import { useCallback, useEffect, useRef, useState } from 'react';
import { addAnalysis } from '../store/appStore';
import { analysisSteps, analyzeUrl, validateUrl } from '../services/analysisService';

export function useAnalysis(dispatch) {
  const [status, setStatus] = useState('idle');
  const [stepIndex, setStepIndex] = useState(-1);
  const [analyzingUrl, setAnalyzingUrl] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const progressTimerRef = useRef(null);
  const requestControllerRef = useRef(null);

  const startAnalysis = useCallback((value, strategy = 'desktop') => {
    const validation = validateUrl(value);
    if (!validation.valid) {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      requestControllerRef.current?.abort();
      setStatus('error');
      setError(validation.message);
      setAnalyzingUrl('');
      setResult(null);
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
    setStepIndex(0);
    setStatus('analyzing');

    let currentStep = 0;
    progressTimerRef.current = setInterval(() => {
      currentStep = Math.min(currentStep + 1, analysisSteps.length - 1);
      setStepIndex(currentStep);
      setStatus(currentStep === 0 ? 'analyzing' : 'processing');
    }, 350);

    analyzeUrl(validation.url, { signal: controller.signal, strategy })
      .then((analysis) => {
        clearInterval(progressTimerRef.current);
        setResult(analysis);
        setStepIndex(analysisSteps.length);
        setStatus('success');
        dispatch(addAnalysis({
          url: validation.url,
          strategy: analysis.strategy,
          lcp: analysis.metrics.lcp === null ? null : analysis.metrics.lcp / 1000,
          fid: null,
          cls: null,
          ttfb: analysis.metrics.ttfb,
          requests: analysis.metrics.totalRequests,
          transferSize: analysis.metrics.transferredBytes,
        }));
      })
      .catch((error) => {
        clearInterval(progressTimerRef.current);
        if (!controller.signal.aborted) {
          setStatus('error');
          setError(error.message);
          setResult(null);
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
    error,
    isLoading: ['validating', 'analyzing', 'processing'].includes(status),
    startAnalysis,
  };
}

export default useAnalysis;
