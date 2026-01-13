import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getProblems } from '@/services/api';
import { ProblemListItem } from '@/types';
import ProblemCard from '@/components/ProblemCard';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search, Filter } from 'lucide-react';

const ProblemsPage = () => {
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState<string>('all');

  const { data, isLoading, error } = useQuery({
    queryKey: ['problems'],
    queryFn: () => getProblems(),
  });

  const problems = data?.problems;

  const filteredProblems = problems?.filter((problem: ProblemListItem) => {
    const matchesSearch = problem.title.toLowerCase().includes(search.toLowerCase());
    const matchesDifficulty = difficulty === 'all' || problem.difficulty.toLowerCase() === difficulty;
    return matchesSearch && matchesDifficulty;
  });

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-muted rounded w-1/3"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-8">
        <div className="text-center text-destructive">
          <p>Failed to load problems. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Problems</h1>
        <p className="text-muted-foreground">
          Browse and solve coding challenges across all difficulty levels
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search problems..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-4">
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger className="w-[150px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results count */}
      <div className="mb-4 text-sm text-muted-foreground">
        Showing {filteredProblems?.length || 0} of {problems?.length || 0} problems
      </div>

      {/* Problems Grid */}
      {filteredProblems && filteredProblems.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProblems.map((problem: ProblemListItem) => (
            <ProblemCard key={problem.id} problem={problem} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No problems found matching your criteria.
          </p>
        </div>
      )}
    </div>
  );
};

export default ProblemsPage;
