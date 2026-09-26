import React from 'react';
import { cn } from '../../../lib/utils';

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-sm bg-surface-elevated/80 border border-border/40',
        className
      )}
      {...props}
    />
  );
}

export function SkeletonCard({ className, ...props }) {
  return (
    <div
      className={cn(
        'rounded-md border border-border bg-surface p-4 space-y-3',
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-12 rounded-sm" />
      </div>
      <Skeleton className="h-7 w-20" />
      <Skeleton className="h-3 w-4/5" />
    </div>
  );
}

export function SkeletonRow({ className, columns = 4, ...props }) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 p-3 border-b border-border/50 bg-surface/50',
        className
      )}
      {...props}
    >
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-4 flex-1 max-w-xs" />
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-4 w-24 ml-auto" />
    </div>
  );
}

export default Skeleton;
