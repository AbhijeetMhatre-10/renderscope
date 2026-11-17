import React, { Suspense, lazy, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock,
  Gamepad2,
  Lightbulb,
  Loader2,
  Monitor,
  Radio,
  Smartphone,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { analysisSteps } from '../../services/analysisService';

const PacketCatcherGame = lazy(() => import('./PacketCatcherGame'));
const RenderPipelineVisualizer = lazy(() => import('./RenderPipelineVisualizer'));

const PERF_TIPS = [
  'Add fetchpriority="high" to your hero LCP image so the browser schedules it ahead of lower-priority assets.',
  'Defer non-critical JavaScript with defer or async to unblock HTML parsing and improve First Contentful Paint.',
  'Use font-display: swap and preload primary WOFF2 font files to eliminate invisible text flashes (FOIT).',
  'Serving modern AVIF or WebP images with explicit width and height prevents Cumulative Layout Shift (CLS).',
  'Edge caching HTML and static assets with immutable Cache-Control headers dramatically trims TTFB.',
  'Break up JavaScript tasks longer than 50ms to keep the main thread responsive and lower INP.',
];

function formatHost(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname + (parsed.pathname && parsed.pathname !== '/' ? parsed.pathname : '');
  } catch {
    return url.replace(/^https?:\/\//, '');
  }
}

export function LoadingState({
  url = 'https://example.com',
  stepIndex = 0,
  strategy = 'desktop',
  compact = false,
  className,
}) {
  const [activeView, setActiveView] = useState('game'); // 'game' | 'pipeline'
  const [elapsedTenths, setElapsedTenths] = useState(0);
  const [tipIndex, setTipIndex] = useState(() => Math.floor(Math.random() * PERF_TIPS.length));

  useEffect(() => {
    if (compact) return undefined;
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      setElapsedTenths(Math.floor((Date.now() - startedAt) / 100));
    }, 100);
    return () => window.clearInterval(timer);
  }, [url, compact]);

  useEffect(() => {
    if (compact) return undefined;
    const tipTimer = window.setInterval(() => {
      setTipIndex((prev) => (prev + 1) % PERF_TIPS.length);
    }, 5500);
    return () => window.clearInterval(tipTimer);
  }, [compact]);

  if (compact) {
    return (
      <div
        className={cn(
          'w-full max-w-md mx-auto my-20 p-6 rounded-lg border border-border bg-surface flex items-center justify-center gap-3',
          className
        )}
        aria-live="polite"
        aria-busy="true"
      >
        <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none text-status-info" />
        <span className="text-xs font-mono text-text-secondary">
          Loading {formatHost(url)}…
        </span>
      </div>
    );
  }

  const clampedStep = Math.max(0, Math.min(analysisSteps.length - 1, stepIndex));
  const progressPct = Math.min(94, Math.max(12, ((clampedStep + 1) / analysisSteps.length) * 90));
  const elapsedFormatted = `${(elapsedTenths / 10).toFixed(1)}s`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={cn(
        'w-full max-w-4xl mx-auto my-4 sm:my-6 p-4 sm:p-6 rounded-lg border border-border bg-surface space-y-5 shadow-sm overflow-hidden',
        className
      )}
      aria-live="polite"
      aria-busy="true"
    >
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.16em] font-mono">
            <span className="inline-flex items-center gap-1.5 text-status-info">
              <Radio className="h-3 w-3 animate-pulse motion-reduce:animate-none" />
              Live Analysis
            </span>
            <span className="text-border">•</span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-elevated border border-border text-text-secondary">
              {strategy === 'mobile' ? (
                <Smartphone className="h-2.5 w-2.5 text-status-info" />
              ) : (
                <Monitor className="h-2.5 w-2.5 text-status-info" />
              )}
              {strategy}
            </span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-elevated border border-border text-text-primary font-mono-numbers">
              <Clock className="h-2.5 w-2.5 text-text-muted" />
              {elapsedFormatted}
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-semibold text-text-primary truncate">
            Analyzing <span className="font-mono text-status-info">{formatHost(url)}</span>
          </h3>
          <p className="text-xs text-text-muted">
            PageSpeed Insights is auditing your URL remotely. Catch resources while the telemetry streams in.
          </p>
        </div>

        {/* Mode Switcher: Mini-Game vs Pipeline Animation */}
        <div
          role="tablist"
          aria-label="Loading display mode"
          className="inline-flex self-start md:self-center items-center p-1 rounded-md border border-border bg-background shrink-0"
        >
          {[
            { id: 'game', label: 'Packet Rush', icon: Gamepad2 },
            { id: 'pipeline', label: 'Render Pipeline', icon: Activity },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeView === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveView(tab.id)}
                className={cn(
                  'relative px-3 py-1.5 rounded-sm text-xs font-mono transition-colors flex items-center gap-1.5',
                  isActive ? 'text-text-primary font-medium' : 'text-text-secondary hover:text-text-primary'
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="loading-stage-tab"
                    className="absolute inset-0 rounded-sm bg-surface-elevated border border-border"
                    transition={{ type: 'spring', bounce: 0.18, duration: 0.28 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5 text-status-info" />
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Interactive Stage */}
      <Suspense
        fallback={
          <div className="rounded-md border border-border bg-background h-[290px] flex items-center justify-center gap-2 text-xs font-mono text-text-muted">
            <Loader2 className="h-4 w-4 animate-spin text-status-info" />
            <span>Initializing telemetry stage…</span>
          </div>
        }
      >
        <AnimatePresence mode="wait">
          {activeView === 'game' ? (
            <motion.div
              key="game"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
            >
              <PacketCatcherGame stepIndex={clampedStep} />
            </motion.div>
          ) : (
            <motion.div
              key="pipeline"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
            >
              <RenderPipelineVisualizer url={url} stepIndex={clampedStep} />
            </motion.div>
          )}
        </AnimatePresence>
      </Suspense>

      {/* Progress Rail & 5-Stage Telemetry Stepper */}
      <div className="space-y-3">
        <div className="relative h-1.5 overflow-hidden rounded-full bg-surface-elevated" aria-hidden="true">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-status-info via-resource-font to-status-success"
            initial={{ width: '10%' }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.65, ease: 'easeOut' }}
          />
          <motion.span
            className="absolute inset-y-0 w-24 rounded-full motion-reduce:hidden"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
            }}
            animate={{ left: ['-25%', '110%'] }}
            transition={{ duration: 1.9, repeat: Infinity, ease: 'linear' }}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
          {analysisSteps.map((step, index) => {
            const complete = index < clampedStep;
            const active = index === clampedStep;
            return (
              <div
                key={step}
                className={cn(
                  'flex items-center gap-2 px-2.5 py-2 rounded-md border text-[11px] font-mono transition-colors',
                  active
                    ? 'border-status-info bg-surface-elevated text-text-primary'
                    : complete
                      ? 'border-border bg-background text-text-primary'
                      : 'border-border-subtle bg-background text-text-muted'
                )}
              >
                {complete ? (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-status-success" />
                ) : active ? (
                  <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin motion-reduce:animate-none text-status-info" />
                ) : (
                  <Circle className="h-3.5 w-3.5 shrink-0 text-text-muted" />
                )}
                <span className="truncate">{step}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rotating Performance Micro-Tip Footer */}
      <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-md border border-border-subtle bg-background text-xs">
        <div className="flex items-start sm:items-center gap-2.5 min-w-0">
          <Lightbulb className="h-3.5 w-3.5 shrink-0 text-status-warning mt-0.5 sm:mt-0" />
          <AnimatePresence mode="wait">
            <motion.p
              key={tipIndex}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="text-text-secondary text-[11px] sm:text-xs leading-relaxed"
            >
              <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted mr-2">
                Perf Tip
              </span>
              {PERF_TIPS[tipIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        <button
          type="button"
          onClick={() => setTipIndex((prev) => (prev + 1) % PERF_TIPS.length)}
          aria-label="Next performance tip"
          className="shrink-0 inline-flex items-center gap-0.5 px-2 py-1 rounded border border-border bg-surface hover:bg-surface-hover text-[10px] font-mono text-text-secondary hover:text-text-primary transition-colors"
        >
          Next
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>
    </motion.div>
  );
}

export default LoadingState;
