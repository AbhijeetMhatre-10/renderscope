import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckCircle2,
  Info,
  RotateCcw,
  SearchCode,
  SlidersHorizontal,
} from 'lucide-react';
import {
  DEFAULT_THRESHOLDS,
  THRESHOLD_CONFIG,
} from '../../analysis/findingEngine';
import FindingCard from './FindingCard';

const SEVERITY_FILTERS = ['all', 'critical', 'warning', 'info'];

export function PerformanceDetective({
  findings = [],
  summary = { total: 0, critical: 0, warning: 0, info: 0 },
  thresholds = DEFAULT_THRESHOLDS,
  findingInsights = {},
  onExplainFinding,
  onThresholdsChange,
  onResetThresholds,
  onViewResource,
  onViewResourcesTab,
  onInspectFix,
}) {
  const [severityFilter, setSeverityFilter] = useState('all');
  const [showThresholds, setShowThresholds] = useState(false);

  const isCustomThresholds = useMemo(
    () =>
      Object.keys(DEFAULT_THRESHOLDS).some(
        (key) => Number(thresholds[key]) !== Number(DEFAULT_THRESHOLDS[key])
      ),
    [thresholds]
  );

  const visibleFindings = useMemo(() => {
    if (severityFilter === 'all') return findings;
    return findings.filter((item) => item.severity === severityFilter);
  }, [findings, severityFilter]);

  const filterCounts = {
    all: summary.total,
    critical: summary.critical,
    warning: summary.warning,
    info: summary.info,
  };

  return (
    <div className="space-y-4">
      {/* Header & Heuristic Controls Bar */}
      <div className="rounded-lg border border-border bg-surface p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <SearchCode className="h-4 w-4 text-status-info shrink-0" />
              <h3 className="text-sm sm:text-base font-semibold text-text-primary">
                Performance Detective
              </h3>
              <span
                className="px-2 py-0.5 rounded-sm border text-[11px] font-mono font-semibold font-mono-numbers"
                style={{
                  color: summary.total > 0 ? 'var(--warning)' : 'var(--success)',
                  borderColor: `color-mix(in srgb, ${summary.total > 0 ? 'var(--warning)' : 'var(--success)'} 40%, transparent)`,
                  backgroundColor: `color-mix(in srgb, ${summary.total > 0 ? 'var(--warning)' : 'var(--success)'} 12%, transparent)`,
                }}
              >
                {summary.total} {summary.total === 1 ? 'finding' : 'findings'}
              </span>
            </div>
            <p className="text-xs text-text-secondary">
              Automatically identifies measurable bottlenecks across JavaScript, images, latency, payloads, and request volume.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowThresholds((prev) => !prev)}
            aria-expanded={showThresholds}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-mono transition-colors shrink-0 ${
              showThresholds || isCustomThresholds
                ? 'border-border-focus bg-surface-elevated text-text-primary'
                : 'border-border bg-background text-text-secondary hover:bg-surface-hover hover:text-text-primary'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-status-info" />
            Thresholds
            {isCustomThresholds && (
              <span className="h-1.5 w-1.5 rounded-full bg-status-info" />
            )}
          </button>
        </div>

        {/* Heuristic Notice + Severity Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3 border-t border-border-subtle">
          <div
            role="group"
            aria-label="Filter findings by severity"
            className="flex items-center gap-1.5 flex-wrap"
          >
            {SEVERITY_FILTERS.map((sev) => {
              const active = severityFilter === sev;
              return (
                <button
                  key={sev}
                  type="button"
                  onClick={() => setSeverityFilter(sev)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm border text-[11px] font-mono uppercase tracking-wider transition-colors ${
                    active
                      ? 'bg-surface-elevated text-text-primary border-border-focus font-medium'
                      : 'bg-background text-text-secondary border-border hover:bg-surface-hover hover:text-text-primary'
                  }`}
                >
                  <span>{sev}</span>
                  <span className="text-[10px] text-text-muted font-mono-numbers">
                    {filterCounts[sev]}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="inline-flex items-center gap-1.5 text-[11px] font-mono text-text-muted">
            <Info className="h-3.5 w-3.5 shrink-0 text-status-info" />
            Thresholds are configurable heuristics, not universal laws.
          </p>
        </div>

        {/* Collapsible Configurable Heuristic Thresholds Panel */}
        <AnimatePresence initial={false}>
          {showThresholds && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-4 border-t border-border-subtle space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-text-secondary">
                    Heuristic Threshold Configuration
                  </span>
                  {isCustomThresholds && (
                    <button
                      type="button"
                      onClick={onResetThresholds}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded border border-border bg-background hover:bg-surface-hover text-[11px] font-mono text-text-secondary hover:text-text-primary transition-colors"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Reset defaults
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {THRESHOLD_CONFIG.map((cfg) => {
                    const value = thresholds[cfg.key] ?? DEFAULT_THRESHOLDS[cfg.key];
                    return (
                      <label
                        key={cfg.key}
                        className="rounded-md border border-border bg-background p-3 space-y-2 block"
                      >
                        <div className="flex items-center justify-between gap-1 font-mono text-[11px]">
                          <span className="text-text-primary font-medium truncate">
                            {cfg.label}
                          </span>
                          <span className="text-status-info font-semibold font-mono-numbers shrink-0">
                            {value} {cfg.unit}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={cfg.min}
                          max={cfg.max}
                          step={cfg.step}
                          value={value}
                          onChange={(e) =>
                            onThresholdsChange?.({
                              ...thresholds,
                              [cfg.key]: Number(e.target.value),
                            })
                          }
                          className="w-full accent-status-info cursor-pointer"
                        />
                        <span className="block text-[10px] text-text-muted leading-snug">
                          {cfg.hint}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Findings Grid or All-Clear State */}
      {visibleFindings.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-border bg-surface p-10 text-center space-y-3"
        >
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface-elevated text-status-success">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h4 className="text-sm font-semibold text-text-primary">
              {summary.total === 0
                ? 'No bottlenecks flagged under current heuristics'
                : `No ${severityFilter} findings detected`}
            </h4>
            <p className="text-xs text-text-secondary">
              {summary.total === 0
                ? 'All measured resources stayed within the configured heuristic thresholds. You can tighten thresholds above for stricter audits.'
                : 'Try switching back to All severities to inspect other advisories.'}
            </p>
          </div>
          {severityFilter !== 'all' && (
            <button
              type="button"
              onClick={() => setSeverityFilter('all')}
              className="px-3 py-1.5 rounded-md border border-border bg-surface-elevated hover:bg-surface-hover text-xs font-mono text-text-primary transition-colors"
            >
              Show all findings
            </button>
          )}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {visibleFindings.map((finding, index) => (
              <FindingCard
                key={finding.id}
                finding={finding}
                index={index}
                aiInsight={findingInsights[finding.id]}
                onExplainFinding={onExplainFinding}
                onViewResource={onViewResource}
                onViewResourcesTab={onViewResourcesTab}
                onInspectFix={onInspectFix}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

export default PerformanceDetective;
