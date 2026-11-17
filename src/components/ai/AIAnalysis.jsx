import React from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle2,
  Cpu,
  ListChecks,
  Loader2,
  RefreshCw,
  Sparkles,
  Zap,
} from 'lucide-react';
import Button from '../ui/Button';

const GRADE_STYLE = {
  Good: { colorVar: 'var(--success)', label: 'Good' },
  'Needs Attention': { colorVar: 'var(--warning)', label: 'Needs Attention' },
  Critical: { colorVar: 'var(--error)', label: 'Critical' },
};

const IMPACT_COLOR = {
  High: 'var(--error)',
  Medium: 'var(--warning)',
  Low: 'var(--info)',
};

export function AIAnalysis({
  url = '',
  resourceCount = 0,
  findingCount = 0,
  state = { status: 'idle', data: null, error: '' },
  onAnalyze,
}) {
  const { status, data, error } = state;
  const isLoading = status === 'loading';
  const grade = GRADE_STYLE[data?.healthGrade] || GRADE_STYLE['Needs Attention'];

  return (
    <div className="space-y-4">
      {/* Top Control Header */}
      <div className="rounded-lg border border-border bg-surface p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Sparkles className="h-4 w-4 text-status-info shrink-0" />
              <h3 className="text-sm sm:text-base font-semibold text-text-primary">
                AI Performance Analysis
              </h3>
              {data && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm border text-[10px] font-mono uppercase tracking-wider"
                  style={{
                    color: data.source === 'gemini' ? 'var(--success)' : 'var(--info)',
                    borderColor: `color-mix(in srgb, ${data.source === 'gemini' ? 'var(--success)' : 'var(--info)'} 40%, transparent)`,
                    backgroundColor: `color-mix(in srgb, ${data.source === 'gemini' ? 'var(--success)' : 'var(--info)'} 12%, transparent)`,
                  }}
                >
                  <Cpu className="h-3 w-3" />
                  {data.source === 'gemini' ? data.model : 'Structured Fallback'}
                </span>
              )}
            </div>
            <p className="text-xs text-text-secondary">
              Synthesizes your measured metrics, {resourceCount} network resources, and {findingCount} detective findings into a prioritized optimization plan.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="primary"
              size="sm"
              loading={isLoading}
              onClick={() => onAnalyze?.({ forceRefresh: Boolean(data) })}
              leftIcon={
                data ? (
                  <RefreshCw className="h-3.5 w-3.5" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )
              }
              className="font-mono text-xs"
            >
              {isLoading
                ? 'Analyzing…'
                : data
                  ? 'Re-analyze Website'
                  : 'Analyze my website'}
            </Button>
          </div>
        </div>

        {/* Structured Pipeline Indicator */}
        <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-border-subtle text-[10px] font-mono text-text-muted">
          <span className="uppercase tracking-wider mr-1">Structured Context:</span>
          {['URL', 'Real Metrics', `${resourceCount} Resources`, 'Waterfall', `${findingCount} Findings`].map(
            (step, idx, arr) => (
              <React.Fragment key={step}>
                <span className="px-2 py-0.5 rounded-sm border border-border bg-background text-text-secondary">
                  {step}
                </span>
                {idx < arr.length - 1 && <span className="text-text-muted">→</span>}
              </React.Fragment>
            )
          )}
        </div>
      </div>

      {/* Error State */}
      {status === 'error' && error && (
        <div
          className="rounded-lg border p-4 text-xs font-mono"
          style={{
            color: 'var(--error)',
            borderColor: 'color-mix(in srgb, var(--error) 40%, transparent)',
            backgroundColor: 'color-mix(in srgb, var(--error) 10%, transparent)',
          }}
        >
          {error}
        </div>
      )}

      {/* Idle Prompt Card */}
      {status === 'idle' && !data && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-border bg-surface p-8 sm:p-10 text-center space-y-4"
        >
          <div
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg border"
            style={{
              color: 'var(--info)',
              borderColor: 'color-mix(in srgb, var(--info) 35%, transparent)',
              backgroundColor: 'color-mix(in srgb, var(--info) 12%, transparent)',
            }}
          >
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="space-y-1.5 max-w-lg mx-auto">
            <h4 className="text-sm sm:text-base font-semibold text-text-primary">
              Ready to interpret {url ? url.replace(/^https?:\/\//, '') : 'this site'}
            </h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              Click <strong className="text-text-primary">Analyze my website</strong> to send your structured telemetry through <code className="font-mono text-status-info">aiService</code> and generate a grounded engineering report.
            </p>
          </div>
          <div>
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => onAnalyze?.({ forceRefresh: false })}
              leftIcon={<Sparkles className="h-4 w-4" />}
              className="font-mono text-xs"
            >
              Analyze my website
            </Button>
          </div>
        </motion.div>
      )}

      {/* Loading State */}
      {isLoading && !data && (
        <div className="rounded-lg border border-border bg-surface p-8 flex flex-col items-center justify-center gap-3 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-status-info" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-text-primary">
              Synthesizing structured performance telemetry…
            </p>
            <p className="text-xs font-mono text-text-muted">
              aiService → structured payload → Gemini 3.8 Flash → structured report
            </p>
          </div>
        </div>
      )}

      {/* Structured AI Report */}
      {data && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-4"
        >
          {/* Fallback Transparency Banner */}
          {data.source === 'fallback' && (
            <div
              className="rounded-md border px-3.5 py-2.5 text-[11px] font-mono flex flex-wrap items-center justify-between gap-2"
              style={{
                color: 'var(--text-secondary)',
                borderColor: 'color-mix(in srgb, var(--info) 35%, transparent)',
                backgroundColor: 'color-mix(in srgb, var(--info) 8%, transparent)',
              }}
            >
              <span>
                Running in <strong className="text-text-primary">Local Structured Mode</strong>{' '}
                {data.fallbackReason === 'missing_api_key'
                  ? '(add GEMINI_API_KEY in .env.local and restart Vite for live Gemini 3.8 Flash).'
                  : `(${data.fallbackReason}).`}
              </span>
            </div>
          )}

          {/* Executive Summary Card */}
          <div className="rounded-lg border border-border bg-surface p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-base font-semibold text-text-primary">
                {data.headline}
              </h4>
              <span
                className="px-2.5 py-0.5 rounded-sm border text-[11px] font-mono font-semibold uppercase tracking-wider"
                style={{
                  color: grade.colorVar,
                  borderColor: `color-mix(in srgb, ${grade.colorVar} 40%, transparent)`,
                  backgroundColor: `color-mix(in srgb, ${grade.colorVar} 14%, transparent)`,
                }}
              >
                Health: {grade.label}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              {data.summary}
            </p>
          </div>

          {/* Bottlenecks & Action Plan Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Key Bottlenecks */}
            <div className="rounded-lg border border-border bg-surface p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-text-muted">
                <AlertTriangle className="h-3.5 w-3.5 text-status-warning" />
                <span>Key Bottlenecks</span>
              </div>

              <div className="space-y-2.5">
                {data.keyBottlenecks.length === 0 ? (
                  <p className="text-xs text-text-muted">No major bottlenecks highlighted.</p>
                ) : (
                  data.keyBottlenecks.map((item, idx) => {
                    const color = IMPACT_COLOR[item.impact] || 'var(--info)';
                    return (
                      <div
                        key={`${item.title}-${idx}`}
                        className="rounded-md border border-border bg-background p-3 space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-mono font-semibold text-text-primary">
                            {item.title}
                          </span>
                          <span
                            className="px-1.5 py-0.5 rounded-sm text-[10px] font-mono uppercase shrink-0"
                            style={{
                              color,
                              backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)`,
                            }}
                          >
                            {item.impact}
                          </span>
                        </div>
                        <p className="text-xs text-text-secondary leading-relaxed">
                          {item.detail}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Prioritized Action Plan */}
            <div className="rounded-lg border border-border bg-surface p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-text-muted">
                <ListChecks className="h-3.5 w-3.5 text-status-info" />
                <span>Prioritized Action Plan</span>
              </div>

              <div className="space-y-2.5">
                {data.actionPlan.map((step, idx) => (
                  <div
                    key={`${step.priority}-${idx}`}
                    className="rounded-md border border-border bg-background p-3 space-y-1"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="px-1.5 py-0.5 rounded-sm font-mono text-[10px] font-bold"
                        style={{
                          color: 'var(--info)',
                          backgroundColor: 'color-mix(in srgb, var(--info) 14%, transparent)',
                        }}
                      >
                        {step.priority}
                      </span>
                      <span className="text-[11px] font-mono text-status-success">
                        {step.expectedGain}
                      </span>
                    </div>
                    <p className="text-xs text-text-primary leading-relaxed">
                      {step.action}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Wins */}
          {data.quickWins.length > 0 && (
            <div className="rounded-lg border border-border bg-surface p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-text-muted">
                <Zap className="h-3.5 w-3.5 text-status-success" />
                <span>Quick Wins</span>
              </div>
              <ul className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                {data.quickWins.map((win, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 rounded-md border border-border bg-background p-3 text-xs text-text-secondary leading-relaxed"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-status-success mt-0.5" />
                    <span>{win}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

export default AIAnalysis;
