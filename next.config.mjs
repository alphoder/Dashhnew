import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig =
{
    async headers() {
        return [
            {
                source: '/api/:path*',
                headers: [
                    { key: "Access-Control-Allow-Credentials", value: "true" },
                    { key: "Access-Control-Allow-Origin", value: "*" },
                    { key: "Access-Control-Allow-Methods", value: "GET, DELETE, PATCH, POST, PUT" },
                    { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" }
                ]
            }
        ]
    },
    images: {
        remotePatterns: [
            {
              protocol: "https",
              hostname: "**",
            },

          ],
        formats: ['image/webp', 'image/avif'],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    },
    poweredByHeader: false,
    compress: true,
}

// Wrap with Sentry's config so source maps upload + tracing instrumentation
// is applied. Sentry init only fires when NEXT_PUBLIC_SENTRY_DSN is set,
// so unconfigured environments behave exactly like before this wrapper.
export default withSentryConfig(nextConfig, {
  // Silent unless an upload fails — avoids noisy build logs.
  silent: true,
  // Org/project come from env so we don't hardcode tenant info.
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Upload source maps only when SENTRY_AUTH_TOKEN is set
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Tunnel through our own route to defeat ad-blockers stripping requests
  // to sentry.io. Disabled by default — set NEXT_PUBLIC_SENTRY_TUNNEL=true
  // to turn on.
  tunnelRoute: process.env.NEXT_PUBLIC_SENTRY_TUNNEL === 'true'
    ? '/monitoring'
    : undefined,
  hideSourceMaps: true,
  disableLogger: true,
});
