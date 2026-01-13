import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

import logger from './utils/logger.js';
import { subscribeToSubmissionUpdates, closeConnections, type SubmissionUpdate } from './services/redis.js';
import { setupSubmissionHandlers, broadcastSubmissionUpdate, getSubscriptionStats } from './handlers/submissionHandler.js';

dotenv.config();

const PORT = parseInt(process.env['PORT'] ?? '3001', 10);
const CORS_ORIGIN = process.env['CORS_ORIGIN'] ?? 'http://localhost:5173';

// Create HTTP server (for health check endpoint)
const httpServer = createServer((req, res) => {
  if (req.url === '/health' && req.method === 'GET') {
    const stats = getSubscriptionStats();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      stats,
    }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

// Create Socket.io server
const io = new Server(httpServer, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 30000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'],
});

// Connection handler
io.on('connection', (socket) => {
  logger.info({ socketId: socket.id, address: socket.handshake.address }, 'Client connected');

  // Setup submission handlers
  setupSubmissionHandlers(io, socket);

  // Handle ping/pong for connection health
  socket.on('ping', () => {
    socket.emit('pong');
  });

  socket.on('disconnect', (reason) => {
    logger.info({ socketId: socket.id, reason }, 'Client disconnected');
  });

  socket.on('error', (error) => {
    logger.error({ socketId: socket.id, err: error }, 'Socket error');
  });
});

// Subscribe to Redis updates and broadcast to connected clients
const setupRedisSubscription = async (): Promise<void> => {
  await subscribeToSubmissionUpdates((update: SubmissionUpdate) => {
    const { submissionId, status, ...rest } = update;
    
    if (status === 'Running') {
      broadcastSubmissionUpdate(io, submissionId, 'submission_status', {
        status,
        timestamp: update.timestamp,
      });
    } else {
      // Completed status (Accepted, Wrong Answer, TLE, Runtime Error, Compilation Error)
      broadcastSubmissionUpdate(io, submissionId, 'submission_completed', {
        status,
        executionTimeMs: rest.executionTimeMs,
        memoryUsedKb: rest.memoryUsedKb,
        testResults: rest.testResults,
        passedCount: rest.passedCount,
        totalCount: rest.totalCount,
        timestamp: update.timestamp,
      });
    }
  });
};

// Graceful shutdown
const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info({ signal }, 'Received shutdown signal');
  
  try {
    // Close all socket connections
    const sockets = await io.fetchSockets();
    for (const socket of sockets) {
      socket.disconnect(true);
    }
    
    // Close HTTP server
    httpServer.close();
    
    // Close Redis connections
    await closeConnections();
    
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
const start = async (): Promise<void> => {
  try {
    await setupRedisSubscription();
    
    httpServer.listen(PORT, () => {
      logger.info({ port: PORT, cors: CORS_ORIGIN }, 'WebSocket server started');
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to start server');
    process.exit(1);
  }
};

start();

export { io, httpServer };
