// biome-ignore assist/source/organizeImports: <explanation>
import * as fs from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import svgr from "vite-plugin-svgr";
import tauriConf from "./src-tauri/tauri.conf.json" with { type: "json" };

const dev = process.env.NODE_ENV !== "production";

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
      autoCodeSplitting: true,
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
      ignored: ["**/.git/**", "**/node_modules/**", "**/src-tauri/**"],
    },
  },
  build: {
    target: "es2020",
    sourcemap: dev ? "inline" : true,
  },
});
