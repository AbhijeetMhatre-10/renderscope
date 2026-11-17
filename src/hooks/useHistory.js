import { useCallback, useEffect, useState } from 'react';
import {
  clearAllAnalyses,
  deleteAnalysis,
  getAllAnalyses,
  getAnalysisById,
  getStorageBackend,
  saveAnalysis,
  seedSampleAnalyses,
  subscribeHistory,
} from '../services/historyService';

export function useHistory() {
  const [analyses, setAnalyses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [storageBackend, setStorageBackend] = useState(() => getStorageBackend());

  const refresh = useCallback(async () => {
    const items = await getAllAnalyses();
    setAnalyses(items);
    setStorageBackend(getStorageBackend());
    setIsLoading(false);
    return items;
  }, []);

  useEffect(() => {
    let active = true;

    getAllAnalyses().then((items) => {
      if (!active) return;
      setAnalyses(items);
      setStorageBackend(getStorageBackend());
      setIsLoading(false);
    });

    const unsubscribe = subscribeHistory(() => {
      getAllAnalyses().then((items) => {
        if (!active) return;
        setAnalyses(items);
        setStorageBackend(getStorageBackend());
      });
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const saveRun = useCallback(async (entry) => {
    return saveAnalysis(entry);
  }, []);

  const removeRun = useCallback(async (id) => {
    await deleteAnalysis(id);
  }, []);

  const clearHistory = useCallback(async () => {
    await clearAllAnalyses();
  }, []);

  const loadSampleRuns = useCallback(async () => {
    return seedSampleAnalyses();
  }, []);

  const getRunById = useCallback(async (id) => {
    return getAnalysisById(id);
  }, []);

  return {
    analyses,
    isLoading,
    storageBackend,
    refresh,
    saveRun,
    removeRun,
    clearHistory,
    loadSampleRuns,
    getRunById,
  };
}

export default useHistory;
