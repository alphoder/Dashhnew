import { describe, it, expect } from 'vitest';
import { getAdapter, listAdapters, SUPPORTED_PLATFORMS } from '@/lib/reclaim';

describe('reclaim adapters', () => {
  it('covers all supported platforms', () => {
    for (const p of SUPPORTED_PLATFORMS) {
      expect(getAdapter(p).platform).toBe(p);
    }
    expect(listAdapters().length).toBe(SUPPORTED_PLATFORMS.length);
  });

  it('instagram adapter parses a well-formed proof', () => {
    const ig = getAdapter('instagram');
    const proof = {
      claimData: {
        parameters: JSON.stringify({
          views: 1234,
          username: 'avakim',
          postUrl: 'https://instagram.com/p/abc',
        }),
      },
    };
    const result = ig.parseProof(proof);
    expect(result).not.toBeNull();
    expect(result!.platform).toBe('instagram');
    expect(result!.handle).toBe('avakim');
    expect(result!.views).toBe(1234);
  });

  it('youtube adapter parses viewCount', () => {
    const yt = getAdapter('youtube');
    const proof = {
      parameters: { viewCount: 99_999, channelHandle: 'ravigaming', videoUrl: 'https://y.t/x' },
    };
    const result = yt.parseProof(proof);
    expect(result?.views).toBe(99_999);
    expect(result?.platform).toBe('youtube');
  });

  it('twitter adapter parses impressions', () => {
    const tw = getAdapter('twitter');
    const proof = {
      parameters: { impressions: 500, username: 'csilva', tweetUrl: 'https://x.com/c/1' },
    };
    const result = tw.parseProof(proof);
    expect(result?.views).toBe(500);
  });

  it('tiktok adapter parses playCount', () => {
    const tk = getAdapter('tiktok');
    const proof = {
      parameters: { playCount: 42, username: 'lena', videoUrl: 'https://tt.com/v/1' },
    };
    const result = tk.parseProof(proof);
    expect(result?.views).toBe(42);
  });

  it('returns null on malformed input', () => {
    const ig = getAdapter('instagram');
    expect(ig.parseProof({})).toBeNull();
    expect(ig.parseProof({ claimData: { parameters: 'not-json' } })).toBeNull();
  });
});
