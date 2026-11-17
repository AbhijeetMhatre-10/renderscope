import React, { memo } from 'react';
import ResourceTypeIcon from './ResourceTypeIcon';
import ResourceBar from './ResourceBar';
import { safeFormatBytes, safeFormatDuration } from './waterfallUtils';

function getStatusColorClass(status) {
  if (typeof status !== 'number') return 'text-text-muted';
  if (status >= 400) return 'text-status-error';
  if (status >= 300) return 'text-status-warning';
  return 'text-status-success';
}

export const WaterfallRow = memo(function WaterfallRow({
  resource,
  totalDurationMs,
  timelineWidthPx,
  ticks = [],
  milestones = [],
  isSelected = false,
  isHovered = false,
  isReplayCurrent = false,
  onSelect,
  onHover,
}) {
  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect?.(resource);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-selected={isSelected}
      onClick={() => onSelect?.(resource)}
      onKeyDown={handleKeyDown}
      onMouseEnter={(e) => onHover?.(resource, e)}
      onMouseMove={(e) => onHover?.(resource, e)}
      onMouseLeave={() => onHover?.(null, null)}
      className={`group flex items-stretch border-b border-border-subtle cursor-pointer transition-colors outline-none focus-visible:ring-1 focus-visible:ring-border-focus ${
        isSelected
          ? 'bg-surface-elevated'
          : isHovered
            ? 'bg-surface-hover'
            : 'bg-surface hover:bg-surface-elevated'
      }`}
    >
      {/* Sticky Resource Info Column */}
      <div
        className={`sticky left-0 z-10 w-56 sm:w-64 shrink-0 px-3 py-2 border-r border-border flex items-center justify-between gap-2 transition-colors ${
          isSelected
            ? 'bg-surface-elevated'
            : isHovered
              ? 'bg-surface-hover'
              : 'bg-surface group-hover:bg-surface-elevated'
        }`}
        style={
          isSelected
            ? { boxShadow: 'inset 2px 0 0 var(--info)' }
            : isReplayCurrent
              ? { boxShadow: 'inset 2px 0 0 var(--success)' }
              : undefined
        }
      >
        <div className="flex items-center gap-2 min-w-0">
          <ResourceTypeIcon type={resource.type} showLabel />
          <span
            className={`text-xs font-mono truncate transition-colors ${
              isSelected
                ? 'text-status-info font-semibold'
                : 'text-text-primary group-hover:text-status-info'
            }`}
            title={resource.url || resource.name}
          >
            {resource.name}
          </span>
        </div>

        <span
          className={`text-[10px] font-mono font-mono-numbers shrink-0 ${getStatusColorClass(
            resource.status
          )}`}
        >
          {resource.status ?? '—'}
        </span>
      </div>

      {/* Scrollable Bar Track */}
      <div
        className="relative shrink-0 h-9"
        style={{ width: `${timelineWidthPx}px` }}
      >
        {/* Vertical Grid Lines */}
        {ticks.map((tick) => (
          <span
            key={tick.ms}
            aria-hidden="true"
            className="pointer-events-none absolute top-0 bottom-0 w-px bg-border-subtle"
            style={{ left: `${tick.leftPct}%` }}
          />
        ))}

        {/* Metric Milestone Vertical Lines */}
        {milestones.map((m) => (
          <span
            key={m.id}
            aria-hidden="true"
            className="pointer-events-none absolute top-0 bottom-0 w-px z-[1]"
            style={{
              left: `${m.leftPct}%`,
              backgroundColor: `color-mix(in srgb, ${m.colorVar} 40%, transparent)`,
            }}
          />
        ))}

        {/* Visual Resource Timing Bar */}
        <ResourceBar
          resource={resource}
          totalDurationMs={totalDurationMs}
          isSelected={isSelected}
          isHovered={isHovered}
        />
      </div>

      {/* Size & Duration Column */}
      <div className="w-32 shrink-0 px-3 py-2 border-l border-border flex items-center justify-end gap-3 text-[11px] font-mono font-mono-numbers">
        <span className="text-text-muted">{safeFormatBytes(resource.transferred)}</span>
        <span className="text-text-primary font-medium w-14 text-right">
          {safeFormatDuration(resource.duration)}
        </span>
      </div>
    </div>
  );
});

export default WaterfallRow;
