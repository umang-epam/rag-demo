import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export async function GET() {
  try {
    await pool.query('SELECT 1')
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 })
  }
}
