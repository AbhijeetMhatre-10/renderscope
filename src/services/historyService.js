const DB_NAME = 'renderscope_history_db';
const DB_VERSION = 1;
const STORE_NAME = 'analyses';
const LOCAL_STORAGE_KEY = 'renderscope_history_v1';
const MAX_SAVED_RUNS = 30;

const listeners = new Set();
let activeBackend = 'indexeddb';

function notifyListeners() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      // Ignore individual subscriber failures.
    }
  });
}

export function subscribeHistory(listener) {
  listeners.add(listener);
  const onStorage = (event) => {
    if (event.key === LOCAL_STORAGE_KEY) listener();
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', onStorage);
  }
  return () => {
    listeners.delete(listener);
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', onStorage);
    }
  };
}

export function getStorageBackend() {
  return activeBackend;
}

export function formatAnalysisDate(timestamp) {
  if (!timestamp) return 'Unknown date';
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(timestamp));
  } catch {
    return new Date(timestamp).toLocaleDateString();
  }
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB unavailable'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = () => {
      activeBackend = 'indexeddb';
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to open IndexedDB'));
    };
  });
}

function readLocalFallback() {
  activeBackend = 'localstorage';
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalFallback(entries) {
  activeBackend = 'localstorage';
  if (typeof window === 'undefined') return;
  try {
    // Trim very large header maps if storing in localStorage to stay safely under quota
    const compact = entries.slice(0, MAX_SAVED_RUNS).map((entry) => ({
      ...entry,
      resources: Array.isArray(entry.resources)
        ? entry.resources.slice(0, 120).map(({ headers: _headers, ...rest }) => rest)
        : [],
    }));
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(compact));
  } catch {
    // Ignore quota errors gracefully.
  }
}

function sortNewestFirst(entries) {
  return [...entries].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

function normalizeEntry(input) {
  const createdAt = typeof input.createdAt === 'number' ? input.createdAt : Date.now();
  const resources = Array.isArray(input.resources) ? input.resources : [];
  const metrics = input.metrics || {
    ttfb: input.ttfb ?? null,
    fcp: input.fcp ?? null,
    lcp: typeof input.lcp === 'number' ? input.lcp : null,
    domContentLoaded: input.domContentLoaded ?? null,
    load: input.load ?? null,
    totalRequests: input.requests ?? resources.length,
    transferredBytes: input.transferSize ?? null,
    resourceCount: resources.length,
    jsSize: input.jsSize ?? null,
    cssSize: input.cssSize ?? null,
    imageSize: input.imageSize ?? null,
  };

  return {
    id: input.id || `run-${createdAt}-${Math.random().toString(36).slice(2, 7)}`,
    url: input.url || '',
    strategy: input.strategy === 'mobile' ? 'mobile' : 'desktop',
    createdAt,
    analyzedAt: input.analyzedAt || formatAnalysisDate(createdAt),
    label: input.label || null,
    metrics,
    resources,
    // Flat summary fields for quick table/card access (all in canonical units: ms & bytes)
    ttfb: metrics.ttfb ?? null,
    fcp: metrics.fcp ?? null,
    lcp: metrics.lcp ?? null,
    jsSize: metrics.jsSize ?? null,
    requests: metrics.totalRequests ?? resources.length,
    transferSize: metrics.transferredBytes ?? null,
  };
}

export async function getAllAnalyses() {
  try {
    const db = await openDatabase();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).getAll();
      req.onsuccess = () => {
        db.close();
        resolve(sortNewestFirst(req.result || []));
      };
      req.onerror = () => {
        db.close();
        reject(req.error);
      };
    });
  } catch {
    return sortNewestFirst(readLocalFallback());
  }
}

export async function getAnalysisById(id) {
  if (!id) return null;
  try {
    const db = await openDatabase();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(id);
      req.onsuccess = () => {
        db.close();
        resolve(req.result || null);
      };
      req.onerror = () => {
        db.close();
        reject(req.error);
      };
    });
  } catch {
    return readLocalFallback().find((item) => item.id === id) || null;
  }
}

export async function saveAnalysis(input) {
  const entry = normalizeEntry(input);

  try {
    const db = await openDatabase();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(entry);

      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });

    // Enforce retention cap in IndexedDB
    const all = await getAllAnalyses();
    if (all.length > MAX_SAVED_RUNS) {
      const stale = all.slice(MAX_SAVED_RUNS);
      const dbPrune = await openDatabase();
      await new Promise((resolve) => {
        const tx = dbPrune.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        stale.forEach((item) => store.delete(item.id));
        tx.oncomplete = () => {
          dbPrune.close();
          resolve();
        };
        tx.onerror = () => {
          dbPrune.close();
          resolve();
        };
      });
    }
  } catch {
    const existing = readLocalFallback().filter((item) => item.id !== entry.id);
    writeLocalFallback(sortNewestFirst([entry, ...existing]));
  }

  notifyListeners();
  return entry;
}

export async function deleteAnalysis(id) {
  if (!id) return;
  try {
    const db = await openDatabase();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch {
    const next = readLocalFallback().filter((item) => item.id !== id);
    writeLocalFallback(next);
  }

  notifyListeners();
}

export async function clearAllAnalyses() {
  try {
    const db = await openDatabase();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).clear();
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch {
    writeLocalFallback([]);
  }

  notifyListeners();
}

function buildSampleRuns() {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  return [
    normalizeEntry({
      id: 'sample-example-after',
      url: 'https://example.com',
      label: 'After Optimization',
      strategy: 'desktop',
      createdAt: now - 1000 * 60 * 18,
      metrics: {
        ttfb: 210,
        fcp: 900,
        lcp: 1800,
        domContentLoaded: 1120,
        load: 1950,
        totalRequests: 64,
        transferredBytes: 1180000,
        resourceCount: 64,
        jsSize: 798720, // 780 KB
        cssSize: 64512,
        imageSize: 286720,
      },
      resources: [
        { id: 'sa-1', name: 'index.html', type: 'html', url: 'https://example.com/', status: 200, startTime: 0, duration: 210, ttfb: 145, download: 65, transferred: 12400, decodedSize: 38200, cache: 'HIT', priority: 'Highest' },
        { id: 'sa-2', name: 'critical.css', type: 'css', url: 'https://example.com/assets/critical.css', status: 200, startTime: 180, duration: 190, ttfb: 60, download: 130, transferred: 18200, decodedSize: 64512, cache: 'HIT', priority: 'Highest' },
        { id: 'sa-3', name: 'app.chunk.js', type: 'js', url: 'https://example.com/assets/app.chunk.js', status: 200, startTime: 220, duration: 420, ttfb: 90, download: 330, transferred: 192000, decodedSize: 512000, cache: 'HIT', priority: 'High' },
        { id: 'sa-4', name: 'vendor.chunk.js', type: 'js', url: 'https://example.com/assets/vendor.chunk.js', status: 200, startTime: 260, duration: 360, ttfb: 85, download: 275, transferred: 114000, decodedSize: 286720, cache: 'HIT', priority: 'High' },
        { id: 'sa-5', name: 'inter-var.woff2', type: 'font', url: 'https://example.com/fonts/inter-var.woff2', status: 200, startTime: 300, duration: 210, ttfb: 70, download: 140, transferred: 42000, decodedSize: 42000, cache: 'HIT', priority: 'High' },
        { id: 'sa-6', name: 'hero.avif', type: 'image', url: 'https://example.com/images/hero.avif', status: 200, startTime: 340, duration: 540, ttfb: 110, download: 430, transferred: 168000, decodedSize: 168000, cache: 'HIT', priority: 'VeryHigh' },
        { id: 'sa-7', name: 'dashboard-preview.webp', type: 'image', url: 'https://example.com/images/dashboard-preview.webp', status: 200, startTime: 780, duration: 410, ttfb: 95, download: 315, transferred: 118720, decodedSize: 118720, cache: 'HIT', priority: 'Medium' },
        { id: 'sa-8', name: 'analytics.js', type: 'js', url: 'https://cdn.example.com/analytics.js', status: 200, startTime: 1100, duration: 290, ttfb: 120, download: 170, transferred: 28400, decodedSize: 72000, cache: 'HIT', priority: 'Low' },
      ],
    }),
    normalizeEntry({
      id: 'sample-example-before',
      url: 'https://example.com',
      label: 'Before Optimization',
      strategy: 'desktop',
      createdAt: now - day,
      metrics: {
        ttfb: 420,
        fcp: 1400,
        lcp: 3100,
        domContentLoaded: 2180,
        load: 3420,
        totalRequests: 92,
        transferredBytes: 2940000,
        resourceCount: 92,
        jsSize: 1258291, // 1.2 MB
        cssSize: 168000,
        imageSize: 1420000,
      },
      resources: [
        { id: 'sb-1', name: 'index.html', type: 'html', url: 'https://example.com/', status: 200, startTime: 0, duration: 420, ttfb: 310, download: 110, transferred: 24800, decodedSize: 62000, cache: 'MISS', priority: 'Highest' },
        { id: 'sb-2', name: 'styles-all.css', type: 'css', url: 'https://example.com/assets/styles-all.css', status: 200, startTime: 420, duration: 440, ttfb: 170, download: 270, transferred: 54000, decodedSize: 168000, cache: 'MISS', priority: 'Highest' },
        { id: 'sb-3', name: 'main-monolith.js', type: 'js', url: 'https://example.com/assets/main-monolith.js', status: 200, startTime: 460, duration: 980, ttfb: 210, download: 770, transferred: 412000, decodedSize: 1258291, cache: 'MISS', priority: 'High' },
        { id: 'sb-4', name: 'custom-font.ttf', type: 'font', url: 'https://example.com/fonts/custom-font.ttf', status: 200, startTime: 860, duration: 520, ttfb: 180, download: 340, transferred: 196000, decodedSize: 196000, cache: 'MISS', priority: 'High' },
        { id: 'sb-5', name: 'hero-uncompressed.png', type: 'image', url: 'https://example.com/images/hero-uncompressed.png', status: 200, startTime: 940, duration: 1480, ttfb: 260, download: 1220, transferred: 1120000, decodedSize: 1120000, cache: 'MISS', priority: 'High' },
        { id: 'sb-6', name: 'banner-secondary.jpg', type: 'image', url: 'https://example.com/images/banner-secondary.jpg', status: 200, startTime: 1380, duration: 760, ttfb: 190, download: 570, transferred: 300000, decodedSize: 300000, cache: 'MISS', priority: 'Medium' },
        { id: 'sb-7', name: 'analytics-legacy.js', type: 'js', url: 'https://thirdparty.example.net/analytics-legacy.js', status: 200, startTime: 1520, duration: 840, ttfb: 490, download: 350, transferred: 88000, decodedSize: 210000, cache: 'MISS', priority: 'Low' },
        { id: 'sb-8', name: 'chat-widget.js', type: 'js', url: 'https://widget.example.net/chat.js', status: 200, startTime: 1960, duration: 920, ttfb: 380, download: 540, transferred: 164000, decodedSize: 440000, cache: 'MISS', priority: 'Low' },
      ],
    }),
    normalizeEntry({
      id: 'sample-portfolio',
      url: 'https://portfolio.dev',
      label: 'Baseline Audit',
      strategy: 'mobile',
      createdAt: now - day * 2,
      metrics: {
        ttfb: 290,
        fcp: 1150,
        lcp: 2400,
        domContentLoaded: 1540,
        load: 2620,
        totalRequests: 51,
        transferredBytes: 1560000,
        resourceCount: 51,
        jsSize: 540000,
        cssSize: 82000,
        imageSize: 840000,
      },
      resources: [
        { id: 'sp-1', name: 'index.html', type: 'html', url: 'https://portfolio.dev/', status: 200, startTime: 0, duration: 290, ttfb: 205, download: 85, transferred: 14200, decodedSize: 41000, cache: 'HIT', priority: 'Highest' },
        { id: 'sp-2', name: 'theme.css', type: 'css', url: 'https://portfolio.dev/theme.css', status: 200, startTime: 260, duration: 240, ttfb: 90, download: 150, transferred: 26400, decodedSize: 82000, cache: 'HIT', priority: 'Highest' },
        { id: 'sp-3', name: 'app.js', type: 'js', url: 'https://portfolio.dev/app.js', status: 200, startTime: 300, duration: 610, ttfb: 140, download: 470, transferred: 184000, decodedSize: 540000, cache: 'HIT', priority: 'High' },
        { id: 'sp-4', name: 'portrait.webp', type: 'image', url: 'https://portfolio.dev/portrait.webp', status: 200, startTime: 560, duration: 920, ttfb: 160, download: 760, transferred: 520000, decodedSize: 520000, cache: 'MISS', priority: 'High' },
        { id: 'sp-5', name: 'case-study.webp', type: 'image', url: 'https://portfolio.dev/case-study.webp', status: 200, startTime: 1040, duration: 640, ttfb: 130, download: 510, transferred: 320000, decodedSize: 320000, cache: 'HIT', priority: 'Medium' },
        { id: 'sp-6', name: 'jetbrains-mono.woff2', type: 'font', url: 'https://portfolio.dev/fonts/jetbrains-mono.woff2', status: 200, startTime: 480, duration: 260, ttfb: 85, download: 175, transferred: 48000, decodedSize: 48000, cache: 'HIT', priority: 'High' },
      ],
    }),
  ];
}

export async function seedSampleAnalyses() {
  const samples = buildSampleRuns();
  for (const sample of samples) {
    await saveAnalysis(sample);
  }
  return getAllAnalyses();
}

export default {
  getAllAnalyses,
  getAnalysisById,
  saveAnalysis,
  deleteAnalysis,
  clearAllAnalyses,
  seedSampleAnalyses,
  subscribeHistory,
  getStorageBackend,
  formatAnalysisDate,
};
