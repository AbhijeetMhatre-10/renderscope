import { formatDuration } from '../lib/utils';

export function detectSlowResources(resources = [], thresholds = {}) {
  const limitMs = thresholds.slowResourceMs ?? 500;
  const criticalMs = limitMs * 2;

  return resources
    .filter((res) => typeof res.duration === 'number' && Number.isFinite(res.duration) && res.duration >= limitMs)
    .sort((a, b) => b.duration - a.duration)
    .map((res) => {
      const formatted = formatDuration(res.duration);
      const isCritical = res.duration >= criticalMs;
      const ttfbNote =
        typeof res.ttfb === 'number' && res.ttfb > res.duration * 0.5
          ? ' Most of this delay was spent waiting for the server response (TTFB).'
          : '';

      return {
        id: `slow-${res.id}`,
        detector: 'slowResourceDetector',
        severity: isCritical ? 'critical' : 'warning',
        category: 'Network Latency',
        title: 'Slow resource',
        resourceName: res.name,
        measurement: formatted,
        impact: formatted,
        metricImpact: `${formatted} load duration exceeds the ${limitMs}ms heuristic`,
        summary: `${res.name} took ${formatted} to complete.${ttfbNote}`,
        whyItMatters:
          'Slow network requests stretch the waterfall, stall dependent assets, and degrade perceived load speed. High latency is often caused by uncached origins or third-party hosts.',
        recommendation:
          'Cache static responses at the CDN edge, preconnect to critical third-party origins, and defer non-essential analytics or embeds.',
        codeSnippet: `<!-- Warm up critical external connections early -->\n<link rel="preconnect" href="${(() => {
          try {
            return new URL(res.url).origin;
          } catch {
            return 'https://cdn.example.com';
          }
        })()}" crossorigin />`,
        thresholdLabel: `Heuristic: ≥ ${limitMs}ms`,
        sortWeight: res.duration,
        resource: res,
        affectedResources: [res.name],
      };
    });
}

export default detectSlowResources;
