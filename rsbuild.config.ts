import { defineConfig } from '@rsbuild/core';
import { pluginBabel } from '@rsbuild/plugin-babel';
import { pluginReact } from '@rsbuild/plugin-react';
import { TanStackRouterRspack } from '@tanstack/router-plugin/rspack';
import { pluginTypeCheck } from '@rsbuild/plugin-type-check';
import { pluginEslint } from '@rsbuild/plugin-eslint';
import { pluginSvgr } from '@rsbuild/plugin-svgr';
import tauriConf from './src-tauri/tauri.conf.json';
import * as fs from 'node:fs';

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

const locales = fs
  .readdirSync('./locales', { withFileTypes: true })
  .filter((dirent) => dirent.isDirectory())
  .map((dirent) => dirent.name)
  .join(',');

const namespaces = fs
  .readdirSync('./locales/en-US', { withFileTypes: true })
  .filter((dirent) => dirent.isFile())
  .map((dirent) => dirent.name.split('.')[0])
  .join(',');

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginBabel({
      include: /\.(?:jsx|tsx)$/,
      babelLoaderOptions(opts) {
        opts.plugins?.unshift('babel-plugin-react-compiler');
      },
    }),
    pluginTypeCheck(),
    pluginEslint({
      enable: process.env.NODE_ENV === 'production',
    }),
    pluginSvgr(),
  ],
  tools: {
    rspack: {
      plugins: [TanStackRouterRspack()],
      output: {
        asyncChunks: false,
      },
    },
  },
  html: {
    template: './index.html',
  },
  source: {
    define: {
      APP_VERSION: JSON.stringify(process.env.npm_package_version),
      APP_ENVIRONMENT: JSON.stringify(appEnv),
      APP_LOCALES: JSON.stringify(locales),
      APP_NAMESPACES: JSON.stringify(namespaces),
    },
  },
  output: {
    target: 'web',
    sourceMap: {
      js: dev ? 'cheap-module-source-map' : 'source-map',
      css: true,
    },
  },
  performance: {
    chunkSplit: {
      strategy: 'split-by-size',
      minSize: 300000,
      maxSize: 500000,
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
      'Content-Security-Policy': tauriConf.app.security.csp,
    },
  },
});
