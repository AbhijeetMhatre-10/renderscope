import React, {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  RotateCcw,
  Search,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import TimelineHeader from './TimelineHeader';
import WaterfallRow from './WaterfallRow';
import TimelineCursor from './TimelineCursor';
import ResourceTypeIcon from './ResourceTypeIcon';
import {
  WATERFALL_TYPES,
  ZOOM_LEVELS,
  countResourcesByType,
  filterResources,
  getResourceMeta,
  getTimelineScale,
  safeFormatBytes,
  safeFormatDuration,
} from './waterfallUtils';
import {
  animateWaterfallEntrance,
  createTimelineCursorController,
  gsap,
} from '../../lib/gsap';
import useReplay from '../../hooks/useReplay';

const ResourceDetails = lazy(() => import('./ResourceDetails'));
const ReplayControls = lazy(() => import('./ReplayControls'));

const LEFT_COL_WIDTH_SM = 224; // w-56
const LEFT_COL_WIDTH_MD = 256; // sm:w-64
const RIGHT_COL_WIDTH = 128; // w-32

export function Waterfall({
  resources = [],
  metrics = null,
  resourceInsights = {},
  onExplainResource,
  onOpenDrawer,
}) {
  const scrollContainerRef = useRef(null);
  const trackOverlayRef = useRef(null);
  const rowsContainerRef = useRef(null);
  const cursorRef = useRef(null);
  const cursorControllerRef = useRef(null);

  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [zoomIndex, setZoomIndex] = useState(0);
  const [selectedResourceId, setSelectedResourceId] = useState(null);
  const [hoveredState, setHoveredState] = useState(null);
  const [hoverCursorTimeMs, setHoverCursorTimeMs] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(960);

  const zoom = ZOOM_LEVELS[zoomIndex];
  const leftColWidth = viewportWidth < 640 ? LEFT_COL_WIDTH_SM : LEFT_COL_WIDTH_MD;

  // Measure scroll viewport width for responsive 1x baseline
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return undefined;

    const updateWidth = () => {
      setViewportWidth(Math.max(360, Math.floor(el.clientWidth)));
    };
    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const typeCounts = useMemo(() => countResourcesByType(resources), [resources]);

  const filteredResources = useMemo(
    () => filterResources(resources, typeFilter, searchQuery),
    [resources, typeFilter, searchQuery]
  );

  const { totalDurationMs, ticks, milestones } = useMemo(
    () => getTimelineScale(resources, metrics, zoom),
    [resources, metrics, zoom]
  );

  const baseTrackWidth = Math.max(420, viewportWidth - leftColWidth - RIGHT_COL_WIDTH);
  const timelineWidthPx = Math.round(baseTrackWidth * zoom);

  const selectedResource = useMemo(
    () => filteredResources.find((item) => item.id === selectedResourceId) || null,
    [filteredResources, selectedResourceId]
  );

  // Part 6: Dedicated Loading Replay Hook backed by GSAP real-timing timeline
  const replay = useReplay({
    resources: filteredResources,
    metrics,
    totalDurationMs,
    rowsContainerRef,
    cursorRef,
    trackWidth: timelineWidthPx,
  });

  // Initialize GSAP quickTo pointer cursor controller for interactive inspection mode
  useEffect(() => {
    if (!cursorRef.current) return undefined;
    cursorControllerRef.current = createTimelineCursorController(cursorRef.current);
    return () => {
      cursorControllerRef.current = null;
    };
  }, []);

  // GSAP staggered bar entrance on mount / filter change
  useEffect(() => {
    if (!rowsContainerRef.current || filteredResources.length === 0) return undefined;

    const ctx = gsap.context(() => {
      animateWaterfallEntrance(rowsContainerRef.current);
    }, rowsContainerRef);

    return () => ctx.revert();
  }, [filteredResources]);

  // Interactive pointer tracking for TimelineCursor when not in Replay mode
  const handleTimelineMouseMove = useCallback(
    (event) => {
      if (replay.isReplayActive || !trackOverlayRef.current || !cursorControllerRef.current) return;
      const rect = trackOverlayRef.current.getBoundingClientRect();
      const rawX = event.clientX - rect.left;

      if (rawX < 0 || rawX > rect.width) {
        cursorControllerRef.current.setVisible(false);
        return;
      }

      const clampedX = Math.max(0, Math.min(rect.width, rawX));
      cursorControllerRef.current.setVisible(true);
      cursorControllerRef.current.moveX(clampedX);
      setHoverCursorTimeMs(Math.round((clampedX / Math.max(1, rect.width)) * totalDurationMs));
    },
    [replay.isReplayActive, totalDurationMs]
  );

  const handleTimelineMouseLeave = useCallback(() => {
    setHoveredState(null);
    if (!replay.isReplayActive) {
      cursorControllerRef.current?.setVisible(false);
    }
  }, [replay.isReplayActive]);

  const handleRowHover = useCallback((resource, event) => {
    if (!resource || !event) {
      setHoveredState(null);
      return;
    }
    const containerRect = scrollContainerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    const x = event.clientX - containerRect.left;
    const y = event.clientY - containerRect.top;
    setHoveredState({ resource, x, y, containerWidth: containerRect.width });
  }, []);

  const handleSelectResource = useCallback((resource) => {
    setSelectedResourceId((prev) => (prev === resource.id ? null : resource.id));
  }, []);

  const handleTypeFilterChange = (nextType) => {
    replay.exitReplay();
    setTypeFilter(nextType);
  };

  const handleSearchChange = (nextQuery) => {
    replay.exitReplay();
    setSearchQuery(nextQuery);
  };

  const handleResetFilters = () => {
    replay.exitReplay();
    setTypeFilter('all');
    setSearchQuery('');
  };

  const handleZoomIn = () => setZoomIndex((idx) => Math.min(ZOOM_LEVELS.length - 1, idx + 1));
  const handleZoomOut = () => setZoomIndex((idx) => Math.max(0, idx - 1));
  const handleResetZoom = () => setZoomIndex(0);

  const activeReplayResourceId =
    replay.isReplayActive && replay.activeEvent?.kind === 'resource'
      ? replay.activeEvent.id
      : null;

  return (
    <div className="space-y-4">
      {/* Lazy-Loaded Loading Replay Playback Deck */}
      <Suspense
        fallback={
          <div className="h-[92px] rounded-lg border border-border bg-surface animate-pulse" />
        }
      >
        <ReplayControls
          currentTime={replay.currentTime}
          duration={replay.duration}
          isPlaying={replay.isPlaying}
          isReplayActive={replay.isReplayActive}
          speed={replay.speed}
          activeEvent={replay.activeEvent}
          milestones={replay.milestones}
          stats={replay.stats}
          disabled={filteredResources.length === 0}
          onPlay={replay.play}
          onPause={replay.pause}
          onRestart={replay.restart}
          onSeek={replay.seek}
          onSpeedChange={replay.setSpeed}
          onExitReplay={replay.exitReplay}
        />
      </Suspense>

      {/* Filter, Search & Zoom Toolbar */}
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-3 sm:p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Resource Type Filters */}
          <div
            role="group"
            aria-label="Filter waterfall by resource type"
            className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0"
          >
            {WATERFALL_TYPES.map((type) => {
              const count = typeCounts[type] || 0;
              if (type !== 'all' && count === 0) return null;
              const active = typeFilter === type;
              const meta = type === 'all' ? null : getResourceMeta(type);

              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleTypeFilterChange(type)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm border text-[11px] font-mono uppercase tracking-wider transition-colors shrink-0 ${
                    active
                      ? 'bg-surface-elevated text-text-primary border-border-focus font-medium'
                      : 'bg-background text-text-secondary border-border hover:bg-surface-hover hover:text-text-primary'
                  }`}
                >
                  {meta && (
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: meta.colorVar }}
                    />
                  )}
                  <span>{type}</span>
                  <span className="text-[10px] text-text-muted font-mono-numbers">{count}</span>
                </button>
              );
            })}
          </div>

          {/* Search + Zoom Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:flex-none sm:w-56">
              <Input
                type="text"
                size="sm"
                placeholder="Search resource or URL..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                prefixIcon={<Search className="w-3.5 h-3.5 text-text-muted" />}
                suffixIcon={
                  searchQuery ? (
                    <button
                      type="button"
                      onClick={() => handleSearchChange('')}
                      aria-label="Clear search"
                      className="text-text-muted hover:text-text-primary"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ) : null
                }
              />
            </div>

            <div
              role="group"
              aria-label="Timeline zoom controls"
              className="inline-flex items-center rounded-md border border-border bg-background p-0.5 font-mono text-xs"
            >
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomIndex === 0}
                aria-label="Zoom out timeline"
                title="Zoom out"
                className="p-1.5 rounded-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <span className="px-2 text-[11px] font-mono-numbers text-text-primary min-w-[46px] text-center select-none">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoomIndex === ZOOM_LEVELS.length - 1}
                aria-label="Zoom in timeline"
                title="Zoom in"
                className="p-1.5 rounded-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
              {zoomIndex > 0 && (
                <button
                  type="button"
                  onClick={handleResetZoom}
                  aria-label="Reset zoom"
                  title="Reset zoom to 100%"
                  className="p-1.5 rounded-sm text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors border-l border-border-subtle ml-0.5"
                >
                  <RotateCcw className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Legend & Meta Summary */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border-subtle text-[11px] font-mono text-text-muted">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-status-warning" />
              TTFB Wait
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-resource-html" />
              HTML
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-resource-css" />
              CSS
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-resource-js" />
              JS
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-resource-image" />
              Image
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-resource-font" />
              Font
            </span>
          </div>

          <span className="font-mono-numbers">
            Showing <strong className="text-text-primary">{filteredResources.length}</strong> of{' '}
            {resources.length} · Span: {safeFormatDuration(totalDurationMs)}
          </span>
        </div>
      </div>

      {/* Main Waterfall Scroll Viewport */}
      <div className="relative rounded-lg border border-border bg-surface shadow-sm overflow-hidden">
        <div
          ref={scrollContainerRef}
          onMouseMove={handleTimelineMouseMove}
          onMouseLeave={handleTimelineMouseLeave}
          className="relative w-full overflow-x-auto"
        >
          <div
            className="relative"
            style={{ width: `${leftColWidth + timelineWidthPx + RIGHT_COL_WIDTH}px` }}
          >
            {/* Dynamic Horizontal Timeline Axis */}
            <TimelineHeader
              ticks={ticks}
              milestones={milestones}
              timelineWidthPx={timelineWidthPx}
            />

            {/* Rows Container */}
            <div ref={rowsContainerRef} className="relative">
              {filteredResources.length === 0 ? (
                <div className="py-14 px-6 text-center space-y-3">
                  <p className="text-sm font-medium text-text-primary">
                    {resources.length === 0
                      ? 'No network requests were recorded for this URL.'
                      : 'No resources match your current filter or search.'}
                  </p>
                  {resources.length > 0 && (
                    <Button variant="secondary" size="sm" onClick={handleResetFilters}>
                      Reset filters
                    </Button>
                  )}
                </div>
              ) : (
                filteredResources.map((resource) => (
                  <WaterfallRow
                    key={resource.id}
                    resource={resource}
                    totalDurationMs={totalDurationMs}
                    timelineWidthPx={timelineWidthPx}
                    ticks={ticks}
                    milestones={milestones}
                    isSelected={selectedResourceId === resource.id}
                    isHovered={hoveredState?.resource?.id === resource.id}
                    isReplayCurrent={activeReplayResourceId === resource.id}
                    onSelect={handleSelectResource}
                    onHover={handleRowHover}
                  />
                ))
              )}
            </div>

            {/* Aligned Interactive / Replay Timeline Cursor Layer */}
            <div
              ref={trackOverlayRef}
              aria-hidden="true"
              className="pointer-events-none absolute top-0 bottom-0"
              style={{
                left: `${leftColWidth}px`,
                width: `${timelineWidthPx}px`,
              }}
            >
              <TimelineCursor
                ref={cursorRef}
                timeMs={replay.isReplayActive ? replay.currentTime : hoverCursorTimeMs}
                isReplaying={replay.isReplayActive}
              />
            </div>
          </div>
        </div>

        {/* Floating Hover Information Popover */}
        {hoveredState?.resource && !replay.isPlaying && (
          <div
            role="tooltip"
            className="pointer-events-none hidden sm:block absolute z-40 w-64 rounded-md border border-border bg-surface-elevated p-3 shadow-lg font-mono text-[11px] space-y-2"
            style={{
              left: `${
                hoveredState.x + 272 > hoveredState.containerWidth
                  ? Math.max(12, hoveredState.x - 270)
                  : hoveredState.x + 14
              }px`,
              top: `${Math.max(42, hoveredState.y - 12)}px`,
            }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <ResourceTypeIcon type={hoveredState.resource.type} showLabel />
              <span className="truncate font-semibold text-text-primary">
                {hoveredState.resource.name}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] border-t border-border-subtle pt-2">
              <span className="text-text-muted">Start</span>
              <span className="text-right font-mono-numbers text-text-primary">
                {safeFormatDuration(hoveredState.resource.startTime)}
              </span>

              <span className="text-text-muted">TTFB</span>
              <span className="text-right font-mono-numbers text-status-warning">
                {safeFormatDuration(hoveredState.resource.ttfb)}
              </span>

              <span className="text-text-muted">Duration</span>
              <span className="text-right font-mono-numbers text-text-primary font-semibold">
                {safeFormatDuration(hoveredState.resource.duration)}
              </span>

              <span className="text-text-muted">Transferred</span>
              <span className="text-right font-mono-numbers text-text-secondary">
                {safeFormatBytes(hoveredState.resource.transferred)}
              </span>
            </div>

            <p className="text-[9px] text-text-muted pt-1 border-t border-border-subtle">
              Click row to inspect timing breakdown
            </p>
          </div>
        )}
      </div>

      {/* Lazy-Loaded Selected Resource Details Panel */}
      {selectedResource && (
        <Suspense
          fallback={
            <div className="rounded-lg border border-border bg-surface p-5 text-xs font-mono text-text-muted">
              Loading resource details…
            </div>
          }
        >
          <ResourceDetails
            resource={selectedResource}
            aiInsight={resourceInsights[selectedResource.id]}
            onExplainResource={onExplainResource}
            onClose={() => setSelectedResourceId(null)}
            onOpenDrawer={onOpenDrawer}
          />
        </Suspense>
      )}
    </div>
  );
}

export default Waterfall;
