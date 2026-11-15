import React from 'react';
import { CheckCircle2, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';
import Badge from '../ui/Badge';

export function SuccessState({
  title = 'Analysis complete',
  url = 'https://example.com',
  strategy = null,
  metrics = {
    lcp: '1.42s',
    fid: '12ms',
    cls: '0.02',
    ttfb: '210ms',
    score: 94,
  },
  className,
}) {
  return (
    <div
      className={cn(
        'w-full p-4 rounded-md border border-status-success/30 bg-status-success/5 flex flex-col sm:flex-row items-center justify-between gap-4',
        className
      )}
    >
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <div className="p-2 rounded-full bg-status-success/20 text-status-success border border-status-success/30 shrink-0">
          <CheckCircle2 className="w-4 h-4" />
        </div>
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-text-primary tracking-tight">
              {title}
            </span>
            <Badge variant="fast" size="xs">Score {metrics.score}/100</Badge>
            {strategy && (
              <Badge variant="info" size="xs">
                {strategy === 'desktop' ? 'Desktop Analysis' : 'Mobile Analysis'}
              </Badge>
            )}
          </div>
          <p className="text-[11px] font-mono text-text-secondary truncate">
            {url}
          </p>
        </div>
      </div>

      {/* Quick Summary Pill Bar */}
      <div className="flex items-center gap-3 overflow-x-auto w-full sm:w-auto justify-start sm:justify-end text-xs font-mono">
        <div className="px-2 py-1 bg-surface rounded border border-border flex items-center gap-1.5 shrink-0">
          <span className="text-text-muted">LCP</span>
          <span className="text-status-success font-semibold">{metrics.lcp}</span>
        </div>
        <div className="px-2 py-1 bg-surface rounded border border-border flex items-center gap-1.5 shrink-0">
          <span className="text-text-muted">TTFB</span>
          <span className="text-text-primary">{metrics.ttfb}</span>
        </div>
        <div className="px-2 py-1 bg-surface rounded border border-border flex items-center gap-1.5 shrink-0">
          <span className="text-text-muted">CLS</span>
          <span className="text-status-success font-semibold">{metrics.cls}</span>
        </div>
      </div>
    </div>
  );
}

export default SuccessState;
