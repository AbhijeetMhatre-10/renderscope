import React from 'react';
import { Info, HelpCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import Badge from '../ui/Badge';

export function PartialState({
  title = 'Some performance information was unavailable.',
  missingItems = ['User-Timing Marks', 'Server-Timing Response Headers'],
  reason = 'The target server does not broadcast Cross-Origin-Resource-Policy or Server-Timing headers, limiting sub-millisecond network breakdown.',
  className,
}) {
  return (
    <div
      className={cn(
        'w-full p-4 rounded-md border border-status-warning/30 bg-status-warning/5 text-xs text-text-secondary space-y-2.5',
        className
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className="p-1 rounded bg-status-warning/20 text-status-warning shrink-0 mt-0.5">
          <Info className="w-3.5 h-3.5" />
        </div>
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-text-primary">
              {title}
            </span>
            <Badge variant="warning" size="xs">Partial Data</Badge>
          </div>
          <p className="text-[11px] leading-relaxed text-text-secondary">
            {reason}
          </p>
        </div>
      </div>

      {missingItems && missingItems.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pl-6 pt-1 font-mono text-[11px]">
          <span className="text-text-muted">Unreported:</span>
          {missingItems.map((item, idx) => (
            <span key={idx} className="px-2 py-0.5 rounded bg-surface border border-border text-text-secondary">
              {item}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default PartialState;
