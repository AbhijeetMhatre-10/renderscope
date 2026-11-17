import React, { Suspense, lazy, useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  Globe,
  Play,
  Search,
  HelpCircle,
  Clock,
  Sparkles,
  ChevronRight,
  Copy,
  Check,
} from 'lucide-react';

import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import Tooltip from '../../components/ui/Tooltip';
import Tabs, { TabList, TabTrigger, TabContent } from '../../components/ui/Tabs';
import Modal from '../../components/ui/Modal';
import Drawer from '../../components/ui/Drawer';
import { SkeletonCard, SkeletonRow } from '../../components/ui/Skeleton';

const Waterfall = lazy(() => import('../../components/waterfall/Waterfall'));
const PerformanceDetective = lazy(() => import('../../components/detective/PerformanceDetective'));
const AIAnalysis = lazy(() => import('../../components/ai/AIAnalysis'));
const AIInlineInsight = lazy(() => import('../../components/ai/AIInlineInsight'));

import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import SuccessState from '../../components/common/SuccessState';

import {
  setActiveAnalyzeTab,
  openDrawer,
  closeDrawer,
  openModal,
  closeModal,
} from '../../store/uiStore';
import { DEFAULT_THRESHOLDS, runFindingEngine } from '../../analysis';
import { formatBytes, formatDuration } from '../../lib/utils';
import useAnalysis from '../../hooks/useAnalysis';
import usePerformanceMetrics from '../../hooks/usePerformanceMetrics';
import useAIAnalysis from '../../hooks/useAIAnalysis';
import { formatUnavailable } from '../../utils/performanceUtils';
import { validateUrl } from '../../services/analysisService';
import { getAnalysisById } from '../../services/historyService';

export function AnalyzePage() {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlParam = searchParams.get('url') || '';
  const runParam = searchParams.get('run') || '';

  const [inputUrl, setInputUrl] = useState(urlParam);
  const [resourceFilter, setResourceFilter] = useState('all');
  const [resourceSearch, setResourceSearch] = useState('');
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [inputError, setInputError] = useState('');
  const [detectiveThresholds, setDetectiveThresholds] = useState(DEFAULT_THRESHOLDS);
  const [selectedStrategy, setSelectedStrategy] = useState(() => {
    if (typeof window === 'undefined') return 'desktop';
    try {
      const saved = window.localStorage.getItem('pagespeed-strategy');
      return saved === 'mobile' ? 'mobile' : 'desktop';
    } catch {
      return 'desktop';
    }
  });
  const selectedStrategyRef = useRef(selectedStrategy);

  const {
    status,
    stepIndex,
    analyzingUrl,
    result,
    snapshotInfo,
    error: analysisError,
    isLoading,
    startAnalysis,
    loadSnapshot,
  } = useAnalysis(dispatch);

  // Redux UI State
  const activeTab = useSelector((state) => state.ui.activeAnalyzeTab);
  const isDrawerOpen = useSelector((state) => state.ui.isDrawerOpen);
  const isModalOpen = useSelector((state) => state.ui.isModalOpen);
  const activeResourceDetails = useSelector((state) => state.ui.activeResourceDetails);
  const activeFindingDetails = useSelector((state) => state.ui.activeFindingDetails);

  useEffect(() => {
    selectedStrategyRef.current = selectedStrategy;
  }, [selectedStrategy]);

  // Load saved snapshot instantly (?run=<id>) or run live analysis (?url=<url>)
  useEffect(() => {
    let cancelled = false;
    if (runParam) {
      getAnalysisById(runParam).then((saved) => {
        if (cancelled) return;
        if (saved) {
          setInputUrl(saved.url);
          if (saved.strategy === 'mobile' || saved.strategy === 'desktop') {
            setSelectedStrategy(saved.strategy);
          }
        }
        loadSnapshot(saved);
      });
      return () => {
        cancelled = true;
      };
    }

    if (urlParam) {
      startAnalysis(urlParam, selectedStrategyRef.current);
    }

    return () => {
      cancelled = true;
    };
  }, [runParam, urlParam, startAnalysis, loadSnapshot]);

  const handleRerunLive = () => {
    if (!analyzingUrl) return;
    setInputError('');
    if (urlParam === analyzingUrl && !runParam) {
      startAnalysis(analyzingUrl, selectedStrategy);
    } else {
      setSearchParams({ url: analyzingUrl });
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const validation = validateUrl(
      inputUrl.trim().match(/^https?:\/\//) ? inputUrl.trim() : `https://${inputUrl.trim()}`
    );
    if (!validation.valid) {
      setInputError(validation.message);
      return;
    }

    setInputError('');
    if (urlParam === validation.url && !runParam) {
      startAnalysis(validation.url, selectedStrategy);
    } else {
      setSearchParams({ url: validation.url });
    }
  };

  const handleStrategyChange = (event) => {
    const nextStrategy = event.target.value === 'mobile' ? 'mobile' : 'desktop';
    setSelectedStrategy(nextStrategy);
    try {
      window.localStorage.setItem('pagespeed-strategy', nextStrategy);
    } catch {
      // Preference persistence is optional when storage is unavailable.
    }
  };

  const resources = useMemo(() => result?.resources || [], [result]);
  const filteredResources = resources.filter((res) => {
    const matchesType = resourceFilter === 'all' || res.type === resourceFilter;
    const matchesSearch =
      res.name.toLowerCase().includes(resourceSearch.toLowerCase()) ||
      res.url.toLowerCase().includes(resourceSearch.toLowerCase());
    return matchesType && matchesSearch;
  });

  const { findings: detectiveFindings, summary: detectiveSummary } = useMemo(
    () => runFindingEngine(resources, detectiveThresholds),
    [resources, detectiveThresholds]
  );

  const performanceMetrics = usePerformanceMetrics(result?.metrics);

  const ai = useAIAnalysis({
    url: analyzingUrl,
    strategy: result?.strategy || selectedStrategy,
    metrics: performanceMetrics,
    resources,
    findings: detectiveFindings,
  });

  const formatMetricDuration = formatDuration;

  const metricCards = performanceMetrics ? [
    ['TTFB', formatUnavailable(performanceMetrics.ttfb, formatMetricDuration), 'Server response time'],
    ['FCP', formatUnavailable(performanceMetrics.fcp, formatMetricDuration), 'First visible content'],
    ['LCP', formatUnavailable(performanceMetrics.lcp, formatMetricDuration), 'Main content paint'],
    ['DOM Loaded', formatUnavailable(performanceMetrics.domContentLoaded, formatMetricDuration), 'HTML parsed & ready'],
    ['Window Load', formatUnavailable(performanceMetrics.load, formatMetricDuration), 'All resources finished'],
    ['Requests', formatUnavailable(performanceMetrics.totalRequests), 'Total network requests'],
    ['Transfer Size', formatUnavailable(performanceMetrics.transferredBytes, formatBytes), 'Compressed bytes transferred'],
    ['JS Weight', formatUnavailable(performanceMetrics.jsSize, formatBytes), 'JavaScript payload size'],
  ] : [];

  const assetDistribution = useMemo(() => {
    const groups = [
      { key: 'js', label: 'JS', colorClass: 'bg-resource-js', bytes: 0 },
      { key: 'image', label: 'Images', colorClass: 'bg-resource-image', bytes: 0 },
      { key: 'css', label: 'CSS', colorClass: 'bg-resource-css', bytes: 0 },
      { key: 'font', label: 'Fonts', colorClass: 'bg-resource-font', bytes: 0 },
      { key: 'html', label: 'HTML', colorClass: 'bg-resource-html', bytes: 0 },
      { key: 'other', label: 'Other', colorClass: 'bg-resource-other', bytes: 0 },
    ];
    const byKey = Object.fromEntries(groups.map((g) => [g.key, g]));
    let totalTransferred = 0;
    let totalDecoded = 0;

    for (const res of resources) {
      const transferred = typeof res.transferred === 'number' && res.transferred > 0 ? res.transferred : 0;
      const decoded = typeof res.decodedSize === 'number' && res.decodedSize > 0 ? res.decodedSize : 0;
      totalTransferred += transferred;
      totalDecoded += decoded;
      const bucket = byKey[res.type] || byKey.other;
      bucket.bytes += transferred || decoded;
    }

    const totalBucketBytes = groups.reduce((sum, g) => sum + g.bytes, 0);
    return {
      totalTransferred,
      totalDecoded,
      items: groups
        .filter((g) => g.bytes > 0)
        .map((g) => ({
          ...g,
          pct: totalBucketBytes > 0 ? (g.bytes / totalBucketBytes) * 100 : 0,
        })),
    };
  }, [resources]);

  const handleCopy = (text) => {
    navigator.clipboard?.writeText(text);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const formatResourceValue = (value, formatter = String) => (
    value === null || value === undefined ? 'Unavailable' : formatter(value)
  );

  return (
    <div className="flex-1 flex flex-col w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Persistent URL Bar & Status Pill */}
      <div className="p-3 sm:p-4 rounded-lg border border-border bg-surface shadow-sm">
        <form
          onSubmit={handleFormSubmit}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
        >
          {/* Status Pill */}
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-sm bg-surface-elevated border border-border text-xs font-mono shrink-0 select-none">
            <span
              className={`w-2 h-2 rounded-full ${isLoading
                ? 'bg-status-warning animate-ping'
                : analyzingUrl
                  ? 'bg-status-success'
                  : 'bg-text-muted'
                }`}
            />
            <span className="text-text-secondary text-[11px]">
              {isLoading ? status.toUpperCase() : status === 'error' ? 'ERROR' : analyzingUrl ? 'INSPECTED' : 'IDLE'}
            </span>
          </div>

          <label className="flex h-10 shrink-0 items-center gap-2 rounded-md border border-border bg-surface px-3 text-xs text-text-secondary">
            <span className="font-mono uppercase tracking-wider text-[10px]">Strategy</span>
            <select
              value={selectedStrategy}
              onChange={handleStrategyChange}
              disabled={isLoading}
              aria-label="Analysis strategy"
              className="bg-transparent font-mono text-xs text-text-primary outline-none"
            >
              <option value="desktop">Desktop</option>
              <option value="mobile">Mobile</option>
            </select>
          </label>

          {/* URL Input */}
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="https://domain.com/path"
              value={inputUrl}
              onChange={(e) => {
                setInputUrl(e.target.value);
                setInputError('');
              }}
              error={Boolean(inputError)}
              mono
              size="md"
              prefixIcon={<Globe className="w-4 h-4 text-text-muted" />}
            />
          </div>

          {/* Analyze Trigger */}
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={isLoading}
            className="shrink-0"
            rightIcon={<Play className="w-3.5 h-3.5 fill-current" />}
          >
            Analyze
          </Button>
        </form>
        {(inputError || analysisError) && (
          <p className="mt-2 text-xs text-status-error">{inputError || analysisError}</p>
        )}
      </div>

      {/* Main Workspace Body */}
      {!analyzingUrl && !isLoading ? (
        /* Initial / Empty State */
        <EmptyState
          title="Analyze a website"
          description="Enter a URL above to inspect its loading performance, network waterfall, and runtime bottlenecks."
          actionLabel="Try Sample (linear.app)"
          onAction={() => {
            setInputUrl('https://linear.app');
            setSearchParams({ url: 'https://linear.app' });
            startAnalysis('https://linear.app', selectedStrategy);
          }}
        />
      ) : isLoading ? (
        /* Interactive Loading State with Mini-Game & Render Pipeline */
        <LoadingState url={analyzingUrl} stepIndex={stepIndex} strategy={selectedStrategy} />
      ) : (
        /* Populated Workspace Structure */
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {/* Saved Snapshot Banner */}
          {snapshotInfo && (
            <div
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-lg border text-xs font-mono"
              style={{
                borderColor: 'color-mix(in srgb, var(--info) 38%, transparent)',
                backgroundColor: 'color-mix(in srgb, var(--info) 10%, var(--surface))',
              }}
            >
              <div className="flex items-center gap-2 text-text-secondary">
                <Clock className="w-3.5 h-3.5 text-status-info shrink-0" />
                <span>
                  Viewing saved snapshot
                  {snapshotInfo.label ? ` (${snapshotInfo.label})` : ''} · Captured{' '}
                  <strong className="text-text-primary">{snapshotInfo.analyzedAt}</strong>
                </span>
              </div>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleRerunLive}
                leftIcon={<Play className="w-3 h-3 fill-current" />}
                className="font-mono text-xs"
              >
                Re-run Live
              </Button>
            </div>
          )}

          {/* Success Banner */}
          <SuccessState
            title={snapshotInfo ? 'Saved snapshot loaded' : 'Analysis complete'}
            url={analyzingUrl}
            metrics={{
              lcp: formatUnavailable(performanceMetrics.lcp, formatMetricDuration),
              fcp: formatUnavailable(performanceMetrics.fcp, formatMetricDuration),
              ttfb: formatUnavailable(performanceMetrics.ttfb, formatMetricDuration),
              requests: performanceMetrics.totalRequests ?? resources.length,
            }}
            strategy={result?.strategy}
          />

          {/* Tabs Navigation */}
          <Tabs
            value={activeTab}
            onValueChange={(val) => dispatch(setActiveAnalyzeTab(val))}
          >
            <div className="border-b border-border pb-3">
              <TabList>
                <TabTrigger value="overview">Overview</TabTrigger>
                <TabTrigger value="waterfall" badge={resources.length}>
                  Waterfall
                </TabTrigger>
                <TabTrigger value="resources" badge={resources.length}>
                  Resources
                </TabTrigger>
                <TabTrigger value="detective" badge={detectiveSummary.total}>
                  Detective
                </TabTrigger>
                <TabTrigger
                  value="ai"
                  icon={<Sparkles className="w-3.5 h-3.5 text-status-info" />}
                >
                  AI Insights
                </TabTrigger>
              </TabList>
            </div>

            {/* TAB 1: OVERVIEW */}
            <TabContent value="overview">
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {metricCards.map(([label, value, description]) => (
                    <Card key={label} className="p-4 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-mono text-text-secondary">{label}</span>
                        <Tooltip content={description}>
                          <span className="text-text-muted hover:text-text-primary cursor-help">
                            <HelpCircle className="w-3.5 h-3.5" />
                          </span>
                        </Tooltip>
                      </div>
                      <span className="block text-xl font-mono font-bold text-text-primary truncate">
                        {value}
                      </span>
                      <p className="text-[11px] text-text-muted font-mono truncate">{description}</p>
                    </Card>
                  ))}
                </div>

                {/* Secondary Diagnostics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Real Asset Weight Distribution */}
                  <Card className="md:col-span-2 p-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-mono uppercase tracking-wider text-text-muted">
                        Asset Weight Distribution
                      </span>
                      <span className="text-xs font-mono font-mono-numbers text-text-secondary">
                        Transferred: {formatBytes(assetDistribution.totalTransferred)}
                        {assetDistribution.totalDecoded > 0
                          ? ` (${formatBytes(assetDistribution.totalDecoded)} decoded)`
                          : ''}
                      </span>
                    </div>

                    {assetDistribution.items.length > 0 ? (
                      <>
                        <div className="h-3 w-full rounded-sm overflow-hidden flex bg-surface-elevated">
                          {assetDistribution.items.map((item) => (
                            <div
                              key={item.key}
                              className={`${item.colorClass} h-full`}
                              style={{ width: `${Math.max(1, item.pct)}%` }}
                              title={`${item.label}: ${formatBytes(item.bytes)} (${Math.round(item.pct)}%)`}
                            />
                          ))}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1 text-xs font-mono font-mono-numbers">
                          {assetDistribution.items.map((item) => (
                            <div key={item.key} className="flex items-center gap-1.5 min-w-0">
                              <span className={`w-2.5 h-2.5 rounded-sm shrink-0 ${item.colorClass}`} />
                              <span className="text-text-secondary truncate">
                                {item.label}: {formatBytes(item.bytes)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="text-xs font-mono text-text-muted">
                        No transfer size data reported for these resources.
                      </p>
                    )}
                  </Card>

                  {/* Quick Detective Summary */}
                  <Card className="p-5 space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono uppercase tracking-wider text-text-muted">
                          Detective Insights
                        </span>
                        <Badge
                          variant={detectiveSummary.critical > 0 ? 'critical' : detectiveSummary.total > 0 ? 'warning' : 'fast'}
                          size="xs"
                        >
                          {detectiveSummary.total} {detectiveSummary.total === 1 ? 'Finding' : 'Findings'}
                        </Badge>
                      </div>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        {detectiveSummary.total === 0
                          ? 'No bottlenecks flagged under current heuristic thresholds.'
                          : `${detectiveSummary.critical} critical, ${detectiveSummary.warning} warning, and ${detectiveSummary.info} info findings detected.`}
                      </p>
                    </div>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => dispatch(setActiveAnalyzeTab('detective'))}
                      className="w-full justify-between font-mono text-xs"
                      rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                    >
                      Inspect Detective
                    </Button>
                  </Card>
                </div>
              </div>
            </TabContent>

            {/* TAB 2: WATERFALL (Lazy-Loaded Interactive Waterfall Visualization) */}
            <TabContent value="waterfall">
              <Suspense
                fallback={
                  <div className="rounded-lg border border-border bg-surface overflow-hidden">
                    {[0, 1, 2, 3, 4, 5].map((idx) => (
                      <SkeletonRow key={idx} />
                    ))}
                  </div>
                }
              >
                <Waterfall
                  resources={resources}
                  metrics={performanceMetrics}
                  resourceInsights={ai.resourceInsights}
                  onExplainResource={ai.runResourceExplanation}
                  onOpenDrawer={(res) => dispatch(openDrawer(res))}
                />
              </Suspense>
            </TabContent>

            {/* TAB 3: RESOURCES TABLE */}
            <TabContent value="resources">
              <div className="space-y-4">
                {/* Search & Filter Controls */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                    {['all', 'html', 'css', 'js', 'image', 'font', 'xhr', 'other'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setResourceFilter(type)}
                        className={`px-2.5 py-1 text-xs font-mono uppercase tracking-wider rounded border transition-colors ${resourceFilter === type
                          ? 'bg-surface-elevated text-text-primary border-border-focus'
                          : 'bg-surface text-text-secondary border-border hover:bg-surface-hover'
                          }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>

                  <div className="w-full sm:w-64">
                    <Input
                      type="text"
                      placeholder="Filter resources..."
                      value={resourceSearch}
                      onChange={(e) => setResourceSearch(e.target.value)}
                      size="sm"
                      prefixIcon={<Search className="w-3.5 h-3.5 text-text-muted" />}
                    />
                  </div>
                </div>

                {/* Resources Table */}
                <div className="border border-border rounded-lg bg-surface overflow-x-auto shadow-sm">
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="border-b border-border bg-surface-elevated/50 text-[11px] text-text-muted uppercase">
                        <th className="p-3">Type</th>
                        <th className="p-3">Resource Name</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Size</th>
                        <th className="p-3 text-right">Transferred</th>
                        <th className="p-3 text-right">Duration</th>
                        <th className="p-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {filteredResources.map((res) => (
                        <tr
                          key={res.id}
                          onClick={() => dispatch(openDrawer(res))}
                          className="hover:bg-surface-elevated/70 cursor-pointer transition-colors"
                        >
                          <td className="p-3">
                            <Badge variant={res.type} size="xs">
                              {res.type}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <div className="max-w-xs truncate text-text-primary font-medium hover:text-status-info">
                              {res.name}
                            </div>
                            <div className="text-[10px] text-text-muted truncate max-w-xs">
                              {res.url}
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="text-status-success font-medium">
                              {res.status}
                            </span>
                          </td>
                          <td className="p-3 text-right text-text-secondary">
                            {formatResourceValue(res.decodedSize, formatBytes)}
                          </td>
                          <td className="p-3 text-right text-text-primary">
                            {formatResourceValue(res.transferred, formatBytes)}
                          </td>
                          <td className="p-3 text-right font-medium text-text-primary">
                            {formatResourceValue(res.duration, formatDuration)}
                          </td>
                          <td className="p-3 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                dispatch(openDrawer(res));
                              }}
                              className="h-6 px-2 text-[10px]"
                            >
                              Inspect
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabContent>

            {/* TAB 4: DETECTIVE FINDINGS (Lazy-Loaded Performance Detective) */}
            <TabContent value="detective">
              <Suspense
                fallback={
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[0, 1, 2, 3].map((idx) => (
                      <SkeletonCard key={idx} />
                    ))}
                  </div>
                }
              >
                <PerformanceDetective
                  findings={detectiveFindings}
                  summary={detectiveSummary}
                  thresholds={detectiveThresholds}
                  findingInsights={ai.findingInsights}
                  onExplainFinding={ai.runFindingExplanation}
                  onThresholdsChange={setDetectiveThresholds}
                  onResetThresholds={() => setDetectiveThresholds(DEFAULT_THRESHOLDS)}
                  onViewResource={(res) => dispatch(openDrawer(res))}
                  onViewResourcesTab={() => dispatch(setActiveAnalyzeTab('resources'))}
                  onInspectFix={(finding) => dispatch(openModal(finding))}
                />
              </Suspense>
            </TabContent>

            {/* TAB 5: AI INSIGHTS (Lazy-Loaded Overall AI Analysis) */}
            <TabContent value="ai">
              <Suspense
                fallback={
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[0, 1].map((idx) => (
                      <SkeletonCard key={idx} />
                    ))}
                  </div>
                }
              >
                <AIAnalysis
                  url={analyzingUrl}
                  resourceCount={resources.length}
                  findingCount={detectiveSummary.total}
                  state={ai.overall}
                  onAnalyze={ai.runOverall}
                />
              </Suspense>
            </TabContent>
          </Tabs>
        </motion.div>
      )}

      {/* DRAWER: Resource Details Inspection */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => dispatch(closeDrawer())}
        title={activeResourceDetails?.name || 'Resource Details'}
        subtitle={activeResourceDetails?.url}
        badge={
          activeResourceDetails && (
            <Badge variant={activeResourceDetails.type} size="xs">
              {activeResourceDetails.type}
            </Badge>
          )
        }
        footer={
          <>
            <span className="text-xs font-mono text-text-muted">
              Initiator: {activeResourceDetails?.initiator || 'parser'}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => dispatch(closeDrawer())}
            >
              Done
            </Button>
          </>
        }
      >
        {activeResourceDetails && (
          <div className="space-y-6 font-mono text-xs">
            {/* Inline AI Resource Explanation Trigger */}
            <div className="space-y-3 font-sans">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                loading={ai.resourceInsights[activeResourceDetails.id]?.status === 'loading'}
                onClick={() =>
                  ai.runResourceExplanation(activeResourceDetails, {
                    forceRefresh: Boolean(ai.resourceInsights[activeResourceDetails.id]?.data),
                  })
                }
                leftIcon={<Sparkles className="w-3.5 h-3.5 text-status-info" />}
                className="w-full justify-center font-mono text-xs"
              >
                {ai.resourceInsights[activeResourceDetails.id]?.data
                  ? 'Explain this resource (Refresh)'
                  : 'Explain this resource'}
              </Button>
              {ai.resourceInsights[activeResourceDetails.id] && (
                <Suspense fallback={null}>
                  <AIInlineInsight
                    mode="resource"
                    state={ai.resourceInsights[activeResourceDetails.id]}
                  />
                </Suspense>
              )}
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-3 rounded bg-surface-elevated border border-border">
                <span className="text-[10px] text-text-muted block">STATUS</span>
                <span className="text-sm font-bold text-status-success">
                  {formatResourceValue(activeResourceDetails.status, (value) => `${value} OK`)}
                </span>
              </div>
              <div className="p-3 rounded bg-surface-elevated border border-border">
                <span className="text-[10px] text-text-muted block">DURATION</span>
                <span className="text-sm font-bold text-text-primary">
                  {formatResourceValue(activeResourceDetails.duration, formatDuration)}
                </span>
              </div>
              <div className="p-3 rounded bg-surface-elevated border border-border">
                <span className="text-[10px] text-text-muted block">TRANSFERRED</span>
                <span className="text-sm font-bold text-text-primary">
                  {formatResourceValue(activeResourceDetails.transferred, formatBytes)}
                </span>
              </div>
              <div className="p-3 rounded bg-surface-elevated border border-border">
                <span className="text-[10px] text-text-muted block">PRIORITY</span>
                <span className="text-sm font-bold text-status-info">
                  {formatResourceValue(activeResourceDetails.priority)}
                </span>
              </div>
            </div>

            {/* Timing Breakdown */}
            <div className="space-y-2 border border-border rounded-md p-4 bg-surface-elevated/40">
              <span className="text-xs font-semibold text-text-primary block font-sans">
                Network Timing Breakdown
              </span>
              <div className="space-y-2 pt-1">
                <div className="flex justify-between text-text-secondary">
                  <span>DNS Lookup:</span>
                  <span className="text-text-primary">
                    {formatResourceValue(activeResourceDetails.dns, formatDuration)}
                  </span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>SSL Handshake:</span>
                  <span className="text-text-primary">
                    {formatResourceValue(activeResourceDetails.ssl, formatDuration)}
                  </span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>Time to First Byte (TTFB):</span>
                  <span className="text-status-warning font-semibold">
                    {formatResourceValue(activeResourceDetails.ttfb, formatDuration)}
                  </span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>Content Download:</span>
                  <span className="text-status-success font-semibold">
                    {formatResourceValue(activeResourceDetails.download, formatDuration)}
                  </span>
                </div>
              </div>
            </div>

            {/* Cache & Compression */}
            <div className="space-y-2 border border-border rounded-md p-4 bg-surface-elevated/40">
              <span className="text-xs font-semibold text-text-primary block font-sans">
                Cache & Edge Optimization
              </span>
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Cache Status:</span>
                  <Badge variant="outline" size="xs">
                    {formatResourceValue(activeResourceDetails.cache)}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Compression:</span>
                  <span className="text-text-primary">
                    {activeResourceDetails.headers?.['content-encoding'] || 'none'}
                  </span>
                </div>
              </div>
            </div>

            {/* HTTP Headers */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-text-primary block font-sans">
                Response Headers
              </span>
              <div className="p-3 bg-background rounded border border-border overflow-x-auto space-y-1">
                {Object.entries(activeResourceDetails.headers || {}).map(([key, val]) => (
                  <div key={key} className="text-[11px] flex gap-2">
                    <span className="text-status-info shrink-0">{key}:</span>
                    <span className="text-text-secondary break-all">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* MODAL: Finding Details & Remediation */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => dispatch(closeModal())}
        title={
          <div className="flex items-center gap-2">
            <Badge
              variant={
                activeFindingDetails?.severity === 'critical'
                  ? 'critical'
                  : activeFindingDetails?.severity === 'info'
                    ? 'info'
                    : 'warning'
              }
              size="xs"
            >
              {activeFindingDetails?.severity}
            </Badge>
            <span>{activeFindingDetails?.title}</span>
          </div>
        }
        subtitle={activeFindingDetails?.category}
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dispatch(closeModal())}
            >
              Dismiss
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleCopy(activeFindingDetails?.codeSnippet || '')}
              leftIcon={copiedSnippet ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            >
              {copiedSnippet ? 'Copied Snippet' : 'Copy Recommendation'}
            </Button>
          </>
        }
      >
        {activeFindingDetails && (
          <div className="space-y-5">
            {/* Impact Alert */}
            <div
              className="p-3 rounded-md border text-xs font-mono flex items-center justify-between gap-2"
              style={{
                color:
                  activeFindingDetails.severity === 'critical'
                    ? 'var(--error)'
                    : activeFindingDetails.severity === 'info'
                      ? 'var(--info)'
                      : 'var(--warning)',
                borderColor: `color-mix(in srgb, ${
                  activeFindingDetails.severity === 'critical'
                    ? 'var(--error)'
                    : activeFindingDetails.severity === 'info'
                      ? 'var(--info)'
                      : 'var(--warning)'
                } 38%, transparent)`,
                backgroundColor: `color-mix(in srgb, ${
                  activeFindingDetails.severity === 'critical'
                    ? 'var(--error)'
                    : activeFindingDetails.severity === 'info'
                      ? 'var(--info)'
                      : 'var(--warning)'
                } 12%, transparent)`,
              }}
            >
              <span>HEURISTIC TRIGGER:</span>
              <span className="font-bold text-right">{activeFindingDetails.metricImpact}</span>
            </div>

            {/* Inline AI Explanation ("Why is this a problem?") */}
            <div className="space-y-3">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                loading={ai.findingInsights[activeFindingDetails.id]?.status === 'loading'}
                onClick={() => ai.runFindingExplanation(activeFindingDetails)}
                leftIcon={<Sparkles className="w-3.5 h-3.5 text-status-info" />}
                className="font-mono text-xs"
              >
                Why is this a problem?
              </Button>
              {ai.findingInsights[activeFindingDetails.id] && (
                <Suspense fallback={null}>
                  <AIInlineInsight
                    mode="finding"
                    state={ai.findingInsights[activeFindingDetails.id]}
                  />
                </Suspense>
              )}
            </div>

            {/* Finding Summary */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold font-mono uppercase text-text-muted">
                Bottleneck Description
              </h4>
              <p className="text-sm text-text-primary leading-relaxed">
                {activeFindingDetails.summary}
              </p>
            </div>

            {/* Recommendation */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold font-mono uppercase text-text-muted">
                Remediation Strategy
              </h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                {activeFindingDetails.recommendation}
              </p>
            </div>

            {/* Code Snippet */}
            {activeFindingDetails.codeSnippet && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono text-text-muted">
                  <span>RECOMMENDED IMPLEMENTATION</span>
                  <button
                    onClick={() => handleCopy(activeFindingDetails.codeSnippet)}
                    className="hover:text-text-primary flex items-center gap-1 text-[11px]"
                  >
                    {copiedSnippet ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <pre className="p-4 bg-background border border-border rounded-md font-mono text-xs text-text-primary overflow-x-auto leading-relaxed">
                  <code>{activeFindingDetails.codeSnippet}</code>
                </pre>
              </div>
            )}

            {/* Affected Resources */}
            {activeFindingDetails.affectedResources && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-semibold font-mono uppercase text-text-muted">
                  Affected Resources
                </h4>
                <div className="flex flex-wrap gap-2">
                  {activeFindingDetails.affectedResources.map((item, idx) => (
                    <Badge key={idx} variant="outline" size="xs">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default AnalyzePage;
