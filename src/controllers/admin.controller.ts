// src/controllers/admin.controller.ts

import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../services/admin.service';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export class AdminController {
  private adminService: AdminService;

  constructor() {
    this.adminService = new AdminService();
  }

  createState = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, abbreviation } = req.body;
      
      if (!name || !abbreviation) {
        throw new AppError(400, 'Name and abbreviation are required');
      }

      const newState = await this.adminService.createState(name, abbreviation);
      res.status(201).json(newState);
    } catch (error) {
      logger.error('Error in createState controller:', error);
      next(error);
    }
  };

  createTopic = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, description } = req.body;
      
      if (!name) {
        throw new AppError(400, 'Topic name is required');
      }

      const newTopic = await this.adminService.createTopic(name, description);
      res.status(201).json(newTopic);
    } catch (error) {
      logger.error('Error in createTopic controller:', error);
      next(error);
    }
  };
}
