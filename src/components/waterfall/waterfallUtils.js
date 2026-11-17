import { formatBytes, formatDuration } from '../../lib/utils';

export const WATERFALL_TYPES = ['all', 'html', 'css', 'js', 'image', 'font', 'xhr', 'other'];

export const ZOOM_LEVELS = [1, 1.5, 2, 3, 4];

export const RESOURCE_META = {
  html: { label: 'HTML', colorVar: 'var(--resource-html)' },
  css: { label: 'CSS', colorVar: 'var(--resource-css)' },
  js: { label: 'JS', colorVar: 'var(--resource-js)' },
  image: { label: 'IMG', colorVar: 'var(--resource-image)' },
  font: { label: 'FONT', colorVar: 'var(--resource-font)' },
  xhr: { label: 'XHR', colorVar: 'var(--info)' },
  other: { label: 'OTHER', colorVar: 'var(--resource-other)' },
};

export function getResourceMeta(type) {
  const key = String(type || 'other').toLowerCase();
  return RESOURCE_META[key] || RESOURCE_META.other;
}

export function safeFormatBytes(value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return '—';
  }
  return formatBytes(value);
}

export function safeFormatDuration(value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return '—';
  }
  return formatDuration(value);
}

/**
 * Picks a clean millisecond tick step based on total duration and zoom factor.
 */
function pickTickStep(totalMs, zoom) {
  const targetTicks = Math.max(4, Math.min(16, Math.round(6 * zoom)));
  const rawStep = totalMs / targetTicks;
  const niceSteps = [50, 100, 200, 250, 500, 1000, 2000, 5000, 10000];
  return niceSteps.find((step) => step >= rawStep) || 10000;
}

/**
 * Computes normalized timeline bounds and dynamic ticks for a set of resources + metrics.
 */
export function getTimelineScale(resources = [], metrics = null, zoom = 1) {
  let maxEnd = 1000;

  for (const res of resources) {
    const start = typeof res.startTime === 'number' && Number.isFinite(res.startTime) ? Math.max(0, res.startTime) : 0;
    const dur = typeof res.duration === 'number' && Number.isFinite(res.duration) ? Math.max(0, res.duration) : 0;
    const end = start + dur;
    if (end > maxEnd) maxEnd = end;
  }

  if (metrics) {
    const metricCandidates = [metrics.fcp, metrics.lcp, metrics.domContentLoaded, metrics.load];
    for (const val of metricCandidates) {
      if (typeof val === 'number' && Number.isFinite(val) && val > maxEnd) {
        maxEnd = val;
      }
    }
  }

  // Add slight right breathing room and snap cleanly to nearest 250ms/500ms step
  const padded = maxEnd * 1.06;
  const snapUnit = padded <= 2000 ? 250 : padded <= 6000 ? 500 : 1000;
  const totalDurationMs = Math.max(500, Math.ceil(padded / snapUnit) * snapUnit);

  const stepMs = pickTickStep(totalDurationMs, zoom);
  const ticks = [];
  for (let ms = 0; ms <= totalDurationMs; ms += stepMs) {
    ticks.push({
      ms,
      leftPct: (ms / totalDurationMs) * 100,
      label: ms === 0 ? '0ms' : ms >= 1000 && ms % 1000 === 0 ? `${ms / 1000}s` : `${ms}ms`,
    });
  }

  const milestones = [];
  if (typeof metrics?.fcp === 'number' && metrics.fcp > 0 && metrics.fcp <= totalDurationMs) {
    milestones.push({
      id: 'fcp',
      label: 'FCP',
      ms: metrics.fcp,
      leftPct: (metrics.fcp / totalDurationMs) * 100,
      colorVar: 'var(--success)',
    });
  }
  if (typeof metrics?.lcp === 'number' && metrics.lcp > 0 && metrics.lcp <= totalDurationMs) {
    milestones.push({
      id: 'lcp',
      label: 'LCP',
      ms: metrics.lcp,
      leftPct: (metrics.lcp / totalDurationMs) * 100,
      colorVar: 'var(--error)',
    });
  }
  if (typeof metrics?.load === 'number' && metrics.load > 0 && metrics.load <= totalDurationMs) {
    milestones.push({
      id: 'load',
      label: 'Load',
      ms: metrics.load,
      leftPct: (metrics.load / totalDurationMs) * 100,
      colorVar: 'var(--info)',
    });
  }

  return { totalDurationMs, stepMs, ticks, milestones };
}

/**
 * Calculates bar left/width percentages and internal TTFB vs download proportions.
 */
export function getResourceGeometry(resource, totalDurationMs) {
  const safeTotal = Math.max(1, totalDurationMs);
  const startMs =
    typeof resource.startTime === 'number' && Number.isFinite(resource.startTime)
      ? Math.max(0, resource.startTime)
      : 0;
  const durationMs =
    typeof resource.duration === 'number' && Number.isFinite(resource.duration)
      ? Math.max(0, resource.duration)
      : 0;

  const leftPct = Math.min(99.2, (startMs / safeTotal) * 100);
  const rawWidthPct = (durationMs / safeTotal) * 100;
  const widthPct = Math.max(0.6, Math.min(100 - leftPct, rawWidthPct));

  const ttfbMs =
    typeof resource.ttfb === 'number' && Number.isFinite(resource.ttfb)
      ? Math.max(0, resource.ttfb)
      : 0;
  const ttfbRatio = durationMs > 0 ? Math.min(100, (ttfbMs / durationMs) * 100) : 0;

  return {
    startMs,
    durationMs,
    leftPct,
    widthPct,
    ttfbRatio,
  };
}

export function countResourcesByType(resources = []) {
  const counts = { all: resources.length };
  for (const res of resources) {
    const type = String(res.type || 'other').toLowerCase();
    counts[type] = (counts[type] || 0) + 1;
  }
  return counts;
}

export function filterResources(resources = [], typeFilter = 'all', searchQuery = '') {
  const query = searchQuery.trim().toLowerCase();
  return resources.filter((res) => {
    const typeMatch = typeFilter === 'all' || String(res.type || 'other').toLowerCase() === typeFilter;
    if (!typeMatch) return false;
    if (!query) return true;
    const name = String(res.name || '').toLowerCase();
    const url = String(res.url || '').toLowerCase();
    return name.includes(query) || url.includes(query);
  });
}
