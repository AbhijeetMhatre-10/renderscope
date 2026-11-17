import { formatBytes } from '../lib/utils';

function getResourceSizeBytes(resource) {
  if (typeof resource.decodedSize === 'number' && Number.isFinite(resource.decodedSize) && resource.decodedSize > 0) {
    return resource.decodedSize;
  }
  if (typeof resource.transferred === 'number' && Number.isFinite(resource.transferred) && resource.transferred > 0) {
    return resource.transferred;
  }
  return null;
}

export function detectLargeJavaScript(resources = [], thresholds = {}) {
  const limitKb = thresholds.largeJsKb ?? 150;
  const criticalKb = limitKb * 2.3;
  const limitBytes = limitKb * 1024;
  const criticalBytes = criticalKb * 1024;

  return resources
    .filter((res) => String(res.type || '').toLowerCase() === 'js')
    .map((res) => ({ res, sizeBytes: getResourceSizeBytes(res) }))
    .filter(({ sizeBytes }) => sizeBytes !== null && sizeBytes >= limitBytes)
    .sort((a, b) => b.sizeBytes - a.sizeBytes)
    .map(({ res, sizeBytes }) => {
      const formatted = formatBytes(sizeBytes);
      const isCritical = sizeBytes >= criticalBytes;

      return {
        id: `js-${res.id}`,
        detector: 'javascriptDetector',
        severity: isCritical ? 'critical' : 'warning',
        category: 'JavaScript',
        title: 'Large JavaScript',
        resourceName: res.name,
        measurement: formatted,
        impact: formatted,
        metricImpact: `${formatted} script exceeds the ${limitKb} KB heuristic`,
        summary: `${res.name} is ${formatted}, which exceeds the ${limitKb} KB JavaScript bundle heuristic.`,
        whyItMatters:
          'Large JavaScript bundles require more time to download, parse, and execute on the main thread — delaying interactivity (INP) and blocking paint updates.',
        recommendation:
          'Split non-critical routes or widgets using dynamic import() / React.lazy(), tree-shake unused exports, and defer third-party scripts.',
        codeSnippet: `// Code-split heavy modules so they load only when needed\nconst HeavyWidget = React.lazy(() => import('./HeavyWidget'));`,
        thresholdLabel: `Heuristic: ≥ ${limitKb} KB`,
        sortWeight: sizeBytes,
        resource: res,
        affectedResources: [res.name],
      };
    });
}

export default detectLargeJavaScript;
