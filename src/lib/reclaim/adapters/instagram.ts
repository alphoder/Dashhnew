import type { ReclaimAdapter, VerifiedEngagement } from '../types';

export const instagramAdapter: ReclaimAdapter = {
  platform: 'instagram',
  providerId:
    process.env.NEXT_PUBLIC_RECLAIM_PROVIDER_ID_INSTAGRAM ||
    process.env.NEXT_PUBLIC_RECLAIM_PROVIDER_ID ||
    '',

  buildRequestConfig({ userId, callbackUrl }) {
    return {
      providerId: this.providerId,
      callbackUrl,
      context: { platform: 'instagram', userId },
    };
  },

  parseProof(rawProof: unknown): VerifiedEngagement | null {
    try {
      const proof = rawProof as any;
      const params = proof?.claimData?.parameters
        ? JSON.parse(proof.claimData.parameters)
        : proof?.parameters ?? {};
      const views = Number(params.views ?? params.viewCount ?? 0);
      const handle = String(params.sessionUsername ?? params.username ?? params.handle ?? '');
      const ownerHandle = String(
        params.ownerUsername ?? params.postOwner ?? params.author ?? handle,
      );
      const postUrl = String(params.postUrl ?? params.url ?? '');
      const postCreatedAt = Number(
        params.postCreatedAt ?? params.takenAt ?? params.createdAt ?? 0,
      ) || undefined;
      const likes = Number(params.likes ?? params.likeCount ?? 0) || undefined;
      const comments = Number(params.comments ?? params.commentCount ?? 0) || undefined;
      const caption = String(
        params.caption ??
          params.description ??
          params.text ??
          params.tweetText ??
          '',
      );
      if (!handle) return null;
      return {
        platform: 'instagram',
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
