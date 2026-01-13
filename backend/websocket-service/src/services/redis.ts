import Redis from 'ioredis';
import logger from '../utils/logger.js';

const REDIS_URL = process.env['REDIS_URL'] ?? 'redis://localhost:6379';

// Subscriber connection for pub/sub
export const subscriber = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    if (times > 3) {
      logger.error('Redis subscriber connection failed after 3 retries');
      return null;
    }
    return Math.min(times * 200, 2000);
  },
});

// Publisher connection for pub/sub
export const publisher = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    if (times > 3) {
      logger.error('Redis publisher connection failed after 3 retries');
      return null;
    }
    return Math.min(times * 200, 2000);
  },
});

subscriber.on('connect', () => {
  logger.info('Redis subscriber connected');
});

subscriber.on('error', (err) => {
  logger.error({ err }, 'Redis subscriber error');
});

publisher.on('connect', () => {
  logger.info('Redis publisher connected');
});

publisher.on('error', (err) => {
  logger.error({ err }, 'Redis publisher error');
});

// Channel names
export const CHANNELS = {
  SUBMISSION_UPDATES: 'submission:updates',
} as const;

// Subscribe to submission updates channel
export const subscribeToSubmissionUpdates = async (
  callback: (message: SubmissionUpdate) => void
): Promise<void> => {
  await subscriber.subscribe(CHANNELS.SUBMISSION_UPDATES);
  
  subscriber.on('message', (channel, message) => {
    if (channel === CHANNELS.SUBMISSION_UPDATES) {
      try {
        const parsed = JSON.parse(message) as SubmissionUpdate;
        callback(parsed);
      } catch (err) {
        logger.error({ err, message }, 'Failed to parse submission update');
      }
    }
  });

  logger.info({ channel: CHANNELS.SUBMISSION_UPDATES }, 'Subscribed to channel');
};

// Publish submission update (used by workers)
export const publishSubmissionUpdate = async (update: SubmissionUpdate): Promise<void> => {
  await publisher.publish(CHANNELS.SUBMISSION_UPDATES, JSON.stringify(update));
  logger.debug({ submissionId: update.submissionId, status: update.status }, 'Published update');
};

// Types
export interface SubmissionUpdate {
  submissionId: string;
  status: 'Queued' | 'Running' | 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded' | 'Runtime Error' | 'Compilation Error';
  executionTimeMs?: number;
  memoryUsedKb?: number;
  testResults?: Array<{
    testCaseId: number;
    passed: boolean;
    executionTimeMs: number;
  }>;
  passedCount?: number;
  totalCount?: number;
  stdout?: string;
  stderr?: string;
  timestamp: string;
}

// Cleanup
export const closeConnections = async (): Promise<void> => {
  await subscriber.quit();
  await publisher.quit();
  logger.info('Redis connections closed');
};

export default { subscriber, publisher, subscribeToSubmissionUpdates, publishSubmissionUpdate, closeConnections };
