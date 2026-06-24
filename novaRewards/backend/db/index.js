const { Pool } = require('pg');

// Single shared connection pool for the entire backend
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Connection pool configuration
  min: 2,              // Minimum connections in pool
  max: 10,             // Maximum connections in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Log pool events for monitoring
pool.on('connect', () => {
  console.log('[DB Pool] New client connected');
});

pool.on('error', (err) => {
  console.error('[DB Pool] Error:', err.message);
  // Log pool errors - this will trigger alerts
});

pool.on('acquire', () => {
  console.log('[DB Pool] Client acquired');
});

pool.on('remove', () => {
  console.log('[DB Pool] Client removed');
});

// Log pool status periodically (for debugging)
setInterval(() => {
  console.log(`[DB Pool] Status - Total: ${pool.totalCount}, Idle: ${pool.idleCount}, Waiting: ${pool.waitingCount}`);
}, 60000); // Every 60 seconds

/**
 * Executes a parameterized SQL query against the PostgreSQL database.
 *
 * @param {string} text   - SQL query string with $1, $2 ... placeholders
 * @param {Array}  params - Parameter values
 * @returns {Promise<import('pg').QueryResult>}
 */
async function query(text, params) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    if (duration > 250) {
      console.warn(`[DB Query] Slow query (${duration}ms): ${text.substring(0, 100)}`);
    }
    return result;
  } catch (error) {
    console.error(`[DB Query] Error: ${error.message}`);
    throw error;
  }
}

// Get pool status
function getPoolStatus() {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
    min: 2,
    max: 10,
  };
}

module.exports = { pool, query, getPoolStatus };
