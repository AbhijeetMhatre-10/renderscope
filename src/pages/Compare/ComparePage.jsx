import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  GitCompare,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/common/EmptyState';
import { formatBytes } from '../../lib/utils';

export function ComparePage() {
  const recentAnalyses = useSelector((state) => state.app.recentAnalyses);

  // Default slots to first two analyses if available
  const [slotAId, setSlotAId] = useState(recentAnalyses[0]?.id || null);
  const [slotBId, setSlotBId] = useState(recentAnalyses[1]?.id || null);

  const analysisA = recentAnalyses.find((r) => r.id === slotAId);
  const analysisB = recentAnalyses.find((r) => r.id === slotBId);

  const isDualSelected = Boolean(analysisA && analysisB);

  // Delta calculation helper: lower is better for timing and sizes
  const computeDelta = (valA, valB, formatFn = (v) => v, invert = false) => {
    const diff = valB - valA;
    const pct = valA !== 0 ? Math.round((diff / valA) * 100) : 0;
    const isNeutral = Math.abs(diff) < 0.001;

    // For metrics where lower is better (LCP, TTFB, requests, size):
    // If diff < 0 -> B is faster/smaller -> good (green)
    // If diff > 0 -> B is slower/larger -> bad (red)
    const isGood = invert ? diff > 0 : diff < 0;

    let badgeClass = 'bg-surface-elevated text-text-muted';
    let textClass = 'text-text-muted';
    if (!isNeutral) {
      if (isGood) {
        badgeClass = 'bg-status-success/15 text-status-success border-status-success/30';
        textClass = 'text-status-success';
      } else {
        badgeClass = 'bg-status-error/15 text-status-error border-status-error/30';
        textClass = 'text-status-error';
      }
    }

    const sign = diff > 0 ? '+' : '';

    return {
      diffFormatted: `${sign}${formatFn(diff)}`,
      pctFormatted: `${sign}${pct}%`,
      badgeClass,
      textClass,
      isGood,
      isNeutral,
    };
  };

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
              Diff Mode
            </Badge>
          </div>
          <p className="text-xs text-text-secondary">
            Differential analysis comparing load sequence, Core Web Vitals, and payload weights.
          </p>
        </div>

        {/* Quick state switcher for testing empty state */}
        <div className="flex items-center gap-2">
          {isDualSelected ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSlotAId(null);
                setSlotBId(null);
              }}
              className="text-text-muted hover:text-text-primary font-mono text-xs"
            >
              Reset Slots (Show Empty)
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSlotAId(recentAnalyses[0]?.id || null);
                setSlotBId(recentAnalyses[1]?.id || null);
              }}
              className="font-mono text-xs"
            >
              Load Sample Pair
            </Button>
          )}
        </div>
      </div>

      {/* Dual Slot Selection Bar */}
      <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center">
        {/* Slot A Selector */}
        <div className="md:col-span-5 p-3 rounded-lg border border-border bg-surface space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-status-info font-medium">
              Target A (Baseline)
            </span>
            {analysisA && (
              <Badge variant="fast" size="xs">
                Score {analysisA.score}
              </Badge>
            )}
          </div>
          <select
            value={slotAId || ''}
            onChange={(e) => setSlotAId(e.target.value || null)}
            className="w-full bg-background border border-border rounded px-3 py-2 text-xs font-mono text-text-primary focus:outline-none focus:border-border-focus"
          >
            <option value="">-- Select Analysis A --</option>
            {recentAnalyses.map((r) => (
              <option key={`a-${r.id}`} value={r.id}>
                {r.url} ({r.lcp}s LCP)
              </option>
            ))}
          </select>
        </div>

        {/* VS Divider Badge */}
        <div className="md:col-span-1 flex items-center justify-center">
          <span className="w-8 h-8 rounded-full bg-surface-elevated border border-border flex items-center justify-center font-mono text-xs text-text-muted select-none font-bold">
            VS
          </span>
        </div>

        {/* Slot B Selector */}
        <div className="md:col-span-5 p-3 rounded-lg border border-border bg-surface space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-status-warning font-medium">
              Target B (Comparison)
            </span>
            {analysisB && (
              <Badge variant="fast" size="xs">
                Score {analysisB.score}
              </Badge>
            )}
          </div>
          <select
            value={slotBId || ''}
            onChange={(e) => setSlotBId(e.target.value || null)}
            className="w-full bg-background border border-border rounded px-3 py-2 text-xs font-mono text-text-primary focus:outline-none focus:border-border-focus"
          >
            <option value="">-- Select Analysis B --</option>
            {recentAnalyses.map((r) => (
              <option key={`b-${r.id}`} value={r.id}>
                {r.url} ({r.lcp}s LCP)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Comparative View */}
      {!isDualSelected ? (
        /* Empty State */
        <EmptyState
          title="Compare performance"
          description="Select two analyses from the dropdown slots above to inspect their performance deltas side by side."
          actionLabel="Select Sample Pair"
          onAction={() => {
            setSlotAId(recentAnalyses[0]?.id || null);
            setSlotBId(recentAnalyses[1]?.id || null);
          }}
          icon={GitCompare}
        />
      ) : (
        /* Populated Side-by-Side Comparison Layout */
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {/* Delta Highlights Table Card */}
          <Card className="border-border">
            <CardHeader className="bg-surface-elevated/40">
              <CardTitle className="font-mono text-xs flex items-center gap-2">
                <GitCompare className="w-4 h-4 text-status-info" />
                METRIC DELTA MATRIX (TARGET B VS TARGET A)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-border text-[11px] text-text-muted bg-surface/50">
                    <th className="p-4">Metric</th>
                    <th className="p-4 text-right">Target A ({analysisA.url.replace('https://', '')})</th>
                    <th className="p-4 text-right">Target B ({analysisB.url.replace('https://', '')})</th>
                    <th className="p-4 text-right">Absolute Delta</th>
                    <th className="p-4 text-right">Percentage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {/* Score */}
                  {(() => {
                    const delta = computeDelta(analysisA.score, analysisB.score, (v) => v, true);
                    return (
                      <tr className="hover:bg-surface-elevated/40 transition-colors">
                        <td className="p-4 font-semibold text-text-primary">Performance Score</td>
                        <td className="p-4 text-right">{analysisA.score}/100</td>
                        <td className="p-4 text-right font-semibold">{analysisB.score}/100</td>
                        <td className={`p-4 text-right font-semibold ${delta.textClass}`}>
                          {delta.diffFormatted} pts
                        </td>
                        <td className="p-4 text-right">
                          <span className={`px-2 py-0.5 rounded text-[11px] border ${delta.badgeClass}`}>
                            {delta.pctFormatted}
                          </span>
                        </td>
                      </tr>
                    );
                  })()}

                  {/* LCP */}
                  {(() => {
                    const delta = computeDelta(analysisA.lcp, analysisB.lcp, (v) => `${v.toFixed(2)}s`);
                    return (
                      <tr className="hover:bg-surface-elevated/40 transition-colors">
                        <td className="p-4 font-semibold text-text-primary">Largest Contentful Paint (LCP)</td>
                        <td className="p-4 text-right">{analysisA.lcp}s</td>
                        <td className="p-4 text-right font-semibold">{analysisB.lcp}s</td>
                        <td className={`p-4 text-right font-semibold ${delta.textClass}`}>
                          {delta.diffFormatted}
                        </td>
                        <td className="p-4 text-right">
                          <span className={`px-2 py-0.5 rounded text-[11px] border ${delta.badgeClass}`}>
                            {delta.pctFormatted}
                          </span>
                        </td>
                      </tr>
                    );
                  })()}

                  {/* TTFB */}
                  {(() => {
                    const delta = computeDelta(analysisA.ttfb, analysisB.ttfb, (v) => `${parseFloat(v.toFixed(2))}ms`);
                    return (
                      <tr className="hover:bg-surface-elevated/40 transition-colors">
                        <td className="p-4 font-semibold text-text-primary">Time to First Byte (TTFB)</td>
                        <td className="p-4 text-right">{analysisA.ttfb}ms</td>
                        <td className="p-4 text-right font-semibold">{analysisB.ttfb}ms</td>
                        <td className={`p-4 text-right font-semibold ${delta.textClass}`}>
                          {delta.diffFormatted}
                        </td>
                        <td className="p-4 text-right">
                          <span className={`px-2 py-0.5 rounded text-[11px] border ${delta.badgeClass}`}>
                            {delta.pctFormatted}
                          </span>
                        </td>
                      </tr>
                    );
                  })()}

                  {/* Requests */}
                  {(() => {
                    const delta = computeDelta(analysisA.requests, analysisB.requests, (v) => v);
                    return (
                      <tr className="hover:bg-surface-elevated/40 transition-colors">
                        <td className="p-4 font-semibold text-text-primary">Total HTTP Requests</td>
                        <td className="p-4 text-right">{analysisA.requests}</td>
                        <td className="p-4 text-right font-semibold">{analysisB.requests}</td>
                        <td className={`p-4 text-right font-semibold ${delta.textClass}`}>
                          {delta.diffFormatted}
                        </td>
                        <td className="p-4 text-right">
                          <span className={`px-2 py-0.5 rounded text-[11px] border ${delta.badgeClass}`}>
                            {delta.pctFormatted}
                          </span>
                        </td>
                      </tr>
                    );
                  })()}

                  {/* Transfer Size */}
                  {(() => {
                    const delta = computeDelta(analysisA.transferSize, analysisB.transferSize, (v) =>
                      formatBytes(Math.abs(v))
                    );
                    return (
                      <tr className="hover:bg-surface-elevated/40 transition-colors">
                        <td className="p-4 font-semibold text-text-primary">Transferred Payload</td>
                        <td className="p-4 text-right">{formatBytes(analysisA.transferSize)}</td>
                        <td className="p-4 text-right font-semibold">{formatBytes(analysisB.transferSize)}</td>
                        <td className={`p-4 text-right font-semibold ${delta.textClass}`}>
                          {analysisB.transferSize > analysisA.transferSize ? '+' : '-'}
                          {formatBytes(Math.abs(analysisB.transferSize - analysisA.transferSize))}
                        </td>
                        <td className="p-4 text-right">
                          <span className={`px-2 py-0.5 rounded text-[11px] border ${delta.badgeClass}`}>
                            {delta.pctFormatted}
                          </span>
                        </td>
                      </tr>
                    );
                  })()}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Visual Bar Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-5 space-y-4">
              <span className="text-xs font-mono uppercase text-text-muted block">
                Target A: {analysisA.url}
              </span>
              <div className="space-y-3 font-mono text-xs">
                <div>
                  <div className="flex justify-between text-text-secondary mb-1">
                    <span>LCP: {analysisA.lcp}s</span>
                    <span>Score: {analysisA.score}/100</span>
                  </div>
                  <div className="h-2 bg-surface-elevated rounded-full overflow-hidden">
                    <div
                      className="h-full bg-status-info"
                      style={{ width: `${Math.min((analysisA.lcp / 4) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="pt-2 text-[11px] text-text-muted flex justify-between border-t border-border/50">
                  <span>TTFB: {analysisA.ttfb}ms</span>
                  <span>Requests: {analysisA.requests}</span>
                  <span>Weight: {formatBytes(analysisA.transferSize)}</span>
                </div>
              </div>
            </Card>

            <Card className="p-5 space-y-4">
              <span className="text-xs font-mono uppercase text-text-muted block">
                Target B: {analysisB.url}
              </span>
              <div className="space-y-3 font-mono text-xs">
                <div>
                  <div className="flex justify-between text-text-secondary mb-1">
                    <span>LCP: {analysisB.lcp}s</span>
                    <span>Score: {analysisB.score}/100</span>
                  </div>
                  <div className="h-2 bg-surface-elevated rounded-full overflow-hidden">
                    <div
                      className="h-full bg-status-warning"
                      style={{ width: `${Math.min((analysisB.lcp / 4) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="pt-2 text-[11px] text-text-muted flex justify-between border-t border-border/50">
                  <span>TTFB: {analysisB.ttfb}ms</span>
                  <span>Requests: {analysisB.requests}</span>
                  <span>Weight: {formatBytes(analysisB.transferSize)}</span>
                </div>
              </div>
            </Card>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default ComparePage;
