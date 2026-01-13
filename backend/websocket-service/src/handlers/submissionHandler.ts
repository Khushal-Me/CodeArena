import type { Socket, Server } from 'socket.io';
import logger from '../utils/logger.js';

// Track which sockets are subscribed to which submissions
const submissionSubscriptions = new Map<string, Set<string>>(); // submissionId -> Set of socketIds
const socketSubscriptions = new Map<string, Set<string>>(); // socketId -> Set of submissionIds

export const setupSubmissionHandlers = (io: Server, socket: Socket): void => {
  const socketLogger = logger.child({ socketId: socket.id });

  // Subscribe to a submission
  socket.on('subscribe_submission', (data: { submissionId: string }) => {
    const { submissionId } = data;
    
    if (!submissionId || typeof submissionId !== 'string') {
      socket.emit('error', { message: 'Invalid submissionId' });
      return;
    }

    // Add socket to submission's subscribers
    if (!submissionSubscriptions.has(submissionId)) {
      submissionSubscriptions.set(submissionId, new Set());
    }
    submissionSubscriptions.get(submissionId)!.add(socket.id);

    // Track socket's subscriptions
    if (!socketSubscriptions.has(socket.id)) {
      socketSubscriptions.set(socket.id, new Set());
    }
    socketSubscriptions.get(socket.id)!.add(submissionId);

    // Join socket room for this submission
    socket.join(`submission:${submissionId}`);

    socketLogger.info({ submissionId }, 'Subscribed to submission');
    socket.emit('subscribed', { submissionId });
  });

  // Unsubscribe from a submission
  socket.on('unsubscribe_submission', (data: { submissionId: string }) => {
    const { submissionId } = data;

    if (!submissionId || typeof submissionId !== 'string') {
      return;
    }

    // Remove socket from submission's subscribers
    submissionSubscriptions.get(submissionId)?.delete(socket.id);
    if (submissionSubscriptions.get(submissionId)?.size === 0) {
      submissionSubscriptions.delete(submissionId);
    }

    // Remove from socket's subscriptions
    socketSubscriptions.get(socket.id)?.delete(submissionId);

    // Leave socket room
    socket.leave(`submission:${submissionId}`);

    socketLogger.info({ submissionId }, 'Unsubscribed from submission');
    socket.emit('unsubscribed', { submissionId });
  });

  // Cleanup on disconnect
  socket.on('disconnect', () => {
    const subscriptions = socketSubscriptions.get(socket.id);
    
    if (subscriptions) {
      for (const submissionId of subscriptions) {
        submissionSubscriptions.get(submissionId)?.delete(socket.id);
        if (submissionSubscriptions.get(submissionId)?.size === 0) {
          submissionSubscriptions.delete(submissionId);
        }
      }
    }

    socketSubscriptions.delete(socket.id);
    socketLogger.info('Disconnected, cleaned up subscriptions');
  });
};

// Broadcast update to all subscribers of a submission
export const broadcastSubmissionUpdate = (
  io: Server,
  submissionId: string,
  event: string,
  data: Record<string, unknown>
): void => {
  const room = `submission:${submissionId}`;
  io.to(room).emit(event, { ...data, submissionId });
  
  const subscriberCount = submissionSubscriptions.get(submissionId)?.size ?? 0;
  logger.debug({ submissionId, event, subscriberCount }, 'Broadcasted submission update');
};

// Get stats about subscriptions
export const getSubscriptionStats = (): { totalSubmissions: number; totalConnections: number } => {
  return {
    totalSubmissions: submissionSubscriptions.size,
    totalConnections: socketSubscriptions.size,
  };
};

export default { setupSubmissionHandlers, broadcastSubmissionUpdate, getSubscriptionStats };
