import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowUpRight,
  Check,
  Clock,
  Database,
  GitCompare,
  Monitor,
  Play,
  RotateCcw,
  Search,
  Smartphone,
  Trash2,
  X,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card, { CardContent, CardFooter } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { SkeletonCard } from '../../components/ui/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import useHistory from '../../hooks/useHistory';
import { formatBytes, formatDuration } from '../../lib/utils';

function formatHost(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname + (parsed.pathname && parsed.pathname !== '/' ? parsed.pathname : '');
  } catch {
    return String(url || '').replace(/^https?:\/\//, '') || 'Unknown host';
  }
}

function safeDuration(ms) {
  return typeof ms === 'number' && Number.isFinite(ms) && ms >= 0 ? formatDuration(ms) : '—';
}

function safeBytes(bytes) {
  return typeof bytes === 'number' && Number.isFinite(bytes) && bytes >= 0 ? formatBytes(bytes) : '—';
}

function getLcpColorClass(lcpMs) {
  if (typeof lcpMs !== 'number' || !Number.isFinite(lcpMs)) return 'text-text-muted';
  if (lcpMs <= 2500) return 'text-status-success';
  if (lcpMs <= 4000) return 'text-status-warning';
  return 'text-status-error';
}

export function HistoryPage() {
  const navigate = useNavigate();
  const {
    analyses,
    isLoading,
    storageBackend,
    removeRun,
    clearHistory,
    loadSampleRuns,
  } = useHistory();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  const filteredAnalyses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return analyses;
    return analyses.filter(
      (run) =>
        String(run.url || '').toLowerCase().includes(q) ||
        String(run.label || '').toLowerCase().includes(q) ||
        String(run.strategy || '').toLowerCase().includes(q)
    );
  }, [analyses, searchQuery]);

  const validSelectedIds = useMemo(
    () => selectedIds.filter((id) => analyses.some((run) => run.id === id)),
    [selectedIds, analyses]
  );

  const toggleSelectForCompare = (id) => {
    setSelectedIds((prev) => {
      const cleaned = prev.filter((item) => analyses.some((run) => run.id === item));
      if (cleaned.includes(id)) {
        return cleaned.filter((item) => item !== id);
      }
      if (cleaned.length >= 2) {
        return [cleaned[1], id];
      }
      return [...cleaned, id];
    });
  };

  const handleCompareSelected = () => {
    if (validSelectedIds.length !== 2) return;
    navigate(
      `/compare?a=${encodeURIComponent(validSelectedIds[0])}&b=${encodeURIComponent(validSelectedIds[1])}`
    );
  };

  return (
    <div className="flex-1 flex flex-col w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-semibold text-text-primary tracking-tight font-sans">
              Recent Analyses
            </h1>
            <Badge variant="default" size="xs">
              {analyses.length} {analyses.length === 1 ? 'Run' : 'Runs'}
            </Badge>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm border border-border bg-surface-elevated text-[10px] font-mono text-text-muted uppercase">
              <Database className="w-3 h-3 text-status-info" />
              {storageBackend === 'indexeddb' ? 'IndexedDB' : 'localStorage'}
            </span>
          </div>
          <p className="text-xs text-text-secondary">
            Saved locally with full network waterfalls. Open any snapshot instantly or pick two runs to compare side by side.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {validSelectedIds.length === 2 && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleCompareSelected}
              leftIcon={<GitCompare className="w-3.5 h-3.5" />}
              className="font-mono text-xs"
            >
              Compare Selected (2)
            </Button>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={loadSampleRuns}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            className="font-mono text-xs"
          >
            Load Sample Runs
          </Button>

          {analyses.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                clearHistory();
                setSelectedIds([]);
              }}
              leftIcon={<Trash2 className="w-3.5 h-3.5 text-status-error" />}
              className="text-text-muted hover:text-status-error font-mono text-xs"
            >
              Clear History
            </Button>
          )}
        </div>
      </div>

      {/* Search & Compare Selection Helper */}
      {analyses.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="w-full sm:w-72">
            <Input
              type="text"
              size="sm"
              placeholder="Filter history by URL or label..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              prefixIcon={<Search className="w-3.5 h-3.5 text-text-muted" />}
              suffixIcon={
                searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear filter"
                    className="text-text-muted hover:text-text-primary"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : null
              }
            />
          </div>

          <span className="text-xs font-mono text-text-muted">
            {validSelectedIds.length === 0
              ? 'Select any 2 cards to compare Before vs After'
              : validSelectedIds.length === 1
                ? '1 selected — pick 1 more run to compare'
                : '2 runs ready to compare'}
          </span>
        </div>
      )}

      {/* Main Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((idx) => (
            <SkeletonCard key={idx} />
          ))}
        </div>
      ) : analyses.length === 0 ? (
        <div className="space-y-4">
          <EmptyState
            title="No saved analyses yet"
            description="Analyze any URL and RenderScope will automatically store its full metrics and network waterfall locally."
            actionLabel="Analyze a website"
            onAction={() => navigate('/analyze')}
            icon={Clock}
          />
          <div className="flex justify-center">
            <Button
              variant="secondary"
              size="sm"
              onClick={loadSampleRuns}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              className="font-mono text-xs"
            >
              Or Load Sample Runs to Preview History & Compare
            </Button>
          </div>
        </div>
      ) : filteredAnalyses.length === 0 ? (
        <EmptyState
          title="No matching analyses"
          description="Try clearing your search filter to see all locally stored runs."
          actionLabel="Reset filter"
          onAction={() => setSearchQuery('')}
          icon={Search}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredAnalyses.map((run, idx) => {
              const selectedSlot = validSelectedIds.indexOf(run.id);
              const isSelected = selectedSlot !== -1;

              return (
                <motion.div
                  key={run.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.2, delay: Math.min(idx * 0.04, 0.2) }}
                >
                  <Card
                    hover
                    className={`flex flex-col justify-between h-full transition-colors ${
                      isSelected ? 'border-border-focus' : 'border-border hover:border-border-focus'
                    }`}
                  >
                    <CardContent className="p-5 space-y-4">
                      {/* Top Row: Host, Date, Strategy & Compare Toggle */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className="text-sm font-mono font-semibold text-text-primary truncate"
                              title={run.url}
                            >
                              {formatHost(run.url)}
                            </span>
                            {run.label && (
                              <span
                                className="px-1.5 py-0.5 rounded-sm border text-[10px] font-mono"
                                style={{
                                  color: 'var(--info)',
                                  borderColor: 'color-mix(in srgb, var(--info) 38%, transparent)',
                                  backgroundColor: 'color-mix(in srgb, var(--info) 12%, transparent)',
                                }}
                              >
                                {run.label}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-[11px] font-mono text-text-muted">
                            <span>{run.analyzedAt}</span>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1 capitalize">
                              {run.strategy === 'mobile' ? (
                                <Smartphone className="w-3 h-3" />
                              ) : (
                                <Monitor className="w-3 h-3" />
                              )}
                              {run.strategy || 'desktop'}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleSelectForCompare(run.id)}
                          aria-pressed={isSelected}
                          title="Select for Compare"
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-sm border text-[10px] font-mono uppercase transition-colors shrink-0 ${
                            isSelected
                              ? 'border-border-focus bg-surface-elevated text-status-info font-semibold'
                              : 'border-border bg-background text-text-muted hover:text-text-primary hover:bg-surface-hover'
                          }`}
                        >
                          {isSelected ? <Check className="w-3 h-3" /> : <GitCompare className="w-3 h-3" />}
                          {isSelected ? (selectedSlot === 0 ? 'Slot A' : 'Slot B') : 'Compare'}
                        </button>
                      </div>

                      {/* Core Metrics Grid */}
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border-subtle font-mono text-xs">
                        <div className="p-2 rounded bg-background border border-border-subtle">
                          <span className="text-[10px] text-text-muted block">LCP</span>
                          <span className={`font-semibold font-mono-numbers ${getLcpColorClass(run.lcp)}`}>
                            {safeDuration(run.lcp)}
                          </span>
                        </div>
                        <div className="p-2 rounded bg-background border border-border-subtle">
                          <span className="text-[10px] text-text-muted block">FCP</span>
                          <span className="font-semibold font-mono-numbers text-text-primary">
                            {safeDuration(run.fcp)}
                          </span>
                        </div>
                        <div className="p-2 rounded bg-background border border-border-subtle">
                          <span className="text-[10px] text-text-muted block">TTFB</span>
                          <span className="font-semibold font-mono-numbers text-text-primary">
                            {safeDuration(run.ttfb)}
                          </span>
                        </div>
                        <div className="p-2 rounded bg-background border border-border-subtle">
                          <span className="text-[10px] text-text-muted block">JS</span>
                          <span className="text-text-secondary font-mono-numbers">
                            {safeBytes(run.jsSize)}
                          </span>
                        </div>
                        <div className="p-2 rounded bg-background border border-border-subtle">
                          <span className="text-[10px] text-text-muted block">REQS</span>
                          <span className="text-text-secondary font-mono-numbers">
                            {run.requests ?? '—'}
                          </span>
                        </div>
                        <div className="p-2 rounded bg-background border border-border-subtle">
                          <span className="text-[10px] text-text-muted block">TRANSFER</span>
                          <span className="text-text-secondary font-mono-numbers">
                            {safeBytes(run.transferSize)}
                          </span>
                        </div>
                      </div>
                    </CardContent>

                    {/* Footer Actions */}
                    <CardFooter className="px-5 py-3 flex items-center justify-between gap-2 border-t border-border-subtle">
                      <button
                        type="button"
                        onClick={() => removeRun(run.id)}
                        className="text-text-muted hover:text-status-error text-[11px] font-mono transition-colors"
                      >
                        Delete
                      </button>

                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/analyze?url=${encodeURIComponent(run.url)}`)}
                          leftIcon={<Play className="w-3 h-3" />}
                          title="Run a fresh live PageSpeed check"
                          className="font-mono text-xs border border-border"
                        >
                          Re-run
                        </Button>
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={() => navigate(`/analyze?run=${encodeURIComponent(run.id)}`)}
                          rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
                          title="Open saved snapshot instantly"
                          className="font-mono text-xs"
                        >
                          Open
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

export default HistoryPage;
