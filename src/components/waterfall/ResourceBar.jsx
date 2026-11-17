import React from 'react';
import { getResourceGeometry, getResourceMeta, safeFormatDuration } from './waterfallUtils';

export function ResourceBar({
  resource,
  totalDurationMs,
  isSelected = false,
  isHovered = false,
}) {
  const { startMs, durationMs, leftPct, widthPct, ttfbRatio } = getResourceGeometry(
    resource,
    totalDurationMs
  );
  const meta = getResourceMeta(resource.type);
  const showInlineDuration = widthPct >= 10;

  return (
    <div
      data-waterfall-bar
      data-start-ms={startMs}
      data-duration-ms={durationMs}
      className="absolute top-1/2 -translate-y-1/2 h-5 rounded-sm flex items-center overflow-hidden transition-shadow duration-150"
      style={{
        left: `${leftPct}%`,
        width: `${widthPct}%`,
        minWidth: '6px',
        border: `1px solid ${isSelected || isHovered ? meta.colorVar : `color-mix(in srgb, ${meta.colorVar} 55%, transparent)`}`,
        backgroundColor: `color-mix(in srgb, ${meta.colorVar} 20%, var(--surface-elevated))`,
        boxShadow: isSelected
          ? `0 0 0 1px ${meta.colorVar}, 0 0 12px color-mix(in srgb, ${meta.colorVar} 35%, transparent)`
          : isHovered
            ? `0 0 10px color-mix(in srgb, ${meta.colorVar} 30%, transparent)`
            : 'none',
      }}
    >
      {/* TTFB Waiting Segment */}
      {ttfbRatio > 0 && (
        <div
          className="h-full shrink-0"
          style={{
            width: `${ttfbRatio}%`,
            backgroundColor: `color-mix(in srgb, var(--warning) 72%, transparent)`,
          }}
        />
      )}

      {/* Download / Main Resource Segment */}
      <div
        className="h-full flex-1"
        style={{
          backgroundColor: `color-mix(in srgb, ${meta.colorVar} 82%, transparent)`,
        }}
      />

      {/* Compact inline timing label when bar has room */}
      {showInlineDuration && durationMs > 0 && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-end pr-1.5 text-[9px] font-mono font-semibold text-white drop-shadow-sm">
          {safeFormatDuration(durationMs)}
        </span>
      )}
    </div>
  );
}

export default ResourceBar;
