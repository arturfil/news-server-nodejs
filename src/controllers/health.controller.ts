import { Request, Response, NextFunction } from 'express';
import { HealthService } from '../services/health.service';
import { AppError } from '../middleware/errorHandler';

export class HealthController {
  private healthService: HealthService;

  constructor() {
    this.healthService = new HealthService();
  }

  checkHealth = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const status = await this.healthService.getStatus();
      res.json(status);
    } catch (error) {
      next(new AppError(500, 'Health check failed'));
    }
  };

  checkDatabase = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const dbStatus = await this.healthService.checkDatabase();
      res.json(dbStatus);
    } catch (error) {
      next(new AppError(500, 'Database health check failed'));
    }
  };

  checkRedis = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const redisStatus = await this.healthService.checkRedis();
      res.json(redisStatus);
    } catch (error) {
      next(new AppError(500, 'Redis health check failed'));
    }
  };
}

