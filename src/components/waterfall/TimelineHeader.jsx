import React from 'react';
import { safeFormatDuration } from './waterfallUtils';

export function TimelineHeader({ ticks = [], milestones = [], timelineWidthPx }) {
  return (
    <div className="flex items-stretch border-b border-border bg-surface-elevated text-[10px] font-mono text-text-muted select-none">
      {/* Sticky Left Column Header */}
      <div className="sticky left-0 z-20 w-56 sm:w-64 shrink-0 px-3 py-2.5 bg-surface-elevated border-r border-border flex items-center justify-between uppercase tracking-wider">
        <span>Resource</span>
        <span>Status</span>
      </div>

      {/* Scrollable Timeline Axis */}
      <div
        className="relative shrink-0 h-9"
        style={{ width: `${timelineWidthPx}px` }}
      >
        {/* Millisecond Ticks */}
        {ticks.map((tick, index) => {
          const isFirst = index === 0;
          const isLast = index === ticks.length - 1;
          return (
            <div
              key={tick.ms}
              className="absolute top-0 bottom-0 flex flex-col justify-between pointer-events-none"
              style={{ left: `${tick.leftPct}%` }}
            >
              <span
                className={`pt-1.5 text-[10px] font-mono-numbers whitespace-nowrap ${
                  isFirst
                    ? 'translate-x-1'
                    : isLast
                      ? '-translate-x-full pr-1'
                      : '-translate-x-1/2'
                }`}
              >
                {tick.label}
              </span>
              <span className="h-2 w-px bg-border" />
            </div>
          );
        })}

        {/* Metric Milestone Flags (FCP / LCP / Load) */}
        {milestones.map((m) => (
          <div
            key={m.id}
            className="absolute top-1 z-10 -translate-x-1/2 pointer-events-none"
            style={{ left: `${m.leftPct}%` }}
            title={`${m.label}: ${safeFormatDuration(m.ms)}`}
          >
            <span
              className="px-1 py-0.5 rounded-sm text-[9px] font-semibold tracking-wider border"
              style={{
                color: m.colorVar,
                borderColor: `color-mix(in srgb, ${m.colorVar} 45%, transparent)`,
                backgroundColor: 'var(--surface)',
              }}
            >
              {m.label}
            </span>
          </div>
        ))}
      </div>

      {/* Right Summary Column Header */}
      <div className="w-32 shrink-0 px-3 py-2.5 border-l border-border bg-surface-elevated flex items-center justify-end gap-3 uppercase tracking-wider">
        <span>Size</span>
        <span className="w-14 text-right">Time</span>
      </div>
    </div>
  );
}

export default TimelineHeader;
