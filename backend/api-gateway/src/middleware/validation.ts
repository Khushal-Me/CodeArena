import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';
import type { ApiError } from '../types/index.js';

// Validation schemas
export const createSubmissionSchema = z.object({
  problemId: z.string().uuid(),
  language: z.enum(['python', 'javascript', 'java', 'cpp']),
  code: z.string().min(1).max(10000),
  sessionId: z.string().uuid(),
});

export const listProblemsQuerySchema = z.object({
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).optional(),
  search: z.string().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const historyQuerySchema = z.object({
  sessionId: z.string().uuid(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const idParamSchema = z.object({
  id: z.string().uuid(),
});

export const slugParamSchema = z.object({
  slug: z.string().min(1).max(255),
});

// Validation middleware factory
export const validateBody = <T extends z.ZodType>(schema: T) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const apiError: ApiError = {
          error: 'ValidationError',
          message: 'Invalid request body',
          statusCode: 400,
          details: {
            errors: error.errors.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
        };
        res.status(400).json(apiError);
        return;
      }
      next(error);
    }
  };
};

export const validateQuery = <T extends z.ZodType>(schema: T) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query) as typeof req.query;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const apiError: ApiError = {
          error: 'ValidationError',
          message: 'Invalid query parameters',
          statusCode: 400,
          details: {
            errors: error.errors.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
        };
        res.status(400).json(apiError);
        return;
      }
      next(error);
    }
  };
};

export const validateParams = <T extends z.ZodType>(schema: T) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.params = schema.parse(req.params) as typeof req.params;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const apiError: ApiError = {
          error: 'ValidationError',
          message: 'Invalid path parameters',
          statusCode: 400,
          details: {
            errors: error.errors.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
        };
        res.status(400).json(apiError);
        return;
      }
      next(error);
    }
  };
};

export default {
  validateBody,
  validateQuery,
  validateParams,
  createSubmissionSchema,
  listProblemsQuerySchema,
  historyQuerySchema,
  idParamSchema,
  slugParamSchema,
};
