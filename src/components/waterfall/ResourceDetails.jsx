import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { Check, Copy, ExternalLink, PanelRightOpen, Sparkles, X } from 'lucide-react';
import { animateSelectionTransition, gsap } from '../../lib/gsap';
import ResourceTypeIcon from './ResourceTypeIcon';
import { getResourceMeta, safeFormatBytes, safeFormatDuration } from './waterfallUtils';

const AIInlineInsight = lazy(() => import('../ai/AIInlineInsight'));

export function ResourceDetails({
  resource,
  aiInsight,
  onExplainResource,
  onClose,
  onOpenDrawer,
}) {
  const panelRef = useRef(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!resource || !panelRef.current) return undefined;

    const ctx = gsap.context(() => {
      animateSelectionTransition(panelRef.current);
    }, panelRef);

    return () => ctx.revert();
  }, [resource]);

  if (!resource) return null;

  const meta = getResourceMeta(resource.type);
  const totalMs = Math.max(1, resource.duration || 0);
  const ttfbMs = typeof resource.ttfb === 'number' ? Math.max(0, resource.ttfb) : 0;
  const downloadMs =
    typeof resource.download === 'number'
      ? Math.max(0, resource.download)
      : Math.max(0, totalMs - ttfbMs);

  const timingSegments = [
    {
      label: 'Start Offset',
      value: safeFormatDuration(resource.startTime),
      pct: 100,
      color: 'var(--info)',
      isMarker: true,
    },
    {
      label: 'Waiting (TTFB)',
      value: safeFormatDuration(resource.ttfb),
      pct: resource.duration ? Math.min(100, (ttfbMs / totalMs) * 100) : 0,
      color: 'var(--warning)',
    },
    {
      label: 'Content Download',
      value: safeFormatDuration(resource.download ?? downloadMs),
      pct: resource.duration ? Math.min(100, (downloadMs / totalMs) * 100) : 0,
      color: meta.colorVar,
    },
  ];

  const handleCopyUrl = () => {
    if (!resource.url) return;
    navigator.clipboard?.writeText(resource.url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div
      ref={panelRef}
      className="rounded-lg border border-border bg-surface p-4 sm:p-5 space-y-4 shadow-sm"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-border-subtle pb-3">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <ResourceTypeIcon type={resource.type} showLabel />
            <h4 className="text-sm font-mono font-semibold text-text-primary truncate">
              {resource.name}
            </h4>
            {resource.status != null && (
              <span className="px-1.5 py-0.5 rounded-sm border border-border bg-surface-elevated text-[10px] font-mono text-status-success">
                HTTP {resource.status}
              </span>
            )}
            {resource.cache && (
              <span className="px-1.5 py-0.5 rounded-sm border border-border bg-surface-elevated text-[10px] font-mono text-text-secondary">
                CACHE: {resource.cache}
              </span>
            )}
          </div>

          {resource.url && (
            <div className="flex items-center gap-2 text-[11px] font-mono text-text-muted">
              <span className="truncate max-w-xl" title={resource.url}>
                {resource.url}
              </span>
              <button
                type="button"
                onClick={handleCopyUrl}
                aria-label="Copy resource URL"
                className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-border bg-surface-elevated hover:bg-surface-hover text-[10px] text-text-secondary hover:text-text-primary transition-colors"
              >
                {copied ? <Check className="h-3 w-3 text-status-success" /> : <Copy className="h-3 w-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <a
                href={resource.url}
                target="_blank"
                rel="noreferrer"
                aria-label="Open resource in new tab"
                className="shrink-0 text-text-muted hover:text-status-info transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {onExplainResource && (
            <button
              type="button"
              disabled={aiInsight?.status === 'loading'}
              onClick={() => onExplainResource(resource)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border bg-surface-elevated hover:bg-surface-hover text-xs font-mono text-text-primary transition-colors disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5 text-status-info" />
              {aiInsight?.status === 'loading' ? 'Explaining…' : 'Explain this resource'}
            </button>
          )}
          {onOpenDrawer && (
            <button
              type="button"
              onClick={() => onOpenDrawer(resource)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border bg-surface-elevated hover:bg-surface-hover text-xs font-mono text-text-primary transition-colors"
            >
              <PanelRightOpen className="h-3.5 w-3.5 text-status-info" />
              Full Inspector
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close resource details"
            className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-border bg-surface-elevated hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Metrics + Visual Timing Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Quick Key-Value Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2.5 font-mono text-xs">
          <div className="p-3 rounded-md border border-border bg-background">
            <span className="block text-[10px] uppercase text-text-muted">Total Duration</span>
            <span className="mt-1 block text-sm font-bold font-mono-numbers text-text-primary">
              {safeFormatDuration(resource.duration)}
            </span>
          </div>
          <div className="p-3 rounded-md border border-border bg-background">
            <span className="block text-[10px] uppercase text-text-muted">Transferred</span>
            <span className="mt-1 block text-sm font-bold font-mono-numbers text-text-primary">
              {safeFormatBytes(resource.transferred)}
            </span>
          </div>
          <div className="p-3 rounded-md border border-border bg-background">
            <span className="block text-[10px] uppercase text-text-muted">Decoded Size</span>
            <span className="mt-1 block text-sm font-bold font-mono-numbers text-text-secondary">
              {safeFormatBytes(resource.decodedSize)}
            </span>
          </div>
          <div className="p-3 rounded-md border border-border bg-background">
            <span className="block text-[10px] uppercase text-text-muted">Priority</span>
            <span className="mt-1 block text-sm font-bold text-status-info truncate">
              {resource.priority || 'Default'}
            </span>
          </div>
        </div>

        {/* Animated Timing Phases */}
        <div className="p-3.5 rounded-md border border-border bg-background space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-text-muted">
            <span>Timing Phases</span>
            <span>Initiator: {resource.initiator?.type || resource.initiator || 'parser'}</span>
          </div>

          <div className="space-y-2.5">
            {timingSegments.map((seg) => (
              <div key={seg.label} className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-text-secondary">{seg.label}</span>
                  <span className="font-mono-numbers text-text-primary font-medium">{seg.value}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-surface-elevated overflow-hidden">
                  <div
                    data-detail-bar
                    className="h-full rounded-full"
                    style={{
                      width: `${seg.isMarker ? 100 : Math.max(seg.pct > 0 ? 4 : 0, seg.pct)}%`,
                      backgroundColor: seg.color,
                      opacity: seg.isMarker ? 0.35 : 0.9,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Inline AI Resource Explanation */}
      {aiInsight && aiInsight.status !== 'idle' && (
        <Suspense fallback={null}>
          <AIInlineInsight mode="resource" state={aiInsight} />
        </Suspense>
      )}
    </div>
  );
}

export default ResourceDetails;
