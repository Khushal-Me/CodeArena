import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../services/database.js';
import { addExecutionJob } from '../services/queue.js';
import { setCache, getCache } from '../services/cache.js';
import { 
  validateBody, 
  validateParams, 
  createSubmissionSchema,
  idParamSchema 
} from '../middleware/validation.js';
import { submissionRateLimiter } from '../middleware/rateLimit.js';
import { asyncHandler, NotFoundError, BadRequestError } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';
import type { 
  Submission, 
  CreateSubmissionRequest,
  CreateSubmissionResponse,
  GetSubmissionResponse 
} from '../types/index.js';
import { dbToApiStatus } from '../types/index.js';

const router = Router();

// POST /api/submissions - Submit code for execution
router.post(
  '/',
  submissionRateLimiter,
  validateBody(createSubmissionSchema),
  asyncHandler(async (req, res) => {
    const { problemId, language, code, sessionId } = req.body as CreateSubmissionRequest;
    const submissionId = uuidv4();

    // Verify problem exists
    const problems = await query<{ id: string }>(
      'SELECT id FROM problems WHERE id = $1',
      [problemId]
    );

    if (problems.length === 0) {
      throw new NotFoundError('Problem');
    }

    // Get test cases for the problem
    const testCases = await query<{ id: string; input: string; expectedOutput: string }>(
      'SELECT id, input, expected_output as "expectedOutput" FROM test_cases WHERE problem_id = $1 ORDER BY order_index',
      [problemId]
    );

    if (testCases.length === 0) {
      throw new BadRequestError('Problem has no test cases');
    }

    // Create submission record (session_id can be null for anonymous users)
    await query(
      `INSERT INTO submissions (id, problem_id, session_id, language, code, status, created_at)
       VALUES ($1, $2, NULL, $3, $4, 'queued', NOW())`,
      [submissionId, problemId, language, code]
    );

    // Add job to execution queue
    await addExecutionJob({
      submissionId,
      problemId,
      language,
      code,
      testCases: testCases.map((tc) => ({
        id: tc.id,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
      })),
    });

    logger.info({ submissionId, problemId, language }, 'Submission created');

    const response: CreateSubmissionResponse = {
      submissionId,
      status: 'Queued',
    };

    res.status(202).json(response);
  })
);

// GET /api/submissions/:id - Get submission status
router.get(
  '/:id',
  validateParams(idParamSchema),
  asyncHandler(async (req, res) => {
    const id = req.params['id'] as string;

    // Try cache first
    const cached = await getCache<GetSubmissionResponse>(`submission:${id}`);
    if (cached && (cached.status === 'Accepted' || cached.status === 'Wrong Answer')) {
      res.json(cached);
      return;
    }

    // Query database
    const submissions = await query<{
      id: string;
      problem_id: string;
      session_id: string;
      language: string;
      code: string;
      status: string;
      execution_time_ms: number | null;
      memory_used_kb: number | null;
      test_results: string | null;
      stdout: string | null;
      stderr: string | null;
      created_at: Date;
      completed_at: Date | null;
      problem_title: string;
      problem_slug: string;
    }>(
      `SELECT s.*, p.title as problem_title, p.slug as problem_slug
       FROM submissions s
       JOIN problems p ON s.problem_id = p.id
       WHERE s.id = $1`,
      [id]
    );

    if (submissions.length === 0) {
      throw new NotFoundError('Submission');
    }

    const submission = submissions[0]!;
    
    const response: GetSubmissionResponse = {
      id: submission.id,
      problemId: submission.problem_id,
      sessionId: submission.session_id ?? '',
      language: submission.language as Submission['language'],
      code: submission.code,
      status: dbToApiStatus(submission.status),
      executionTimeMs: submission.execution_time_ms,
      memoryUsedKb: submission.memory_used_kb,
      testResults: submission.test_results ? JSON.parse(submission.test_results) : null,
      stdout: submission.stdout,
      stderr: submission.stderr,
      createdAt: submission.created_at,
      completedAt: submission.completed_at,
      problem: {
        title: submission.problem_title,
        slug: submission.problem_slug,
      },
    };

    // Cache completed submissions
    if (response.status === 'Accepted' || response.status === 'Wrong Answer') {
      await setCache(`submission:${id}`, response, 3600);
    }

    res.json(response);
  })
);

export default router;
