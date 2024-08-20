import { defineConfig } from 'vite';
import viteReactSwc from '@vitejs/plugin-react-swc';
import eslintPlugin from '@nabla/vite-plugin-eslint';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import { resolve } from 'path';
import vercel from 'vite-plugin-vercel';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [TanStackRouterVite(), viteReactSwc(), eslintPlugin(), vercel()],
  define: {
    APP_VERSION: JSON.stringify(process.env.npm_package_version),
    APP_ENVIRONMENT: JSON.stringify(
      process.env.VITE_VERCEL_ENV ?? process.env.NODE_ENV,
    ),
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    headers: {
      'X-DNS-Prefetch-Control': 'on',
      'X-XSS-Protection': '1; mode=block',
      'X-Frame-Options': 'SAMEORIGIN',
      'X-Content-Type-Options': 'nosniff',
    },
    port: process.env.PORT as unknown as number,
  },
  css: {
    devSourcemap: true,
  },
  build: {
    sourcemap: true,
  },
});
