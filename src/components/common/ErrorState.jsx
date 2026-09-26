import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';
import Button from '../ui/Button';

export function ErrorState({
  title = "Something went wrong. We couldn't analyze this website.",
  description = 'The target host may be unreachable, rejecting automated probes, or encountering SSL handshake failure.',
  errorDetails = 'ERR_CONNECTION_TIMED_OUT: TCP SYN timeout after 15000ms',
  onRetry,
  className,
}) {
  return (
    <div
      className={cn(
        'w-full max-w-lg mx-auto my-12 p-6 sm:p-8 rounded-lg border border-status-error/30 bg-status-error/5 text-center space-y-5',
        className
      )}
    >
      <div className="inline-flex items-center justify-center p-3 rounded-full bg-status-error/10 text-status-error border border-status-error/20">
        <AlertTriangle className="w-6 h-6" />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-base font-semibold text-text-primary tracking-tight">
          {title}
        </h3>
        <p className="text-xs text-text-secondary leading-relaxed max-w-sm mx-auto">
          {description}
        </p>
      </div>

      {errorDetails && (
        <div className="p-3 bg-background/80 rounded border border-status-error/20 text-left font-mono text-[11px] text-status-error overflow-x-auto">
          <code>&gt; {errorDetails}</code>
        </div>
      )}

      {onRetry && (
        <div className="pt-2">
          <Button
            variant="danger"
            size="md"
            onClick={onRetry}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}

export default ErrorState;
