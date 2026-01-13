import { Queue } from 'bullmq';
import Redis from 'ioredis';
import logger from '../utils/logger.js';
import type { ExecutionJob } from '../types/index.js';

const REDIS_URL = process.env['REDIS_URL'] ?? 'redis://localhost:6379';

// Create a separate Redis connection for BullMQ
const connection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
  retryStrategy: (times) => {
    if (times > 10) {
      logger.error('Redis connection failed after 10 retries');
      return null;
    }
    return Math.min(times * 200, 2000);
  },
});

connection.on('error', (err) => {
  logger.error({ err: err.message }, 'Redis connection error');
});

connection.on('connect', () => {
  logger.info('Redis connected');
});

export const executionQueue = new Queue<ExecutionJob>('execution-queue', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: {
      count: 1000,
      age: 3600, // 1 hour
    },
    removeOnFail: {
      count: 500,
      age: 86400, // 24 hours
    },
  },
});

executionQueue.on('error', (err) => {
  // Log but don't crash - queue errors are often recoverable
  logger.error({ err: err.message }, 'Queue error (non-fatal)');
});

export const addExecutionJob = async (job: ExecutionJob): Promise<string> => {
  const result = await executionQueue.add('execute', job, {
    jobId: job.submissionId,
    priority: 1,
  });
  logger.info({ submissionId: job.submissionId, jobId: result.id }, 'Job added to queue');
  return result.id ?? job.submissionId;
};

export const getQueueStats = async (): Promise<{
  waiting: number;
  active: number;
  completed: number;
  failed: number;
}> => {
  const [waiting, active, completed, failed] = await Promise.all([
    executionQueue.getWaitingCount(),
    executionQueue.getActiveCount(),
    executionQueue.getCompletedCount(),
    executionQueue.getFailedCount(),
  ]);
  return { waiting, active, completed, failed };
};

export const closeQueue = async (): Promise<void> => {
  await executionQueue.close();
  await connection.quit();
  logger.info('Queue connection closed');
};

export default { executionQueue, addExecutionJob, getQueueStats, closeQueue };
