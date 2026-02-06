
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Allow network access for mobile testing
    port: 5173,
  },
  build: {
    chunkSizeWarningLimit: 1024, // 1MB chunks
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ai-vendor': ['@google/genai'],
          'ui-vendor': ['lucide-react', 'd3']
        }
      }
    }
  }
});
