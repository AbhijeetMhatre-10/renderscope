import React from 'react';
import { cn } from '../../../lib/utils';

export function Card({ className, children, hover = false, ...props }) {
  return (
    <div
      className={cn(
        'rounded-md border border-border bg-surface text-text-primary transition-all duration-150',
        hover && 'hover:border-border-focus hover:bg-surface-elevated cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }) {
  return (
    <div
      className={cn('flex items-center justify-between p-4 border-b border-border/60', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }) {
  return (
    <h3
      className={cn('text-sm font-semibold tracking-tight text-text-primary', className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }) {
  return (
    <p
      className={cn('text-xs text-text-secondary mt-0.5', className)}
      {...props}
    >
      {children}
    </p>
  );
}

export function CardContent({ className, children, ...props }) {
  return (
    <div className={cn('p-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }) {
  return (
    <div
      className={cn('flex items-center justify-between p-4 border-t border-border/60 bg-surface-elevated/40 text-xs text-text-secondary', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
