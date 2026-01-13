import { CheckCircle2, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { TestResult } from '@/types';

interface TestCaseCardProps {
  testCase: TestResult;
  index: number;
  input?: string;
  expectedOutput?: string;
  showDetails?: boolean;
}

const TestCaseCard = ({
  testCase,
  index,
  input,
  expectedOutput,
  showDetails = false,
}: TestCaseCardProps) => {
  const [isExpanded, setIsExpanded] = useState(showDetails);

  return (
    <div
      className={cn(
        'rounded-lg border overflow-hidden transition-all',
        testCase.passed
          ? 'border-l-4 border-l-green-500'
          : 'border-l-4 border-l-red-500'
      )}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {testCase.passed ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <XCircle className="h-5 w-5 text-red-500" />
          )}
          <span className="font-medium">Test Case {index + 1}</span>
          <span className="text-sm text-muted-foreground">
            {testCase.executionTimeMs}ms
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'text-sm font-medium',
              testCase.passed ? 'text-green-500' : 'text-red-500'
            )}
          >
            {testCase.passed ? 'Passed' : 'Failed'}
          </span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="border-t p-4 space-y-4 bg-muted/30">
          {input && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Input
              </h4>
              <pre className="bg-background rounded-md p-3 text-sm overflow-x-auto">
                {input}
              </pre>
            </div>
          )}

          {expectedOutput && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Expected Output
              </h4>
              <pre className="bg-background rounded-md p-3 text-sm overflow-x-auto">
                {expectedOutput}
              </pre>
            </div>
          )}

          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              Your Output
            </h4>
            <pre
              className={cn(
                'rounded-md p-3 text-sm overflow-x-auto',
                testCase.passed ? 'bg-background' : 'bg-red-500/10'
              )}
            >
              {testCase.output || '(empty)'}
            </pre>
          </div>

          {testCase.error && (
            <div>
              <h4 className="text-sm font-medium text-red-500 mb-2">Error</h4>
              <pre className="bg-red-500/10 rounded-md p-3 text-sm text-red-500 overflow-x-auto">
                {testCase.error}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TestCaseCard;
