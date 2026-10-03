import { NextResponse } from 'next/server'
import { z } from 'zod'
import { pool } from '@/lib/db'

export async function POST(req) {
  try {
    const body = await req.json()
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
      .parse(body)

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

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ message: error?.message || 'Failed to save run' }, { status: 500 })
  }
}
