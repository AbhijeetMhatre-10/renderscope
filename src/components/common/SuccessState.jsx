import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import Badge from '../ui/Badge';

export function SuccessState({
  title = 'Analysis complete',
  url = '',
  strategy = null,
  metrics = {},
  className,
}) {
  const pills = [
    metrics.lcp ? { label: 'LCP', value: metrics.lcp, highlight: true } : null,
    metrics.fcp ? { label: 'FCP', value: metrics.fcp } : null,
    metrics.ttfb ? { label: 'TTFB', value: metrics.ttfb } : null,
    metrics.requests !== undefined && metrics.requests !== null
      ? { label: 'Requests', value: String(metrics.requests) }
      : null,
  ].filter(Boolean);

  return (
    <div
      className={cn(
        'w-full p-4 rounded-md border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4',
        className
      )}
      style={{
        borderColor: 'color-mix(in srgb, var(--success) 35%, transparent)',
        backgroundColor: 'color-mix(in srgb, var(--success) 7%, var(--surface))',
      }}
    >
      <div className="flex items-center gap-3 w-full sm:w-auto min-w-0">
        <div
          className="p-2 rounded-full text-status-success border shrink-0"
          style={{
            borderColor: 'color-mix(in srgb, var(--success) 35%, transparent)',
            backgroundColor: 'color-mix(in srgb, var(--success) 16%, transparent)',
          }}
        >
          <CheckCircle2 className="w-4 h-4" />
        </div>
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-text-primary tracking-tight">
              {title}
            </span>
            {strategy && (
              <Badge variant="info" size="xs">
                {strategy === 'desktop' ? 'Desktop' : 'Mobile'}
              </Badge>
            )}
          </div>
          <p className="text-[11px] font-mono text-text-secondary truncate">
            {url}
          </p>
        </div>
      </div>

      {pills.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto justify-start sm:justify-end text-xs font-mono">
          {pills.map((pill) => (
            <div
              key={pill.label}
              className="px-2 py-1 bg-surface rounded border border-border flex items-center gap-1.5 shrink-0 font-mono-numbers"
            >
              <span className="text-text-muted">{pill.label}</span>
              <span className={pill.highlight ? 'text-status-success font-semibold' : 'text-text-primary'}>
                {pill.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SuccessState;
