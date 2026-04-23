import type { ReclaimAdapter, VerifiedEngagement } from '../types';

export const twitterAdapter: ReclaimAdapter = {
  platform: 'twitter',
  providerId: process.env.NEXT_PUBLIC_RECLAIM_PROVIDER_ID_TWITTER || '',

  buildRequestConfig({ userId, callbackUrl }) {
    return {
      providerId: this.providerId,
      callbackUrl,
      context: { platform: 'twitter', userId },
    };
  },

  parseProof(rawProof: unknown): VerifiedEngagement | null {
    try {
      const proof = rawProof as any;
      const params = proof?.claimData?.parameters
        ? JSON.parse(proof.claimData.parameters)
        : proof?.parameters ?? {};
      const views = Number(params.impressions ?? params.views ?? 0);
      const handle = String(
        params.sessionUsername ?? params.username ?? params.handle ?? '',
      );
      const ownerHandle = String(
        params.tweetAuthor ?? params.authorUsername ?? handle,
      );
      const postUrl = String(params.tweetUrl ?? params.url ?? '');
      const postCreatedAt = Number(
        params.tweetCreatedAt ?? params.createdAt ?? 0,
      ) || undefined;
      const likes = Number(params.likeCount ?? params.likes ?? 0) || undefined;
      const comments = Number(params.replyCount ?? params.replies ?? 0) || undefined;
      const caption = String(
        params.caption ??
          params.description ??
          params.text ??
          params.tweetText ??
          '',
      );
      if (!handle) return null;
      return {
        platform: 'twitter',
        handle,
        ownerHandle,
        postUrl,
        views,
        postCreatedAt,
        likes,
        comments,
        caption,
        rawProof,
        verifiedAt: new Date(),
      };
    } catch {
      return null;
    }
  },
};
