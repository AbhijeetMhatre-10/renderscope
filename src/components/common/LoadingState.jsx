import React from 'react';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { analysisSteps } from '../../services/analysisService';

export function LoadingState({
  url = 'https://example.com',
  stepIndex = 0,
  className,
}) {
  return (
    <div
      className={cn(
        'w-full max-w-xl mx-auto my-12 p-6 sm:p-8 rounded-lg border border-border bg-surface space-y-5',
        className
      )}
    >
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-text-primary">Analyzing {url.replace(/^https?:\/\//, '')}</h3>
      </div>

      <div className="space-y-3 rounded-md border border-border bg-background p-4">
        {analysisSteps.map((step, index) => {
          const complete = index < stepIndex;
          const active = index === stepIndex;
          return (
            <div key={step} className="flex items-center gap-2 text-xs">
              {complete ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-status-success" />
              ) : active ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-status-info" />
              ) : (
                <Circle className="h-3.5 w-3.5 text-text-muted" />
              )}
              <span className={complete || active ? 'text-text-primary' : 'text-text-muted'}>{step}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default LoadingState;
