import React from 'react';
import { Activity, CheckCircle2, Circle, Loader2, Radio } from 'lucide-react';
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
        'w-full max-w-2xl mx-auto my-12 p-5 sm:p-7 rounded-lg border border-border bg-surface space-y-5 overflow-hidden',
        className
      )}
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-status-info font-mono">
            <Radio className="h-3 w-3 animate-pulse motion-reduce:animate-none" />
            Live analysis
          </p>
          <h3 className="text-base font-semibold text-text-primary">
            Analyzing {url.replace(/^https?:\/\//, '')}
          </h3>
          <p className="text-xs text-text-muted">PageSpeed is processing the URL remotely. Visual stages show activity while the API runs.</p>
        </div>
        <Activity className="h-5 w-5 shrink-0 text-status-info analysis-pulse motion-reduce:animate-none" aria-hidden="true" />
      </div>

      <div className="analysis-browser relative rounded-md border border-border bg-background p-3 sm:p-4">
        <div className="flex items-center gap-1.5 border-b border-border-subtle pb-3">
          <span className="h-2 w-2 rounded-full bg-status-error/70" />
          <span className="h-2 w-2 rounded-full bg-status-warning/70" />
          <span className="h-2 w-2 rounded-full bg-status-success/70" />
          <div className="ml-2 h-5 flex-1 rounded-sm border border-border bg-surface px-2 flex items-center text-[10px] text-text-muted font-mono truncate">
            {url}
          </div>
        </div>
        <div className="relative mt-4 grid grid-cols-[1fr_auto] gap-3">
          <div className="space-y-2">
            <div className="h-2.5 w-3/4 rounded-full bg-status-info/40" />
            <div className="h-2 w-full rounded-full bg-surface-elevated" />
            <div className="h-2 w-5/6 rounded-full bg-surface-elevated" />
            <div className="grid grid-cols-3 gap-2 pt-2">
              <span className="h-10 rounded-sm bg-resource-html/20" />
              <span className="h-10 rounded-sm bg-resource-css/20" />
              <span className="h-10 rounded-sm bg-resource-js/20" />
            </div>
          </div>
          <div className="flex w-20 flex-col justify-end gap-1.5">
            {[0, 1, 2, 3].map((item) => (
              <span key={item} className="analysis-resource-bar h-1.5 rounded-full bg-status-info/60" style={{ animationDelay: `${item * 180}ms` }} />
            ))}
          </div>
          <span className="analysis-scan-line pointer-events-none absolute inset-x-0 top-0 h-px bg-status-info/70 motion-reduce:hidden" />
        </div>
      </div>

      <div className="h-1 overflow-hidden rounded-full bg-surface-elevated" aria-hidden="true">
        <div
          className="h-full rounded-full bg-status-info transition-[width] duration-500 ease-out"
          style={{ width: `${Math.min(100, Math.max(8, ((stepIndex + 1) / analysisSteps.length) * 100))}%` }}
        />
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
                <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none text-status-info" />
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
