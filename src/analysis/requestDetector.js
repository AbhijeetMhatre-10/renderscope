export function detectManyRequests(resources = [], thresholds = {}) {
  const limitCount = thresholds.manyRequestsCount ?? 60;
  const count = resources.length;

  if (count < limitCount) {
    return [];
  }

  const severity =
    count >= limitCount * 2.2
      ? 'critical'
      : count >= Math.round(limitCount * 1.5)
        ? 'warning'
        : 'info';

  return [
    {
      id: 'requests-total-count',
      detector: 'requestDetector',
      severity,
      category: 'Request Volume',
      title: 'Many requests',
      resourceName: `${count} resources detected`,
      measurement: `${count} requests`,
      impact: `${count} reqs`,
      metricImpact: `${count} total network requests exceeds the ${limitCount}-request heuristic`,
      summary: `${count} network requests were recorded during page load (heuristic threshold: ${limitCount}).`,
      whyItMatters:
        'A high volume of individual requests increases browser scheduling overhead, connection contention, and waterfall depth — especially on high-latency or mobile connections.',
      recommendation:
        'Consolidate small modules, lazy-load below-the-fold images and non-critical chunks, audit third-party tags, and cache immutable assets.',
      codeSnippet: `// Defer non-critical modules until interaction or viewport visibility\nconst AnalyticsPanel = React.lazy(() => import('./AnalyticsPanel'));`,
      thresholdLabel: `Heuristic: ≥ ${limitCount} requests`,
      sortWeight: count,
      resource: null,
      affectedResources: resources.slice(0, 6).map((res) => res.name),
    },
  ];
}

export default detectManyRequests;
