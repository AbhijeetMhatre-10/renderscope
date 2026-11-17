import { useCallback, useEffect, useRef, useState } from 'react';
import { addAnalysis } from '../store/appStore';
import { analysisSteps, analyzeUrl, validateUrl } from '../services/analysisService';
import { saveAnalysis } from '../services/historyService';

export function useAnalysis(dispatch) {
  const [status, setStatus] = useState('idle');
  const [stepIndex, setStepIndex] = useState(-1);
  const [analyzingUrl, setAnalyzingUrl] = useState('');
  const [result, setResult] = useState(null);
  const [snapshotInfo, setSnapshotInfo] = useState(null);
  const [error, setError] = useState('');
  const progressTimerRef = useRef(null);
  const requestControllerRef = useRef(null);
  const requestIdRef = useRef(0);

  const loadSnapshot = useCallback((savedRun) => {
    requestIdRef.current += 1;
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    requestControllerRef.current?.abort();

    if (!savedRun) {
      setStatus('error');
      setError('Saved analysis snapshot could not be found in local history.');
      setAnalyzingUrl('');
      setResult(null);
      setSnapshotInfo(null);
      setStepIndex(-1);
      return false;
    }

    setError('');
    setAnalyzingUrl(savedRun.url);
    setResult({
      url: savedRun.url,
      strategy: savedRun.strategy || 'desktop',
      metrics: savedRun.metrics,
      resources: savedRun.resources || [],
      normalizationTimeMs: 0,
    });
    setSnapshotInfo({
      id: savedRun.id,
      analyzedAt: savedRun.analyzedAt,
      label: savedRun.label || null,
      createdAt: savedRun.createdAt,
    });
    setStepIndex(analysisSteps.length);
    setStatus('success');
    return true;
  }, []);

  const startAnalysis = useCallback((value, strategy = 'desktop') => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    const validation = validateUrl(value);
    if (!validation.valid) {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      requestControllerRef.current?.abort();
      setStatus('error');
      setError(validation.message);
      setAnalyzingUrl('');
      setResult(null);
      setSnapshotInfo(null);
      setStepIndex(-1);
      return Promise.resolve(false);
    }

    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    requestControllerRef.current?.abort();
    const controller = new AbortController();
    requestControllerRef.current = controller;
    setAnalyzingUrl(validation.url);
    setError('');
    setResult(null);
    setSnapshotInfo(null);
    setStepIndex(0);
    setStatus('analyzing');

    let currentStep = 0;
    progressTimerRef.current = setInterval(() => {
      currentStep = Math.min(currentStep + 1, analysisSteps.length - 1);
      setStepIndex(currentStep);
      setStatus(currentStep === 0 ? 'analyzing' : 'processing');
    }, 2200);

    analyzeUrl(validation.url, { signal: controller.signal, strategy })
      .then((analysis) => {
        if (requestId !== requestIdRef.current || controller.signal.aborted) return;
        clearInterval(progressTimerRef.current);
        setResult(analysis);
        setSnapshotInfo(null);
        setStepIndex(analysisSteps.length);
        setStatus('success');

        // Persist full snapshot (metrics + resources) to IndexedDB / localStorage
        saveAnalysis({
          url: validation.url,
          strategy: analysis.strategy,
          metrics: analysis.metrics,
          resources: analysis.resources,
        }).catch(() => {
          // Persistence errors should not disrupt displaying the live analysis.
        });

        dispatch(addAnalysis({
          url: validation.url,
          strategy: analysis.strategy,
          lcp: analysis.metrics.lcp === null ? null : analysis.metrics.lcp / 1000,
          fcp: analysis.metrics.fcp,
          fid: null,
          cls: null,
          ttfb: analysis.metrics.ttfb,
          jsSize: analysis.metrics.jsSize,
          requests: analysis.metrics.totalRequests,
          transferSize: analysis.metrics.transferredBytes,
        }));
      })
      .catch((err) => {
        if (requestId !== requestIdRef.current) return;
        clearInterval(progressTimerRef.current);
        if (!controller.signal.aborted) {
          setStatus('error');
          setError(err.message);
          setResult(null);
          setSnapshotInfo(null);
          setAnalyzingUrl('');
          setStepIndex(-1);
        }
      });

    return Promise.resolve(true);
  }, [dispatch]);

  useEffect(() => () => {
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    requestControllerRef.current?.abort();
  }, []);

  return {
    status,
    stepIndex,
    analyzingUrl,
    result,
    snapshotInfo,
    error,
    isLoading: ['validating', 'analyzing', 'processing'].includes(status),
    startAnalysis,
    loadSnapshot,
  };
}

export default useAnalysis;
