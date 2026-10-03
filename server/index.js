import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { GoogleGenAI } from '@google/genai'
import pgvector from 'pgvector'
import { z } from 'zod'
import { initDb, pool, withTransaction } from './lib/db.js'

const app = express()
const PORT = Number(process.env.PORT || 8787)
const EMBEDDING_DIMENSION = Number(process.env.EMBEDDING_DIMENSION || 1536)

function getEmbeddingModel() {
  const model = process.env.EMBEDDING_MODEL
  if (!model || model.includes('text-embedding')) {
    return 'gemini-embedding-001'
  }
  return model
}

function getChatModel() {
  const model = process.env.CHAT_MODEL
  if (!model || model.includes('gpt-') || model === 'gemini-2.5-flash') {
    return 'gemini-3.6-flash'
  }
  return model
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.OPENAI_API_KEY,
})

app.use(cors())
app.use(express.json({ limit: '25mb' }))

const embedSchema = z.object({
  inputs: z.array(z.string().min(1)).min(1),
})

const upsertSchema = z.object({
  documentName: z.string().min(1),
  sourceText: z.string().optional(),
  chunks: z
    .array(
      z.object({
        chunkIndex: z.number().int().nonnegative(),
        chunkText: z.string().min(1),
        embedding: z.array(z.number()),
      }),
    )
    .min(1),
})

const searchSchema = z.object({
  queryEmbedding: z.array(z.number()),
  topK: z.number().int().positive().max(20),
})

const chatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['system', 'user', 'assistant']),
        content: z.string(),
      }),
    )
    .min(1),
  stream: z.boolean().optional(),
})

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ ok: true })
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message })
  }
})

app.post('/api/embed', async (req, res) => {
  try {
    const parsed = embedSchema.parse(req.body)
    const modelToUse = getEmbeddingModel()
    const embeddings = await Promise.all(
      parsed.inputs.map(async (text) => {
        const response = await ai.models.embedContent({
          model: modelToUse,
          contents: text,
          config: {
            outputDimensionality: EMBEDDING_DIMENSION,
          },
        })
        const values = response.embeddings?.[0]?.values || response.embedding?.values
        if (!values) {
          throw new Error(`Failed to extract embedding values for model ${modelToUse}`)
        }
        return values
      }),
    )

    res.json({
      embeddings,
      usage: null,
      model: modelToUse,
    })
  } catch (error) {
    handleError(res, error)
  }
})

app.post('/api/rag/upsert', async (req, res) => {
  try {
    const parsed = upsertSchema.parse(req.body)

    const result = await withTransaction(async (db) => {
      const docInsert = await db.query(
        `INSERT INTO documents (name, source_text)
         VALUES ($1, $2)
         RETURNING id`,
        [parsed.documentName, parsed.sourceText || null],
      )

      const documentId = docInsert.rows[0].id

      const chunkSql = `
        INSERT INTO chunks (document_id, chunk_index, chunk_text, embedding)
        VALUES ($1, $2, $3, $4)
      `

      for (const chunk of parsed.chunks) {
        if (chunk.embedding.length !== EMBEDDING_DIMENSION) {
          throw new Error(
            `Embedding length mismatch for chunk ${chunk.chunkIndex}. Expected ${EMBEDDING_DIMENSION}, got ${chunk.embedding.length}`,
          )
        }

        await db.query(chunkSql, [
          documentId,
          chunk.chunkIndex,
          chunk.chunkText,
          pgvector.toSql(chunk.embedding),
        ])
      }

      return { documentId, count: parsed.chunks.length }
    })

    res.json({
      documentId: result.documentId,
      chunksInserted: result.count,
    })
  } catch (error) {
    handleError(res, error)
  }
})

app.post('/api/rag/search', async (req, res) => {
  try {
    const parsed = searchSchema.parse(req.body)
    if (parsed.queryEmbedding.length !== EMBEDDING_DIMENSION) {
      throw new Error(
        `Query embedding length mismatch. Expected ${EMBEDDING_DIMENSION}, got ${parsed.queryEmbedding.length}`,
      )
    }

    const rows = await pool.query(
      `SELECT
         c.id,
         c.chunk_index,
         c.chunk_text,
         c.document_id,
         1 - (c.embedding <=> $1::vector) AS score
       FROM chunks c
       ORDER BY c.embedding <=> $1::vector
       LIMIT $2`,
      [pgvector.toSql(parsed.queryEmbedding), parsed.topK],
    )

    res.json({
      matches: rows.rows.map((row) => ({
        id: row.id,
        documentId: row.document_id,
        chunkIndex: row.chunk_index,
        chunkText: row.chunk_text,
        score: Number(row.score),
      })),
    })
  } catch (error) {
    handleError(res, error)
  }
})

app.post('/api/run', async (req, res) => {
  try {
    const payload = z
      .object({
        mode: z.enum(['rag', 'no-rag']),
        question: z.string(),
        totalTimeMs: z.number(),
        promptTokens: z.number(),
        completionTokens: z.number(),
        totalTokens: z.number(),
        contextChars: z.number(),
        contextApproxTokens: z.number(),
      })
      .parse(req.body)

    await pool.query(
      `INSERT INTO runs (mode, question, total_time_ms, prompt_tokens, completion_tokens, total_tokens, context_chars, context_approx_tokens)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        payload.mode,
        payload.question,
        payload.totalTimeMs,
        payload.promptTokens,
        payload.completionTokens,
        payload.totalTokens,
        payload.contextChars,
        payload.contextApproxTokens,
      ],
    )

    res.json({ ok: true })
  } catch (error) {
    handleError(res, error)
  }
})

app.get('/api/runs', async (_req, res) => {
  try {
    const rows = await pool.query(
      `SELECT id, mode, question, total_time_ms, prompt_tokens, completion_tokens, total_tokens,
              context_chars, context_approx_tokens, created_at
       FROM runs
       ORDER BY created_at DESC
       LIMIT 20`,
    )
    res.json({ runs: rows.rows })
  } catch (error) {
    handleError(res, error)
  }
})

app.post('/api/chat', async (req, res) => {
  try {
    const parsed = chatSchema.parse(req.body)
    const stream = Boolean(parsed.stream)

    const systemMessage = parsed.messages.find((m) => m.role === 'system')?.content
    const contents = parsed.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }))

    const config = systemMessage ? { systemInstruction: systemMessage } : {}

    const chatModelToUse = getChatModel()

    if (!stream) {
      const response = await ai.models.generateContent({
        model: chatModelToUse,
        contents,
        config,
      })

      const usage = response.usageMetadata
        ? {
            prompt_tokens: response.usageMetadata.promptTokenCount || 0,
            completion_tokens: response.usageMetadata.candidatesTokenCount || 0,
            total_tokens: response.usageMetadata.totalTokenCount || 0,
          }
        : null

      res.json({
        answer: response.text || '',
        usage,
      })
      return
    }

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    const responseStream = await ai.models.generateContentStream({
      model: chatModelToUse,
      contents,
      config,
    })

    for await (const chunk of responseStream) {
      if (chunk.text) {
        res.write(`data: ${JSON.stringify({ type: 'delta', delta: chunk.text })}\n\n`)
      }

      if (chunk.usageMetadata) {
        res.write(
          `data: ${JSON.stringify({
            type: 'usage',
            usage: {
              prompt_tokens: chunk.usageMetadata.promptTokenCount || 0,
              completion_tokens: chunk.usageMetadata.candidatesTokenCount || 0,
              total_tokens: chunk.usageMetadata.totalTokenCount || 0,
            },
          })}\n\n`,
        )
      }
    }

    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
    res.end()
  } catch (error) {
    if (!res.headersSent) {
      handleError(res, error)
      return
    }

    res.write(
      `data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`,
    )
    res.end()
  }
})

function handleError(res, error) {
  let statusCode = 500
  let message = error?.message || 'Unexpected server error'

  if (typeof error?.status === 'number' && error.status >= 100 && error.status < 600) {
    statusCode = error.status
  } else if (typeof error?.statusCode === 'number' && error.statusCode >= 100 && error.statusCode < 600) {
    statusCode = error.statusCode
  } else if (typeof error?.error?.code === 'number' && error.error.code >= 100 && error.error.code < 600) {
    statusCode = error.error.code
  }

  if (typeof message === 'string' && message.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(message)
      if (parsed.error?.message) {
        message = parsed.error.message
      }
      if (typeof parsed.error?.code === 'number') {
        statusCode = parsed.error.code
      }
    } catch {
      // ignore JSON parse failure
    }
  }

  if (error?.issues) {
    res.status(400).json({ message: 'Invalid request payload', details: error.issues })
    return
  }

  res.status(statusCode).json({ message })
}

async function bootstrap() {
  await initDb()
  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`)
  })
}

bootstrap().catch((error) => {
  console.error('Failed to start server:', error)
  process.exitCode = 1
})
