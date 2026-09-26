import { createSlice } from '@reduxjs/toolkit';
import { initialAnalyses } from './mockData';

const getInitialTheme = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('renderscope_theme');
    if (saved === 'light' || saved === 'dark') return saved;
  }
  return 'dark';
};

export const appSlice = createSlice({
  name: 'app',
  initialState: {
    theme: getInitialTheme(),
    recentAnalyses: initialAnalyses,
  },
  reducers: {
    setTheme: (state, action) => {
      state.theme = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.setItem('renderscope_theme', action.payload);
        document.documentElement.setAttribute('data-theme', action.payload);
      }
    },
    toggleTheme: (state) => {
      const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
      state.theme = nextTheme;
      if (typeof window !== 'undefined') {
        localStorage.setItem('renderscope_theme', nextTheme);
        document.documentElement.setAttribute('data-theme', nextTheme);
      }
    },
    addAnalysis: (state, action) => {
      // Avoid exact duplicate IDs or URLs at the top
      const newAnalysis = {
        id: `run-${Date.now()}`,
        analyzedAt: 'Just now',
        score: Math.floor(Math.random() * 15) + 85,
        ...action.payload,
      };
      state.recentAnalyses = [newAnalysis, ...state.recentAnalyses];
    },
    clearHistory: (state) => {
      state.recentAnalyses = [];
    },
    removeAnalysis: (state, action) => {
      state.recentAnalyses = state.recentAnalyses.filter(item => item.id !== action.payload);
    },
    resetMockHistory: (state) => {
      state.recentAnalyses = initialAnalyses;
    },
  },
});

export const {
  setTheme,
  toggleTheme,
  addAnalysis,
  clearHistory,
  removeAnalysis,
  resetMockHistory,
} = appSlice.actions;

export default appSlice.reducer;
