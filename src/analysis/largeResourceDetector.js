import { formatBytes } from '../lib/utils';

const SPECIALIZED_TYPES = new Set(['js', 'image']);

function getSizeBytes(resource) {
  if (typeof resource.transferred === 'number' && Number.isFinite(resource.transferred) && resource.transferred > 0) {
    return resource.transferred;
  }
  if (typeof resource.decodedSize === 'number' && Number.isFinite(resource.decodedSize) && resource.decodedSize > 0) {
    return resource.decodedSize;
  }
  return null;
}

export function detectLargeResources(resources = [], thresholds = {}) {
  const limitKb = thresholds.largeResourceKb ?? 300;
  const criticalKb = limitKb * 2.5;
  const limitBytes = limitKb * 1024;
  const criticalBytes = criticalKb * 1024;

  return resources
    .filter((res) => !SPECIALIZED_TYPES.has(String(res.type || 'other').toLowerCase()))
    .map((res) => ({ res, sizeBytes: getSizeBytes(res) }))
    .filter(({ sizeBytes }) => sizeBytes !== null && sizeBytes >= limitBytes)
    .sort((a, b) => b.sizeBytes - a.sizeBytes)
    .map(({ res, sizeBytes }) => {
      const formatted = formatBytes(sizeBytes);
      const isCritical = sizeBytes >= criticalBytes;
      const typeLabel = String(res.type || 'other').toUpperCase();

      return {
        id: `large-${res.id}`,
        detector: 'largeResourceDetector',
        severity: isCritical ? 'critical' : 'warning',
        category: `${typeLabel} Payload`,
        title: `Large ${typeLabel} resource`,
        resourceName: res.name,
        measurement: formatted,
        impact: formatted,
        metricImpact: `${formatted} payload exceeds the ${limitKb} KB heuristic`,
        summary: `${res.name} (${typeLabel}) is ${formatted}, exceeding the ${limitKb} KB general resource heuristic.`,
        whyItMatters:
          'Heavy stylesheets, web fonts, HTML documents, or API responses increase transfer cost and can block critical rendering stages until downloaded.',
        recommendation:
          'Enable Brotli/Gzip compression, subset custom web fonts to used glyph ranges, remove unused CSS rules, or paginate large JSON responses.',
        codeSnippet: `# Ensure Brotli compression and long-lived caching at your edge/server\nContent-Encoding: br\nCache-Control: public, max-age=31536000, immutable`,
        thresholdLabel: `Heuristic: ≥ ${limitKb} KB`,
        sortWeight: sizeBytes,
        resource: res,
        affectedResources: [res.name],
      };
    });
}

export default detectLargeResources;
