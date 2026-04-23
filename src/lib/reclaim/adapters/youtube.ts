import type { ReclaimAdapter, VerifiedEngagement } from '../types';

export const youtubeAdapter: ReclaimAdapter = {
  platform: 'youtube',
  providerId: process.env.NEXT_PUBLIC_RECLAIM_PROVIDER_ID_YOUTUBE || '',

  buildRequestConfig({ userId, callbackUrl }) {
    return {
      providerId: this.providerId,
      callbackUrl,
      context: { platform: 'youtube', userId },
    };
  },

  parseProof(rawProof: unknown): VerifiedEngagement | null {
    try {
      const proof = rawProof as any;
      const params = proof?.claimData?.parameters
        ? JSON.parse(proof.claimData.parameters)
        : proof?.parameters ?? {};
      const views = Number(params.viewCount ?? params.views ?? 0);
      const handle = String(
        params.sessionChannelHandle ?? params.channelHandle ?? params.channelId ?? '',
      );
      const ownerHandle = String(
        params.videoOwnerHandle ?? params.uploaderHandle ?? params.channelHandle ?? handle,
      );
      const postUrl = String(params.videoUrl ?? params.url ?? '');
      const postCreatedAt = Number(
        params.publishedAt ?? params.uploadedAt ?? params.createdAt ?? 0,
      ) || undefined;
      const likes = Number(params.likeCount ?? params.likes ?? 0) || undefined;
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
        platform: 'youtube',
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
