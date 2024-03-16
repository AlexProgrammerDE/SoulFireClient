const securityHeaders = [
    {
        key: 'X-DNS-Prefetch-Control',
        value: 'on'
    },
    {
        key: 'X-XSS-Protection',
        value: '1; mode=block'
    },
    {
        key: 'X-Frame-Options',
        value: 'SAMEORIGIN'
    },
    {
        key: 'X-Content-Type-Options',
        value: 'nosniff'
    },
    {
        key: 'Content-Security-Policy',
        value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; object-src 'none'; base-uri 'self'; connect-src 'self'; font-src 'self'; frame-src 'self'; img-src 'self' data:; manifest-src 'self'; media-src 'self'; worker-src 'self';"
    }
]

const tauriBuild = process.env.TAURI_ARCH !== undefined;

/** @type {import('next').NextConfig} */
const nextConfig = {
    output: tauriBuild ? 'export' : undefined,
    headers: tauriBuild ? undefined : async () => {
        return [
            {
                source: '/:path*',
                headers: securityHeaders
            }
        ]
    },
};

export default nextConfig;
