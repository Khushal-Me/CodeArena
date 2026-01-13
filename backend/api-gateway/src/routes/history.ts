import { Router } from 'express';
import { query } from '../services/database.js';
import { validateQuery, historyQuerySchema } from '../middleware/validation.js';
import { asyncHandler, BadRequestError } from '../middleware/errorHandler.js';
import type { HistoryQuery, HistoryResponse, Submission } from '../types/index.js';

const router = Router();

// GET /api/history - Get submission history for a session
router.get(
  '/',
  validateQuery(historyQuerySchema),
  asyncHandler(async (req, res) => {
    const { sessionId, limit, offset } = req.query as unknown as HistoryQuery;

    if (!sessionId) {
      throw new BadRequestError('sessionId is required');
    }

    // Get total count
    const countResult = await query<{ count: string }>(
      'SELECT COUNT(*) as count FROM submissions WHERE session_id = $1',
      [sessionId]
    );
    const total = parseInt(countResult[0]?.count ?? '0', 10);

    // Query submissions with problem info
    const submissions = await query<{
      id: string;
      language: string;
      status: string;
      execution_time: number | null;
      created_at: Date;
      problem_title: string;
      problem_slug: string;
    }>(
      `SELECT s.id, s.language, s.status, s.execution_time, s.created_at,
              p.title as problem_title, p.slug as problem_slug
       FROM submissions s
       JOIN problems p ON s.problem_id = p.id
       WHERE s.session_id = $1
       ORDER BY s.created_at DESC
       LIMIT $2 OFFSET $3`,
      [sessionId, limit ?? 50, offset ?? 0]
    );

    const response: HistoryResponse = {
      submissions: submissions.map((s) => ({
        id: s.id,
        problemTitle: s.problem_title,
        problemSlug: s.problem_slug,
        language: s.language as Submission['language'],
        status: s.status as Submission['status'],
        executionTimeMs: s.execution_time,
        createdAt: s.created_at,
      })),
      total,
      limit: limit ?? 50,
      offset: offset ?? 0,
    };

    res.json(response);
  })
);

export default router;
