import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: 'valutolab2-postgres-1',
  port: 5432,
  database: 'valutolab',
  user: 'valutolab',
  password: 'ValutoLab2024!'
});

pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL local database');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL pool error:', err.message);
});

export default pool;
