import type { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import logger from '../utils/logger.js';
import type { ApiError } from '../types/index.js';

// Custom error class
export class AppError extends Error {
  statusCode: number;
  error: string;
  details?: Record<string, unknown>;

  constructor(
    statusCode: number,
    error: string,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.error = error;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Not found error
export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, 'NotFound', `${resource} not found`);
  }
}

// Bad request error
export class BadRequestError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(400, 'BadRequest', message, details);
  }
}

// Conflict error
export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, 'Conflict', message);
  }
}

// Internal server error
export class InternalError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(500, 'InternalError', message);
  }
}

// Error handler middleware
export const errorHandler: ErrorRequestHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log the error
  logger.error({
    err,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
  }, 'Request error');

  // Handle known AppError
  if (err instanceof AppError) {
    const apiError: ApiError = {
      error: err.error,
      message: err.message,
      statusCode: err.statusCode,
      details: err.details,
    };
    res.status(err.statusCode).json(apiError);
    return;
  }

  // Handle unknown errors
  const apiError: ApiError = {
    error: 'InternalError',
    message: process.env['NODE_ENV'] === 'production' 
      ? 'An unexpected error occurred' 
      : err.message,
    statusCode: 500,
  };

  res.status(500).json(apiError);
};

// 404 handler for unmatched routes
export const notFoundHandler = (req: Request, res: Response): void => {
  const apiError: ApiError = {
    error: 'NotFound',
    message: `Cannot ${req.method} ${req.path}`,
    statusCode: 404,
  };
  res.status(404).json(apiError);
};

// Async handler wrapper to catch async errors
export const asyncHandler = <T>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default {
  AppError,
  NotFoundError,
  BadRequestError,
  ConflictError,
  InternalError,
  errorHandler,
  notFoundHandler,
  asyncHandler,
};
