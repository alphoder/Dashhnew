import type { Platform, ReclaimAdapter } from './types';
import { instagramAdapter } from './adapters/instagram';
import { youtubeAdapter } from './adapters/youtube';
import { twitterAdapter } from './adapters/twitter';
import { tiktokAdapter } from './adapters/tiktok';

const registry: Record<Platform, ReclaimAdapter> = {
  instagram: instagramAdapter,
  youtube: youtubeAdapter,
  twitter: twitterAdapter,
  tiktok: tiktokAdapter,
};

export function getAdapter(platform: Platform): ReclaimAdapter {
  return registry[platform];
}

export function listAdapters(): ReclaimAdapter[] {
  return Object.values(registry);
}

export const SUPPORTED_PLATFORMS: Platform[] = [
  'instagram',
  'youtube',
  'twitter',
  'tiktok',
];

export * from './types';
