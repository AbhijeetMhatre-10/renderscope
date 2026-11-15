import { normalizeResources } from './resourceService';
import { getPerformanceMetrics } from '../utils/performanceUtils';

const PAGE_SPEED_ENDPOINT = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
const DEFAULT_TIMEOUT_MS = 120000;
const CACHE_TTL_MS = 5 * 60 * 1000;
const analysisCache = new Map();

export const analysisSteps = [
  'Connecting',
  'Collecting resources',
  'Processing performance data',
  'Building timeline',
  'Detecting bottlenecks',
];

export function validateUrl(value) {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname) {
      return { valid: false, message: 'Enter a valid HTTP or HTTPS URL.' };
    }

    return { valid: true, url: url.toString() };
  } catch {
    return { valid: false, message: 'Enter a valid HTTP or HTTPS URL.' };
  }
}

export async function fetchPageSpeedData(url, {
  signal,
  strategy = 'desktop',
  timeoutMs = Number(import.meta.env.VITE_PAGESPEED_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS,
} = {}) {
  const startedAt = performance.now();
  const requestUrl = new URL(PAGE_SPEED_ENDPOINT);
  requestUrl.searchParams.set('url', url);
  requestUrl.searchParams.set('strategy', strategy);
  requestUrl.searchParams.set('category', 'performance');
  requestUrl.searchParams.set('locale', 'en');

  const apiKey = import.meta.env.VITE_PAGESPEED_API_KEY?.trim();
  if (apiKey) requestUrl.searchParams.set('key', apiKey);

  const controller = new AbortController();
  let timedOut = false;
  const abortRequest = () => controller.abort();
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  signal?.addEventListener('abort', abortRequest, { once: true });

  try {
    const response = await fetch(requestUrl, { signal: controller.signal });
    const body = await response.json().catch(() => null);

    if (!response.ok) {
      const message = body?.error?.message || `PageSpeed Insights request failed (${response.status}).`;
      if (response.status === 403 || response.status === 429) {
        throw new Error(`PageSpeed Insights quota or API access error (${response.status}). ${message}`);
      }
      throw new Error(message);
    }

    if (!body?.lighthouseResult?.audits) {
      throw new Error('PageSpeed Insights returned no Lighthouse performance data.');
    }

    return body;
  } catch (error) {
    if (error.name === 'AbortError') {
      const elapsedSeconds = Math.round((performance.now() - startedAt) / 1000);
      if (timedOut) {
        throw new Error(
          `PageSpeed Insights did not respond within ${Math.round(timeoutMs / 1000)} seconds (elapsed ${elapsedSeconds}s).`
        );
      }
      throw new Error('The PageSpeed Insights request was cancelled.');
    }
    if (error instanceof Error && /quota|rate limit|too many requests/i.test(error.message)) {
      throw new Error(`PageSpeed Insights quota/rate limit reached. ${error.message}`);
    }
    throw error instanceof Error ? error : new Error('Unable to analyze this URL.');
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener('abort', abortRequest);
  }
}

export function normalizePageSpeedResponse(response, url, strategy) {
  const startedAt = performance.now();
  const lighthouse = response.lighthouseResult;
  const networkItems = lighthouse.audits['network-requests']?.details?.items || [];
  const resources = normalizeResources(networkItems);

  return {
    url,
    strategy,
    metrics: getPerformanceMetrics(lighthouse.audits, resources),
    resources,
    normalizationTimeMs: Math.round(performance.now() - startedAt),
  };
}

export async function analyzeUrl(url, { strategy = 'desktop', ...options } = {}) {
  const cacheKey = `${strategy}:${url}`;
  const cached = analysisCache.get(cacheKey);
  if (cached && Date.now() - cached.createdAt < CACHE_TTL_MS) {
    return cached.result;
  }

  const response = await fetchPageSpeedData(url, { ...options, strategy });
  const result = normalizePageSpeedResponse(response, url, strategy);
  analysisCache.set(cacheKey, { createdAt: Date.now(), result });
  return result;
}
