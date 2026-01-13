import { Pool, PoolClient } from 'pg';
import logger from '../utils/logger.js';

const DATABASE_URL = process.env['DATABASE_URL'] ?? 'postgresql://postgres:postgres@localhost:5432/codearena';

export const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected database pool error');
});

pool.on('connect', () => {
  logger.debug('New database connection established');
});

export const query = async <T>(
  text: string,
  params?: (string | number | boolean | null | string[] | Date)[]
): Promise<T[]> => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug({ query: text, duration, rows: result.rowCount }, 'Query executed');
    return result.rows as T[];
  } catch (error) {
    logger.error({ err: error, query: text }, 'Query failed');
    throw error;
  }
};

export const getClient = async (): Promise<PoolClient> => {
  const client = await pool.connect();
  return client;
};

export const checkConnection = async (): Promise<boolean> => {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
};

export const closePool = async (): Promise<void> => {
  await pool.end();
  logger.info('Database pool closed');
};

export default { pool, query, getClient, checkConnection, closePool };
