import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { TanStackRouterRspack } from '@tanstack/router-plugin/rspack';
import { pluginTypeCheck } from '@rsbuild/plugin-type-check';
import { pluginEslint } from '@rsbuild/plugin-eslint';

const dev = process.env.NODE_ENV !== 'production';

const baseEnv = process.env.VERCEL_ENV ?? process.env.NODE_ENV;
let appEnv: string;
if (baseEnv === 'production') {
  appEnv = 'production';
} else if (baseEnv === 'preview') {
  appEnv = 'preview';
} else {
  appEnv = 'development';
}

export default defineConfig({
  plugins: [pluginReact(), pluginTypeCheck(), pluginEslint()],
  tools: {
    rspack: {
      plugins: [TanStackRouterRspack()],
    },
  },
  html: {
    template: './index.html',
  },
  source: {
    define: {
      APP_VERSION: JSON.stringify(process.env.npm_package_version),
      APP_ENVIRONMENT: JSON.stringify(appEnv),
    },
  },
  output: {
    target: 'web',
    sourceMap: {
      js: dev ? 'cheap-module-source-map' : 'source-map',
      css: true,
    },
  },
  server: {
    strictPort: true,
    host: process.env.TAURI_DEV_HOST ?? undefined,
    headers: {
      'X-DNS-Prefetch-Control': 'on',
      'X-XSS-Protection': '1; mode=block',
      'X-Frame-Options': 'SAMEORIGIN',
      'X-Content-Type-Options': 'nosniff',
    },
  },
});
