import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getHistory } from '@/services/api';
import StatusIndicator from '@/components/StatusIndicator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Filter, History } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const HistoryPage = () => {
  const [languageFilter, setLanguageFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data, isLoading, error } = useQuery({
    queryKey: ['history'],
    queryFn: () => getHistory(),
  });

  const submissions = data?.submissions;

  const filteredSubmissions = submissions?.filter((submission) => {
    const matchesLanguage = languageFilter === 'all' || submission.language === languageFilter;
    const matchesStatus = statusFilter === 'all' || submission.status === statusFilter;
    return matchesLanguage && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-8">
        <div className="text-center text-destructive">
          <p>Failed to load submission history. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <History className="h-8 w-8" />
          <h1 className="text-3xl font-bold tracking-tight">Submission History</h1>
        </div>
        <p className="text-muted-foreground">
          View all your past submissions and their results
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <Select value={languageFilter} onValueChange={setLanguageFilter}>
          <SelectTrigger className="w-[150px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Languages</SelectItem>
            <SelectItem value="python">Python</SelectItem>
            <SelectItem value="javascript">JavaScript</SelectItem>
            <SelectItem value="java">Java</SelectItem>
            <SelectItem value="cpp">C++</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Accepted">Accepted</SelectItem>
            <SelectItem value="Wrong Answer">Wrong Answer</SelectItem>
            <SelectItem value="Time Limit Exceeded">TLE</SelectItem>
            <SelectItem value="Runtime Error">Runtime Error</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Summary */}
      {submissions && submissions.length > 0 && (
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{submissions.length}</div>
              <p className="text-sm text-muted-foreground">Total Submissions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-500">
                {submissions.filter((s) => s.status === 'Accepted').length}
              </div>
              <p className="text-sm text-muted-foreground">Accepted</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-500">
                {submissions.filter((s) => s.status === 'Wrong Answer').length}
              </div>
              <p className="text-sm text-muted-foreground">Wrong Answer</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {submissions.length > 0 
                  ? Math.round(
                      (submissions.filter((s) => s.status === 'Accepted').length /
                        submissions.length) *
                        100
                    )
                  : 0}%
              </div>
              <p className="text-sm text-muted-foreground">Acceptance Rate</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Submissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Submissions ({filteredSubmissions?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredSubmissions && filteredSubmissions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Problem</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Language</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubmissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell>
                      <Link
                        to={`/problems/${submission.problemSlug}`}
                        className="font-medium hover:underline"
                      >
                        {submission.problemTitle}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <StatusIndicator status={submission.status} size="sm" />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {submission.language}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {submission.executionTimeMs
                        ? `${submission.executionTimeMs}ms`
                        : '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDistanceToNow(new Date(submission.createdAt), {
                        addSuffix: true,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="ghost">
                        <Link to={`/submissions/${submission.id}`}>
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {submissions?.length === 0
                  ? 'No submissions yet. Start solving problems!'
                  : 'No submissions match your filters.'}
              </p>
              {submissions?.length === 0 && (
                <Button asChild className="mt-4">
                  <Link to="/problems">Browse Problems</Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HistoryPage;
