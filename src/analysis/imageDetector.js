import { formatBytes } from '../lib/utils';

function getImageBytes(resource) {
  if (typeof resource.transferred === 'number' && Number.isFinite(resource.transferred) && resource.transferred > 0) {
    return resource.transferred;
  }
  if (typeof resource.decodedSize === 'number' && Number.isFinite(resource.decodedSize) && resource.decodedSize > 0) {
    return resource.decodedSize;
  }
  return null;
}

export function detectLargeImages(resources = [], thresholds = {}) {
  const limitKb = thresholds.largeImageKb ?? 200;
  const criticalKb = limitKb * 2.5;
  const limitBytes = limitKb * 1024;
  const criticalBytes = criticalKb * 1024;

  return resources
    .filter((res) => String(res.type || '').toLowerCase() === 'image')
    .map((res) => ({ res, sizeBytes: getImageBytes(res) }))
    .filter(({ sizeBytes }) => sizeBytes !== null && sizeBytes >= limitBytes)
    .sort((a, b) => b.sizeBytes - a.sizeBytes)
    .map(({ res, sizeBytes }) => {
      const formatted = formatBytes(sizeBytes);
      const isCritical = sizeBytes >= criticalBytes;

      return {
        id: `img-${res.id}`,
        detector: 'imageDetector',
        severity: isCritical ? 'critical' : 'warning',
        category: 'Images',
        title: 'Large image',
        resourceName: res.name,
        measurement: formatted,
        impact: formatted,
        metricImpact: `${formatted} image exceeds the ${limitKb} KB heuristic`,
        summary: `${res.name} transfers ${formatted}, exceeding the ${limitKb} KB image weight heuristic.`,
        whyItMatters:
          'Oversized images consume significant bandwidth and frequently delay Largest Contentful Paint (LCP), especially on mobile networks.',
        recommendation:
          'Serve compressed AVIF or WebP variants sized to the rendered viewport, add width/height attributes, and lazy-load below-the-fold images.',
        codeSnippet: `<img\n  src="${res.name.replace(/\.\w+$/, '.avif')}"\n  width="800"\n  height="450"\n  loading="lazy"\n  decoding="async"\n  alt=""\n/>`,
        thresholdLabel: `Heuristic: ≥ ${limitKb} KB`,
        sortWeight: sizeBytes,
        resource: res,
        affectedResources: [res.name],
      };
    });
}

export default detectLargeImages;
