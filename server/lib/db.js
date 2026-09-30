import pg from 'pg'
import pgvector from 'pgvector/pg'

const { Pool } = pg

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/rag_demo'

export const pool = new Pool({ connectionString })

export async function initDb() {
  const client = await pool.connect()
  try {
    await pgvector.registerTypes(client)
  } finally {
    client.release()
  }
}

export async function withTransaction(fn) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
