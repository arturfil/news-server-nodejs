// src/controllers/news.controller.ts

import { Request, Response, NextFunction } from 'express';
import { NewsService } from '../services/news.service';
import { AppError } from '../middleware/errorHandler';
import { NewsFilters, PaginationOptions } from '../types/news.types';
import { logger } from '../utils/logger';

export class NewsController {
  private newsService: NewsService;

  constructor() {
    this.newsService = new NewsService();
  }

  getNews = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Parse filters from query parameters
      const filters: NewsFilters = {
        state: req.query.state as string,
        topic: req.query.topic as string,
        searchQuery: req.query.search as string,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined
      };

      // Parse pagination options
      const pagination: PaginationOptions = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10
      };

      // Validate pagination parameters
      if (pagination.page < 1 || pagination.limit < 1 || pagination.limit > 100) {
        throw new AppError(400, 'Invalid pagination parameters');
      }

      const news = await this.newsService.getNews(filters, pagination);
      res.json(news);
    } catch (error) {
      logger.error('Error in getNews controller:', error);
      next(error);
    }
  };

  getArticleById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const articleId = parseInt(req.params.id);
      
      if (isNaN(articleId)) {
        throw new AppError(400, 'Invalid article ID');
      }

      const article = await this.newsService.getArticleById(articleId);
      
      if (!article) {
        throw new AppError(404, 'Article not found');
      }

      res.json(article);
    } catch (error) {
      logger.error('Error in getArticleById controller:', error);
      next(error);
    }
  };

  getStates = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const states = await this.newsService.getStates();
      res.json(states);
    } catch (error) {
      logger.error('Error in getStates controller:', error);
      next(error);
    }
  };

  getTopics = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const topics = await this.newsService.getTopics();
      res.json(topics);
    } catch (error) {
      logger.error('Error in getTopics controller:', error);
      next(error);
    }
  };
}
