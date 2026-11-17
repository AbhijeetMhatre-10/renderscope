import React from 'react';
import { Eye, Pause, Play, RotateCcw, Sparkles } from 'lucide-react';
import { REPLAY_SPEEDS } from '../../hooks/useReplay';
import { safeFormatDuration } from './waterfallUtils';

function formatSeconds(ms) {
  if (typeof ms !== 'number' || !Number.isFinite(ms)) return '0.00s';
  return `${(ms / 1000).toFixed(2)}s`;
}

export function ReplayControls({
  currentTime = 0,
  duration = 1000,
  isPlaying = false,
  isReplayActive = false,
  speed = 1,
  activeEvent = null,
  milestones = [],
  stats = { activeCount: 0, completedCount: 0, totalCount: 0 },
  disabled = false,
  onPlay,
  onPause,
  onRestart,
  onSeek,
  onSpeedChange,
  onExitReplay,
}) {
  const safeDuration = Math.max(1, duration);
  const progressPct = Math.max(0, Math.min(100, (currentTime / safeDuration) * 100));

  return (
    <div className="rounded-lg border border-border bg-surface p-3 sm:p-4 space-y-3">
      {/* Top Row: Transport, Scrubber, Speed */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        {/* Transport Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            disabled={disabled}
            onClick={isPlaying ? onPause : onPlay}
            aria-label={isPlaying ? 'Pause loading replay' : 'Play loading replay'}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md font-mono text-xs font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none"
            style={{
              backgroundColor: isPlaying ? 'var(--surface-elevated)' : 'var(--info)',
              color: isPlaying ? 'var(--text-primary)' : '#ffffff',
              border: isPlaying ? '1px solid var(--border)' : '1px solid transparent',
            }}
          >
            {isPlaying ? (
              <>
                <Pause className="h-3.5 w-3.5 fill-current" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" />
                Play
              </>
            )}
          </button>

          <button
            type="button"
            disabled={disabled}
            onClick={onRestart}
            aria-label="Restart loading replay"
            title="Restart from 0ms"
            className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-border bg-surface-elevated hover:bg-surface-hover text-xs font-mono text-text-secondary hover:text-text-primary transition-colors disabled:opacity-40 disabled:pointer-events-none"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Restart</span>
          </button>

          {isReplayActive && (
            <button
              type="button"
              onClick={onExitReplay}
              title="Restore full waterfall view"
              className="inline-flex items-center gap-1 h-8 px-2.5 rounded-md border border-border bg-background hover:bg-surface-hover text-[11px] font-mono text-text-muted hover:text-text-primary transition-colors"
            >
              <Eye className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Full View</span>
            </button>
          )}
        </div>

        {/* Interactive Scrubber + Timestamp */}
        <div className="flex-1 flex items-center gap-3 min-w-0">
          <div className="relative flex-1 h-7 flex items-center">
            {/* Base Track */}
            <div className="w-full h-1.5 rounded-full bg-surface-elevated border border-border-subtle overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${progressPct}%`,
                  background: 'linear-gradient(90deg, var(--info), var(--success))',
                }}
              />
            </div>

            {/* Measured Milestone Pips on Scrubber */}
            {milestones.map((m) => {
              const leftPct = Math.max(0, Math.min(100, (m.ms / safeDuration) * 100));
              return (
                <button
                  key={m.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => onSeek?.(m.ms)}
                  title={`Jump to ${m.fullLabel} (${safeFormatDuration(m.ms)})`}
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 h-3 w-1.5 rounded-full transition-transform hover:scale-125"
                  style={{
                    left: `${leftPct}%`,
                    backgroundColor: m.colorVar,
                  }}
                />
              );
            })}

            {/* Playhead Thumb */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 h-3.5 w-3.5 rounded-full border-2 shadow-sm"
              style={{
                left: `${progressPct}%`,
                backgroundColor: 'var(--surface)',
                borderColor: isPlaying ? 'var(--success)' : 'var(--info)',
                boxShadow: isPlaying ? '0 0 8px var(--success)' : '0 0 6px var(--info)',
              }}
            />

            {/* Accessible Native Range Input Overlay */}
            <input
              type="range"
              min={0}
              max={safeDuration}
              step={10}
              value={Math.min(safeDuration, currentTime)}
              disabled={disabled}
              aria-label="Scrub loading replay timeline"
              onChange={(e) => onSeek?.(Number(e.target.value))}
              className="absolute inset-0 z-10 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
          </div>

          {/* Monospace Current / Total Timestamp */}
          <div className="shrink-0 font-mono font-mono-numbers text-xs text-right min-w-[104px]">
            <span className="font-semibold text-text-primary">{formatSeconds(currentTime)}</span>
            <span className="text-text-muted"> / {formatSeconds(duration)}</span>
          </div>
        </div>

        {/* Speed Selector (0.5x, 1x, 2x, 5x) */}
        <div
          role="group"
          aria-label="Replay playback speed"
          className="inline-flex self-start lg:self-center items-center rounded-md border border-border bg-background p-0.5 font-mono text-[11px] shrink-0"
        >
          {REPLAY_SPEEDS.map((mult) => {
            const active = speed === mult;
            return (
              <button
                key={mult}
                type="button"
                disabled={disabled}
                onClick={() => onSpeedChange?.(mult)}
                className={`px-2 py-1 rounded-sm transition-colors disabled:opacity-40 ${
                  active
                    ? 'bg-surface-elevated text-text-primary font-semibold border border-border-focus'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover border border-transparent'
                }`}
              >
                {mult}x
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Live Event Strip ("Watch what happened") */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-border-subtle text-[11px] font-mono">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-text-muted shrink-0">
            <Sparkles className="h-3 w-3 text-status-info" />
            {isReplayActive ? 'Live Event' : 'Loading Replay'}
          </span>

          {isReplayActive && activeEvent ? (
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="px-1.5 py-0.5 rounded-sm border text-[10px] font-semibold uppercase shrink-0"
                style={{
                  color: activeEvent.colorVar,
                  borderColor: `color-mix(in srgb, ${activeEvent.colorVar} 40%, transparent)`,
                  backgroundColor: `color-mix(in srgb, ${activeEvent.colorVar} 14%, transparent)`,
                }}
              >
                {activeEvent.badge}
              </span>
              <span className="text-text-primary truncate max-w-[220px] sm:max-w-sm">
                {activeEvent.title}
              </span>
              <span className="text-text-muted font-mono-numbers shrink-0">
                @{safeFormatDuration(activeEvent.timeMs)}
              </span>
            </div>
          ) : (
            <span className="text-text-secondary truncate">
              Press Play or drag the scrubber to watch measured resources load in real relative time.
            </span>
          )}
        </div>

        {/* Clickable Milestone Quick-Jump Pills + Live Counter */}
        <div className="flex items-center gap-2 flex-wrap">
          {milestones.map((m) => (
            <button
              key={m.id}
              type="button"
              disabled={disabled}
              onClick={() => onSeek?.(m.ms)}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm border border-border bg-background hover:bg-surface-hover text-[10px] transition-colors disabled:opacity-40"
              title={`Seek to ${m.fullLabel}`}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: m.colorVar }}
              />
              <span className="text-text-secondary">{m.label}</span>
              <span className="text-text-muted font-mono-numbers">{safeFormatDuration(m.ms)}</span>
            </button>
          ))}

          {isReplayActive && (
            <span className="text-[10px] text-text-muted font-mono-numbers pl-1 border-l border-border-subtle">
              <strong className="text-text-primary">{stats.completedCount}</strong>/{stats.totalCount} loaded
              {stats.activeCount > 0 ? ` · ${stats.activeCount} active` : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReplayControls;
