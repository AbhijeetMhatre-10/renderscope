import React, { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import LoadingState from '../components/common/LoadingState';

const HomePage = lazy(() => import('../pages/Home/HomePage'));
const AnalyzePage = lazy(() => import('../pages/Analyze/AnalyzePage'));
const HistoryPage = lazy(() => import('../pages/History/HistoryPage'));
const ComparePage = lazy(() => import('../pages/Compare/ComparePage'));
const NotFoundPage = lazy(() => import('../pages/NotFound/NotFoundPage'));

function RouteFallback() {
  return <LoadingState url="RenderScope" stepIndex={0} compact />;
}

function LazyPage({ children }) {
  return <Suspense fallback={<RouteFallback />}>{children}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <LazyPage><HomePage /></LazyPage>,
      },
      {
        path: 'analyze',
        element: <LazyPage><AnalyzePage /></LazyPage>,
      },
      {
        path: 'history',
        element: <LazyPage><HistoryPage /></LazyPage>,
      },
      {
        path: 'compare',
        element: <LazyPage><ComparePage /></LazyPage>,
      },
      {
        path: '*',
        element: <LazyPage><NotFoundPage /></LazyPage>,
      },
    ],
  },
]);

export default router;
