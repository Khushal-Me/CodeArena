import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getSubmission } from '@/services/api';
import StatusIndicator from '@/components/StatusIndicator';
import TestCaseCard from '@/components/TestCaseCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, MemoryStick, FileCode2, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const SubmissionPage = () => {
  const { id } = useParams<{ id: string }>();

  const { data: submission, isLoading, error } = useQuery({
    queryKey: ['submission', id],
    queryFn: () => getSubmission(id!),
    enabled: !!id,
    refetchInterval: (query) => {
      // Keep polling if submission is still processing
      const status = query.state.data?.status;
      if (status === 'Queued' || status === 'Running') {
        return 2000;
      }
      return false;
    },
  });

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="container py-8">
        <div className="text-center text-destructive">
          <p>Failed to load submission. Please try again later.</p>
        </div>
      </div>
    );
  }

  const passedCount = submission.testResults?.filter((r) => r.passed).length || 0;
  const totalCount = submission.testResults?.length || 0;

  return (
    <div className="container py-8 max-w-4xl">
      {/* Back Button */}
      <Button asChild variant="ghost" className="mb-4 -ml-4">
        <Link to={`/problems/${submission.problemId}`}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Problem
        </Link>
      </Button>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              Submission Details
            </h1>
            <p className="text-muted-foreground">
              Submission ID: {submission.id}
            </p>
          </div>
          <StatusIndicator status={submission.status} size="lg" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <FileCode2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Language</p>
                <p className="font-semibold capitalize">{submission.language}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Execution Time</p>
                <p className="font-semibold">
                  {submission.executionTimeMs ? `${submission.executionTimeMs}ms` : '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <MemoryStick className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Memory Usage</p>
                <p className="font-semibold">
                  {submission.memoryUsedKb ? `${Math.round(submission.memoryUsedKb / 1024)}MB` : '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Submitted</p>
                <p className="font-semibold">
                  {formatDistanceToNow(new Date(submission.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Results */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Test Results</CardTitle>
            {totalCount > 0 && (
              <Badge variant={passedCount === totalCount ? 'default' : 'secondary'}>
                {passedCount} / {totalCount} Passed
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {submission.testResults && submission.testResults.length > 0 ? (
            <div className="space-y-3">
              {submission.testResults.map((result, idx) => (
                <TestCaseCard
                  key={idx}
                  testCase={result}
                  index={idx}
                />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              {submission.status === 'Queued' || submission.status === 'Running'
                ? 'Running test cases...'
                : 'No test results available.'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Code Section */}
      <Card>
        <CardHeader>
          <CardTitle>Submitted Code</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted rounded-lg p-4 overflow-x-auto text-sm">
            <code>{submission.code}</code>
          </pre>
        </CardContent>
      </Card>

      {/* Error Message */}
      {submission.stderr && (
        <Card className="mt-4 border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-destructive/10 rounded-lg p-4 overflow-x-auto text-sm text-destructive">
              {submission.stderr}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SubmissionPage;
