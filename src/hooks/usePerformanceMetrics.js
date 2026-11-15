import { useMemo } from 'react';
import { getPerformanceMetrics } from '../utils/performanceUtils';

export function usePerformanceMetrics(metrics) {
  return useMemo(() => metrics || null, [metrics]);
}

export { getPerformanceMetrics };

export default usePerformanceMetrics;
