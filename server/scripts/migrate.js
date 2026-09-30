import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { pool } from '../lib/db.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const migrationsDir = path.resolve(__dirname, '../../db/migrations')

async function run() {
  const files = await fs.readdir(migrationsDir)
  const migrationFiles = files.filter((name) => name.endsWith('.sql')).sort()

  if (migrationFiles.length === 0) {
    console.log('No migrations found.')
    return
  }

  const client = await pool.connect()
  try {
    for (const file of migrationFiles) {
      const sqlPath = path.join(migrationsDir, file)
      const sql = await fs.readFile(sqlPath, 'utf-8')
      console.log(`Applying migration: ${file}`)
      await client.query(sql)
    }
  } finally {
    client.release()
    await pool.end()
  }

  console.log('Migrations applied successfully.')
}

run().catch((error) => {
  console.error('Migration failed:', error)
  process.exitCode = 1
})
