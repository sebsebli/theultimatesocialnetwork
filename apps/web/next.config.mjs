import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

// API base URL for images (profile, headers, etc.) — allow in CSP img-src so avatars load
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const apiOrigin = apiUrl.replace(/\/$/, '');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Note: standalone output disabled for now due to build issues
  // output: 'standalone',

  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  },

  // Image optimization (for next/image; Avatar uses <img> so CSP img-src is what allows API images)
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
        pathname: '/citewalk-images/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/images/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '3000',
        pathname: '/images/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Security headers and .well-known for app deep links (Universal Links / App Links)
  async headers() {
    return [
      {
        source: '/.well-known/apple-app-site-association',
        headers: [{ key: 'Content-Type', value: 'application/json' }],
      },
      {
        source: '/.well-known/assetlinks.json',
        headers: [{ key: 'Content-Type', value: 'application/json' }],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
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
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://storage.ko-fi.com",
              "style-src 'self' 'unsafe-inline' https://storage.ko-fi.com https://fonts.googleapis.com",
              `img-src 'self' data: https: blob: ${apiOrigin} http://localhost:3000 http://127.0.0.1:3000 https://storage.ko-fi.com`,
              "font-src 'self' data: https://fonts.gstatic.com",
              "connect-src 'self' https: https://storage.ko-fi.com",
              "frame-ancestors 'self'",
              "base-uri 'self'",
              "form-action 'self'"
            ].join('; ')
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);