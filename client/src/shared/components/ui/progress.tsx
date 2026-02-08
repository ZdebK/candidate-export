import * as React from 'react';
import { cn } from '../../utils/cn';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
}

function Progress({ className, value = 0, ...props }: ProgressProps) {
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('relative h-3 w-full overflow-hidden rounded-full bg-slate-100', className)}
      {...props}
    >
      <div
        className="h-full bg-gradient-to-r from-purple-600 to-purple-500 rounded-full transition-all duration-300 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export { Progress };
