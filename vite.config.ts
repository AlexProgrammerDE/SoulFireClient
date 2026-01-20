import * as fs from "node:fs";
import { resolve } from "node:path";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";
import tauriConf from "./src-tauri/tauri.conf.json" with { type: "json" };

const baseEnv = process.env.VERCEL_ENV ?? process.env.NODE_ENV;
const appEnv =
  baseEnv === "production"
    ? "production"
    : baseEnv === "preview"
      ? "preview"
      : "development";

const locales = fs
  .readdirSync("./locales", { withFileTypes: true })
  .filter((dirent) => dirent.isDirectory())
  .map((dirent) => dirent.name)
  .join(",");

const namespaces = fs
  .readdirSync("./locales/en-US", { withFileTypes: true })
  .filter((dirent) => dirent.isFile())
  .map((dirent) => dirent.name.split(".")[0])
  .join(",");

const host = process.env.TAURI_DEV_HOST;
const isDev = appEnv === "development";

export default defineConfig({
  define: {
    APP_VERSION: JSON.stringify(process.env.npm_package_version),
    APP_ENVIRONMENT: JSON.stringify(appEnv),
    APP_LOCALES: JSON.stringify(locales),
    APP_NAMESPACES: JSON.stringify(namespaces),
  },
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: !isDev,
    }),
    react(),
    svgr(),
  ],
  clearScreen: false,
  resolve: {
    alias: {
      "@": resolve(process.cwd(), "src"),
    },
  },
  server: {
    host: host || false,
    port: 1420,
    strictPort: true,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    headers: {
      "X-DNS-Prefetch-Control": "on",
      "X-XSS-Protection": "1; mode=block",
      "X-Frame-Options": "SAMEORIGIN",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": tauriConf.app.security.csp,
    },
    watch: {
      ignored: ["**/src-tauri/**", "**/target/**", "**/.idea/**"],
    },
  },
  envPrefix: ["VITE_", "TAURI_ENV_*"],
  build: {
    // Tauri uses Chromium on Windows and WebKit on macOS and Linux
    target: process.env.TAURI_ENV_PLATFORM
      ? process.env.TAURI_ENV_PLATFORM === "windows"
        ? "chrome105"
        : "safari13"
      : "es2020",
    // don't minify for debug builds
    minify: !process.env.TAURI_ENV_DEBUG ? "esbuild" : false,
    // produce sourcemaps for debug builds
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
  },
});
