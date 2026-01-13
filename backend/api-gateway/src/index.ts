/**
 * CodeArena API Gateway
 * 
 * Main entry point for the REST API server. Handles:
 * - Problem listing and details
 * - Code submission and status tracking
 * - Submission history queries
 * - Health monitoring
 * 
 * Architecture:
 * - Express.js with TypeScript for type safety
 * - PostgreSQL for persistent storage
 * - Redis for caching and job queue
 * - BullMQ for distributed job processing
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import logger from './utils/logger.js';
import { checkConnection as checkDbConnection, closePool } from './services/database.js';
import { checkConnection as checkRedisConnection, closeConnection as closeRedis } from './services/cache.js';
import { getQueueStats, closeQueue } from './services/queue.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

import submissionsRouter from './routes/submissions.js';
import problemsRouter from './routes/problems.js';
import historyRouter from './routes/history.js';

dotenv.config();

const app = express();
const PORT = parseInt(process.env['PORT'] ?? '3000', 10);
const CORS_ORIGIN = process.env['CORS_ORIGIN'] ?? 'http://localhost:5173';

// Trust proxy (for Railway, Render, etc.)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS
app.use(cors({
  origin: CORS_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-Id'],
  credentials: true,
}));

// Body parser
app.use(express.json({ limit: '1mb' }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration,
    }, 'Request completed');
  });
  next();
});

// Health check endpoint
app.get('/health', async (_req, res) => {
  const dbOk = await checkDbConnection();
  const redisOk = await checkRedisConnection();
  const queueStats = await getQueueStats();

  const isHealthy = dbOk && redisOk;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    services: {
      database: dbOk ? 'up' : 'down',
      redis: redisOk ? 'up' : 'down',
      queue: {
        waiting: queueStats.waiting,
        active: queueStats.active,
      },
    },
  });
});

// API routes
app.use('/api/submissions', submissionsRouter);
app.use('/api/problems', problemsRouter);
app.use('/api/history', historyRouter);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info({ signal }, 'Received shutdown signal');
  
  try {
    await closeQueue();
    await closeRedis();
    await closePool();
    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error({ err: error }, 'Error during shutdown');
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const server = app.listen(PORT, () => {
  logger.info({ port: PORT, cors: CORS_ORIGIN }, 'API Gateway started');
});

export { app, server };
