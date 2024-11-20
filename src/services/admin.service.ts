import { pool } from '../database';
import { redisClient } from '../cache';
import { logger } from '../utils/logger';

export class AdminService {
  async createState(name: string, abbreviation: string) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const result = await client.query(
        'INSERT INTO states (name, abbreviation) VALUES ($1, $2) RETURNING *',
        [name, abbreviation]
      );

      await client.query('COMMIT');

      // Invalidate the states cache
      await redisClient.del('states:list');

      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      
      if ((error as any).code === '23505') { // Unique violation
        throw new Error('State already exists');
      }
      
      logger.error('Error creating state:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async createTopic(name: string, description?: string) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const result = await client.query(
        'INSERT INTO topics (name, description) VALUES ($1, $2) RETURNING *',
        [name, description]
      );

      await client.query('COMMIT');

      // Invalidate the topics cache
      await redisClient.del('topics:list');

      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      
      if ((error as any).code === '23505') { // Unique violation
        throw new Error('Topic already exists');
      }
      
      logger.error('Error creating topic:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}
