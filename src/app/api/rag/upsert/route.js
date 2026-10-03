import { NextResponse } from 'next/server'
import { z } from 'zod'
import pgvector from 'pgvector'
import { initDb, withTransaction } from '@/lib/db'
import { EMBEDDING_DIMENSION } from '@/lib/ai'

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

export async function POST(req) {
  try {
    await initDb()
    const body = await req.json()
    const parsed = upsertSchema.parse(body)

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

    return NextResponse.json({
      documentId: result.documentId,
      chunksInserted: result.count,
    })
  } catch (error) {
    return NextResponse.json({ message: error?.message || 'Failed to upsert vectors' }, { status: 500 })
  }
}
