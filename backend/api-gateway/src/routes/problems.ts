import { Router } from 'express';
import { query } from '../services/database.js';
import { setCache, getCache } from '../services/cache.js';
import { 
  validateQuery, 
  validateParams, 
  listProblemsQuerySchema,
  slugParamSchema 
} from '../middleware/validation.js';
import { asyncHandler, NotFoundError } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';
import type { 
  Problem, 
  TestCase,
  ListProblemsQuery,
  ListProblemsResponse,
  GetProblemResponse 
} from '../types/index.js';

const router = Router();

// GET /api/problems - List all problems
router.get(
  '/',
  validateQuery(listProblemsQuerySchema),
  asyncHandler(async (req, res) => {
    const { difficulty, search, limit, offset } = req.query as unknown as ListProblemsQuery;

    // Build query dynamically based on filters
    let queryText = `
      SELECT id, title, slug, difficulty, tags
      FROM problems
      WHERE 1=1
    `;
    const params: (string | number)[] = [];
    let paramIndex = 1;

    if (difficulty) {
      queryText += ` AND difficulty = $${paramIndex}`;
      params.push(difficulty);
      paramIndex++;
    }

    if (search) {
      queryText += ` AND (title ILIKE $${paramIndex} OR $${paramIndex} = ANY(tags))`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Get total count
    const countQuery = queryText.replace('SELECT id, title, slug, difficulty, tags', 'SELECT COUNT(*) as count');
    const countResult = await query<{ count: string }>(countQuery, params);
    const total = parseInt(countResult[0]?.count ?? '0', 10);

    // Add pagination
    queryText += ` ORDER BY id ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit ?? 20, offset ?? 0);

    const problems = await query<{
      id: string;
      title: string;
      slug: string;
      difficulty: string;
      tags: string[];
    }>(queryText, params);

    const response: ListProblemsResponse = {
      problems: problems.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        difficulty: p.difficulty as Problem['difficulty'],
        tags: p.tags ?? [],
      })),
      total,
      limit: limit ?? 20,
      offset: offset ?? 0,
    };

    res.json(response);
  })
);

// GET /api/problems/:slug - Get problem details
router.get(
  '/:slug',
  validateParams(slugParamSchema),
  asyncHandler(async (req, res) => {
    const slug = req.params['slug'] as string;

    // Try cache first
    const cacheKey = `problem:${slug}`;
    const cached = await getCache<GetProblemResponse>(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    // Query problem
    const problems = await query<{
      id: string;
      title: string;
      slug: string;
      description: string;
      difficulty: string;
      tags: string[];
      created_at: Date;
    }>(
      'SELECT * FROM problems WHERE slug = $1',
      [slug]
    );

    if (problems.length === 0) {
      throw new NotFoundError('Problem');
    }

    const problem = problems[0]!;

    // Query test cases (only return visible ones with full details)
    const testCases = await query<{
      id: string;
      input: string;
      expected_output: string;
      is_hidden: boolean;
    }>(
      `SELECT id, input, expected_output, is_hidden
       FROM test_cases 
       WHERE problem_id = $1 
       ORDER BY order_index`,
      [problem.id]
    );

    const visibleTestCases = testCases.filter((tc) => !tc.is_hidden);
    const totalTestCases = testCases.length;

    const response: GetProblemResponse = {
      id: problem.id,
      title: problem.title,
      slug: problem.slug,
      description: problem.description,
      difficulty: problem.difficulty as Problem['difficulty'],
      tags: problem.tags ?? [],
      createdAt: problem.created_at,
      testCases: visibleTestCases.map((tc) => ({
        id: tc.id,
        input: tc.input,
        expectedOutput: tc.expected_output,
        isHidden: tc.is_hidden,
      })),
      visibleTestCaseCount: visibleTestCases.length,
      totalTestCaseCount: totalTestCases,
    };

    // Cache problem data (problems don't change often)
    await setCache(cacheKey, response, 3600);

    res.json(response);
  })
);

export default router;
