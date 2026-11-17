import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  Globe,
  Play,
  Filter,
  Search,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Clock,
  HardDrive,
  Layers,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  Sliders,
  Copy,
  Check,
} from 'lucide-react';

import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Tooltip from '../../components/ui/Tooltip';
import Tabs, { TabList, TabTrigger, TabContent } from '../../components/ui/Tabs';
import Modal from '../../components/ui/Modal';
import Drawer from '../../components/ui/Drawer';

import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import SuccessState from '../../components/common/SuccessState';
import PartialState from '../../components/common/PartialState';

import {
  setActiveAnalyzeTab,
  openDrawer,
  closeDrawer,
  openModal,
  closeModal,
} from '../../store/uiStore';
import { mockFindings } from '../../store/mockData';
import { formatBytes, formatDuration } from '../../lib/utils';
import useAnalysis from '../../hooks/useAnalysis';
import usePerformanceMetrics from '../../hooks/usePerformanceMetrics';
import { formatUnavailable } from '../../utils/performanceUtils';
import { validateUrl } from '../../services/analysisService';

export function AnalyzePage() {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlParam = searchParams.get('url') || '';

  const [inputUrl, setInputUrl] = useState(urlParam);
  const [resourceFilter, setResourceFilter] = useState('all');
  const [resourceSearch, setResourceSearch] = useState('');
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [inputError, setInputError] = useState('');
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
    error: analysisError,
    isLoading,
    startAnalysis,
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

  // Initial trigger from URL param
  useEffect(() => {
    if (urlParam) {
      startAnalysis(urlParam, selectedStrategyRef.current);
    }
  }, [urlParam, startAnalysis]);

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
    setSearchParams({ url: validation.url });
    startAnalysis(validation.url, selectedStrategy);
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

  const resources = result?.resources || [];
  const filteredResources = resources.filter((res) => {
    const matchesType = resourceFilter === 'all' || res.type === resourceFilter;
    const matchesSearch =
      res.name.toLowerCase().includes(resourceSearch.toLowerCase()) ||
      res.url.toLowerCase().includes(resourceSearch.toLowerCase());
    return matchesType && matchesSearch;
  });

  const performanceMetrics = usePerformanceMetrics(result?.metrics);

  const formatMetricDuration = formatDuration;

  const metricCards = performanceMetrics ? [
    ['TTFB', formatUnavailable(performanceMetrics.ttfb, formatMetricDuration), 'Time to First Byte'],
    ['FCP', formatUnavailable(performanceMetrics.fcp, formatMetricDuration), 'First Contentful Paint'],
    ['LCP', formatUnavailable(performanceMetrics.lcp, formatMetricDuration), 'Largest Contentful Paint'],
    ['DOMContentLoaded', formatUnavailable(performanceMetrics.domContentLoaded, formatMetricDuration), 'DOMContentLoaded'],
    ['Load', formatUnavailable(performanceMetrics.load, formatMetricDuration), 'Window load event'],
    ['Total requests', formatUnavailable(performanceMetrics.totalRequests), 'Network requests'],
    ['Transferred bytes', formatUnavailable(performanceMetrics.transferredBytes, formatBytes), 'Transferred bytes'],
    ['Resource count', formatUnavailable(performanceMetrics.resourceCount), 'Resources collected'],
    ['JS size', formatUnavailable(performanceMetrics.jsSize, formatBytes), 'JavaScript size'],
    ['CSS size', formatUnavailable(performanceMetrics.cssSize, formatBytes), 'CSS size'],
    ['Image size', formatUnavailable(performanceMetrics.imageSize, formatBytes), 'Image size'],
  ] : [];

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
        /* Brief 1.2s Loading State */
        <LoadingState url={analyzingUrl} stepIndex={stepIndex} />
      ) : (
        /* Populated Workspace Structure */
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {/* Success Banner */}
          <SuccessState
            title="Analysis complete"
            url={analyzingUrl}
            metrics={{
              lcp: formatUnavailable(performanceMetrics.lcp, formatMetricDuration),
              ttfb: formatUnavailable(performanceMetrics.ttfb, formatMetricDuration),
              cls: 'Unavailable',
              score: 94,
            }}
            strategy={result?.strategy}
          />

          {/* Tabs Navigation */}
          <Tabs
            value={activeTab}
            onValueChange={(val) => dispatch(setActiveAnalyzeTab(val))}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-3">
              <TabList>
                <TabTrigger value="overview">Overview</TabTrigger>
                <TabTrigger value="waterfall" badge={resources.length}>
                  Waterfall
                </TabTrigger>
                <TabTrigger value="resources" badge={resources.length}>
                  Resources
                </TabTrigger>
                <TabTrigger value="detective" badge={mockFindings.length}>
                  Detective
                </TabTrigger>
              </TabList>

              <div className="flex items-center gap-2 text-xs font-mono text-text-muted">
                <span>View:</span>
                <span className="text-text-primary capitalize">{activeTab}</span>
              </div>
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
                  {/* Transfer Breakdown */}
                  <Card className="md:col-span-2 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono uppercase tracking-wider text-text-muted">
                        Asset Weight Distribution
                      </span>
                      <span className="text-xs font-mono text-text-secondary">
                        Total Transfer: 588 KB (1.02 MB uncompressed)
                      </span>
                    </div>

                    {/* Progress Bar of Content Types */}
                    <div className="h-3 w-full rounded-sm overflow-hidden flex bg-surface-elevated">
                      <div className="bg-resource-js h-full" style={{ width: '45%' }} title="JS 45%" />
                      <div className="bg-resource-image h-full" style={{ width: '38%' }} title="Images 38%" />
                      <div className="bg-resource-css h-full" style={{ width: '10%' }} title="CSS 10%" />
                      <div className="bg-resource-font h-full" style={{ width: '5%' }} title="Fonts 5%" />
                      <div className="bg-resource-html h-full" style={{ width: '2%' }} title="HTML 2%" />
                    </div>

                    {/* Legend */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-sm bg-resource-js" />
                        <span className="text-text-secondary">JS: 428 KB</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-sm bg-resource-image" />
                        <span className="text-text-secondary">Img: 384 KB</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-sm bg-resource-css" />
                        <span className="text-text-secondary">CSS: 58 KB</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-sm bg-resource-font" />
                        <span className="text-text-secondary">Font: 35 KB</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-sm bg-resource-html" />
                        <span className="text-text-secondary">HTML: 25 KB</span>
                      </div>
                    </div>
                  </Card>

                  {/* Quick Detective Summary */}
                  <Card className="p-5 space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono uppercase tracking-wider text-text-muted">
                          Detective Insights
                        </span>
                        <Badge variant="warning" size="xs">
                          {mockFindings.length} Advisories
                        </Badge>
                      </div>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        Found 2 critical bottlenecks directly postponing Largest Contentful Paint.
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

                {/* Partial state demonstration */}
                <PartialState />
              </div>
            </TabContent>

            {/* TAB 2: WATERFALL (Responsive with Horizontal Scroll) */}
            <TabContent value="waterfall">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-text-muted">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-sm bg-status-info" />
                      <span>DNS & Connect</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-sm bg-status-warning" />
                      <span>TTFB Wait</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-sm bg-status-success" />
                      <span>Download</span>
                    </span>
                  </div>
                  <span>Click any row to inspect resource in Drawer</span>
                </div>

                {/* Waterfall Container with explicit horizontal scrolling */}
                <div className="w-full border border-border rounded-lg bg-surface overflow-x-auto shadow-sm">
                  <div className="min-w-[760px] p-4 font-mono select-none">
                    {/* Time Scale Axis */}
                    <div className="relative h-6 border-b border-border/80 flex text-[10px] text-text-muted">
                      <span className="absolute left-0">0ms</span>
                      <span className="absolute left-[20%]">200ms</span>
                      <span className="absolute left-[40%]">400ms</span>
                      <span className="absolute left-[60%]">600ms</span>
                      <span className="absolute left-[80%]">800ms</span>
                      <span className="absolute right-0">1000ms+</span>
                    </div>

                    {/* Waterfall Rows */}
                    <div className="divide-y divide-border/40 pt-2">
                      {resources.map((res) => {
                        // Max scale 1000ms
                        const maxMs = 1000;
                        const startPct = Math.min(((res.startTime || 0) / maxMs) * 100, 90);
                        const widthPct = res.duration === null
                          ? 4
                          : Math.max(Math.min((res.duration / maxMs) * 100, 100 - startPct), 4);
                        const ttfbWidth = res.ttfb !== null && res.duration
                          ? Math.min((res.ttfb / res.duration) * 100, 100)
                          : 0;

                        return (
                          <div
                            key={res.id}
                            onClick={() => dispatch(openDrawer(res))}
                            className="group flex items-center py-2 px-1 hover:bg-surface-elevated/70 cursor-pointer transition-colors rounded"
                          >
                            {/* Resource Info Column */}
                            <div className="w-64 shrink-0 flex items-center gap-2 pr-3">
                              <Badge variant={res.type} size="xs" className="w-14 justify-center">
                                {res.type}
                              </Badge>
                              <span className="text-xs text-text-primary truncate font-medium group-hover:text-status-info">
                                {res.name}
                              </span>
                            </div>

                            {/* Waterfall Bar Graph Column */}
                            <div className="relative flex-1 h-5 bg-surface-elevated/40 rounded overflow-hidden">
                              {/* LCP Marker Line */}
                              <div
                                className="absolute top-0 bottom-0 w-px bg-status-error/40 z-10 pointer-events-none"
                                style={{ left: '72%' }}
                                title="LCP Marker (1.42s)"
                              />

                              {/* Resource Timing Bar */}
                              <div
                                className="absolute h-full rounded-sm flex items-center overflow-hidden"
                                style={{
                                  left: `${startPct}%`,
                                  width: `${widthPct}%`,
                                }}
                              >
                                {/* TTFB segment */}
                                <div
                                  className="h-full bg-status-warning/70"
                                  style={{ width: `${ttfbWidth}%` }}
                                  title={`TTFB: ${formatResourceValue(res.ttfb, formatDuration)}`}
                                />
                                {/* Download segment */}
                                <div
                                  className="h-full bg-status-success/80 flex-1"
                                  title={`Content Download: ${formatResourceValue(res.download, formatDuration)}`}
                                />
                              </div>
                            </div>

                            {/* Duration & Size Column */}
                            <div className="w-32 shrink-0 flex items-center justify-end gap-3 text-[11px] text-text-muted pl-4">
                              <span>{formatResourceValue(res.transferred, formatBytes)}</span>
                              <span className="text-text-primary font-medium w-14 text-right">
                                {formatResourceValue(res.duration, formatDuration)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
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

            {/* TAB 4: DETECTIVE FINDINGS */}
            <TabContent value="detective">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-semibold text-text-primary">
                      Heuristic Performance Findings
                    </h3>
                    <p className="text-xs text-text-secondary">
                      Automated diagnostics pinpointing latency drivers. Click any finding to inspect remediation code.
                    </p>
                  </div>
                  <Badge variant="warning" size="sm">
                    {mockFindings.length} Detected
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mockFindings.map((finding) => (
                    <Card
                      key={finding.id}
                      hover
                      onClick={() => dispatch(openModal(finding))}
                      className="p-5 space-y-3 border-border hover:border-border-focus"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <Badge
                          variant={finding.severity === 'critical' ? 'critical' : 'warning'}
                          size="xs"
                        >
                          {finding.severity}
                        </Badge>
                        <span className="text-xs font-mono font-semibold text-status-error">
                          {finding.impact}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-sm font-semibold text-text-primary group-hover:text-status-info">
                          {finding.title}
                        </h4>
                        <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                          {finding.summary}
                        </p>
                      </div>

                      <div className="pt-2 flex items-center justify-between text-[11px] font-mono border-t border-border/60">
                        <span className="text-text-muted">{finding.category}</span>
                        <span className="text-status-info flex items-center gap-1">
                          Inspect Fix <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
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
              variant={activeFindingDetails?.severity === 'critical' ? 'critical' : 'warning'}
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
            <div className="p-3 rounded-md bg-status-error/10 border border-status-error/30 text-xs font-mono text-status-error flex items-center justify-between">
              <span>ESTIMATED PENALTY:</span>
              <span className="font-bold">{activeFindingDetails.metricImpact}</span>
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
