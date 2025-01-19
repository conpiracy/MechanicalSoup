import pg from 'pg'
import dotenv from 'dotenv'
import { spawn } from 'child_process'

// Ensure .env is loaded
dotenv.config()

// Check for required environment variables
if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is not set')
  console.error('Please ensure you have set the DATABASE_URL in your .env file or environment')
  process.exit(1)
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
})

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to database:', err.message)
    process.exit(1)
  }
  console.log('Successfully connected to database')
  release()
})

export const query = (text, params) => pool.query(text, params)

// Check if data exists
const checkDataExists = async () => {
  const result = await query('SELECT COUNT(*) FROM whop_data')
  return parseInt(result.rows[0].count) > 0
}

// Run initial scrape
const runInitialScrape = () => {
  return new Promise((resolve, reject) => {
    console.log('Running initial data scrape...')
    const pythonProcess = spawn('python', ['process_revenue_data.py'])
    
    pythonProcess.on('close', (code) => {
      if (code === 0) {
        console.log('Initial scrape completed successfully')
        resolve()
      } else {
        reject(new Error('Initial scrape failed'))
      }
    })
  })
}

// Initialize table and data
const initDb = async () => {
  try {
    // Create table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS whop_data (
        id SERIAL PRIMARY KEY,
        platform_metrics JSONB,
        top_communities JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    // Check if we have any data
    const hasData = await checkDataExists()
    if (!hasData) {
      await runInitialScrape()
    }
    
    console.log('Database initialized successfully')
  } catch (error) {
    console.error('Database initialization error:', error)
    throw error
  }
}

initDb().catch(console.error)
