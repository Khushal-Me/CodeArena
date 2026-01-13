import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the API module with exported functions
const mockGetProblems = vi.fn();
const mockGetProblem = vi.fn();
const mockCreateSubmission = vi.fn();
const mockGetSubmission = vi.fn();
const mockGetSubmissionHistory = vi.fn();

vi.mock('@/services/api', () => ({
  api: {},
  getProblems: mockGetProblems,
  getProblem: mockGetProblem,
  createSubmission: mockCreateSubmission,
  getSubmission: mockGetSubmission,
  getSubmissionHistory: mockGetSubmissionHistory,
}));

// Mock the WebSocket service
const mockConnect = vi.fn();
const mockDisconnect = vi.fn();
const mockSubscribeToSubmission = vi.fn();

vi.mock('@/services/websocket', () => ({
  websocketService: {
    connect: mockConnect,
    disconnect: mockDisconnect,
    subscribeToSubmission: mockSubscribeToSubmission,
  },
}));

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getProblems', () => {
    it('should fetch problems list', async () => {
      const { getProblems } = await import('@/services/api');
      const mockProblems = [
        { id: '1', title: 'Two Sum', difficulty: 'easy' },
        { id: '2', title: 'Add Two Numbers', difficulty: 'medium' },
      ];

      mockGetProblems.mockResolvedValue(mockProblems);

      const result = await getProblems();
      expect(result).toEqual(mockProblems);
      expect(mockGetProblems).toHaveBeenCalledTimes(1);
    });
  });

  describe('getProblem', () => {
    it('should fetch a single problem by id', async () => {
      const { getProblem } = await import('@/services/api');
      const mockProblem = {
        id: '1',
        title: 'Two Sum',
        difficulty: 'easy',
        description: 'Given an array...',
      };

      mockGetProblem.mockResolvedValue(mockProblem);

      const result = await getProblem('1');
      expect(result).toEqual(mockProblem);
      expect(mockGetProblem).toHaveBeenCalledWith('1');
    });
  });

  describe('createSubmission', () => {
    it('should submit a solution and return submission id', async () => {
      const { createSubmission } = await import('@/services/api');
      const mockResponse = { submissionId: 'sub-123' };

      mockCreateSubmission.mockResolvedValue(mockResponse);

      const result = await createSubmission({
        problemId: '1',
        code: 'print("hello")',
        language: 'python',
      });
      expect(result).toEqual(mockResponse);
      expect(mockCreateSubmission).toHaveBeenCalledWith({
        problemId: '1',
        code: 'print("hello")',
        language: 'python',
      });
    });
  });
});

describe('WebSocket Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should connect to websocket server', async () => {
    const { websocketService } = await import('@/services/websocket');
    
    websocketService.connect();
    expect(mockConnect).toHaveBeenCalledTimes(1);
  });

  it('should subscribe to submission updates', async () => {
    const { websocketService } = await import('@/services/websocket');
    const callbacks = { onStatus: vi.fn(), onCompleted: vi.fn() };
    
    websocketService.subscribeToSubmission('sub-123', callbacks);
    expect(mockSubscribeToSubmission).toHaveBeenCalledWith('sub-123', callbacks);
  });
});
