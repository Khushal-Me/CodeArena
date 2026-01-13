/**
 * API Client Service
 * 
 * Centralized HTTP client for communicating with the CodeArena API Gateway.
 * Features:
 * - Automatic session ID injection via interceptors
 * - Standardized error handling
 * - Type-safe request/response interfaces
 * 
 * Endpoints:
 * - GET /problems - List all coding problems
 * - GET /problems/:slug - Get problem details with test cases
 * - POST /submissions - Submit code for execution
 * - GET /submissions/:id - Get submission status
 * - GET /history - Get user's submission history
 */

import axios, { AxiosError } from 'axios';
import type {
  ListProblemsResponse,
  GetProblemResponse,
  CreateSubmissionResponse,
  Submission,
  HistoryResponse,
  HealthCheckResponse,
  SupportedLanguage,
} from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Create axios instance
export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding session ID
api.interceptors.request.use((config) => {
  const sessionId = getSessionId();
  if (sessionId) {
    config.headers['X-Session-Id'] = sessionId;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      // Server responded with error
      console.error('API Error:', error.response.data);
    } else if (error.request) {
      // Request was made but no response
      console.error('Network Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Session management
const SESSION_KEY = 'codearena_session_id';

export const getSessionId = (): string => {
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
};

// Problems API
export const getProblems = async (params?: {
  difficulty?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<ListProblemsResponse> => {
  const response = await api.get<ListProblemsResponse>('/problems', { params });
  return response.data;
};

export const getProblem = async (slug: string): Promise<GetProblemResponse> => {
  const response = await api.get<GetProblemResponse>(`/problems/${slug}`);
  return response.data;
};

// Submissions API
export const createSubmission = async (data: {
  problemId: string;
  language: SupportedLanguage;
  code: string;
}): Promise<CreateSubmissionResponse> => {
  const response = await api.post<CreateSubmissionResponse>('/submissions', {
    ...data,
    sessionId: getSessionId(),
  });
  return response.data;
};

export const getSubmission = async (id: string): Promise<Submission> => {
  const response = await api.get<Submission>(`/submissions/${id}`);
  return response.data;
};

// History API
export const getHistory = async (params?: {
  limit?: number;
  offset?: number;
}): Promise<HistoryResponse> => {
  const response = await api.get<HistoryResponse>('/history', {
    params: {
      ...params,
      sessionId: getSessionId(),
    },
  });
  return response.data;
};

// Health check
export const getHealth = async (): Promise<HealthCheckResponse> => {
  const response = await api.get<HealthCheckResponse>('/health');
  return response.data;
};

export default api;
