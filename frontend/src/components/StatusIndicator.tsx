import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  AlertTriangle,
  Code,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SubmissionStatus } from '@/types';

interface StatusIndicatorProps {
  status: SubmissionStatus;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const statusConfig: Record<
  SubmissionStatus,
  {
    icon: typeof CheckCircle2;
    color: string;
    bgColor: string;
    label: string;
    animate?: boolean;
  }
> = {
  Queued: {
    icon: Clock,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    label: 'In Queue',
    animate: true,
  },
  Running: {
    icon: Loader2,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    label: 'Running...',
    animate: true,
  },
  Accepted: {
    icon: CheckCircle2,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    label: 'Accepted',
  },
  'Wrong Answer': {
    icon: XCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    label: 'Wrong Answer',
  },
  'Time Limit Exceeded': {
    icon: Clock,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    label: 'Time Limit Exceeded',
  },
  'Runtime Error': {
    icon: AlertTriangle,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    label: 'Runtime Error',
  },
  'Compilation Error': {
    icon: Code,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    label: 'Compilation Error',
  },
};

const sizeClasses = {
  sm: {
    container: 'text-xs px-2 py-1',
    icon: 'h-3 w-3',
  },
  md: {
    container: 'text-sm px-3 py-1.5',
    icon: 'h-4 w-4',
  },
  lg: {
    container: 'text-base px-4 py-2',
    icon: 'h-5 w-5',
  },
};

const StatusIndicator = ({
  status,
  size = 'md',
  showLabel = true,
}: StatusIndicatorProps) => {
  const config = statusConfig[status];
  const sizeClass = sizeClasses[size];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        config.bgColor,
        config.color,
        sizeClass.container
      )}
    >
      <Icon
        className={cn(sizeClass.icon, config.animate && 'animate-spin')}
      />
      {showLabel && <span>{config.label}</span>}
    </div>
  );
};

export default StatusIndicator;
