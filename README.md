# DASHH

> Peer-to-peer, zkTLS-verified influencer engagement, settled on Solana.
> No middlemen. No admin. No fake views.

[![CI](https://github.com/alphoder/Dashhnew/actions/workflows/ci.yml/badge.svg)](https://github.com/alphoder/Dashhnew/actions)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![Solana](https://img.shields.io/badge/Solana-Devnet-9945FF)
![Reclaim](https://img.shields.io/badge/Reclaim-zkTLS-14F195)

DASHH connects brands directly with creators. A brand escrows SOL, creators post
content on social platforms, zkTLS proofs verify the views, and the smart
routing layer pays creators out — all without a platform sitting in the middle
of the money.

---

## Table of contents

- [What makes it different](#what-makes-it-different)
- [The two-proof settlement model](#the-two-proof-settlement-model)
- [Stack](#stack)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [Project structure](#project-structure)
- [Payout models](#payout-models)
- [Disqualification rules](#disqualification-rules)
- [Testing](#testing)
- [Deployment](#deployment)
- [Docs](#docs)
- [License](#license)

---

## What makes it different

| Problem with legacy influencer platforms | DASHH's answer |
| --- | --- |
| Fake views inflate payouts | zkTLS proofs pulled directly from the platform, not screenshots |
| Platforms take 20–40% and hold funds | 20% fee signed into the terms, on-chain escrow, no custody |
| Admins mediate disputes subjectively | 13 deterministic disqualification rules, baked into code |
| Creators re-submit proofs, risk double-pay | Delta-aware payout math — paid once for each new view |
| Brand/creator trust drift over time | Two proofs per campaign: a join proof and a final-window proof |

---

## The two-proof settlement model

Every campaign has exactly **two proof checkpoints per creator**, and payouts
only settle once both land:

1. **Join proof** — at the moment the creator joins the campaign, they prove
   ownership of the social account via Reclaim's zkTLS provider. This locks the
   baseline metrics (views, follower count, caption content).
2. **Final proof** — during a **7-day window after the campaign ends**, the
   creator returns and submits a second proof. This captures the final state.

The difference between the two proofs is what gets paid. Any creator who
doesn't return inside the window is auto-disqualified and their share rolls
back into the residual pool. No human decides — the code does.

See `src/lib/settlement.ts` and `src/lib/payouts.ts`.

---

## Stack

- **Framework** — Next.js 14 (App Router, Route Groups, Server Actions)
- **Language** — TypeScript end-to-end
- **DB** — Neon Postgres + Drizzle ORM (serverless)
- **Auth** — Sign-In With Solana (SIWS) + HMAC-signed JWT cookies
- **Chain** — Solana Web3.js, Phantom Wallet, Solana Actions / Blinks
- **Verification** — Reclaim Protocol zkTLS (Instagram, YouTube, X, TikTok)
- **Storage** — Arweave / Irys for permanent proof bundles
- **UI** — Tailwind CSS, shadcn/ui, Framer Motion
- **Validation** — Zod schemas at every API boundary
- **Testing** — Vitest (45 tests across 6 files)
- **CI/CD** — GitHub Actions, Vercel, Vercel Cron

---

## Getting started

```bash
# 1. Clone
git clone https://github.com/alphoder/Dashhnew.git
cd Dashhnew

# 2. Install
npm install

# 3. Configure secrets
cp .env.example .env
# fill in DATABASE_URL, SIWS_SESSION_SECRET, Reclaim IDs, Solana recipient, etc.

# 4. Push schema + seed
npx drizzle-kit push
node scripts/seed.mjs

# 5. Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You need Phantom on
**Devnet** and some devnet SOL to test the full flow.

---

## Environment variables

See `.env.example` for the full list. The critical ones:

| Key | Purpose |
| --- | --- |
| `DATABASE_URL` | Neon Postgres connection string (pooled) |
| `SIWS_SESSION_SECRET` | 32+ char secret for signing auth cookies |
| `NEXT_PUBLIC_APP_URL` | Public URL, used by Solana Actions metadata |
| `NEXT_PUBLIC_SOLANA_CLUSTER` | `devnet` or `mainnet-beta` |
| `NEXT_PUBLIC_SOLANA_RPC` | RPC endpoint |
| `SOLANA_RECIPIENT_ADDRESS` | Platform-fee receiver |
| `NEXT_PUBLIC_RECLAIM_APP_ID` / `_APP_SECRET` | Reclaim app credentials |
| `NEXT_PUBLIC_RECLAIM_PROVIDER_ID_{INSTAGRAM,YOUTUBE,TWITTER,TIKTOK}` | Per-platform zkTLS providers |
| `IRYS_PRIVATE_KEY` | Optional — Arweave uploader key |

---

## Scripts

```bash
npm run dev           # Next.js dev server
npm run build         # Production build
npm run start         # Production server
npm run lint          # ESLint
npm run typecheck     # tsc --noEmit
npm run test          # Vitest
npx drizzle-kit push  # Sync schema to Neon
node scripts/seed.mjs # Idempotent seed (8 campaigns, 5 creators, 23 proofs)
```

---

## Project structure

```
src/
├─ app/
│  ├─ (app)/                 # Authenticated app shell — dashboard, discover,
│  │                         # leaderboard, form, analytics, creatordashboard
│  ├─ api/
│  │  ├─ v2/                 # v2 endpoints: campaigns, proofs, settle, sync
│  │  ├─ auth/               # SIWS nonce + verify
│  │  └─ ...                 # legacy Solana Action endpoints
│  ├─ how-it-works/          # Public flow walkthrough
│  └─ page.tsx               # Landing page
├─ components/
│  ├─ motion/                # FadeIn, Stagger, CountUp, HoverLift, ModeTransition
│  ├─ app-sidebar.tsx        # Mode-aware sidebar
│  └─ ...
├─ lib/
│  ├─ modes.ts               # Explore / Create mode — single source of truth
│  ├─ settlement.ts          # Two-proof routing + final-window logic
│  ├─ payouts.ts             # Delta-aware payout math, 4 payment models
│  ├─ terms.ts               # Signed T&C, ban policy, disqualification list
│  ├─ reclaim/               # Multi-platform zkTLS adapters + verifier
│  ├─ solana/                # Web3 helpers
│  ├─ auth/                  # SIWS cookie session
│  └─ db/                    # Drizzle schema + client
├─ hooks/
└─ tests/                    # Vitest suites
docs/
├─ PROJECT.md                # Full architecture doc
├─ VIVA_PREP.md / .pdf       # Viva prep pack (90 Q&As across 5 partitions)
scripts/
├─ seed.mjs                  # Neon seeder
└─ viva-to-pdf.py            # Markdown → styled PDF
```

---

## Payout models

Configured per campaign:

- **`per_view`** — flat rate × verified view delta.
- **`top_performer`** — winner-takes-all above a floor.
- **`split_top_n`** — prize pool split across top N by views.
- **`equal_split`** — fixed per-creator share.

All four route through the same `computePayoutForProof()` so double-submission
can never double-pay.

---

## Disqualification rules

13 deterministic rules live in `src/lib/terms.ts` (`DISQUALIFICATION_REASONS`).
Summary:

1. Missing required hashtag / mention / phrase from the brand's terms
2. Caption doesn't reference the campaign
3. Account switched / handle changed between join and final proof
4. View count drops (indicative of deletion)
5. Final proof missed — outside the 7-day window
6. Duplicate proof (same social URL on two campaigns)
7. View-bot signatures (velocity anomalies above platform thresholds)
8. Private / deleted post at settlement time
9. Content mismatch (campaign is about X, post is about Y)
10. Caption engagement-farming (banned-phrase list)
11. Self-engagement ring detected
12. Brand-side fraud signals (flagged by Reclaim adapter)
13. T&C not signed or signed-wallet mismatch

Three strikes across campaigns → **90-day ban**, enforced at join time.

---

## Testing

```bash
npm run test
```

45 tests across 6 files covering: payout delta math, settlement window logic,
mode derivation, terms builders, ban evaluation, and reclaim verify rules.

CI runs lint + typecheck + tests + build on every push via
`.github/workflows/ci.yml`.

---

## Deployment

**Vercel:**

1. Import the repo at [vercel.com/new](https://vercel.com/new).
2. Framework preset: **Next.js** (auto-detected).
3. Add every variable from `.env.example` under **Project → Settings → Environment Variables**.
4. Deploy.

**Cron** (already wired in `vercel.json`):

| Path | Schedule | Purpose |
| --- | --- | --- |
| `/api/v2/sync` | every 30 min | Poll public APIs for display-only view updates |
| `/api/v2/settle` | every 6 h | Trigger settlement for campaigns past the 7-day window |

Cron never moves money directly — it only queues settlements that still require
the creator's final zkTLS proof.

---

## Docs

- `docs/PROJECT.md` — full architecture, decisions, problems-and-fixes log.
- `docs/VIVA_PREP.md` + `VIVA_PREP.pdf` — partition-wise viva prep for the
  5-person team (90 Q&As).
- `/how-it-works` — the live visual walkthrough for end-users.

---

## License

MIT — see `LICENSE` if present, otherwise assume MIT for this academic project.

---

Built for the SGSITS UG Major Project, 2025-26.
