// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    logger.error(`${err.statusCode} - ${err.message}`);
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message
    });
  }

  logger.error('Internal Server Error:', err);
  return res.status(500).json({
    status: 'error',
    message: 'Internal server error'
  });
};
