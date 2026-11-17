import { useCallback, useEffect, useRef, useState } from 'react';
import {
  analyzeWebsiteOverall,
  explainFinding,
  explainResource,
} from '../services/aiService';

const EMPTY_BUCKET = {
  overall: { status: 'idle', data: null, error: '' },
  findings: {},
  resources: {},
};

export function useAIAnalysis({ url = '', strategy = 'desktop', metrics = null, resources = [], findings = [] }) {
  const scopeKey = `${strategy}:${url}`;
  const [buckets, setBuckets] = useState({});
  const controllersRef = useRef(new Map());

  const activeBucket = buckets[scopeKey] || EMPTY_BUCKET;

  useEffect(() => {
    const map = controllersRef.current;
    return () => {
      map.forEach((controller) => controller.abort());
      map.clear();
    };
  }, [scopeKey]);

  const registerController = useCallback((key) => {
    const existing = controllersRef.current.get(key);
    if (existing) existing.abort();
    const controller = new AbortController();
    controllersRef.current.set(key, controller);
    return controller;
  }, []);

  const runOverall = useCallback(
    async ({ forceRefresh = false } = {}) => {
      if (!url) return;
      const key = `${scopeKey}:overall`;
      const controller = registerController(key);

      setBuckets((prev) => {
        const current = prev[scopeKey] || EMPTY_BUCKET;
        return {
          ...prev,
          [scopeKey]: {
            ...current,
            overall: { status: 'loading', data: current.overall.data, error: '' },
          },
        };
      });

      try {
        const data = await analyzeWebsiteOverall(
          { url, strategy, metrics, resources, findings },
          { signal: controller.signal, forceRefresh }
        );
        if (controller.signal.aborted) return;

        setBuckets((prev) => {
          const current = prev[scopeKey] || EMPTY_BUCKET;
          return {
            ...prev,
            [scopeKey]: {
              ...current,
              overall: { status: 'success', data, error: '' },
            },
          };
        });
      } catch (error) {
        if (controller.signal.aborted) return;
        setBuckets((prev) => {
          const current = prev[scopeKey] || EMPTY_BUCKET;
          return {
            ...prev,
            [scopeKey]: {
              ...current,
              overall: {
                status: 'error',
                data: null,
                error: error instanceof Error ? error.message : 'Unable to generate AI analysis.',
              },
            },
          };
        });
      }
    },
    [url, strategy, metrics, resources, findings, scopeKey, registerController]
  );

  const runFindingExplanation = useCallback(
    async (finding, { forceRefresh = false } = {}) => {
      if (!url || !finding?.id) return;
      const key = `${scopeKey}:finding:${finding.id}`;
      const controller = registerController(key);

      setBuckets((prev) => {
        const current = prev[scopeKey] || EMPTY_BUCKET;
        return {
          ...prev,
          [scopeKey]: {
            ...current,
            findings: {
              ...current.findings,
              [finding.id]: {
                status: 'loading',
                data: current.findings[finding.id]?.data || null,
                error: '',
              },
            },
          },
        };
      });

      try {
        const data = await explainFinding(
          { url, finding, metrics },
          { signal: controller.signal, forceRefresh }
        );
        if (controller.signal.aborted) return;

        setBuckets((prev) => {
          const current = prev[scopeKey] || EMPTY_BUCKET;
          return {
            ...prev,
            [scopeKey]: {
              ...current,
              findings: {
                ...current.findings,
                [finding.id]: { status: 'success', data, error: '' },
              },
            },
          };
        });
      } catch (error) {
        if (controller.signal.aborted) return;
        setBuckets((prev) => {
          const current = prev[scopeKey] || EMPTY_BUCKET;
          return {
            ...prev,
            [scopeKey]: {
              ...current,
              findings: {
                ...current.findings,
                [finding.id]: {
                  status: 'error',
                  data: null,
                  error: error instanceof Error ? error.message : 'Unable to explain finding.',
                },
              },
            },
          };
        });
      }
    },
    [url, metrics, scopeKey, registerController]
  );

  const runResourceExplanation = useCallback(
    async (resource, { forceRefresh = false } = {}) => {
      if (!url || !resource?.id) return;
      const key = `${scopeKey}:resource:${resource.id}`;
      const controller = registerController(key);

      setBuckets((prev) => {
        const current = prev[scopeKey] || EMPTY_BUCKET;
        return {
          ...prev,
          [scopeKey]: {
            ...current,
            resources: {
              ...current.resources,
              [resource.id]: {
                status: 'loading',
                data: current.resources[resource.id]?.data || null,
                error: '',
              },
            },
          },
        };
      });

      try {
        const data = await explainResource(
          { url, resource, metrics },
          { signal: controller.signal, forceRefresh }
        );
        if (controller.signal.aborted) return;

        setBuckets((prev) => {
          const current = prev[scopeKey] || EMPTY_BUCKET;
          return {
            ...prev,
            [scopeKey]: {
              ...current,
              resources: {
                ...current.resources,
                [resource.id]: { status: 'success', data, error: '' },
              },
            },
          };
        });
      } catch (error) {
        if (controller.signal.aborted) return;
        setBuckets((prev) => {
          const current = prev[scopeKey] || EMPTY_BUCKET;
          return {
            ...prev,
            [scopeKey]: {
              ...current,
              resources: {
                ...current.resources,
                [resource.id]: {
                  status: 'error',
                  data: null,
                  error: error instanceof Error ? error.message : 'Unable to explain resource.',
                },
              },
            },
          };
        });
      }
    },
    [url, metrics, scopeKey, registerController]
  );

  return {
    overall: activeBucket.overall,
    findingInsights: activeBucket.findings,
    resourceInsights: activeBucket.resources,
    runOverall,
    runFindingExplanation,
    runResourceExplanation,
  };
}

export default useAIAnalysis;
