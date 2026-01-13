import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ProblemListItem, Difficulty } from '@/types';

interface ProblemCardProps {
  problem: ProblemListItem;
}

const difficultyVariant: Record<Difficulty, 'easy' | 'medium' | 'hard'> = {
  Easy: 'easy',
  Medium: 'medium',
  Hard: 'hard',
};

const ProblemCard = ({ problem }: ProblemCardProps) => {
  return (
    <Link to={`/problems/${problem.slug}`}>
      <Card className="h-full transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg leading-tight line-clamp-2">
              {problem.title}
            </CardTitle>
            <Badge variant={difficultyVariant[problem.difficulty]}>
              {problem.difficulty}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5">
            {problem.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {problem.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{problem.tags.length - 3} more
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ProblemCard;
