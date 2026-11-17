import { detectLargeJavaScript } from './javascriptDetector';
import { detectLargeImages } from './imageDetector';
import { detectSlowResources } from './slowResourceDetector';
import { detectLargeResources } from './largeResourceDetector';
import { detectManyRequests } from './requestDetector';

/**
 * Default heuristic thresholds for Performance Detective.
 * These are tunable guidelines rather than universal rules.
 */
export const DEFAULT_THRESHOLDS = {
  largeJsKb: 150,
  largeImageKb: 200,
  slowResourceMs: 500,
  largeResourceKb: 300,
  manyRequestsCount: 60,
};

export const THRESHOLD_CONFIG = [
  {
    key: 'largeJsKb',
    label: 'Large JavaScript',
    unit: 'KB',
    min: 50,
    max: 1000,
    step: 25,
    hint: 'Flags JS bundles above this size',
  },
  {
    key: 'largeImageKb',
    label: 'Large Image',
    unit: 'KB',
    min: 50,
    max: 2000,
    step: 50,
    hint: 'Flags image assets above this transfer weight',
  },
  {
    key: 'slowResourceMs',
    label: 'Slow Resource',
    unit: 'ms',
    min: 150,
    max: 3000,
    step: 50,
    hint: 'Flags requests exceeding this load duration',
  },
  {
    key: 'largeResourceKb',
    label: 'Large Asset (Other)',
    unit: 'KB',
    min: 100,
    max: 2000,
    step: 50,
    hint: 'Flags CSS, fonts, HTML, or XHR above this size',
  },
  {
    key: 'manyRequestsCount',
    label: 'Many Requests',
    unit: 'reqs',
    min: 20,
    max: 250,
    step: 5,
    hint: 'Flags pages issuing at least this many requests',
  },
];

const SEVERITY_RANK = {
  critical: 0,
  warning: 1,
  info: 2,
};

export function normalizeThresholds(custom = {}) {
  return {
    largeJsKb: Math.max(10, Number(custom.largeJsKb) || DEFAULT_THRESHOLDS.largeJsKb),
    largeImageKb: Math.max(10, Number(custom.largeImageKb) || DEFAULT_THRESHOLDS.largeImageKb),
    slowResourceMs: Math.max(50, Number(custom.slowResourceMs) || DEFAULT_THRESHOLDS.slowResourceMs),
    largeResourceKb: Math.max(10, Number(custom.largeResourceKb) || DEFAULT_THRESHOLDS.largeResourceKb),
    manyRequestsCount: Math.max(5, Number(custom.manyRequestsCount) || DEFAULT_THRESHOLDS.manyRequestsCount),
  };
}

export function runFindingEngine(resources = [], customThresholds = {}) {
  const safeResources = Array.isArray(resources) ? resources : [];
  const thresholds = normalizeThresholds(customThresholds);

  const findings = [
    ...detectLargeJavaScript(safeResources, thresholds),
    ...detectLargeImages(safeResources, thresholds),
    ...detectSlowResources(safeResources, thresholds),
    ...detectLargeResources(safeResources, thresholds),
    ...detectManyRequests(safeResources, thresholds),
  ].sort((a, b) => {
    const rankDiff = (SEVERITY_RANK[a.severity] ?? 3) - (SEVERITY_RANK[b.severity] ?? 3);
    if (rankDiff !== 0) return rankDiff;
    return (b.sortWeight || 0) - (a.sortWeight || 0);
  });

  const summary = findings.reduce(
    (acc, item) => {
      acc.total += 1;
      if (item.severity === 'critical') acc.critical += 1;
      else if (item.severity === 'warning') acc.warning += 1;
      else acc.info += 1;
      return acc;
    },
    { total: 0, critical: 0, warning: 0, info: 0 }
  );

  return { findings, summary, thresholds };
}

export default runFindingEngine;
