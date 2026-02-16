import { closePool } from './db.js'
import { initializeDatabase } from './seed.js'

const run = async () => {
  await initializeDatabase()
  console.log('Synthetic reporting and documents data loaded into PostgreSQL.')
}

run()
  .catch((error) => {
    console.error('Synthetic data load failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await closePool()
  })
