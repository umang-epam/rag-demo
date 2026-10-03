import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export async function GET() {
  try {
    const rows = await pool.query(
      `SELECT id, mode, question, total_time_ms, prompt_tokens, completion_tokens, total_tokens,
              context_chars, context_approx_tokens, created_at
       FROM runs
       ORDER BY created_at DESC
       LIMIT 20`,
    )
    return NextResponse.json({ runs: rows.rows })
  } catch (error) {
    return NextResponse.json({ message: error?.message || 'Failed to fetch runs' }, { status: 500 })
  }
}
