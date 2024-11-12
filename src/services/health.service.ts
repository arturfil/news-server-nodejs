import { pool } from '../database';
import { redisClient } from '../cache';
import { logger } from '../utils/logger';

export class HealthService {
  async getStatus() {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: uptime,
      memory: {
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
      }
    };
  }

  async checkDatabase() {
    try {
      const startTime = Date.now();
      const result = await pool.query('SELECT NOW()');
      const responseTime = Date.now() - startTime;

      return {
        status: 'ok',
        responseTime: `${responseTime}ms`,
        timestamp: result.rows[0].now
      };
    } catch (error) {
      logger.error('Database health check failed:', error);
      throw error;
    }
  }

  async checkRedis() {
    try {
      const startTime = Date.now();
      await redisClient.set('health_check', 'ok');
      const value = await redisClient.get('health_check');
      const responseTime = Date.now() - startTime;

      return {
        status: value === 'ok' ? 'ok' : 'error',
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Redis health check failed:', error);
      throw error;
    }
  }
}
