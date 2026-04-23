import type { ReclaimAdapter, VerifiedEngagement } from '../types';

export const tiktokAdapter: ReclaimAdapter = {
  platform: 'tiktok',
  providerId: process.env.NEXT_PUBLIC_RECLAIM_PROVIDER_ID_TIKTOK || '',

  buildRequestConfig({ userId, callbackUrl }) {
    return {
      providerId: this.providerId,
      callbackUrl,
      context: { platform: 'tiktok', userId },
    };
  },

  parseProof(rawProof: unknown): VerifiedEngagement | null {
    try {
      const proof = rawProof as any;
      const params = proof?.claimData?.parameters
        ? JSON.parse(proof.claimData.parameters)
        : proof?.parameters ?? {};
      const views = Number(params.playCount ?? params.views ?? 0);
      const handle = String(
        params.sessionUsername ?? params.username ?? params.handle ?? '',
      );
      const ownerHandle = String(
        params.videoAuthor ?? params.authorUsername ?? handle,
      );
      const postUrl = String(params.videoUrl ?? params.url ?? '');
      const postCreatedAt = Number(
        params.createTime ?? params.createdAt ?? 0,
      ) || undefined;
      const likes = Number(params.diggCount ?? params.likes ?? 0) || undefined;
      const comments = Number(params.commentCount ?? params.comments ?? 0) || undefined;
      const caption = String(
        params.caption ??
          params.description ??
          params.text ??
          params.tweetText ??
          '',
      );
      if (!handle) return null;
      return {
        platform: 'tiktok',
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
