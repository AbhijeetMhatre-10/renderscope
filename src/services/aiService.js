import { formatBytes, formatDuration } from '../lib/utils';

const AI_ENDPOINT = (import.meta.env.VITE_AI_ENDPOINT || '/api/ai').trim();
const REQUEST_TIMEOUT_MS = 30000;
const responseCache = new Map();

function safeBytes(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? formatBytes(value)
    : 'Unavailable';
}

function safeDuration(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? formatDuration(value)
    : 'Unavailable';
}

function summarizeResourcesByType(resources = []) {
  return resources.reduce((acc, res) => {
    const type = String(res.type || 'other').toLowerCase();
    if (!acc[type]) {
      acc[type] = { count: 0, transferredBytes: 0, decodedBytes: 0 };
    }
    acc[type].count += 1;
    if (typeof res.transferred === 'number' && res.transferred > 0) {
      acc[type].transferredBytes += res.transferred;
    }
    if (typeof res.decodedSize === 'number' && res.decodedSize > 0) {
      acc[type].decodedBytes += res.decodedSize;
    }
    return acc;
  }, {});
}

export function buildOverallPayload({ url, strategy = 'desktop', metrics = {}, resources = [], findings = [] }) {
  const topSlowResources = [...resources]
    .filter((r) => typeof r.duration === 'number')
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 5)
    .map((r) => ({
      name: r.name,
      type: r.type,
      startTimeMs: Math.round(r.startTime || 0),
      durationMs: Math.round(r.duration),
      ttfbMs: typeof r.ttfb === 'number' ? Math.round(r.ttfb) : null,
      transferredBytes: r.transferred,
    }));

  const topLargestResources = [...resources]
    .filter((r) => typeof (r.transferred ?? r.decodedSize) === 'number')
    .sort((a, b) => (b.transferred ?? b.decodedSize ?? 0) - (a.transferred ?? a.decodedSize ?? 0))
    .slice(0, 5)
    .map((r) => ({
      name: r.name,
      type: r.type,
      transferredBytes: r.transferred,
      decodedBytes: r.decodedSize,
      durationMs: typeof r.duration === 'number' ? Math.round(r.duration) : null,
    }));

  return {
    url,
    strategy,
    metrics: {
      ttfbMs: metrics?.ttfb ?? null,
      fcpMs: metrics?.fcp ?? null,
      lcpMs: metrics?.lcp ?? null,
      domContentLoadedMs: metrics?.domContentLoaded ?? null,
      loadMs: metrics?.load ?? null,
      totalRequests: metrics?.totalRequests ?? resources.length,
      transferredBytes: metrics?.transferredBytes ?? null,
      jsBytes: metrics?.jsSize ?? null,
      cssBytes: metrics?.cssSize ?? null,
      imageBytes: metrics?.imageSize ?? null,
    },
    resourceBreakdown: summarizeResourcesByType(resources),
    topSlowResources,
    topLargestResources,
    findings: findings.slice(0, 12).map((f) => ({
      severity: f.severity,
      category: f.category,
      title: f.title,
      resourceName: f.resourceName,
      measurement: f.measurement,
      thresholdLabel: f.thresholdLabel,
    })),
  };
}

export function buildFindingPayload({ url, finding, metrics = {} }) {
  return {
    url,
    finding: {
      severity: finding.severity,
      category: finding.category,
      title: finding.title,
      resourceName: finding.resourceName,
      measurement: finding.measurement,
      thresholdLabel: finding.thresholdLabel,
      summary: finding.summary,
    },
    resource: finding.resource
      ? {
          name: finding.resource.name,
          type: finding.resource.type,
          status: finding.resource.status,
          startTimeMs: finding.resource.startTime,
          durationMs: finding.resource.duration,
          ttfbMs: finding.resource.ttfb,
          transferredBytes: finding.resource.transferred,
          decodedBytes: finding.resource.decodedSize,
          cache: finding.resource.cache,
        }
      : null,
    metrics: {
      ttfbMs: metrics?.ttfb ?? null,
      fcpMs: metrics?.fcp ?? null,
      lcpMs: metrics?.lcp ?? null,
      loadMs: metrics?.load ?? null,
    },
  };
}

export function buildResourcePayload({ url, resource, metrics = {} }) {
  return {
    url,
    resource: {
      name: resource.name,
      type: resource.type,
      url: resource.url,
      status: resource.status,
      startTimeMs: resource.startTime,
      durationMs: resource.duration,
      ttfbMs: resource.ttfb,
      downloadMs: resource.download,
      transferredBytes: resource.transferred,
      decodedBytes: resource.decodedSize,
      cache: resource.cache,
      priority: resource.priority,
      initiator: resource.initiator?.type || resource.initiator || 'parser',
    },
    metrics: {
      fcpMs: metrics?.fcp ?? null,
      lcpMs: metrics?.lcp ?? null,
      loadMs: metrics?.load ?? null,
    },
  };
}

function buildFallbackOverall(payload, reason) {
  const { metrics, findings, topSlowResources, topLargestResources } = payload;
  const criticalCount = findings.filter((f) => f.severity === 'critical').length;
  const warningCount = findings.filter((f) => f.severity === 'warning').length;

  let healthGrade = 'Good';
  if (criticalCount > 0 || (typeof metrics.lcpMs === 'number' && metrics.lcpMs > 4000)) {
    healthGrade = 'Critical';
  } else if (warningCount > 0 || (typeof metrics.lcpMs === 'number' && metrics.lcpMs > 2500)) {
    healthGrade = 'Needs Attention';
  }

  const headline =
    healthGrade === 'Good'
      ? `Solid delivery profile with ${metrics.totalRequests} requests (${safeBytes(metrics.transferredBytes)})`
      : `${findings.length} measurable bottleneck${findings.length === 1 ? '' : 's'} shaping page load (${safeDuration(metrics.lcpMs)} LCP)`;

  const summaryParts = [
    `Measured ${metrics.totalRequests} network requests transferring ${safeBytes(metrics.transferredBytes)}.`,
    metrics.lcpMs != null ? `Largest Contentful Paint landed at ${safeDuration(metrics.lcpMs)} with FCP at ${safeDuration(metrics.fcpMs)} and TTFB at ${safeDuration(metrics.ttfbMs)}.` : null,
    findings.length > 0
      ? `Performance Detective flagged ${criticalCount} critical and ${warningCount} warning findings across your waterfall.`
      : 'No individual resources exceeded the active heuristic thresholds.',
  ].filter(Boolean);

  const keyBottlenecks = findings.slice(0, 4).map((f) => ({
    title: `${f.title}: ${f.resourceName}`,
    impact: f.severity === 'critical' ? 'High' : f.severity === 'warning' ? 'Medium' : 'Low',
    detail: `Measured ${f.measurement} (${f.thresholdLabel}).`,
  }));

  if (keyBottlenecks.length === 0 && topSlowResources[0]) {
    keyBottlenecks.push({
      title: `Slowest observed asset: ${topSlowResources[0].name}`,
      impact: 'Low',
      detail: `Completed in ${safeDuration(topSlowResources[0].durationMs)} starting at ${safeDuration(topSlowResources[0].startTimeMs)}.`,
    });
  }

  const actionPlan = [];
  if (findings.some((f) => f.category === 'JavaScript')) {
    actionPlan.push({
      priority: 'P1',
      action: 'Code-split large JavaScript bundles with React.lazy() / dynamic import() and defer non-critical scripts.',
      expectedGain: 'Lower main-thread parse time & faster INP/FCP',
    });
  }
  if (findings.some((f) => f.category === 'Images')) {
    actionPlan.push({
      priority: actionPlan.length === 0 ? 'P1' : 'P2',
      action: 'Convert oversized hero and media assets to compressed AVIF/WebP with responsive srcset sizing.',
      expectedGain: 'Significant reduction in transfer weight & faster LCP',
    });
  }
  if (findings.some((f) => f.category === 'Network Latency') || (metrics.ttfbMs && metrics.ttfbMs > 400)) {
    actionPlan.push({
      priority: actionPlan.length < 2 ? 'P2' : 'P3',
      action: 'Serve slow origin/third-party assets behind edge caching and add rel="preconnect" for critical hosts.',
      expectedGain: 'Shorter waterfall tail & lower TTFB',
    });
  }
  if (actionPlan.length === 0) {
    actionPlan.push({
      priority: 'P3',
      action: 'Maintain current asset budgets and monitor regressions across mobile and desktop runs.',
      expectedGain: 'Sustained Core Web Vitals health',
    });
  }

  const quickWins = [
    topLargestResources[0]
      ? `Audit ${topLargestResources[0].name} (${safeBytes(topLargestResources[0].transferredBytes ?? topLargestResources[0].decodedBytes)}), currently your heaviest asset.`
      : 'Verify Brotli compression and immutable Cache-Control headers on static bundles.',
    'Add fetchpriority="high" on the primary LCP image so the browser schedules it first.',
    'Use font-display: swap and preload primary WOFF2 fonts to avoid invisible text flashes.',
  ];

  return {
    source: 'fallback',
    model: 'local-structured',
    fallbackReason: reason,
    headline,
    healthGrade,
    summary: summaryParts.join(' '),
    keyBottlenecks,
    actionPlan,
    quickWins,
  };
}

function buildFallbackFinding(payload, reason) {
  const { finding, resource, metrics } = payload;
  const timingNote =
    resource?.durationMs != null
      ? ` It ran for ${safeDuration(resource.durationMs)} starting at ${safeDuration(resource.startTimeMs)}.`
      : '';

  return {
    source: 'fallback',
    model: 'local-structured',
    fallbackReason: reason,
    headline: `Why ${finding.title} (${finding.resourceName}) slows rendering`,
    explanation: `${finding.summary}${timingNote} Resources crossing ${finding.thresholdLabel.toLowerCase()} compete for bandwidth, main-thread execution, or connection slots during critical page boot.`,
    userImpact:
      metrics.lcpMs != null
        ? `With current LCP at ${safeDuration(metrics.lcpMs)} and FCP at ${safeDuration(metrics.fcpMs)}, trimming this bottleneck directly improves perceived load speed on slower networks.`
        : 'Users on cellular or mid-tier devices experience longer wait times before interactive content renders.',
    fixSteps: [
      `Inspect ${finding.resourceName} in the Waterfall and Resource Drawer to check compression and cache status.`,
      finding.category === 'JavaScript'
        ? 'Split non-critical chunks using dynamic import() and remove unused dependencies.'
        : finding.category === 'Images'
          ? 'Resize the asset to its rendered dimensions and export as compressed AVIF or WebP.'
          : 'Enable CDN caching, preconnect critical origins, and defer non-essential requests.',
      'Re-run RenderScope analysis to confirm the reduction in transfer size or duration.',
    ],
    codeHint:
      finding.category === 'JavaScript'
        ? 'const DeferredFeature = React.lazy(() => import("./DeferredFeature"));'
        : finding.category === 'Images'
          ? '<img src="hero.avif" width="800" height="450" fetchpriority="high" decoding="async" alt="" />'
          : 'Cache-Control: public, max-age=31536000, immutable',
  };
}

function buildFallbackResource(payload, reason) {
  const { resource, metrics } = payload;
  const type = String(resource.type || 'other').toLowerCase();

  const roleMap = {
    html: 'The entry HTML document bootstraps DOM parsing and discovers all downstream CSS, scripts, fonts, and media.',
    css: 'Stylesheets are render-blocking by default — the browser delays First Paint until critical CSS builds the CSSOM.',
    js: 'JavaScript bundles download, parse, and execute on the main thread, directly affecting interactivity and hydration.',
    image: 'Image assets visually populate the viewport and often determine Largest Contentful Paint (LCP) when above the fold.',
    font: 'Web font files style typography; late font downloads can trigger Flash of Invisible Text (FOIT) or layout shifts.',
    xhr: 'XHR/Fetch requests load runtime API data needed to populate dynamic UI sections.',
    other: 'Supporting network asset requested during page lifecycle.',
  };

  const ttfbShare =
    typeof resource.ttfbMs === 'number' && typeof resource.durationMs === 'number' && resource.durationMs > 0
      ? Math.round((resource.ttfbMs / resource.durationMs) * 100)
      : null;

  const timingAnalysis =
    `Started at ${safeDuration(resource.startTimeMs)} and completed in ${safeDuration(resource.durationMs)} ` +
    `(transfer: ${safeBytes(resource.transferredBytes)}, decoded: ${safeBytes(resource.decodedBytes)}).` +
    (ttfbShare !== null
      ? ` Server wait (TTFB) accounted for ~${ttfbShare}% of total duration.`
      : '') +
    (metrics.lcpMs != null && typeof resource.startTimeMs === 'number' && resource.startTimeMs < metrics.lcpMs
      ? ` Because it loaded before LCP (${safeDuration(metrics.lcpMs)}), it sits inside the critical paint window.`
      : '');

  const optimizationAdvice = [];
  if (resource.cache === 'MISS') {
    optimizationAdvice.push('Response was a cache miss — configure immutable Cache-Control headers for static versioned assets.');
  }
  if (typeof resource.durationMs === 'number' && resource.durationMs >= 400) {
    optimizationAdvice.push('Reduce latency via CDN edge caching, HTTP/2–3 multiplexing, or preconnecting to its origin.');
  }
  if (typeof resource.transferredBytes === 'number' && resource.transferredBytes >= 150 * 1024) {
    optimizationAdvice.push(`Asset weight (${safeBytes(resource.transferredBytes)}) is substantial — verify Brotli compression, code splitting, or media optimization.`);
  }
  if (optimizationAdvice.length === 0) {
    optimizationAdvice.push('Timing and transfer weight look healthy; keep caching headers and priority hints intact.');
  }

  return {
    source: 'fallback',
    model: 'local-structured',
    fallbackReason: reason,
    headline: `${resource.name} (${type.toUpperCase()} · ${safeDuration(resource.durationMs)})`,
    role: roleMap[type] || roleMap.other,
    timingAnalysis,
    optimizationAdvice,
  };
}

function normalizeOverallResponse(raw, meta) {
  return {
    source: meta.source,
    model: meta.model,
    headline: String(raw?.headline || 'Website Performance Summary'),
    healthGrade: ['Good', 'Needs Attention', 'Critical'].includes(raw?.healthGrade)
      ? raw.healthGrade
      : 'Needs Attention',
    summary: String(raw?.summary || ''),
    keyBottlenecks: Array.isArray(raw?.keyBottlenecks)
      ? raw.keyBottlenecks.slice(0, 5).map((item) => ({
          title: String(item?.title || 'Bottleneck'),
          impact: String(item?.impact || 'Medium'),
          detail: String(item?.detail || ''),
        }))
      : [],
    actionPlan: Array.isArray(raw?.actionPlan)
      ? raw.actionPlan.slice(0, 5).map((item, idx) => ({
          priority: String(item?.priority || `P${idx + 1}`),
          action: String(item?.action || ''),
          expectedGain: String(item?.expectedGain || ''),
        }))
      : [],
    quickWins: Array.isArray(raw?.quickWins) ? raw.quickWins.slice(0, 4).map(String) : [],
  };
}

function normalizeFindingResponse(raw, meta) {
  return {
    source: meta.source,
    model: meta.model,
    headline: String(raw?.headline || 'Why this finding matters'),
    explanation: String(raw?.explanation || ''),
    userImpact: String(raw?.userImpact || ''),
    fixSteps: Array.isArray(raw?.fixSteps) ? raw.fixSteps.slice(0, 5).map(String) : [],
    codeHint: raw?.codeHint ? String(raw.codeHint) : '',
  };
}

function normalizeResourceResponse(raw, meta) {
  return {
    source: meta.source,
    model: meta.model,
    headline: String(raw?.headline || 'Resource Explanation'),
    role: String(raw?.role || ''),
    timingAnalysis: String(raw?.timingAnalysis || ''),
    optimizationAdvice: Array.isArray(raw?.optimizationAdvice)
      ? raw.optimizationAdvice.slice(0, 4).map(String)
      : [],
  };
}

async function requestAiGateway(mode, payload, signal) {
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort, { once: true });
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(AI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, payload }),
      signal: controller.signal,
    });

    const contentType = response.headers.get('content-type') || '';
    if (!response.ok || !contentType.includes('application/json')) {
      return { ok: false, fallback: true, reason: `gateway_unavailable (${response.status})` };
    }

    return await response.json();
  } catch (error) {
    if (signal?.aborted) {
      throw error;
    }
    return {
      ok: false,
      fallback: true,
      reason: error instanceof Error ? error.message : 'network_error',
    };
  } finally {
    window.clearTimeout(timeoutId);
    signal?.removeEventListener('abort', onAbort);
  }
}

export async function analyzeWebsiteOverall(
  { url, strategy, metrics, resources, findings },
  { signal, forceRefresh = false } = {}
) {
  const cacheKey = `overall:${strategy}:${url}:${resources.length}:${findings.length}`;
  if (!forceRefresh && responseCache.has(cacheKey)) {
    return responseCache.get(cacheKey);
  }

  const payload = buildOverallPayload({ url, strategy, metrics, resources, findings });
  const result = await requestAiGateway('overall', payload, signal);

  const normalized = result?.ok && result.data
    ? normalizeOverallResponse(result.data, { source: result.source || 'gemini', model: result.model || 'gemini-3.8-flash' })
    : buildFallbackOverall(payload, result?.reason || 'missing_api_key');

  responseCache.set(cacheKey, normalized);
  return normalized;
}

export async function explainFinding(
  { url, finding, metrics },
  { signal, forceRefresh = false } = {}
) {
  const cacheKey = `finding:${url}:${finding.id}:${finding.measurement}`;
  if (!forceRefresh && responseCache.has(cacheKey)) {
    return responseCache.get(cacheKey);
  }

  const payload = buildFindingPayload({ url, finding, metrics });
  const result = await requestAiGateway('finding', payload, signal);

  const normalized = result?.ok && result.data
    ? normalizeFindingResponse(result.data, { source: result.source || 'gemini', model: result.model || 'gemini-3.8-flash' })
    : buildFallbackFinding(payload, result?.reason || 'missing_api_key');

  responseCache.set(cacheKey, normalized);
  return normalized;
}

export async function explainResource(
  { url, resource, metrics },
  { signal, forceRefresh = false } = {}
) {
  const cacheKey = `resource:${url}:${resource.id}:${resource.duration}`;
  if (!forceRefresh && responseCache.has(cacheKey)) {
    return responseCache.get(cacheKey);
  }

  const payload = buildResourcePayload({ url, resource, metrics });
  const result = await requestAiGateway('resource', payload, signal);

  const normalized = result?.ok && result.data
    ? normalizeResourceResponse(result.data, { source: result.source || 'gemini', model: result.model || 'gemini-3.8-flash' })
    : buildFallbackResource(payload, result?.reason || 'missing_api_key');

  responseCache.set(cacheKey, normalized);
  return normalized;
}

export default {
  analyzeWebsiteOverall,
  explainFinding,
  explainResource,
};
