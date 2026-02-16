import dotenv from 'dotenv'
import pg from 'pg'

dotenv.config()

const { Pool } = pg

const sslEnabled = process.env.PGSSL === 'true'
const poolConfig = {
  max: Number(process.env.PG_POOL_MAX ?? 10),
  host: process.env.PGHOST ?? '85.209.0.78',
  port: Number(process.env.PGPORT ?? 5432),
  database: process.env.PGDATABASE ?? 'rbw',
  user: process.env.PGUSER ?? 'postgres',
  password: process.env.PGPASSWORD ?? 'postgres',
}

if (process.env.DATABASE_URL) {
  poolConfig.connectionString = process.env.DATABASE_URL
}

if (sslEnabled) {
  poolConfig.ssl = { rejectUnauthorized: false }
}

const pool = new Pool(poolConfig)

pool.on('error', (error) => {
  console.error('PostgreSQL pool error:', error)
})

const withClient = async (handler) => {
  const client = await pool.connect()
  try {
    return await handler(client)
  } finally {
    client.release()
  }
}

const query = (text, params = []) => pool.query(text, params)

const closePool = async () => {
  await pool.end()
}

export { closePool, pool, query, withClient }
