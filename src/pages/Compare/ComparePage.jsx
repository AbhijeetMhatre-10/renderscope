import React, { Suspense, lazy, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeftRight,
  GitCompare,
  RotateCcw,
  TrendingDown,
  TrendingUp,
  Minus,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Card, { CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { SkeletonRow } from '../../components/ui/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import useHistory from '../../hooks/useHistory';
import { formatBytes, formatDuration } from '../../lib/utils';

const WaterfallCompare = lazy(() => import('../../components/compare/WaterfallCompare'));

function formatHost(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return String(url || '').replace(/^https?:\/\//, '') || 'Unknown';
  }
}

function isValidNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function formatRunOption(run) {
  const host = formatHost(run.url);
  const tag = run.label ? ` · ${run.label}` : '';
  const lcpLabel = isValidNumber(run.lcp) ? ` · LCP ${formatDuration(run.lcp)}` : '';
  return `${host}${tag} (${run.analyzedAt}${lcpLabel})`;
}

function computeDelta(valA, valB, formatAbs) {
  if (!isValidNumber(valA) || !isValidNumber(valB)) {
    return {
      unavailable: true,
      diffFormatted: '—',
      pctFormatted: '—',
      colorVar: 'var(--text-muted)',
      trend: 'neutral',
    };
  }

  const diff = valB - valA;
  const pct = valA !== 0 ? Math.round((diff / valA) * 100) : 0;
  const isNeutral = Math.abs(diff) < 0.001;
  // Lower is better for TTFB, FCP, LCP, JS size, Requests, and Transfer size
  const improved = diff < 0;

  const sign = diff > 0 ? '+' : diff < 0 ? '-' : '';
  return {
    unavailable: false,
    diffFormatted: isNeutral ? '0' : `${sign}${formatAbs(Math.abs(diff))}`,
    pctFormatted: isNeutral ? '0%' : `${diff > 0 ? '+' : ''}${pct}%`,
    colorVar: isNeutral ? 'var(--text-muted)' : improved ? 'var(--success)' : 'var(--error)',
    trend: isNeutral ? 'neutral' : improved ? 'improved' : 'regressed',
  };
}

export function ComparePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { analyses, isLoading, loadSampleRuns } = useHistory();

  const paramA = searchParams.get('a');
  const paramB = searchParams.get('b');

  const [manualSlotA, setManualSlotA] = useState(null);
  const [manualSlotB, setManualSlotB] = useState(null);

  // Derive active slot IDs cleanly without synchronous setState inside effects
  const slotAId = useMemo(() => {
    const candidate = manualSlotA ?? paramA;
    if (candidate && analyses.some((r) => r.id === candidate)) return candidate;
    if (analyses.length >= 2) {
      // Pick older run as "Before (A)" when auto-selecting
      return analyses[1]?.id || null;
    }
    return analyses[0]?.id || null;
  }, [manualSlotA, paramA, analyses]);

  const slotBId = useMemo(() => {
    const candidate = manualSlotB ?? paramB;
    if (candidate && analyses.some((r) => r.id === candidate)) return candidate;
    if (analyses.length >= 2) {
      // Pick newest run as "After (B)" when auto-selecting
      return analyses[0]?.id || null;
    }
    return null;
  }, [manualSlotB, paramB, analyses]);

  const analysisA = useMemo(
    () => analyses.find((r) => r.id === slotAId) || null,
    [analyses, slotAId]
  );
  const analysisB = useMemo(
    () => analyses.find((r) => r.id === slotBId) || null,
    [analyses, slotBId]
  );

  const isDualSelected = Boolean(analysisA && analysisB);

  const handleSelectA = (id) => {
    setManualSlotA(id || '');
    const next = new URLSearchParams(searchParams);
    if (id) next.set('a', id);
    else next.delete('a');
    setSearchParams(next, { replace: true });
  };

  const handleSelectB = (id) => {
    setManualSlotB(id || '');
    const next = new URLSearchParams(searchParams);
    if (id) next.set('b', id);
    else next.delete('b');
    setSearchParams(next, { replace: true });
  };

  const handleSwap = () => {
    if (!slotAId && !slotBId) return;
    const prevA = slotAId || '';
    const prevB = slotBId || '';
    setManualSlotA(prevB);
    setManualSlotB(prevA);
    const next = new URLSearchParams();
    if (prevB) next.set('a', prevB);
    if (prevA) next.set('b', prevA);
    setSearchParams(next, { replace: true });
  };

  const handleLoadSamples = async () => {
    const seeded = await loadSampleRuns();
    const beforeRun = seeded.find((r) => r.id === 'sample-example-before') || seeded[1];
    const afterRun = seeded.find((r) => r.id === 'sample-example-after') || seeded[0];
    if (beforeRun && afterRun) {
      setManualSlotA(beforeRun.id);
      setManualSlotB(afterRun.id);
      setSearchParams({ a: beforeRun.id, b: afterRun.id }, { replace: true });
    }
  };

  const comparisonRows = useMemo(() => {
    if (!analysisA || !analysisB) return [];
    return [
      {
        id: 'ttfb',
        label: 'TTFB',
        sublabel: 'Time to First Byte',
        valA: analysisA.ttfb,
        valB: analysisB.ttfb,
        format: formatDuration,
      },
      {
        id: 'fcp',
        label: 'FCP',
        sublabel: 'First Contentful Paint',
        valA: analysisA.fcp,
        valB: analysisB.fcp,
        format: formatDuration,
      },
      {
        id: 'lcp',
        label: 'LCP',
        sublabel: 'Largest Contentful Paint',
        valA: analysisA.lcp,
        valB: analysisB.lcp,
        format: formatDuration,
      },
      {
        id: 'js',
        label: 'JS',
        sublabel: 'JavaScript Size',
        valA: analysisA.jsSize,
        valB: analysisB.jsSize,
        format: formatBytes,
      },
      {
        id: 'requests',
        label: 'Requests',
        sublabel: 'Total Network Requests',
        valA: analysisA.requests,
        valB: analysisB.requests,
        format: (v) => String(Math.round(v)),
      },
      {
        id: 'transfer',
        label: 'Transferred',
        sublabel: 'Total Network Weight',
        valA: analysisA.transferSize,
        valB: analysisB.transferSize,
        format: formatBytes,
      },
    ];
  }, [analysisA, analysisB]);

  return (
    <div className="flex-1 flex flex-col w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-text-primary tracking-tight font-sans">
              Compare Performance
            </h1>
            <Badge variant="default" size="xs">
              Before vs After
            </Badge>
          </div>
          <p className="text-xs text-text-secondary">
            Compare any two locally saved analyses across TTFB, FCP, LCP, JS weight, requests, and synchronized waterfalls.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleLoadSamples}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            className="font-mono text-xs"
          >
            Load Sample Pair
          </Button>
        </div>
      </div>

      {/* Dual Slot Selection Bar */}
      {analyses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center">
          {/* Analysis A (Before) */}
          <div className="md:col-span-5 p-3.5 rounded-lg border border-border bg-surface space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="uppercase text-status-info font-semibold">
                Analysis A · Before
              </span>
              {analysisA && (
                <span className="text-text-muted capitalize">
                  {analysisA.strategy || 'desktop'}
                </span>
              )}
            </div>
            <select
              value={slotAId || ''}
              onChange={(e) => handleSelectA(e.target.value)}
              aria-label="Select Analysis A (Before)"
              className="w-full bg-background border border-border rounded px-3 py-2 text-xs font-mono text-text-primary focus:outline-none focus:border-border-focus"
            >
              <option value="">-- Select Analysis A --</option>
              {analyses.map((run) => (
                <option key={`a-${run.id}`} value={run.id}>
                  {formatRunOption(run)}
                </option>
              ))}
            </select>
          </div>

          {/* VS / Swap Trigger */}
          <div className="md:col-span-1 flex items-center justify-center">
            <button
              type="button"
              onClick={handleSwap}
              title="Swap Analysis A and Analysis B"
              aria-label="Swap Analysis A and Analysis B"
              className="h-9 w-9 rounded-full bg-surface-elevated border border-border hover:border-border-focus flex items-center justify-center font-mono text-xs text-text-secondary hover:text-status-info transition-colors"
            >
              <ArrowLeftRight className="h-4 w-4" />
            </button>
          </div>

          {/* Analysis B (After) */}
          <div className="md:col-span-5 p-3.5 rounded-lg border border-border bg-surface space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="uppercase text-status-success font-semibold">
                Analysis B · After
              </span>
              {analysisB && (
                <span className="text-text-muted capitalize">
                  {analysisB.strategy || 'desktop'}
                </span>
              )}
            </div>
            <select
              value={slotBId || ''}
              onChange={(e) => handleSelectB(e.target.value)}
              aria-label="Select Analysis B (After)"
              className="w-full bg-background border border-border rounded px-3 py-2 text-xs font-mono text-text-primary focus:outline-none focus:border-border-focus"
            >
              <option value="">-- Select Analysis B --</option>
              {analyses.map((run) => (
                <option key={`b-${run.id}`} value={run.id}>
                  {formatRunOption(run)}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Main Comparative Body */}
      {isLoading ? (
        <div className="rounded-lg border border-border bg-surface overflow-hidden">
          {[0, 1, 2, 3, 4].map((idx) => (
            <SkeletonRow key={idx} />
          ))}
        </div>
      ) : analyses.length < 2 ? (
        <div className="space-y-4">
          <EmptyState
            title="Need at least two saved analyses to compare"
            description="Run two URL analyses (or load the built-in Before vs After sample pair) to inspect metric deltas and synchronized waterfalls."
            actionLabel="Load Sample Before vs After Pair"
            onAction={handleLoadSamples}
            icon={GitCompare}
          />
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/analyze')}
              className="font-mono text-xs border border-border"
            >
              Or Analyze a Website Now
            </Button>
          </div>
        </div>
      ) : !isDualSelected ? (
        <EmptyState
          title="Select Analysis A and Analysis B"
          description="Pick a baseline run in Slot A and a comparison run in Slot B above to view metric deltas and visual waterfall differences."
          actionLabel="Compare Latest Two Runs"
          onAction={() => {
            handleSelectA(analyses[1].id);
            handleSelectB(analyses[0].id);
          }}
          icon={GitCompare}
        />
      ) : (
        <motion.div
          key={`${analysisA.id}-${analysisB.id}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          className="space-y-6"
        >
          {/* Metric Delta Matrix (Before vs After) */}
          <Card className="border-border overflow-hidden">
            <CardHeader className="bg-surface-elevated border-b border-border">
              <CardTitle className="font-mono text-xs flex items-center justify-between gap-2 flex-wrap">
                <span className="flex items-center gap-2">
                  <GitCompare className="w-4 h-4 text-status-info" />
                  BEFORE VS AFTER METRIC MATRIX
                </span>
                <span className="text-[11px] text-text-muted font-normal">
                  Lower values = faster / lighter (green)
                </span>
              </CardTitle>
            </CardHeader>

            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-border text-[11px] text-text-muted bg-background">
                    <th className="p-4">Metric</th>
                    <th className="p-4 text-right">
                      Before ({formatHost(analysisA.url)}
                      {analysisA.label ? ` · ${analysisA.label}` : ''})
                    </th>
                    <th className="p-4 text-right">
                      After ({formatHost(analysisB.url)}
                      {analysisB.label ? ` · ${analysisB.label}` : ''})
                    </th>
                    <th className="p-4 text-right">Delta</th>
                    <th className="p-4 text-right">Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {comparisonRows.map((row) => {
                    const delta = computeDelta(row.valA, row.valB, row.format);
                    const TrendIcon =
                      delta.trend === 'improved'
                        ? TrendingDown
                        : delta.trend === 'regressed'
                          ? TrendingUp
                          : Minus;

                    return (
                      <tr
                        key={row.id}
                        className="hover:bg-surface-elevated transition-colors"
                      >
                        <td className="p-4">
                          <span className="font-semibold text-text-primary block">
                            {row.label}
                          </span>
                          <span className="text-[10px] text-text-muted">
                            {row.sublabel}
                          </span>
                        </td>
                        <td className="p-4 text-right font-mono-numbers text-text-secondary">
                          {isValidNumber(row.valA) ? row.format(row.valA) : 'Unavailable'}
                        </td>
                        <td className="p-4 text-right font-mono-numbers font-semibold text-text-primary">
                          {isValidNumber(row.valB) ? row.format(row.valB) : 'Unavailable'}
                        </td>
                        <td
                          className="p-4 text-right font-mono-numbers font-semibold"
                          style={{ color: delta.colorVar }}
                        >
                          {delta.diffFormatted}
                        </td>
                        <td className="p-4 text-right">
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[11px] border font-mono-numbers"
                            style={{
                              color: delta.colorVar,
                              borderColor: `color-mix(in srgb, ${delta.colorVar} 38%, transparent)`,
                              backgroundColor: `color-mix(in srgb, ${delta.colorVar} 12%, transparent)`,
                            }}
                          >
                            <TrendIcon className="h-3 w-3" />
                            {delta.pctFormatted}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Lazy-Loaded Visual Waterfall Comparison */}
          <Suspense
            fallback={
              <div className="rounded-lg border border-border bg-surface overflow-hidden">
                {[0, 1, 2, 3, 4].map((idx) => (
                  <SkeletonRow key={idx} />
                ))}
              </div>
            }
          >
            <WaterfallCompare analysisA={analysisA} analysisB={analysisB} />
          </Suspense>
        </motion.div>
      )}
    </div>
  );
}

export default ComparePage;
