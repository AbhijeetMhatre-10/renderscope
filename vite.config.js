import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { aiProxyPlugin } from './server/aiProxyPlugin.js';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), aiProxyPlugin()],
});
