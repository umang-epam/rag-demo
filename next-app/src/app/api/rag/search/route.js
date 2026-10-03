import { NextResponse } from 'next/server'
import { z } from 'zod'
import pgvector from 'pgvector'
import { pool, initDb } from '@/lib/db'
import { EMBEDDING_DIMENSION } from '@/lib/ai'

const searchSchema = z.object({
  queryEmbedding: z.array(z.number()),
  topK: z.number().int().positive().max(20),
})

export async function POST(req) {
  try {
    await initDb()
    const body = await req.json()
    const parsed = searchSchema.parse(body)

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

    return NextResponse.json({
      matches: rows.rows.map((row) => ({
        id: row.id,
        documentId: row.document_id,
        chunkIndex: row.chunk_index,
        chunkText: row.chunk_text,
        score: Number(row.score),
      })),
    })
  } catch (error) {
    return NextResponse.json({ message: error?.message || 'Search failed' }, { status: 500 })
  }
}
