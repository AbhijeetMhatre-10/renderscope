import { configureStore } from '@reduxjs/toolkit';
import appReducer from './appStore';
import uiReducer from './uiStore';

export const store = configureStore({
  reducer: {
    app: appReducer,
    ui: uiReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});

export * from './appStore';
export * from './uiStore';
