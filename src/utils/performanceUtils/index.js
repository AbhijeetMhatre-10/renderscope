function getNumericAuditValue(audit) {
  return typeof audit?.numericValue === 'number' && Number.isFinite(audit.numericValue)
    ? audit.numericValue
    : null;
}

function getObservedMetric(audits, key) {
  const items = audits.metrics?.details?.items;
  const value = items?.[0]?.[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function getPerformanceMetrics(audits = {}, resources = []) {
  const sizesByType = resources.reduce((sizes, resource) => {
    const size = resource.decodedSize;
    if (typeof size !== 'number') return sizes;
    sizes[resource.type] = (sizes[resource.type] || 0) + size;
    return sizes;
  }, {});

  const transferredBytes = resources.reduce(
    (total, resource) => total + (resource.transferred || 0),
    0
  );
  const hasTransferSize = resources.some((resource) => typeof resource.transferred === 'number');

  return {
    ttfb: getNumericAuditValue(audits['server-response-time']),
    fcp: getNumericAuditValue(audits['first-contentful-paint']),
    lcp: getNumericAuditValue(audits['largest-contentful-paint']),
    domContentLoaded: getObservedMetric(audits, 'observedDomContentLoaded'),
    load: getObservedMetric(audits, 'observedLoad'),
    totalRequests: resources.length,
    transferredBytes: hasTransferSize ? transferredBytes : null,
    resourceCount: resources.length,
    jsSize: sizesByType.js ?? null,
    cssSize: sizesByType.css ?? null,
    imageSize: sizesByType.image ?? null,
  };
}

export function formatUnavailable(value, formatter = (item) => item) {
  return value === null || value === undefined ? 'Unavailable' : formatter(value);
}
