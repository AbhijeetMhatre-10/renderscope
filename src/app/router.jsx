import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import HomePage from '../pages/Home/HomePage';
import AnalyzePage from '../pages/Analyze/AnalyzePage';
import HistoryPage from '../pages/History/HistoryPage';
import ComparePage from '../pages/Compare/ComparePage';
import NotFoundPage from '../pages/NotFound/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'analyze',
        element: <AnalyzePage />,
      },
      {
        path: 'history',
        element: <HistoryPage />,
      },
      {
        path: 'compare',
        element: <ComparePage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);

export default router;
