import React, { Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  AlertTriangle,
  ChevronRight,
  Eye,
  Info,
  Layers,
  Sparkles,
} from 'lucide-react';
import Button from '../ui/Button';

const AIInlineInsight = lazy(() => import('../ai/AIInlineInsight'));

const SEVERITY_STYLE = {
  critical: {
    icon: AlertCircle,
    label: 'Critical',
    colorVar: 'var(--error)',
  },
  warning: {
    icon: AlertTriangle,
    label: 'Warning',
    colorVar: 'var(--warning)',
  },
  info: {
    icon: Info,
    label: 'Info',
    colorVar: 'var(--info)',
  },
};

export function FindingCard({
  finding,
  index = 0,
  aiInsight,
  onExplainFinding,
  onViewResource,
  onViewResourcesTab,
  onInspectFix,
}) {
  const style = SEVERITY_STYLE[finding.severity] || SEVERITY_STYLE.info;
  const Icon = style.icon;
  const hasInsight = aiInsight && aiInsight.status !== 'idle';

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.22, delay: Math.min(index * 0.04, 0.24), ease: 'easeOut' }}
      className="flex flex-col justify-between rounded-lg border border-border bg-surface p-5 space-y-4 transition-colors hover:border-border-focus shadow-sm"
    >
      <div className="space-y-3.5">
        {/* Top Row: Severity Pill & Heuristic Tag */}
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-border-subtle">
          <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm border text-[10px] font-mono uppercase tracking-wider font-semibold"
            style={{
              color: style.colorVar,
              borderColor: `color-mix(in srgb, ${style.colorVar} 40%, transparent)`,
              backgroundColor: `color-mix(in srgb, ${style.colorVar} 12%, transparent)`,
            }}
          >
            <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
            {style.label}
          </span>

          <span className="text-[10px] font-mono text-text-muted">
            {finding.thresholdLabel}
          </span>
        </div>

        {/* Finding Title + Measured Resource Box */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-text-primary">
            {finding.title}
          </h4>

          <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2 font-mono text-xs">
            <span
              className="text-text-primary font-medium truncate"
              title={finding.resource?.url || finding.resourceName}
            >
              {finding.resourceName}
            </span>
            <span
              className="shrink-0 font-bold font-mono-numbers"
              style={{ color: style.colorVar }}
            >
              {finding.measurement}
            </span>
          </div>
        </div>

        {/* Why It Matters */}
        <div className="space-y-1">
          <span className="block text-[10px] font-mono uppercase tracking-wider text-text-muted">
            Why it matters
          </span>
          <p className="text-xs text-text-secondary leading-relaxed">
            {finding.whyItMatters}
          </p>
        </div>

        {/* Inline AI Explanation ("Why is this a problem?") */}
        {hasInsight && (
          <Suspense fallback={null}>
            <AIInlineInsight mode="finding" state={aiInsight} />
          </Suspense>
        )}
      </div>

      {/* Footer Actions */}
      <div className="pt-3 border-t border-border-subtle flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {finding.resource ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onViewResource?.(finding.resource)}
              leftIcon={<Eye className="h-3.5 w-3.5 text-status-info" />}
              className="font-mono text-xs"
            >
              View Resource
            </Button>
          ) : (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onViewResourcesTab?.()}
              leftIcon={<Layers className="h-3.5 w-3.5 text-status-info" />}
              className="font-mono text-xs"
            >
              View Resources
            </Button>
          )}

          {onExplainFinding && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              loading={aiInsight?.status === 'loading'}
              onClick={() => onExplainFinding(finding)}
              leftIcon={<Sparkles className="h-3.5 w-3.5 text-status-info" />}
              className="font-mono text-xs border border-border"
            >
              Why is this a problem?
            </Button>
          )}
        </div>

        <button
          type="button"
          onClick={() => onInspectFix?.(finding)}
          className="inline-flex items-center gap-1 text-xs font-mono text-status-info hover:underline"
        >
          Inspect Fix
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.article>
  );
}

export default FindingCard;
