import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react-swc'
import {TanStackRouterVite} from "@tanstack/router-vite-plugin";
import {resolve} from 'path';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        TanStackRouterVite(),
    ],
    define: {
        APP_VERSION: JSON.stringify(process.env.npm_package_version),
    },
    resolve: {
        alias: {
            "@": resolve(__dirname, "src"),
        },
    },
    server: {
        headers: {
            'X-DNS-Prefetch-Control': 'on',
            'X-XSS-Protection': '1; mode=block',
            'X-Frame-Options': 'SAMEORIGIN',
            'X-Content-Type-Options': 'nosniff',
        }
    },
    css: {
        devSourcemap: true,
    },
    build: {
        sourcemap: true,
    }
})
