/**
 * WebSocket Service for Real-Time Updates
 * 
 * Manages Socket.io connection to receive live submission status updates.
 * Implements automatic reconnection with exponential backoff.
 * 
 * Events:
 * - submission_status: Intermediate status updates (Queued, Running)
 * - submission_completed: Final result with test case details
 */

import { io, Socket } from 'socket.io-client';
import type { SubmissionStatusEvent, SubmissionCompletedEvent } from '@/types';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001';

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      reconnectionDelayMax: 5000,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
    });

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  subscribeToSubmission(
    submissionId: string,
    callbacks: {
      onStatus?: (data: SubmissionStatusEvent) => void;
      onCompleted?: (data: SubmissionCompletedEvent) => void;
      onError?: (error: { message: string }) => void;
    }
  ): () => void {
    const socket = this.connect();

    // Subscribe to submission updates
    socket.emit('subscribe_submission', { submissionId });

    // Set up event listeners
    const handleStatus = (data: SubmissionStatusEvent) => {
      if (data.submissionId === submissionId && callbacks.onStatus) {
        callbacks.onStatus(data);
      }
    };

    const handleCompleted = (data: SubmissionCompletedEvent) => {
      if (data.submissionId === submissionId && callbacks.onCompleted) {
        callbacks.onCompleted(data);
      }
    };

    const handleError = (error: { message: string; submissionId?: string }) => {
      if ((!error.submissionId || error.submissionId === submissionId) && callbacks.onError) {
        callbacks.onError(error);
      }
    };

    socket.on('submission_status', handleStatus);
    socket.on('submission_completed', handleCompleted);
    socket.on('error', handleError);

    // Return cleanup function
    return () => {
      socket.emit('unsubscribe_submission', { submissionId });
      socket.off('submission_status', handleStatus);
      socket.off('submission_completed', handleCompleted);
      socket.off('error', handleError);
    };
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

// Singleton instance
export const websocketService = new WebSocketService();

export default websocketService;
