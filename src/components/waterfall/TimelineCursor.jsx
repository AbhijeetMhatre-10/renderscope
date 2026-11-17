import React, { forwardRef } from 'react';
import { safeFormatDuration } from './waterfallUtils';

export const TimelineCursor = forwardRef(function TimelineCursor(
  { timeMs = 0, isReplaying = false },
  ref
) {
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute top-0 bottom-0 left-0 z-30 opacity-0 will-change-transform"
    >
      {/* Vertical Hairline */}
      <div
        className="h-full w-px"
        style={{
          backgroundColor: isReplaying ? 'var(--success)' : 'var(--info)',
          boxShadow: isReplaying
            ? '0 0 8px var(--success)'
            : '0 0 6px var(--info)',
        }}
      />

      {/* Live Timestamp Pill */}
      <div
        className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-sm font-mono font-mono-numbers text-[10px] font-semibold whitespace-nowrap border shadow-sm"
        style={{
          color: 'var(--text-primary)',
          backgroundColor: 'var(--surface)',
          borderColor: isReplaying ? 'var(--success)' : 'var(--info)',
        }}
      >
        {safeFormatDuration(timeMs)}
      </div>
    </div>
  );
});

export default TimelineCursor;
