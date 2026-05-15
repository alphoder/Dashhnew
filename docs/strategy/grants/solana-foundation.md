# Solana Foundation Grant — DASHH Application

> Submit at: <https://solana.org/grants>
>
> Solana Foundation grants are larger and slower than Reclaim or Superteam.
> Expected response: 6–12 weeks. Realistic ask: **$15,000–$50,000** for
> early-stage builder, more for established teams. Submit ONLY after
> Reclaim + Superteam are in (gives traction signal).

---

## Project: DASHH

### One-liner

Peer-to-peer, zkTLS-verified influencer marketing settled on Solana. No
middlemen, no admins, no fake views.

### URLs

- Live: <https://dashhnew.vercel.app>
- GitHub: <https://github.com/alphoder/Dashhnew>
- Docs: <https://dashhnew.vercel.app/docs>
- Case studies: <https://dashhnew.vercel.app/case-studies>

---

## The thesis

**Influencer marketing is a $25B/year industry losing $1.4B/year to
fraud.** Every existing platform — Instagram Creator Marketplace, Brave
Ads, traditional agencies — relies on platform-reported metrics or
manual reporting, neither of which the brand can verify.

Solana fixes the settlement layer. Reclaim Protocol fixes the
verification layer. DASHH stitches them together into a complete
product that brands and creators can use today.

The unlock for Solana specifically: this is one of the **first real
consumer marketplaces** built natively on Solana that isn't another
DeFi primitive. Every creator who uses DASHH on-ramps with Phantom,
signs with SIWS, and learns to read transactions on Solana Explorer.
Distribution is one of the most-cited Solana ecosystem gaps; DASHH is
direct distribution.

---

## What we've built (production, not prototype)

### Stack

- **Framework:** Next.js 14 (App Router, Route Groups, Server Actions)
- **Language:** TypeScript end-to-end
- **DB:** Neon Postgres + Drizzle ORM
- **Auth:** Sign-In With Solana (SIWS) + HMAC-signed JWT cookies
- **Chain:** Solana Web3.js, Phantom Wallet, Solana Actions / Blinks
- **Verification:** Reclaim Protocol zkTLS (4 platform adapters)
- **Storage:** Arweave / Irys for permanent proof anchoring
- **CI/CD:** GitHub Actions, Vercel, Vercel Cron

### Numbers (as of submission)

- **22+ API routes** under `/api/v2/*` with Zod validation, rate-limit
  (per IP + per wallet), and CAPTCHA stub.
- **6 v2 database tables** (`profiles_v2`, `campaigns_v2`,
  `participations_v2`, `proofs_v2`, `payouts_v2`, `notifications_v2`).
- **45 Vitest tests** across 6 files. CI green on every push.
- **13 deterministic disqualification rules** + **3-strike ban policy
  (90 days)** + **4 payment models**.
- **Two-proof settlement model** — Join + Final inside a 7-day window
  — is the headline architectural contribution.
- **17,000+ lines of TypeScript**, ~100 files in `src/`.
- Public **/case-studies**, **/docs**, **/embed/campaign/[id]**, and
  **/legal/{privacy,terms,cookies}** routes.
- **Sentry + PostHog + Cloudflare Turnstile** all wired (gated by env
  vars; activate when ready).

### Live on devnet, mainnet-ready

Migration plan documented in `docs/PRODUCTION_ROADMAP.md`. Three gates
between now and mainnet: (1) audited Anchor escrow program, (2) Squads
multisig on the platform wallet, (3) Sumsub/Veriff KYB on high-volume
brands. We've designed for these; we haven't shipped them because they
need money and time.

---

## What the grant funds

| Workstream | Months | Cost driver |
| --- | --- | --- |
| **Audited Anchor escrow** — replace `SystemProgram.transfer` stand-in with a PDA-owned program; ship via Anchor; submit to OtterSec or Superteam audit grants | 1.5 | Audit fees (waived if grant approved) + dev time |
| **Mainnet launch + multisig migration** | 0.5 | Real SOL for deploy + buffer for hot-wallet refills |
| **Design-partner recruitment** — onboard 10 real Indian brands, run their first campaigns at near-zero fee, publish each as a case study | 2 | Subsidised platform fees for first 10 brands |
| **Builder-facing surface** — open the API for third-party dashboards (Helius templates, Magic Eden integration, etc.) | 1 | Dev time + docs |
| **Co-marketing tour** — talks at Solana India events, Indian university chapters, technical blog posts | 1 | Travel + content production |

**Total scope:** ~6 months of focused team effort.

**Total ask:** $25,000 USDC.

### Milestones

1. **M1 ($5k @ award)** — Anchor program design + draft submitted for
   audit. Squads multisig live on mainnet for the platform wallet.
2. **M2 ($5k @ month 2)** — Audit passed. Mainnet live. First 3
   design-partner campaigns funded.
3. **M3 ($5k @ month 4)** — 10 design-partner case studies published.
   Public API documented at /docs/api.
4. **M4 ($5k @ month 5)** — 3 third-party integrations live (Helius,
   Magic Eden, Tensor) — verified by their teams.
5. **M5 ($5k @ month 6)** — Co-marketing tour complete. Final report
   with platform-fee revenue numbers + creator-payout volume.

---

## Why this works for the Foundation

- **Distribution.** Every campaign onboards a brand AND a creator to
  Solana. Average campaign = 5 new wallets. 10 campaigns/week =
  200/month onboards.
- **Real money flow on mainnet.** Once shipped, every settled payout
  is a public on-chain transaction that the Foundation can cite when
  arguing "Solana hosts real economic activity."
- **Anti-fraud story.** zkTLS-backed engagement verification is a
  story the Foundation can take to enterprise advertisers (Meta,
  Snap, TikTok have all expressed interest in similar tech). DASHH is
  a concrete prior-art demo.
- **India + emerging markets.** A natural fit for the Foundation's
  ambition to grow Solana usage outside the US/EU. India has
  ~80 million creators and the highest creator-economy growth rate
  globally.

---

## Founder

**Vedant Singh** (0801CS231156) — solo builder. Final-year B.Tech
(Computer Science & Engineering) at Shri Govindram Seksaria Institute
of Technology and Science (SGSITS), Indore, Madhya Pradesh, India.
Cohort 2025–26, graduating June 2026.

Built DASHH end-to-end as a major final-year project: every commit on
`alphoder/Dashhnew`, every API route, every on-chain integration, every
test file. Now taking the project independent past graduation to ship
on mainnet with the funding requested below.

Academic project supervision: **Ms. Ritambhara Patidar** and
**Ms. Mamta Gupta**, Department of Computer Engineering, SGSITS.

**Solo-builder advantages relevant to a Foundation grant:**
- No team-blocking-team coordination. Each milestone is one-person
  executable.
- Full ownership of the codebase — zero handover overhead between
  features.
- Lower funding ceiling required (no team salary). 100% of the grant
  goes to shipping, not headcount.
- Plan to expand to 2–3 hires after the mainnet launch (when there's
  revenue to support them and a track record to point at).

---

## Disclosures

- **No prior funding.** This is my first grant application.
- **No competing grant accepted yet.** Reclaim Protocol and Superteam
  India applications submitted in parallel; I'll disclose any awarded.
- **No equity given up.** The repo is MIT-licensed and IP is held by me
  personally. Will incorporate as a sole proprietorship initially, then
  Pvt Ltd if/when revenue or external investment makes that necessary.

---

## Contact

- Name: **Vedant Singh**
- Email: `<<your-email@example.com>>`
- Twitter: `@dashhhee`
- GitHub: <https://github.com/alphoder/Dashhnew>
- Live demo: <https://dashhnew.vercel.app>
- Solana wallet (grant receive): `7ZyHfVPKqQN67LtQ6Drr1WhLfpYwbmAzQ5v8xpsAvqve`

---

*Last updated: 15 May 2026.*
