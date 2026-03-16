import { Request, Response, NextFunction } from 'express';
import { APIError } from '../utils/api-error';
import { logger } from '../config/logger';
export const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  //know operation error-safe to send detials to client
  if (error instanceof APIError && error.isOperational) {
    res.status(error.statusCode).json({
      success: false,
      statusCode: error.statusCode,
      message: error.message,
      errors: error.errors,
    });
    return;
  }

  logger.error('💥 Unexpected error:', {
    error: error.message,
    stack: error.stack,
    url: _req.url,
    method: _req.method,
  });

  res.status(500).json({
    success: false,
    statusCode: 500,
    message: 'Internal server error',
    errors: [],
  });
};

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(APIError.notFound(`Route ${req.method} ${req.url} not found`));
};
