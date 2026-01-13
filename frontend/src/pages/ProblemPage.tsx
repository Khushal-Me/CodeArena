import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getProblem, createSubmission } from '@/services/api';
import { websocketService } from '@/services/websocket';
import { SupportedLanguage, SubmissionStatus, TestResult, LANGUAGE_CONFIG } from '@/types';
import CodeEditor from '@/components/CodeEditor';
import TestCaseCard from '@/components/TestCaseCard';
import StatusIndicator from '@/components/StatusIndicator';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Clock, MemoryStick, FileCode2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const difficultyColors: Record<string, string> = {
  Easy: 'bg-green-500/10 text-green-500 border-green-500/20',
  Medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  Hard: 'bg-red-500/10 text-red-500 border-red-500/20',
};

const ProblemPage = () => {
  const { id } = useParams<{ id: string }>();
  const [language, setLanguage] = useState<SupportedLanguage>('python');
  const [code, setCode] = useState(LANGUAGE_CONFIG.python.defaultCode);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [status, setStatus] = useState<SubmissionStatus | null>(null);
  const [results, setResults] = useState<TestResult[]>([]);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [memoryUsage, setMemoryUsage] = useState<number | null>(null);

  const { data: problem, isLoading, error } = useQuery({
    queryKey: ['problem', id],
    queryFn: () => getProblem(id!),
    enabled: !!id,
  });

  const submitMutation = useMutation({
    mutationFn: (data: { problemId: string; code: string; language: SupportedLanguage }) =>
      createSubmission(data),
    onSuccess: (data) => {
      setSubmissionId(data.submissionId);
      setStatus('Queued');
      setResults([]);
      setExecutionTime(null);
      setMemoryUsage(null);
    },
  });

  // Handle language change
  const handleLanguageChange = useCallback((newLanguage: SupportedLanguage) => {
    setLanguage(newLanguage);
    setCode(LANGUAGE_CONFIG[newLanguage].defaultCode);
  }, []);

  // Subscribe to submission updates
  useEffect(() => {
    if (!submissionId) return;

    const unsubscribe = websocketService.subscribeToSubmission(submissionId, {
      onStatus: (data) => {
        setStatus(data.status);
      },
      onCompleted: (data) => {
        setStatus(data.status);
        setExecutionTime(data.executionTimeMs);
        setMemoryUsage(Math.round(data.memoryUsedKb / 1024));
        // Map the test results
        setResults(data.testResults.map(r => ({
          testCaseId: r.testCaseId,
          passed: r.passed,
          output: r.output || '',
          executionTimeMs: r.executionTimeMs,
        })));
      },
      onError: (err) => {
        console.error('Submission error:', err.message);
        setStatus('Runtime Error');
      },
    });

    return unsubscribe;
  }, [submissionId]);

  const handleSubmit = () => {
    if (!problem) return;
    submitMutation.mutate({ problemId: problem.id, code, language });
  };

  const isRunning = status === 'Queued' || status === 'Running';

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="container py-8">
        <div className="text-center text-destructive">
          <p>Failed to load problem. Please try again later.</p>
        </div>
      </div>
    );
  }

  // Get available languages (all languages are supported for now)
  const supportedLanguages: SupportedLanguage[] = ['python', 'javascript', 'java', 'cpp'];

  return (
    <div className="container py-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-8rem)]">
        {/* Left Panel - Problem Description */}
        <div className="flex flex-col overflow-hidden">
          <Card className="flex-1 overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{problem.title}</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge
                      variant="outline"
                      className={cn(difficultyColors[problem.difficulty])}
                    >
                      {problem.difficulty}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {supportedLanguages.length} languages
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="overflow-y-auto">
              <Tabs defaultValue="description">
                <TabsList>
                  <TabsTrigger value="description">Description</TabsTrigger>
                  <TabsTrigger value="testcases">Test Cases</TabsTrigger>
                </TabsList>
                <TabsContent value="description" className="mt-4">
                  <div className="prose prose-sm dark:prose-invert">
                    <p className="whitespace-pre-wrap">{problem.description}</p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {problem.tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="testcases" className="mt-4 space-y-4">
                  {problem.testCases
                    .filter((tc) => !tc.isHidden)
                    .map((testCase, idx) => (
                      <div key={testCase.id} className="space-y-2">
                        <h4 className="font-semibold">Test Case {idx + 1}</h4>
                        <div className="bg-muted rounded-lg p-4 font-mono text-sm space-y-2">
                          <div>
                            <span className="text-muted-foreground">Input:</span>
                            <pre className="mt-1 whitespace-pre-wrap">{testCase.input}</pre>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Expected Output:</span>
                            <pre className="mt-1 whitespace-pre-wrap">{testCase.expectedOutput}</pre>
                          </div>
                        </div>
                      </div>
                    ))}
                  <p className="text-sm text-muted-foreground">
                    Showing {problem.visibleTestCaseCount} of {problem.totalTestCaseCount} test cases
                  </p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Code Editor & Results */}
        <div className="flex flex-col gap-4 overflow-hidden">
          {/* Language Select & Submit */}
          <div className="flex items-center justify-between">
            <Select value={language} onValueChange={(v) => handleLanguageChange(v as SupportedLanguage)}>
              <SelectTrigger className="w-[180px]">
                <FileCode2 className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {supportedLanguages.map((lang) => (
                  <SelectItem key={lang} value={lang}>
                    {LANGUAGE_CONFIG[lang].name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleSubmit}
              disabled={isRunning || !code.trim() || submitMutation.isPending}
              className="gap-2"
            >
              <Play className="h-4 w-4" />
              {isRunning || submitMutation.isPending ? 'Running...' : 'Submit'}
            </Button>
          </div>

          {/* Code Editor */}
          <div className="flex-1 min-h-0">
            <CodeEditor
              language={language}
              value={code}
              onChange={(value) => setCode(value || '')}
            />
          </div>

          {/* Results Panel */}
          {status && (
            <Card>
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Results</CardTitle>
                  <StatusIndicator status={status} />
                </div>
              </CardHeader>
              <CardContent className="max-h-48 overflow-y-auto">
                {executionTime !== null && (
                  <div className="flex gap-4 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" /> {executionTime}ms
                    </span>
                    {memoryUsage !== null && (
                      <span className="flex items-center gap-1">
                        <MemoryStick className="h-4 w-4" /> {memoryUsage}MB
                      </span>
                    )}
                  </div>
                )}
                {results.length > 0 ? (
                  <div className="space-y-2">
                    {results.map((result, idx) => (
                      <TestCaseCard
                        key={idx}
                        testCase={result}
                        index={idx}
                      />
                    ))}
                  </div>
                ) : isRunning ? (
                  <p className="text-sm text-muted-foreground">
                    Running test cases...
                  </p>
                ) : null}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProblemPage;
