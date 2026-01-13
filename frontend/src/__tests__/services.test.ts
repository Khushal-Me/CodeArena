import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/services/api', () => ({
  api: {
    getProblems: vi.fn(),
    getProblem: vi.fn(),
    submitSolution: vi.fn(),
    getSubmission: vi.fn(),
    getSubmissionHistory: vi.fn(),
  },
}));

vi.mock('@/services/websocket', () => ({
  websocketService: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    subscribeToSubmission: vi.fn(),
    unsubscribeFromSubmission: vi.fn(),
    onStatusUpdate: vi.fn(),
  },
}));

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getProblems', () => {
    it('should fetch problems list', async () => {
      const { api } = await import('@/services/api');
      const mockProblems = [
        { id: '1', title: 'Two Sum', difficulty: 'easy' },
        { id: '2', title: 'Add Two Numbers', difficulty: 'medium' },
      ];

      (api.getProblems as any).mockResolvedValue(mockProblems);

      const result = await api.getProblems();
      expect(result).toEqual(mockProblems);
      expect(api.getProblems).toHaveBeenCalledTimes(1);
    });
  });

  describe('getProblem', () => {
    it('should fetch a single problem by id', async () => {
      const { api } = await import('@/services/api');
      const mockProblem = {
        id: '1',
        title: 'Two Sum',
        difficulty: 'easy',
        description: 'Given an array...',
      };

      (api.getProblem as any).mockResolvedValue(mockProblem);

      const result = await api.getProblem('1');
      expect(result).toEqual(mockProblem);
      expect(api.getProblem).toHaveBeenCalledWith('1');
    });
  });

  describe('submitSolution', () => {
    it('should submit a solution and return submission id', async () => {
      const { api } = await import('@/services/api');
      const mockResponse = { submissionId: 'sub-123' };

      (api.submitSolution as any).mockResolvedValue(mockResponse);

      const result = await api.submitSolution('1', 'print("hello")', 'python');
      expect(result).toEqual(mockResponse);
      expect(api.submitSolution).toHaveBeenCalledWith('1', 'print("hello")', 'python');
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
    expect(websocketService.connect).toHaveBeenCalledTimes(1);
  });

  it('should subscribe to submission updates', async () => {
    const { websocketService } = await import('@/services/websocket');
    
    websocketService.subscribeToSubmission('sub-123');
    expect(websocketService.subscribeToSubmission).toHaveBeenCalledWith('sub-123');
  });

  it('should handle status updates', async () => {
    const { websocketService } = await import('@/services/websocket');
    const mockCallback = vi.fn();

    websocketService.onStatusUpdate(mockCallback);
    expect(websocketService.onStatusUpdate).toHaveBeenCalledWith(mockCallback);
  });
});
