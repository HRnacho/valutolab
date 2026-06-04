import pg from 'pg';
const { Pool } = pg;

if (!process.env.DB_PASSWORD) {
  console.error('❌ FATAL: DB_PASSWORD environment variable is not set');
  process.exit(1);
}

const pool = new Pool({
  host: process.env.DB_HOST || 'valutolab2-postgres-1',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'valutolab',
  user: process.env.DB_USER || 'valutolab',
  password: process.env.DB_PASSWORD
});

pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL local database');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL pool error:', err.message);
});

export default pool;
