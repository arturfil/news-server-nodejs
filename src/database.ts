import { Pool } from 'pg';
import { logger } from './utils/logger';
import dotenv from 'dotenv';

dotenv.config()

const dbConfig = {
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: parseInt(process.env.POSTGRES_PORT || '5432')
};

// Validate required configuration
if (!dbConfig.host || !dbConfig.user || !dbConfig.password || !dbConfig.database) {
  throw new Error('Missing required database configuration. Check your environment variables.');
}

const pool = new Pool({
  user:     `${process.env.POSTGRES_USER}`|| 'postgres',
  host:     `${process.env.POSTGRES_HOST}` || 'localhost',
  database: `${process.env.POSTGRES_DB}` || 'legislative_news',
  password: `${process.env.POSTGRES_PASSWORD}` || 'postgres',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
});

export async function initializeDatabase() {
  try {
    await pool.query('SELECT NOW()');
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
}

export { pool };
