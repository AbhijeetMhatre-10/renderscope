import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  Clock,
  ExternalLink,
  Trash2,
  RotateCcw,
  ArrowUpRight,
  Gauge,
  Layers,
  HardDrive,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Card, { CardContent, CardFooter } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/common/EmptyState';
import { clearHistory, removeAnalysis, resetMockHistory } from '../../store/appStore';
import { formatBytes } from '../../lib/utils';

export function HistoryPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const recentAnalyses = useSelector((state) => state.app.recentAnalyses);

  const handleOpen = (url) => {
    navigate(`/analyze?url=${encodeURIComponent(url)}`);
  };

  return (
    <div className="flex-1 flex flex-col w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-text-primary tracking-tight font-sans">
              Recent Analyses
            </h1>
            <Badge variant="default" size="xs">
              {recentAnalyses.length} Runs
            </Badge>
          </div>
          <p className="text-xs text-text-secondary">
            Cached diagnostic profiles and timeline snapshots across probed hosts.
          </p>
        </div>

        {/* State Controls for testing Empty vs Mock states */}
        <div className="flex items-center gap-2">
          {recentAnalyses.length > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dispatch(clearHistory())}
              leftIcon={<Trash2 className="w-3.5 h-3.5 text-status-error" />}
              className="text-text-muted hover:text-status-error"
            >
              Clear History
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => dispatch(resetMockHistory())}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Load Sample History
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      {recentAnalyses.length === 0 ? (
        /* Empty State */
        <EmptyState
          title="Recent analyses — No analyses yet."
          description="Analyze a website and your recent results will appear here."
          actionLabel="Analyze a website"
          onAction={() => navigate('/analyze')}
          icon={Clock}
        />
      ) : (
        /* Mock State Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentAnalyses.map((run, idx) => (
            <motion.div
              key={run.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.05 }}
            >
              <Card hover className="flex flex-col justify-between h-full group border-border hover:border-border-focus/70">
                <CardContent className="p-5 space-y-4">
                  {/* Top Bar: Host & Score */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-text-primary truncate">
                        <span className="truncate">{run.url}</span>
                      </div>
                      <span className="text-[11px] font-mono text-text-muted block">
                        Analyzed {run.analyzedAt}
                      </span>
                    </div>

                    <Badge
                      variant={run.score >= 90 ? 'fast' : run.score >= 70 ? 'warning' : 'slow'}
                      size="xs"
                      className="shrink-0"
                    >
                      Score {run.score}
                    </Badge>
                  </div>

                  {/* Core Metrics Pill Grid */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50 font-mono text-xs">
                    <div className="p-2 rounded bg-surface-elevated/50 border border-border/40">
                      <span className="text-[10px] text-text-muted block">LCP</span>
                      <span className="font-semibold text-status-success">
                        {run.lcp}s
                      </span>
                    </div>
                    <div className="p-2 rounded bg-surface-elevated/50 border border-border/40">
                      <span className="text-[10px] text-text-muted block">TTFB</span>
                      <span className="font-semibold text-text-primary">
                        {run.ttfb}ms
                      </span>
                    </div>
                    <div className="p-2 rounded bg-surface-elevated/50 border border-border/40">
                      <span className="text-[10px] text-text-muted block">REQUESTS</span>
                      <span className="text-text-secondary">
                        {run.requests}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-surface-elevated/50 border border-border/40">
                      <span className="text-[10px] text-text-muted block">TRANSFER</span>
                      <span className="text-text-secondary">
                        {formatBytes(run.transferSize)}
                      </span>
                    </div>
                  </div>
                </CardContent>

                {/* Footer Actions */}
                <CardFooter className="px-5 py-3 flex items-center justify-between border-t border-border/50">
                  <button
                    onClick={() => dispatch(removeAnalysis(run.id))}
                    className="text-text-muted hover:text-status-error text-[11px] font-mono transition-colors"
                  >
                    Delete
                  </button>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleOpen(run.url)}
                    rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
                  >
                    Open
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export default HistoryPage;
