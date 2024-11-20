// src/migrations/rollback.ts

import { pool } from '../database';
import { logger } from '../utils/logger';

async function rollbackTables() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Drop tables in correct order (respecting foreign key constraints)
    await client.query(`
      -- First drop junction tables
      DROP TABLE IF EXISTS articles_tags CASCADE;
      
      -- Then drop dependent tables
      DROP TABLE IF EXISTS article_tags CASCADE;
      DROP TABLE IF EXISTS articles CASCADE;
      DROP TABLE IF EXISTS topics CASCADE;
      DROP TABLE IF EXISTS states CASCADE;
      DROP TABLE IF EXISTS sources CASCADE;
      
      -- Drop the trigger function
      DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;

      -- Drop indices (they will be dropped with their tables, but including for completeness)
      DROP INDEX IF EXISTS idx_articles_state;
      DROP INDEX IF EXISTS idx_articles_topic;
      DROP INDEX IF EXISTS idx_articles_published_date;
      DROP INDEX IF EXISTS idx_articles_title_text;
      DROP INDEX IF EXISTS idx_articles_content_text;
    `);

    await client.query('COMMIT');
    logger.info('Successfully rolled back all tables and functions');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error rolling back database:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Rollback articles only (keeping structure but removing data)
async function rollbackArticles() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Clear all data from articles and related tables
    await client.query(`
      TRUNCATE TABLE articles_tags CASCADE;
      TRUNCATE TABLE articles CASCADE;
    `);

    await client.query('COMMIT');
    logger.info('Successfully rolled back articles data');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error rolling back articles:', error);
    throw error;
  } finally {
    client.release();
  }
}

// If running directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'all':
      rollbackTables()
        .then(() => {
          logger.info('Full database rollback completed');
          process.exit(0);
        })
        .catch((error) => {
          logger.error('Database rollback failed:', error);
          process.exit(1);
        });
      break;

    case 'articles':
      rollbackArticles()
        .then(() => {
          logger.info('Articles rollback completed');
          process.exit(0);
        })
        .catch((error) => {
          logger.error('Articles rollback failed:', error);
          process.exit(1);
        });
      break;

    default:
      logger.error('Invalid command. Use "all" or "articles"');
      process.exit(1);
  }
}

export { rollbackTables, rollbackArticles };
