import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Layers, Rows3 } from 'lucide-react';
import ResourceTypeIcon from '../waterfall/ResourceTypeIcon';
import {
  getResourceGeometry,
  getResourceMeta,
  getTimelineScale,
  safeFormatBytes,
  safeFormatDuration,
} from '../waterfall/waterfallUtils';
import { animateWaterfallEntrance, gsap } from '../../lib/gsap';

const COMPARE_TYPES = ['all', 'html', 'css', 'js', 'image', 'font', 'xhr', 'other'];
const ASSET_LANES = ['html', 'css', 'js', 'image', 'font'];

function formatHost(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return String(url || '').replace(/^https?:\/\//, '');
  }
}

function getLaneSpans(resources = [], type) {
  const matching = resources.filter((r) => String(r.type || 'other').toLowerCase() === type);
  if (matching.length === 0) return null;

  let minStart = Infinity;
  let maxEnd = 0;
  let totalBytes = 0;

  for (const res of matching) {
    const start = typeof res.startTime === 'number' && Number.isFinite(res.startTime) ? Math.max(0, res.startTime) : 0;
    const dur = typeof res.duration === 'number' && Number.isFinite(res.duration) ? Math.max(0, res.duration) : 0;
    if (start < minStart) minStart = start;
    if (start + dur > maxEnd) maxEnd = start + dur;
    totalBytes += res.transferred || res.decodedSize || 0;
  }

  return {
    count: matching.length,
    startMs: Number.isFinite(minStart) ? minStart : 0,
    endMs: maxEnd,
    durationMs: Math.max(0, maxEnd - (Number.isFinite(minStart) ? minStart : 0)),
    totalBytes,
  };
}

function SynchronizedPanel({
  tag,
  accentVar,
  analysis,
  resources,
  totalDurationMs,
  ticks,
  milestones,
  cursorPct,
  onCursorMove,
  onCursorLeave,
}) {
  return (
    <div className="rounded-lg border border-border bg-surface overflow-hidden">
      {/* Panel Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-border bg-surface-elevated font-mono text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="px-1.5 py-0.5 rounded-sm border text-[10px] font-bold uppercase"
            style={{
              color: accentVar,
              borderColor: `color-mix(in srgb, ${accentVar} 40%, transparent)`,
              backgroundColor: `color-mix(in srgb, ${accentVar} 14%, transparent)`,
            }}
          >
            {tag}
          </span>
          <span className="font-semibold text-text-primary truncate">
            {formatHost(analysis.url)}
          </span>
          {analysis.label && (
            <span className="text-[10px] text-text-muted">({analysis.label})</span>
          )}
        </div>
        <div className="flex items-center gap-3 text-[11px] text-text-muted font-mono-numbers">
          <span>LCP {safeFormatDuration(analysis.lcp)}</span>
          <span>•</span>
          <span>{resources.length} shown</span>
        </div>
      </div>

      {/* Scrollable Aligned Track */}
      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          {/* Shared Axis Ticks */}
          <div className="flex items-stretch border-b border-border-subtle bg-background text-[10px] font-mono text-text-muted select-none">
            <div className="w-52 shrink-0 px-3 py-1.5 border-r border-border">Resource</div>
            <div
              className="relative flex-1 h-7"
              onMouseMove={onCursorMove}
              onMouseLeave={onCursorLeave}
            >
              {ticks.map((tick, idx) => (
                <span
                  key={tick.ms}
                  className={`absolute top-1.5 font-mono-numbers ${
                    idx === 0 ? 'translate-x-1' : idx === ticks.length - 1 ? '-translate-x-full pr-1' : '-translate-x-1/2'
                  }`}
                  style={{ left: `${tick.leftPct}%` }}
                >
                  {tick.label}
                </span>
              ))}
              {milestones.map((m) => (
                <span
                  key={m.id}
                  className="absolute bottom-0.5 -translate-x-1/2 px-1 rounded-sm text-[9px] font-semibold"
                  style={{
                    left: `${m.leftPct}%`,
                    color: m.colorVar,
                    backgroundColor: 'var(--surface)',
                  }}
                >
                  {m.label}
                </span>
              ))}
            </div>
            <div className="w-24 shrink-0 px-3 py-1.5 border-l border-border text-right">Time</div>
          </div>

          {/* Resource Rows */}
          {resources.length === 0 ? (
            <div className="py-8 px-4 text-center text-xs font-mono text-text-muted">
              No resources recorded for this filter.
            </div>
          ) : (
            <div className="divide-y divide-border-subtle">
              {resources.slice(0, 24).map((res) => {
                const { leftPct, widthPct, ttfbRatio, startMs, durationMs } = getResourceGeometry(
                  res,
                  totalDurationMs
                );
                const meta = getResourceMeta(res.type);

                return (
                  <div
                    key={res.id}
                    className="flex items-stretch hover:bg-surface-elevated transition-colors"
                  >
                    <div className="w-52 shrink-0 px-3 py-1.5 border-r border-border flex items-center gap-2 min-w-0">
                      <ResourceTypeIcon type={res.type} />
                      <span
                        className="text-[11px] font-mono text-text-primary truncate"
                        title={res.url || res.name}
                      >
                        {res.name}
                      </span>
                    </div>

                    <div
                      className="relative flex-1 h-7"
                      onMouseMove={onCursorMove}
                      onMouseLeave={onCursorLeave}
                    >
                      {/* Tick Gridlines */}
                      {ticks.map((tick) => (
                        <span
                          key={tick.ms}
                          aria-hidden="true"
                          className="pointer-events-none absolute top-0 bottom-0 w-px bg-border-subtle"
                          style={{ left: `${tick.leftPct}%` }}
                        />
                      ))}

                      {/* FCP / LCP Lines */}
                      {milestones.map((m) => (
                        <span
                          key={m.id}
                          aria-hidden="true"
                          className="pointer-events-none absolute top-0 bottom-0 w-px"
                          style={{
                            left: `${m.leftPct}%`,
                            backgroundColor: `color-mix(in srgb, ${m.colorVar} 45%, transparent)`,
                          }}
                        />
                      ))}

                      {/* Synchronized Hover Cursor */}
                      {cursorPct !== null && (
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute top-0 bottom-0 w-px z-20"
                          style={{
                            left: `${cursorPct}%`,
                            backgroundColor: 'var(--info)',
                          }}
                        />
                      )}

                      {/* Animated Resource Timing Bar */}
                      <div
                        data-waterfall-bar
                        data-start-ms={startMs}
                        data-duration-ms={durationMs}
                        className="absolute top-1/2 -translate-y-1/2 h-4 rounded-sm flex overflow-hidden"
                        style={{
                          left: `${leftPct}%`,
                          width: `${widthPct}%`,
                          minWidth: '5px',
                          border: `1px solid color-mix(in srgb, ${meta.colorVar} 65%, transparent)`,
                        }}
                        title={`${res.name} · Start ${safeFormatDuration(startMs)} · Duration ${safeFormatDuration(durationMs)} · ${safeFormatBytes(res.transferred)}`}
                      >
                        {ttfbRatio > 0 && (
                          <div
                            className="h-full shrink-0"
                            style={{
                              width: `${ttfbRatio}%`,
                              backgroundColor: 'color-mix(in srgb, var(--warning) 75%, transparent)',
                            }}
                          />
                        )}
                        <div
                          className="h-full flex-1"
                          style={{
                            backgroundColor: `color-mix(in srgb, ${meta.colorVar} 85%, transparent)`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="w-24 shrink-0 px-3 py-1.5 border-l border-border text-right text-[11px] font-mono font-mono-numbers text-text-secondary">
                      {safeFormatDuration(res.duration)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {resources.length > 24 && (
            <div className="px-4 py-2 border-t border-border-subtle bg-background text-[10px] font-mono text-text-muted">
              Showing first 24 of {resources.length} resources — use type filters above to focus on JS, CSS, or Images.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function WaterfallCompare({ analysisA, analysisB }) {
  const containerRef = useRef(null);
  const [viewMode, setViewMode] = useState('waterfalls'); // 'waterfalls' | 'lanes'
  const [typeFilter, setTypeFilter] = useState('all');
  const [cursorPct, setCursorPct] = useState(null);

  const resourcesA = useMemo(() => analysisA?.resources || [], [analysisA]);
  const resourcesB = useMemo(() => analysisB?.resources || [], [analysisB]);

  const filteredA = useMemo(
    () =>
      typeFilter === 'all'
        ? resourcesA
        : resourcesA.filter((r) => String(r.type || 'other').toLowerCase() === typeFilter),
    [resourcesA, typeFilter]
  );

  const filteredB = useMemo(
    () =>
      typeFilter === 'all'
        ? resourcesB
        : resourcesB.filter((r) => String(r.type || 'other').toLowerCase() === typeFilter),
    [resourcesB, typeFilter]
  );

  // Shared synchronized time scale across both Before (A) and After (B)
  const sharedScale = useMemo(() => {
    const combinedResources = [...resourcesA, ...resourcesB];
    const combinedMetrics = {
      fcp: Math.max(analysisA?.fcp || 0, analysisB?.fcp || 0) || null,
      lcp: Math.max(analysisA?.lcp || 0, analysisB?.lcp || 0) || null,
      load: Math.max(analysisA?.metrics?.load || 0, analysisB?.metrics?.load || 0) || null,
    };
    return getTimelineScale(combinedResources, combinedMetrics, 1);
  }, [resourcesA, resourcesB, analysisA, analysisB]);

  const milestonesA = useMemo(() => {
    const total = sharedScale.totalDurationMs;
    const list = [];
    if (typeof analysisA?.fcp === 'number' && analysisA.fcp > 0 && analysisA.fcp <= total) {
      list.push({ id: 'fcp', label: 'FCP', leftPct: (analysisA.fcp / total) * 100, colorVar: 'var(--success)' });
    }
    if (typeof analysisA?.lcp === 'number' && analysisA.lcp > 0 && analysisA.lcp <= total) {
      list.push({ id: 'lcp', label: 'LCP', leftPct: (analysisA.lcp / total) * 100, colorVar: 'var(--error)' });
    }
    return list;
  }, [analysisA, sharedScale.totalDurationMs]);

  const milestonesB = useMemo(() => {
    const total = sharedScale.totalDurationMs;
    const list = [];
    if (typeof analysisB?.fcp === 'number' && analysisB.fcp > 0 && analysisB.fcp <= total) {
      list.push({ id: 'fcp', label: 'FCP', leftPct: (analysisB.fcp / total) * 100, colorVar: 'var(--success)' });
    }
    if (typeof analysisB?.lcp === 'number' && analysisB.lcp > 0 && analysisB.lcp <= total) {
      list.push({ id: 'lcp', label: 'LCP', leftPct: (analysisB.lcp / total) * 100, colorVar: 'var(--error)' });
    }
    return list;
  }, [analysisB, sharedScale.totalDurationMs]);

  useEffect(() => {
    if (!containerRef.current) return undefined;
    const ctx = gsap.context(() => {
      animateWaterfallEntrance(containerRef.current);
    }, containerRef);
    return () => ctx.revert();
  }, [analysisA?.id, analysisB?.id, typeFilter, viewMode]);

  const handleCursorMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(100, ((event.clientX - rect.left) / Math.max(1, rect.width)) * 100));
    setCursorPct(pct);
  };

  const handleCursorLeave = () => setCursorPct(null);

  const cursorTimeMs =
    cursorPct !== null ? Math.round((cursorPct / 100) * sharedScale.totalDurationMs) : null;

  return (
    <div ref={containerRef} className="space-y-4">
      {/* Waterfall Comparison Toolbar */}
      <div className="rounded-lg border border-border bg-surface p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-text-primary">
              Visual Waterfall Comparison
            </h3>
            <span className="px-2 py-0.5 rounded-sm border border-border bg-background text-[10px] font-mono text-text-secondary font-mono-numbers">
              Shared Axis: 0ms — {safeFormatDuration(sharedScale.totalDurationMs)}
            </span>
            {cursorTimeMs !== null && (
              <span
                className="px-2 py-0.5 rounded-sm border text-[10px] font-mono font-semibold font-mono-numbers"
                style={{
                  color: 'var(--info)',
                  borderColor: 'color-mix(in srgb, var(--info) 40%, transparent)',
                  backgroundColor: 'color-mix(in srgb, var(--info) 12%, transparent)',
                }}
              >
                Cursor: {safeFormatDuration(cursorTimeMs)}
              </span>
            )}
          </div>
          <p className="text-xs text-text-muted">
            Both timelines share an identical millisecond scale so load-time shifts align directly.
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="inline-flex self-start md:self-center items-center p-0.5 rounded-md border border-border bg-background font-mono text-[11px]">
          <button
            type="button"
            onClick={() => setViewMode('waterfalls')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm transition-colors ${
              viewMode === 'waterfalls'
                ? 'bg-surface-elevated text-text-primary border border-border-focus font-medium'
                : 'text-text-secondary hover:text-text-primary border border-transparent'
            }`}
          >
            <Rows3 className="h-3.5 w-3.5 text-status-info" />
            Aligned Waterfalls
          </button>
          <button
            type="button"
            onClick={() => setViewMode('lanes')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm transition-colors ${
              viewMode === 'lanes'
                ? 'bg-surface-elevated text-text-primary border border-border-focus font-medium'
                : 'text-text-secondary hover:text-text-primary border border-transparent'
            }`}
          >
            <Layers className="h-3.5 w-3.5 text-status-info" />
            By Asset Type
          </button>
        </div>
      </div>

      {/* Resource Filter Strip (for Aligned Waterfalls mode) */}
      {viewMode === 'waterfalls' && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {COMPARE_TYPES.map((type) => {
            const active = typeFilter === type;
            const meta = type === 'all' ? null : getResourceMeta(type);
            return (
              <button
                key={type}
                type="button"
                onClick={() => setTypeFilter(type)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm border text-[11px] font-mono uppercase tracking-wider transition-colors shrink-0 ${
                  active
                    ? 'bg-surface-elevated text-text-primary border-border-focus font-medium'
                    : 'bg-surface text-text-secondary border-border hover:bg-surface-hover'
                }`}
              >
                {meta && (
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: meta.colorVar }}
                  />
                )}
                {type}
              </button>
            );
          })}
        </div>
      )}

      {/* VIEW 1: Synchronized Stacked Waterfalls (Before A vs After B) */}
      {viewMode === 'waterfalls' ? (
        <div className="space-y-4">
          <SynchronizedPanel
            tag="Before (A)"
            accentVar="var(--info)"
            analysis={analysisA}
            resources={filteredA}
            totalDurationMs={sharedScale.totalDurationMs}
            ticks={sharedScale.ticks}
            milestones={milestonesA}
            cursorPct={cursorPct}
            onCursorMove={handleCursorMove}
            onCursorLeave={handleCursorLeave}
          />
          <SynchronizedPanel
            tag="After (B)"
            accentVar="var(--success)"
            analysis={analysisB}
            resources={filteredB}
            totalDurationMs={sharedScale.totalDurationMs}
            ticks={sharedScale.ticks}
            milestones={milestonesB}
            cursorPct={cursorPct}
            onCursorMove={handleCursorMove}
            onCursorLeave={handleCursorLeave}
          />
        </div>
      ) : (
        /* VIEW 2: Paired Asset-Type Timeline Lanes (Before vs After on Same Track) */
        <div className="rounded-lg border border-border bg-surface overflow-x-auto">
          <div className="min-w-[640px]">
            <div className="flex items-stretch border-b border-border bg-surface-elevated text-[10px] font-mono text-text-muted">
              <div className="w-44 shrink-0 px-4 py-2 border-r border-border uppercase">Asset Type</div>
              <div className="relative flex-1 h-8">
                {sharedScale.ticks.map((tick, idx) => (
                  <span
                    key={tick.ms}
                    className={`absolute top-2 font-mono-numbers ${
                      idx === 0 ? 'translate-x-1' : idx === sharedScale.ticks.length - 1 ? '-translate-x-full pr-1' : '-translate-x-1/2'
                    }`}
                    style={{ left: `${tick.leftPct}%` }}
                  >
                    {tick.label}
                  </span>
                ))}
              </div>
              <div className="w-40 shrink-0 px-3 py-2 border-l border-border text-right uppercase">
                A vs B Span
              </div>
            </div>

            <div className="divide-y divide-border-subtle">
              {ASSET_LANES.map((type) => {
                const spanA = getLaneSpans(resourcesA, type);
                const spanB = getLaneSpans(resourcesB, type);
                const meta = getResourceMeta(type);
                const total = Math.max(1, sharedScale.totalDurationMs);

                return (
                  <div key={type} className="flex items-stretch">
                    <div className="w-44 shrink-0 px-4 py-3 border-r border-border flex items-center gap-2">
                      <ResourceTypeIcon type={type} showLabel />
                    </div>

                    <div className="relative flex-1 py-2.5 space-y-1.5">
                      {sharedScale.ticks.map((tick) => (
                        <span
                          key={tick.ms}
                          aria-hidden="true"
                          className="pointer-events-none absolute top-0 bottom-0 w-px bg-border-subtle"
                          style={{ left: `${tick.leftPct}%` }}
                        />
                      ))}

                      {/* Lane A (Before) */}
                      <div className="relative h-4">
                        {spanA && (
                          <div
                            data-waterfall-bar
                            className="absolute inset-y-0 rounded-sm flex items-center px-1.5 text-[9px] font-mono text-white"
                            style={{
                              left: `${(spanA.startMs / total) * 100}%`,
                              width: `${Math.max(1.5, (spanA.durationMs / total) * 100)}%`,
                              backgroundColor: `color-mix(in srgb, ${meta.colorVar} 55%, var(--surface-elevated))`,
                              border: `1px solid ${meta.colorVar}`,
                            }}
                          >
                            A
                          </div>
                        )}
                      </div>

                      {/* Lane B (After) */}
                      <div className="relative h-4">
                        {spanB && (
                          <div
                            data-waterfall-bar
                            className="absolute inset-y-0 rounded-sm flex items-center px-1.5 text-[9px] font-mono text-white font-semibold"
                            style={{
                              left: `${(spanB.startMs / total) * 100}%`,
                              width: `${Math.max(1.5, (spanB.durationMs / total) * 100)}%`,
                              backgroundColor: meta.colorVar,
                            }}
                          >
                            B
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="w-40 shrink-0 px-3 py-2.5 border-l border-border font-mono text-[10px] flex flex-col justify-center items-end gap-1 font-mono-numbers">
                      <span className="text-text-secondary">
                        A: {spanA ? `${safeFormatDuration(spanA.durationMs)} (${spanA.count})` : '—'}
                      </span>
                      <span className="text-text-primary font-semibold">
                        B: {spanB ? `${safeFormatDuration(spanB.durationMs)} (${spanB.count})` : '—'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WaterfallCompare;
