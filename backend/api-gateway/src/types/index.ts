// Type definitions for CodeArena API Gateway

export interface Problem {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  createdAt: Date;
}

export interface TestCase {
  id: string;
  problemId: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  orderIndex: number;
  createdAt: Date;
}

export interface Submission {
  id: string;
  problemId: string;
  sessionId: string;
  language: SupportedLanguage;
  code: string;
  status: SubmissionStatus;
  executionTimeMs: number | null;
  memoryUsedKb: number | null;
  testResults: TestResult[] | null;
  stdout: string | null;
  stderr: string | null;
  createdAt: Date;
  completedAt: Date | null;
}

export type SupportedLanguage = 'python' | 'javascript' | 'java' | 'cpp';

// Database status values (lowercase with underscores)
export type DbSubmissionStatus =
  | 'queued'
  | 'processing'
  | 'accepted'
  | 'wrong_answer'
  | 'time_limit_exceeded'
  | 'memory_limit_exceeded'
  | 'runtime_error'
  | 'compilation_error'
  | 'system_error';

// API/Frontend status values (title case with spaces)
export type SubmissionStatus =
  | 'Queued'
  | 'Running'
  | 'Accepted'
  | 'Wrong Answer'
  | 'Time Limit Exceeded'
  | 'Runtime Error'
  | 'Compilation Error';

// Status mapping functions
export const dbToApiStatus = (dbStatus: string): SubmissionStatus => {
  const mapping: Record<string, SubmissionStatus> = {
    'queued': 'Queued',
    'processing': 'Running',
    'accepted': 'Accepted',
    'wrong_answer': 'Wrong Answer',
    'time_limit_exceeded': 'Time Limit Exceeded',
    'memory_limit_exceeded': 'Time Limit Exceeded',
    'runtime_error': 'Runtime Error',
    'compilation_error': 'Compilation Error',
    'system_error': 'Runtime Error',
  };
  return mapping[dbStatus] ?? 'Queued';
};

export interface TestResult {
  testCaseId: string;
  passed: boolean;
  output: string;
  executionTimeMs: number;
  error?: string;
}

export interface Session {
  id: string;
  createdAt: Date;
  lastActivity: Date;
}

// API Request/Response types
export interface CreateSubmissionRequest {
  problemId: string;
  language: SupportedLanguage;
  code: string;
  sessionId: string;
}

export interface CreateSubmissionResponse {
  submissionId: string;
  status: SubmissionStatus;
}

export interface GetSubmissionResponse extends Submission {
  problem?: Pick<Problem, 'title' | 'slug'>;
}

export interface ListProblemsQuery {
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ListProblemsResponse {
  problems: Array<Pick<Problem, 'id' | 'title' | 'slug' | 'difficulty' | 'tags'>>;
  total: number;
  limit: number;
  offset: number;
}

export interface GetProblemResponse extends Problem {
  testCases: Array<Pick<TestCase, 'id' | 'input' | 'expectedOutput' | 'isHidden'>>;
  visibleTestCaseCount: number;
  totalTestCaseCount: number;
}

export interface HistoryQuery {
  sessionId: string;
  limit?: number;
  offset?: number;
}

export interface HistoryResponse {
  submissions: Array<{
    id: string;
    problemTitle: string;
    problemSlug: string;
    language: SupportedLanguage;
    status: SubmissionStatus;
    executionTimeMs: number | null;
    createdAt: Date;
  }>;
  total: number;
  limit: number;
  offset: number;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services: {
    database: 'up' | 'down';
    redis: 'up' | 'down';
    workers: number;
  };
}

// Queue Job types
export interface ExecutionJob {
  submissionId: string;
  problemId: string;
  language: SupportedLanguage;
  code: string;
  testCases: Array<{
    id: string;
    input: string;
    expectedOutput: string;
  }>;
}

export interface ExecutionResult {
  submissionId: string;
  status: SubmissionStatus;
  executionTimeMs: number;
  memoryUsedKb: number;
  testResults: TestResult[];
  stdout: string;
  stderr: string;
}

// Error types
export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
  details?: Record<string, unknown>;
}
