import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâ€”file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: {
        '/api/melhorenvio-sandbox': {
          target: 'https://sandbox.melhorenvio.com.br',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/melhorenvio-sandbox/, ''),
        },
        '/api/melhorenvio-prod': {
          target: 'https://melhorenvio.com.br',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/melhorenvio-prod/, ''),
        },
        '/api/superfrete-sandbox': {
          target: 'https://sandbox.superfrete.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/superfrete-sandbox/, ''),
        },
        '/api/superfrete-prod': {
          target: 'https://api.superfrete.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/superfrete-prod/, ''),
        },
        '/api/correios-sandbox': {
          target: 'https://cwshom.correios.com.br',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/correios-sandbox/, ''),
        },
        '/api/correios-prod': {
          target: 'https://api.correios.com.br',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/correios-prod/, ''),
        },
      },
    },
  };
});
