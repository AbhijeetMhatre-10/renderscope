const RESOURCE_TYPES = [
  ['text/html', 'html'],
  ['text/css', 'css'],
  ['javascript', 'js'],
  ['ecmascript', 'js'],
  ['image/', 'image'],
  ['font/', 'font'],
  ['application/font', 'font'],
  ['fetch', 'xhr'],
  ['xmlhttprequest', 'xhr'],
];

function getResourceType(item) {
  const resourceType = String(item.resourceType || '').toLowerCase();
  if (resourceType.includes('xhr') || resourceType.includes('fetch')) return 'xhr';

  const mimeType = String(item.mimeType || '').toLowerCase();
  const typeMatch = RESOURCE_TYPES.find(([value]) => mimeType.includes(value));
  return typeMatch?.[1] || 'other';
}

function getResourceName(resourceUrl) {
  try {
    const url = new URL(resourceUrl);
    const name = url.pathname.split('/').filter(Boolean).pop();
    return name || url.hostname;
  } catch {
    return resourceUrl || 'Unknown resource';
  }
}

function numericValue(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function normalizeResource(item, index) {
  const startTime = numericValue(item.startTime ?? item.networkRequestTime);
  const endTime = numericValue(item.endTime ?? item.networkEndTime);
  const duration = startTime !== null && endTime !== null
    ? Math.max(0, endTime - startTime)
    : null;
  const transferred = numericValue(item.transferSize);
  const decodedSize = numericValue(item.resourceSize);
  const ttfb = startTime !== null && numericValue(item.networkRequestTime) !== null
    ? Math.max(0, item.networkRequestTime - startTime)
    : null;

  return {
    id: `resource-${index + 1}`,
    name: getResourceName(item.url),
    type: getResourceType(item),
    url: item.url || '',
    status: numericValue(item.statusCode),
    decodedSize,
    transferred,
    startTime,
    duration,
    dns: null,
    ssl: null,
    ttfb,
    download: duration !== null && ttfb !== null ? Math.max(0, duration - ttfb) : null,
    initiator: item.initiator || null,
    priority: item.priority || null,
    cache: item.fromCache === true ? 'HIT' : item.fromCache === false ? 'MISS' : null,
    headers: {},
  };
}

export function normalizeResources(items = []) {
  return items
    .filter((item) => item?.url)
    .map(normalizeResource);
}
