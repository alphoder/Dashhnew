# Reclaim Protocol Builder Grant — DASHH Application

> Submit at: <https://reclaimprotocol.org/grants> (or DM
> [@reclaimprotocol on X](https://x.com/reclaimprotocol))
>
> Read this top to bottom, replace anything in `<<angle brackets>>`, and
> paste. Expected response time: 2–4 weeks. Realistic ask: **$5,000–$10,000**.

---

## 1. Project name

DASHH — Peer-to-Peer, zkTLS-Verified Influencer Marketing on Solana

## 2. One-sentence pitch

DASHH lets brands escrow ad budgets on Solana and pay creators only for
views that Reclaim Protocol cryptographically proves are real, eliminating
the $1.4B/year fake-engagement problem in influencer marketing.

## 3. Team

Five-person undergraduate engineering team at Shri Govindram Seksaria
Institute of Technology and Science (SGSITS), Indore, India:

- **<<Saksham Vyalsa>>** — backend + on-chain
- **<<Sanjeet Kumar>>** — frontend + animations
- **<<Vedant Singh>>** — full-stack lead + product
- **<<Vivek Bharti>>** — Reclaim integration + verifier pipeline
- **<<Yatharth Urmaliya>>** — testing + documentation

GitHub: <https://github.com/alphoder/Dashhnew>
Live: <https://dashhnew.vercel.app>

## 4. The problem we're solving

Brands lose an estimated **$1.4 billion per year** to fake influencer
engagement. The fraud is straightforward — view counts are platform-reported
and screenshots are trivially fakeable. The status quo:

- Instagram Creator Marketplace: 30% platform fee, no view verification.
- Brave Ads: ~50% effective platform take, no per-view audit trail.
- Traditional agencies: 40–60% intermediary fee, manual reporting.

None of these systems can cryptographically prove that the engagement a
brand paid for actually happened.

## 5. How Reclaim Protocol solves this for us

DASHH uses **Reclaim's zkTLS proof system** as the foundational verifier
of every payable view. Specifically:

- **Four platform adapters** at `src/lib/reclaim/adapters/{instagram,
  youtube, twitter, tiktok}.ts` map the Reclaim attestor payload to a
  normalised `{ viewCount, caption, handle }` shape.
- **Provider IDs in production** (already integrated against live Reclaim
  app `0x4f5C9deCb26Fd1b7633AEBA319994791182696A3`):
  - Instagram: `65e26669-e083-4b67-91fa-6a4fadfbefb1`
  - YouTube: `c4f06d5f-9a7f-4de0-a5e4-253bd9807c81`
  - X/Twitter: `e6fe962d-8b4e-4ce5-abcc-3d21c88bd64a`
  - TikTok: `9ec60ce1-e131-428c-b4fc-865f9782a09c`
- **13-rule disqualification pipeline** at
  `src/lib/reclaim/verify.ts` runs against every Reclaim proof before
  any SOL moves. Rules cover handle mismatches, missing hashtags,
  view-bot velocity signatures, deleted-post detection, duplicate
  submissions across campaigns, and more.
- **Arweave anchoring** of every verified Reclaim proof at
  `src/lib/arweave.ts` so the audit trail outlives DASHH itself.

## 6. The two-proof settlement model (Reclaim-specific innovation)

A novel architecture on top of Reclaim: every campaign requires **two
proofs per creator** — a Join Proof at participation time and a Final
Proof inside a 7-day window after the campaign ends. The view delta
between the two is what gets paid.

This solves three attacks single-proof systems can't:

1. **View-bot inflation** — bots can spike views temporarily but can't
   sustain across two timestamps.
2. **Post-deletion fraud** — Final Proof requires the post still exists.
3. **Handle switching** — Join + Final must reference the same handle.

Code at `src/lib/settlement.ts` and `src/lib/payouts.ts`. Tested in
`tests/settlement.test.ts` (9 cases) and `tests/verify.test.ts` (6 cases).

## 7. Current status

| Surface | Status |
| --- | --- |
| Production deployment | Live on Vercel + Neon Postgres |
| Solana cluster | Devnet (mainnet gated on Anchor escrow audit) |
| Reclaim integration | Live, all 4 platform providers wired |
| Test suite | 45 Vitest tests across 6 files, all green on CI |
| Documentation | Full docs site at /docs + Privacy/ToS |
| Engineering report | 100+ TypeScript files, 17,000+ LOC, 25+ API routes |

## 8. What we'd build with the grant

| Workstream | Effort | Reclaim-specific |
| --- | --- | --- |
| **More providers** — wire Reclaim's LinkedIn, Twitch, Reddit, Spotify providers as DASHH adapters | 2 weeks | Yes — direct ecosystem expansion |
| **Provider-fallback chain** — if a primary adapter returns a parse-error, fall through to the next-best Reclaim provider for the same platform | 1 week | Yes — strengthens Reclaim's resilience story |
| **Reclaim proof browser** — a public route at `/proofs/<id>` that re-verifies the proof's signature client-side using Reclaim's JS SDK so any third party can audit | 1 week | Yes — flagship transparency demo |
| **End-to-end demo video** featuring Reclaim as the trust anchor | 1 week | Promotes Reclaim in marketing |
| **Audited Anchor escrow** integration that releases payouts only on Reclaim verifier signatures | 3–4 weeks | Yes — first production Solana protocol fronting Reclaim verifier sigs |

Total scope: 8–10 weeks of focused work for the 5-person team.

## 9. Funding ask

**$5,000–$10,000** in USDC, milestoned:

- $2,000 on grant award — kicks off the additional-providers work
- $3,000 on shipping the new providers + fallback chain (Milestone 1)
- $3,000 on shipping the proof browser + demo video (Milestone 2)
- $2,000 on mainnet launch with the audited escrow (Milestone 3)

## 10. What we'll commit to in return

- **Public credit** to Reclaim on the DASHH landing hero ("Built with
  Reclaim Protocol zkTLS"), docs site, every campaign-details modal, and
  the demo video.
- **Open-source forever** — repo is MIT-licensed, integration code stays
  public.
- **Monthly progress updates** to the Reclaim core team via Discord/email.
- **Co-marketing** — co-authored thread on X/Twitter when each milestone
  ships, tagging `@reclaimprotocol`.
- **Feedback loop** — bug reports + provider suggestions from real
  end-user traffic, formalised as GitHub issues in the Reclaim repos.

## 11. Why us, why now

- We're a **5-person team** with a **shipped product on production
  infrastructure** — not a 1-person prototype.
- Reclaim is already the **backbone** of our verification layer — we
  cannot ship without it. The grant accelerates work we're going to do
  regardless.
- The **two-proof model is genuinely novel** — single-proof systems
  dominate the space. Reclaim's documentation can cite us as a flagship
  use case once we ship.
- We're based in **India**, where micro-influencer marketing is one of
  the fastest-growing creator-economy segments globally. Reclaim's
  geographic ecosystem footprint expands with our adoption.

## 12. Contact

- Email: `<<lead-founder@example.com>>`
- Twitter: `<<@yourhandle>>`
- GitHub: alphoder/Dashhnew
- Live demo: <https://dashhnew.vercel.app>

---

*Last updated: 15 May 2026.*
