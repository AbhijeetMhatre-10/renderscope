import { loadEnv } from 'vite';

const MAX_BODY_BYTES = 256 * 1024;
const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash';

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];

    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('Request payload too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error('Invalid JSON payload'));
      }
    });

    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

function buildPrompts(mode, payload) {
  const groundingRule =
    'You are RenderScope AI, a senior web performance engineer. Use ONLY the provided measured data. Never invent URLs, file names, or metrics that are not in the input. Keep explanations clear, concise, and actionable. Return valid JSON matching the requested schema only.';

  if (mode === 'finding') {
    return {
      system: groundingRule,
      user: `Explain why this specific performance finding is a problem and how to fix it.\n\nMeasured Data:\n${JSON.stringify(
        payload,
        null,
        2
      )}\n\nReturn JSON with exact keys:\n{\n  "headline": "short crisp headline",\n  "explanation": "2-3 sentences explaining the root technical mechanism",\n  "userImpact": "1-2 sentences on real user impact (LCP/INP/CLS/bandwidth)",\n  "fixSteps": ["step 1", "step 2", "step 3"],\n  "codeHint": "short practical code or header snippet"\n}`,
    };
  }

  if (mode === 'resource') {
    return {
      system: groundingRule,
      user: `Explain this specific network resource, its timing profile, and whether/how to optimize it.\n\nMeasured Data:\n${JSON.stringify(
        payload,
        null,
        2
      )}\n\nReturn JSON with exact keys:\n{\n  "headline": "short summary of this resource",\n  "role": "1-2 sentences explaining what this asset type does in browser rendering",\n  "timingAnalysis": "2 sentences interpreting its startTime, TTFB, download, and transfer size",\n  "optimizationAdvice": ["advice 1", "advice 2", "advice 3"]\n}`,
    };
  }

  return {
    system: groundingRule,
    user: `Provide an overall performance analysis of this website based on the measured metrics, resources, and heuristic findings.\n\nMeasured Data:\n${JSON.stringify(
      payload,
      null,
      2
    )}\n\nReturn JSON with exact keys:\n{\n  "headline": "concise executive summary headline",\n  "healthGrade": "Good | Needs Attention | Critical",\n  "summary": "2-3 sentences synthesizing the real metrics and resource profile",\n  "keyBottlenecks": [\n    { "title": "short title", "impact": "High | Medium | Low", "detail": "concise evidence-backed detail" }\n  ],\n  "actionPlan": [\n    { "priority": "P1 | P2 | P3", "action": "specific engineering action", "expectedGain": "expected metric improvement" }\n  ],\n  "quickWins": ["quick win 1", "quick win 2", "quick win 3"]\n}`,
  };
}

async function callGemini({ apiKey, model, mode, payload }) {
  const { system, user } = buildPrompts(mode, payload);
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: {
        temperature: 0.25,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const message = errorBody?.error?.message || `Gemini API returned ${response.status}`;
    throw new Error(message);
  }

  const body = await response.json();
  const rawText = body?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('Gemini API returned an empty response');
  }

  const cleaned = rawText
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');

  return JSON.parse(cleaned);
}

function createAiMiddleware(env) {
  return async (req, res, next) => {
    const pathname = (req.url || '').split('?')[0];
    if (pathname !== '/api/ai') {
      next();
      return;
    }

    if (req.method !== 'POST') {
      sendJson(res, 405, { ok: false, error: 'Method not allowed' });
      return;
    }

    try {
      const { mode = 'overall', payload = {} } = await readJsonBody(req);
      if (!['overall', 'finding', 'resource'].includes(mode)) {
        sendJson(res, 400, { ok: false, error: 'Unsupported analysis mode' });
        return;
      }

      const apiKey = (env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '').trim();
      const model = (env.GEMINI_MODEL || process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL).trim();

      if (!apiKey) {
        sendJson(res, 200, {
          ok: false,
          fallback: true,
          reason: 'missing_api_key',
          model,
        });
        return;
      }

      const data = await callGemini({ apiKey, model, mode, payload });
      sendJson(res, 200, {
        ok: true,
        source: 'gemini',
        model,
        data,
      });
    } catch (error) {
      sendJson(res, 200, {
        ok: false,
        fallback: true,
        reason: error instanceof Error ? error.message : 'AI provider unavailable',
      });
    }
  };
}

export function aiProxyPlugin() {
  let loadedEnv = {};

  return {
    name: 'renderscope-ai-proxy',
    configResolved(config) {
      loadedEnv = loadEnv(config.mode, config.root, '');
    },
    configureServer(server) {
      server.middlewares.use(createAiMiddleware(loadedEnv));
    },
    configurePreviewServer(server) {
      server.middlewares.use(createAiMiddleware(loadedEnv));
    },
  };
}

export default aiProxyPlugin;
