import type { MetadataRoute } from 'next';

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL || 'https://dashhnew.vercel.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          // Per-wallet pages don't need to be indexed
          '/verifyClaim/',
          // Internal demo/preview-only routes
          '/blinkcard/',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
