import React from 'react';
import { Terminal, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import Button from '../ui/Button';

export function EmptyState({
  title = 'No analysis yet.',
  description = 'Enter a target URL above or select a past run to inspect its visual performance timeline.',
  actionLabel = 'Start Analysis',
  onAction,
  icon: Icon = Terminal,
  className,
}) {
  return (
    <div
      className={cn(
        'w-full max-w-lg mx-auto my-12 p-8 rounded-lg border border-border border-dashed bg-surface/50 text-center space-y-5',
        className
      )}
    >
      <div className="inline-flex items-center justify-center p-3 rounded-md bg-surface-elevated text-text-muted border border-border">
        <Icon className="w-6 h-6" />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-base font-semibold text-text-primary tracking-tight">
          {title}
        </h3>
        <p className="text-xs text-text-secondary leading-relaxed max-w-sm mx-auto">
          {description}
        </p>
      </div>

      {actionLabel && onAction && (
        <div className="pt-2">
          <Button
            variant="secondary"
            size="md"
            onClick={onAction}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}

export default EmptyState;
