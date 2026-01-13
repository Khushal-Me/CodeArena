// Type definitions for CodeArena frontend

export type SupportedLanguage = 'python' | 'javascript' | 'java' | 'cpp';

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export type SubmissionStatus =
  | 'Queued'
  | 'Running'
  | 'Accepted'
  | 'Wrong Answer'
  | 'Time Limit Exceeded'
  | 'Runtime Error'
  | 'Compilation Error';

export interface Problem {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: Difficulty;
  tags: string[];
  createdAt: string;
}

export interface ProblemListItem {
  id: string;
  title: string;
  slug: string;
  difficulty: Difficulty;
  tags: string[];
}

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

export interface TestResult {
  testCaseId: string;
  passed: boolean;
  output: string;
  executionTimeMs: number;
  error?: string;
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
  createdAt: string;
  completedAt: string | null;
  problem?: {
    title: string;
    slug: string;
  };
}

export interface SubmissionHistoryItem {
  id: string;
  problemTitle: string;
  problemSlug: string;
  language: SupportedLanguage;
  status: SubmissionStatus;
  executionTimeMs: number | null;
  createdAt: string;
}

// API Response types
export interface ListProblemsResponse {
  problems: ProblemListItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface GetProblemResponse extends Problem {
  testCases: TestCase[];
  visibleTestCaseCount: number;
  totalTestCaseCount: number;
}

export interface CreateSubmissionResponse {
  submissionId: string;
  status: SubmissionStatus;
}

export interface HistoryResponse {
  submissions: SubmissionHistoryItem[];
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
    queue: {
      waiting: number;
      active: number;
    };
  };
}

// WebSocket event types
export interface SubmissionStatusEvent {
  submissionId: string;
  status: SubmissionStatus;
  timestamp: string;
}

export interface SubmissionCompletedEvent {
  submissionId: string;
  status: SubmissionStatus;
  executionTimeMs: number;
  memoryUsedKb: number;
  testResults: Array<{
    testCaseId: number;
    passed: boolean;
    executionTimeMs: number;
  }>;
  passedCount: number;
  totalCount: number;
  timestamp: string;
}

// Language configurations
export const LANGUAGE_CONFIG: Record<SupportedLanguage, {
  name: string;
  monacoLanguage: string;
  defaultCode: string;
}> = {
  python: {
    name: 'Python 3.11',
    monacoLanguage: 'python',
    defaultCode: `def solution():\n    # Write your solution here\n    pass\n\nif __name__ == "__main__":\n    solution()`,
  },
  javascript: {
    name: 'JavaScript (Node.js 20)',
    monacoLanguage: 'javascript',
    defaultCode: `function solution() {\n    // Write your solution here\n}\n\nsolution();`,
  },
  java: {
    name: 'Java 17',
    monacoLanguage: 'java',
    defaultCode: `public class Solution {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}`,
  },
  cpp: {
    name: 'C++ (g++ 11)',
    monacoLanguage: 'cpp',
    defaultCode: `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}`,
  },
};

// Status configurations
export const STATUS_CONFIG: Record<SubmissionStatus, {
  color: string;
  bgColor: string;
  icon: string;
}> = {
  'Queued': {
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    icon: 'Clock',
  },
  'Running': {
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    icon: 'Loader2',
  },
  'Accepted': {
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    icon: 'CheckCircle2',
  },
  'Wrong Answer': {
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    icon: 'XCircle',
  },
  'Time Limit Exceeded': {
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    icon: 'Clock',
  },
  'Runtime Error': {
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    icon: 'AlertTriangle',
  },
  'Compilation Error': {
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    icon: 'Code',
  },
};

export const DIFFICULTY_CONFIG: Record<Difficulty, {
  color: string;
  bgColor: string;
}> = {
  'Easy': {
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  'Medium': {
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
  },
  'Hard': {
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
  },
};
