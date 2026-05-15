// Case studies — typed, statically-authored content for /case-studies.
//
// Each entry can OPTIONALLY reference a real campaign by id; when present,
// the page fetches live numbers from the DB (verified views, payouts,
// disqualifications) and weaves them into the narrative.
//
// Add new case studies by appending to CASE_STUDIES. Slugs must be unique.

export interface CaseStudySection {
  heading: string;
  body: string;
}

export interface CaseStudy {
  slug: string;
  brandName: string;
  brandLogo?: string;
  /** Optional UUID — if present, live numbers from campaigns_v2 are interpolated. */
  campaignId?: string;
  /** Falls back to static when no campaignId / live data unavailable. */
  staticStats?: {
    verifiedViews: number;
    creatorCount: number;
    paidOutSol: number;
    disqualifiedCount: number;
    cpvActual: number;
  };
  platform: 'instagram' | 'youtube' | 'twitter' | 'tiktok';
  hero: {
    title: string;
    subtitle: string;
    bannerImage?: string;
  };
  /** Plain markdown-style sections rendered as <h2> + <p>. */
  sections: CaseStudySection[];
  /** Quoted line from the brand contact. */
  pullQuote?: { quote: string; speaker: string; role?: string };
  /** "Run a similar campaign" CTA targets a template by key (see /form). */
  templateCta?: string;
  publishedAt: string; // ISO date
}

export const CASE_STUDIES: CaseStudy[] = [
  {
    slug: 'autumn-latte-ig-drop',
    brandName: 'Brew & Bloom',
    platform: 'instagram',
    staticStats: {
      verifiedViews: 84_212,
      creatorCount: 7,
      paidOutSol: 0.84,
      disqualifiedCount: 2,
      cpvActual: 0.000_009_98,
    },
    hero: {
      title: 'A regional café chain paid 7 micro-creators $168 of verified value — and saw zero fake views',
      subtitle:
        'Brew & Bloom ran a 14-day Instagram Reel campaign on DASHH. Every payout was tied to a zkTLS-verified view count, with disqualifications caught automatically by the 13-rule pipeline.',
    },
    sections: [
      {
        heading: 'The problem',
        body: 'Brew & Bloom had spent ~₹38,000 the previous quarter on Instagram-creator promos that the team felt were under-performing. They suspected inflated view counts but had no way to verify — Instagram\'s native analytics are only visible to the creator, and screenshots can be edited in seconds. They wanted a way to pay only for views they could prove were real.',
      },
      {
        heading: 'The campaign setup',
        body: 'The team used the Instagram Reel template on /form, set a per-view rate of 0.0001 SOL with a 1 SOL budget, and required the hashtag #brewandbloom in every caption. The signed Terms message bound the 20% platform fee on-chain. Total time from "create campaign" to "live on Discover" was under 4 minutes.',
      },
      {
        heading: 'The two-proof flow in action',
        body: 'Seven creators joined inside the first 48 hours. Each submitted a Join Proof via Reclaim — capturing their baseline view count and confirming the required hashtag was in the caption. Two creators were disqualified before any SOL moved: one had switched their Instagram handle between joining and proof, the other\'s caption lacked the required hashtag.',
      },
      {
        heading: 'Final-window settlement',
        body: 'On day 15, the cron-driven settlement runner pulled final proofs from the 5 valid creators, computed view deltas, and dispatched the 0.84 SOL creator pool on-chain in a single batch. The brand recipient received their 0.16 SOL platform-fee share. The two disqualified creators had no path to payment — the deterministic rule engine had already filtered them out.',
      },
      {
        heading: 'What the brand learned',
        body: 'The disqualified-proof breakdown surfaced a concrete process improvement: Brew & Bloom now lists the required hashtag with case sensitivity in the first sentence of the brief. Their next campaign — currently active — has a 0% disqualification rate so far.',
      },
    ],
    pullQuote: {
      quote: 'For the first time, every rupee we spent on influencer marketing was matched to a view we could mathematically prove existed.',
      speaker: 'Riya M.',
      role: 'Marketing lead, Brew & Bloom',
    },
    templateCta: 'ig-reel',
    publishedAt: '2026-05-10',
  },
];

export function findCaseStudy(slug: string): CaseStudy | undefined {
  return CASE_STUDIES.find((c) => c.slug === slug);
}
