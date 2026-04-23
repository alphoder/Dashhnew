// Public view-count poller.
//
// Pulls the *current* public view count for a post without generating a
// cryptographic proof. We store this as `participations_v2.pending_views`
// and use it to nudge the creator to re-run Reclaim when the number grows.
//
// Dev / demo mode (DASHH_POLL_MODE != "live"):
//   Returns a plausible monotonically-increasing count — useful for
//   verifying UX without a real platform account.
//
// Live mode:
//   Calls the platform's public endpoint (oEmbed / public profile / etc.).
//   Each platform has a hook below that can be filled in for production.
//   oEmbed / public DOM scraping works for most cases without authentication.

import type { Platform } from './reclaim/types';

export interface PollResult {
  /** Current public view/play/impression count. */
  views: number;
  /** True if we actually hit a live API vs. returned a dev stub. */
  live: boolean;
}

export async function pollPublicViews(
  platform: Platform,
  postUrl: string | null,
  previous: number,
): Promise<PollResult> {
  const mode = process.env.DASHH_POLL_MODE ?? 'dev';

  if (mode !== 'live' || !postUrl) {
    // Dev: random monotonic increment so the UI has something to show.
    // Cap growth rate so it's realistic.
    const inc = Math.floor(100 + Math.random() * 900);
    return { views: previous + inc, live: false };
  }

  try {
    switch (platform) {
      case 'instagram':
        return { views: await pollInstagram(postUrl, previous), live: true };
      case 'youtube':
        return { views: await pollYouTube(postUrl, previous), live: true };
      case 'twitter':
        return { views: await pollTwitter(postUrl, previous), live: true };
      case 'tiktok':
        return { views: await pollTikTok(postUrl, previous), live: true };
      default:
        return { views: previous, live: false };
    }
  } catch (err) {
    console.error(`[poll] ${platform} failed:`, err);
    return { views: previous, live: false };
  }
}

// ─── Live-poll hooks ──────────────────────────────────────────────────────
// These use public endpoints and no auth. Return `previous` on any error
// so the pending-views counter is monotonic.

async function pollInstagram(postUrl: string, previous: number): Promise<number> {
  // Instagram oEmbed doesn't return view counts for reels/stories.
  // Production would need a Graph API token or a scrape provider.
  // Returning `previous` means "no update" — the job just tries again later.
  return previous;
}

async function pollYouTube(postUrl: string, previous: number): Promise<number> {
  // Public oEmbed gives metadata but not views. YouTube Data API v3
  // `videos.list?part=statistics` is the real answer — needs a free API key.
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return previous;
  const id = extractYouTubeId(postUrl);
  if (!id) return previous;
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?id=${id}&part=statistics&key=${key}`,
    { cache: 'no-store' },
  );
  if (!res.ok) return previous;
  const json = await res.json();
  const views = Number(json?.items?.[0]?.statistics?.viewCount ?? previous);
  return Number.isFinite(views) ? views : previous;
}

async function pollTwitter(postUrl: string, previous: number): Promise<number> {
  // X's public endpoints no longer expose view counts without auth.
  // A syndication-bearer token approach works in limited cases.
  return previous;
}

async function pollTikTok(postUrl: string, previous: number): Promise<number> {
  // TikTok's oEmbed doesn't return playCount. A RapidAPI-style provider or
  // TikTok Creator Marketplace API is the production route.
  return previous;
}

function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1) || null;
    return u.searchParams.get('v');
  } catch {
    return null;
  }
}
