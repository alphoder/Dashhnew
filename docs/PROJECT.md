# DASHH — Project Documentation

> Everything about the project — what it is, why each decision was made, which
> problems we hit, how we solved them, and how the finished system actually
> works. This is the one document to read if you want the full picture.

---

## Table of contents

1. [What DASHH is](#1-what-dashh-is)
2. [The trust problem we had to solve](#2-the-trust-problem-we-had-to-solve)
3. [Final end-to-end flow](#3-final-end-to-end-flow)
4. [Problems we hit & how we solved them](#4-problems-we-hit--how-we-solved-them)
5. [Tech stack](#5-tech-stack)
6. [Architecture](#6-architecture)
7. [Database schema](#7-database-schema)
8. [API reference](#8-api-reference)
9. [File map](#9-file-map)
10. [Running locally](#10-running-locally)
11. [Tests & CI](#11-tests--ci)
12. [What's still missing for full production](#12-whats-still-missing-for-full-production)
13. [Glossary](#13-glossary)

---

## 1. What DASHH is

**DASHH is a peer-to-peer marketplace where brands pay micro-influencers only
for cryptographically-verified real engagement on social media, settled on
Solana.**

There are two sides:

- **Brands** — fund campaigns in a Solana escrow, set budget & payment model,
  get verified engagement. Pay a flat 20 % platform fee.
- **Creators** — join campaigns, post content on Instagram / YouTube / X /
  TikTok, and submit zkTLS proofs of their engagement. Paid on-chain when
  proofs verify.

No admin sits in the middle. Disputes are resolved by cryptography, not a
support queue.

---

## 2. The trust problem we had to solve

The defining design question was: *"how do we make sure a creator can't fake
their views, post someone else's content, or pump a bot farm?"*

We evolved through three models:

### Model A — **Single proof, paid immediately** (v1's behaviour)
Simple but broken. A creator could submit one view count and get paid even
if half those views were bots that Instagram later rolled back.

### Model B — **One proof + rolling trust + auto-sync**
Creator runs Reclaim once, we poll the platform's public view counter, and
auto-pay on the delta. Added 5 heuristic guardrails (spike cap, velocity
ratio, engagement ratio, time window, view drop) to catch obvious attacks.

Problem: approximately-correct. Heuristics can be gamed under the thresholds.
Payouts are a Solana tx — once confirmed, irreversible. If bots inflated the
counter and the platform rolled them back later, we'd have already paid.

### Model C — **Two-proof settlement** ← the one we shipped
Exactly two Reclaim proofs per campaign per creator:

- **Proof #1 (join)** — during the campaign. Anchors ownership + baseline
  views. No payout yet.
- **Proof #2 (final)** — inside a 7-day window after campaign end. Captures
  the post-rollback view count. Triggers the on-chain payout.

Why this wins:
1. **Bot-farm views get rolled back by platforms within days.** The final
   proof captures the stable number.
2. **Incentive is self-aligning.** Honest creators want the final proof —
   that's how they get paid. Bot-farm creators *can't* pass the final proof
   because their inflated counts will have dropped.
3. **Payment is cryptographically final at the boundary.** No heuristic
   guessing; the money only moves on a fresh proof.
4. **Small UX cost** — 2 verifications per campaign vs 1–3 in Model B.
5. **Simpler code** — fewer moving parts, smaller attack surface.

**The public-API polling is kept**, but *display-only*. It shows creators
their running view count + nudges them before deadlines. It doesn't move any
money.

---

## 3. Final end-to-end flow

### Brand journey
```
1. Onboarding → pick role "Brand" → connect Phantom → platform
2. /form → fill campaign details (title, image, description, platform,
   budget, cpv, end date)
3. Pick payment model:
     · per_view       — every verified view pays cpv SOL up to budget
     · top_performer  — top-viewed creator takes the whole creator pool
     · split_top_n    — top N creators split equally
     · equal_split    — every verified creator gets equal share
4. (Optional) Content-match rules: required hashtag / mention / phrase
5. See live fee math: Budget · Platform 20% · Creator pool 80%
6. Tick T&C → Phantom signs a human-readable terms message
7. Second Phantom popup funds the escrow (SystemProgram.transfer on devnet;
   a real escrow program is future work)
8. Share dialog with the dial.to Blink URL + social share buttons
9. Watch /analytics for stats
```

### Creator journey
```
1. Onboarding → pick role "Creator" → connect Phantom → platform → handle
2. /discover (Feed) — browse active campaigns
3. Click a card → CampaignDetailsModal opens with:
     · Full description + hero image
     · Payment model explained in plain English
     · Fee breakdown (Budget / 20% platform / 80% creator pool)
     · Terms signed by the brand (auditable)
     · Per-campaign leaderboard
     · Disqualification rules (red-bordered)
     · T&C checkbox (must be ticked)
4. Click "Sign terms & join" → Phantom pops up → signature stored
5. Creator posts content on their real social account, including the
   required hashtag / mention / phrase
6. /verifyClaim/[id] — run Reclaim → generates zkTLS proof → POSTs to
   /api/v2/proofs
7. That's their JOIN proof. Participation is anchored.
8. Sync cron (every 30 min) polls the public view counter and shows
   pending views in the UI. No payment yet.
9. Campaign endsAt passes → a 7-day settlement window opens
10. Creator returns, runs Reclaim again → FINAL proof lands
11. Settlement cron (every 6h) processes completed campaigns:
     · Creators with a final proof → payout per model
     · Creators without → forfeited
     · Campaign marked settled
12. Payout queued; next block Solana tx discharges SOL to the creator's
    wallet (escrow release is future work; currently DB-only)
```

### Visual timeline

```
Campaign  ┬──────────── active ─────────────┬──── 7d settle ───┬── settled
          │                                 │                  │
Brand:    ┤ create+sign+fund                                   │ (done)
                                            │                  │
Creator:  ┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─ join proof │                  │
          │                                 │                  │
          │                                 ├── final proof ─► │ PAYOUT
          │                                 │                  │
          │                                 │    no final ────►│ FORFEIT
                                            │                  │
                                            │ cron settles     │
```

---

## 4. Problems we hit & how we solved them

We iterated on the app over the course of the project. These are the concrete
problems that came up and how each was resolved.

### 4.1 Thirteen broken buttons
**Problem:** v1 had ~13 dead buttons (`href="#"`, `onClick` missing, or
console-log-only).
**Solution:** Full audit, fixed every button:
- `hero-section` "Connect Us" → routed to onboarding
- `verifyClaim` "Verify Tweets Insights" → platform-specific provider ID
- `highlights-section` buttons → real handlers
- `creator-login` → Phantom connect flow
- `product-form` → real POST, fixed `"''"` initialiser bug
- Footer's 13 `href="#"` → real routes or "coming soon" toasts

### 4.2 Naming ambiguity — "User" vs "Creator"
**Problem:** V1 toggle said "User / Creator" which didn't map cleanly to
what the pages do.
**Solution:** Renamed to verb-based labels **"Explore / Create"** in a new
`RoleToggle` component with icon. Backed by a single-source-of-truth
`src/lib/modes.ts` and `useMode()` hook so sidebar and header can never
drift.

### 4.3 Sidebar-header drift on neutral routes
**Problem:** Visiting `/analytics` or `/notifications` flipped the header pill
to "Explore" even though analytics is a Create page.
**Solution:** Single `deriveMode()` helper. Routes classified into
EXPLORE_ROUTES / CREATE_ROUTES / NEUTRAL_ROUTES. Neutral routes preserve the
user's last explicit mode.

### 4.4 Admin panel broke the peer-to-peer story
**Problem:** There was an admin page for dispute moderation.
**Solution:** Deleted it. DASHH is peer-to-peer — disqualifications are
triggered by failed Reclaim proofs, not human review. Ban policy is
automatic.

### 4.5 Campaigns opened with no context
**Problem:** "Join campaign" fired immediately from a card with only a
truncated description. No transparency for the creator.
**Solution:** Built `CampaignDetailsModal` that fetches full data and shows:
- Full hero + description
- 4 stat tiles
- Payment model explained
- 3-column fee breakdown
- Brand's signed terms attestation
- Per-campaign leaderboard
- Disqualification rules (red-bordered) + mandatory T&C checkbox
- "Sign terms & join" button (disabled until agreed)

### 4.6 Campaign creation was "throw money over the wall"
**Problem:** The v1 form had no payment-model options, no platform-fee
visibility, no terms signing.
**Solution:** Rebuilt `/form` to include:
- Payment-model picker (4 models)
- Top-N input (conditional on split_top_n)
- Live fee math (20% platform, 80% creator pool)
- Content-match fields (hashtag / mention / phrase)
- T&C checkbox + Phantom signMessage for acknowledgement
- Two-step submit: sign terms, then fund escrow

### 4.7 Creators could submit proofs for content they didn't own
**Problem:** zkTLS guarantees the data came from the platform, but doesn't
enforce the post owner matches the session user. A creator could claim
someone else's viral post.
**Solution:** Extended Reclaim adapters to extract `ownerHandle`. The verify
pipeline rejects (severe → instant ban) if `ownerHandle !== handle`.

### 4.8 Old posts could be re-submitted to new campaigns
**Problem:** A creator could submit a 2019 viral post to a 2025 campaign.
**Solution:** Extract `postCreatedAt` from the proof. Verify pipeline rejects
if `post.createdAt < campaign.startsAt`.

### 4.9 Creators could post unrelated content and still claim
**Problem:** A creator could post anything — even if it didn't mention the
brand — and still submit a valid proof of their own views.
**Solution:**
- Brand-defined `requiredHashtag`, `requiredMention`, `requiredPhrase` on
  the campaign.
- Adapter extracts `caption` from the proof.
- Verify pipeline rejects if any required marker is missing from the caption.

### 4.10 Bot velocity and zero-engagement spikes
**Problem:** A creator could buy 10 k bot views and submit a proof.
**Solution:** Heuristic guards in `verify.ts`:
- First-proof spike > 100 k views → warn (held for review)
- Views ≥ 10 k with 0 likes/comments → warn
- Views/engagement ratio > 500 → warn
- View count decreases between proofs → reject

These filter obvious patterns but aren't the primary defense. That's the
2-proof model (4.22).

### 4.11 Double-payouts on proof resubmission
**Problem:** If a creator submitted 1 k views, got paid, then resubmitted 5 k
views, the naive code paid another 5 k × cpv — double-counting the original
1 k.
**Solution:** `src/lib/payouts.ts` `computePayoutForProof()` pays on the
DELTA only, caps at remaining campaign budget, and defers pool-based models
to settlement.

### 4.12 Proofs weren't permanent
**Problem:** Raw Reclaim proofs lived only in the Postgres `proofs_v2` table.
If that DB was tampered with, proof-of-fraud would vanish.
**Solution:** `src/lib/arweave.ts` anchors every verified proof to Arweave
via Irys. The Arweave tx id is stored on the proof row. Permanent public
record.

### 4.13 Missing SIWS auth on mutating routes
**Problem:** Anyone could POST to `/api/v2/campaigns/[id]/participate` with
any wallet address.
**Solution:** Session guards via `getSession()` from SIWS JWT cookie. Posts
require the session's wallet to match the payload wallet.

### 4.14 `/verifyClaim` broke with a pino-pretty SSR error
**Problem:** `@reclaimprotocol/js-sdk` imports `pino` which requires
`pino-pretty` as a server-side transport. Next.js SSR couldn't bundle it.
**Solution:** Dynamic `await import('@reclaimprotocol/js-sdk')` inside the
click handler. SDK never hits the SSR bundle.

### 4.15 Leaderboard didn't render despite data
**Problem:** Global leaderboard endpoint returned 5 rows but the page still
looked empty on first load.
**Solution:** Rebuilt the page with tiers, podium, XP bars, "your rank"
card, and badges. The data was always there — the flat table just made it
feel broken.

### 4.16 No per-campaign leaderboard
**Problem:** Top performers were only visible globally, not per campaign.
**Solution:** New `/api/v2/campaigns/[id]/leaderboard` endpoint + a "Top
participants" section in the CampaignDetailsModal.

### 4.17 Creators could resubmit on every view update → constant re-verify fatigue
**Problem:** If views grow constantly, does the creator need to run Reclaim
every hour?
**Solution:** Public-API sync polling. Pending views update every 30 min
automatically; creator only re-verifies when it's worth their time — OR
under the 2-proof model, never more than twice per campaign.

### 4.18 The "verify once, trust-mode auto-pay" model
**Problem:** Continuous auto-payouts were convenient but allowed bot views
to slip through until the platform rolled them back.
**Solution:** Scrapped auto-pay. Kept the polling as display-only. Replaced
with the 2-proof settlement model (see 4.22).

### 4.19 No forfeiture rule — budgets could sit unclaimed forever
**Problem:** If a creator joined but never came back, their share locked up
the brand's escrow.
**Solution:** 7-day settlement window after `endsAt`. Miss it → forfeited.
Cron `/api/v2/settle` handles it.

### 4.20 Bans needed a concrete policy, not just a flag
**Problem:** T&C mentioned bans but had no formal threshold.
**Solution:** `BAN_POLICY` in `lib/terms.ts`: 3 disqualifications in 90 days
OR a single severe offence (impersonation, bot ring, coordinated fraud).
`profiles_v2.banned` is flipped automatically; all mutating routes reject
banned wallets.

### 4.21 13 disqualification grounds — and T&C only listed 7
**Problem:** Code enforced more checks than the T&C disclosed.
**Solution:** Expanded `DISQUALIFICATION_REASONS` in `lib/terms.ts` to 13
offences that exactly mirror what the verifier enforces. The `/terms` page
renders from the same constant.

### 4.22 The final trust model — two proofs per campaign
**Problem:** Even with all of 4.7–4.11 in place, Model B (rolling trust +
auto-pay) left a window where bot views could be paid before the platform's
bot-detection caught up. Not acceptable for a brand-trust product.
**Solution:** Model C (2-proof settlement). Described above in §2. Enforced
in:
- `lib/settlement.ts` — `routeProofByWindow()`
- `/api/v2/proofs` — routes each proof as JOIN or FINAL
- `/api/v2/settle` — cron that closes campaigns, forfeits missed, distributes
  pool-based payouts
- UI banners reflect each state (Join due / Final due / Forfeited)

### 4.23 Typography was a mess
**Problem:** Pages used a dozen different heading sizes; fonts were
default-sans.
**Solution:** Defined a type scale in `globals.css` (`.h-display`,
`.h-main`, `.h-section`, `.h-card`, `.eyebrow`, `.body`, `.body-muted`).
Space Grotesk for headings, Inter for body, Google-Fonts-loaded.

### 4.24 The whole app was pink-coral — off-brand for a Solana app
**Problem:** v1 used `#ff9a9e → #a855f7` gradient everywhere.
**Solution:** Solana Native palette: `#9945FF` (purple) + `#14F195` (mint)
on `#000000`. Swept across every gradient + pink-* class in 40+ files.

### 4.25 Production-readiness gaps
**Problem:** The README promised features that weren't wired.
**Solution:** Closed the gaps:
- SIWS auth + session cookies
- Zod validation on every API route
- In-memory rate limiter (Upstash-ready)
- Arweave anchoring
- Multi-platform Reclaim adapters (IG/YT/X/TikTok)
- Vitest test suite (45 tests across 6 files)
- GitHub Actions CI (lint/typecheck/test/build)
- Vercel cron for `/api/v2/sync` + `/api/v2/settle`
- Seed script for demo data (8 campaigns, 23 proofs, 10 notifications)

### 4.26 Open bugs that are still real
- No on-chain Solana escrow program deployed — payout rows are DB-only
  until a real escrow program lands (future Anchor work).
- Rate limiter is in-memory; swap for Upstash on horizontal scale.
- No Playwright E2E yet (unit coverage only).
- `instagram`/`twitter`/`tiktok` polling are no-ops until their API keys are
  configured; YouTube uses the free Data API v3.

---

## 5. Tech stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS |
| UI primitives | shadcn/ui, lucide-react icons, Framer Motion |
| Design system | Custom Solana-native palette (`#9945FF` + `#14F195`) |
| Database | Neon Postgres (serverless) |
| ORM | Drizzle |
| Auth | SIWS (Sign In With Solana) → HMAC-signed JWT cookie |
| Web3 | `@solana/web3.js`, `@solana/actions` (Blinks), Phantom wallet |
| Engagement proofs | Reclaim Protocol zkTLS SDK, per-platform adapters |
| Proof anchoring | Irys → Arweave |
| Validation | Zod |
| Rate limit | In-memory (dev) / Upstash (prod swap) |
| Testing | Vitest |
| CI | GitHub Actions (lint + typecheck + test + build) |
| Cron | Vercel Cron (`/api/v2/sync` 30 min, `/api/v2/settle` 6 h) |

---

## 6. Architecture

```
                    ┌────────────────────┐
                    │   Creator / Brand  │
                    │   Phantom wallet   │
                    └──────────┬─────────┘
                               │ SIWS sign-in
                               │ + signed T&C
                               ▼
┌───────────────────────────────────────────────────────────────┐
│              Next.js 14 (App Router)                           │
│                                                                │
│  (app)/                               api/v2/                  │
│    dashboard   ← Explore mode          campaigns/              │
│    creatordb   ← Create mode              /[id]/participate    │
│    discover                               /[id]/leaderboard    │
│    analytics                           proofs/                 │
│    leaderboard                         settle/                 │
│    notifications                       sync/                   │
│    terms                               notifications/          │
│    onboarding                          analytics/summary       │
│    form                                leaderboard             │
│                                                                │
│  Components:                          Libs:                    │
│    campaign-card / modal               auth/siws               │
│    pending-views-banner                db/schema-v2            │
│    leaderboard podium                  reclaim/* (4 adapters)  │
│    role-toggle                         reclaim/verify          │
│    app-sidebar (mode-aware)            settlement              │
│                                        payouts                 │
│                                        terms (+ban policy)     │
│                                        tiers (gamification)    │
│                                        trust (sync guardrails) │
│                                        arweave                 │
│                                        platform-poll           │
│                                        modes + useMode hook    │
└──────┬────────────────────┬─────────────────────┬─────────────┘
       │                    │                     │
       ▼                    ▼                     ▼
┌─────────────┐    ┌─────────────────┐   ┌─────────────────┐
│ Neon (PG)   │    │ Reclaim Protocol│   │  Solana devnet  │
│ Drizzle     │    │ zkTLS proofs    │   │  Phantom + Blinks│
│             │    │                 │   │  SystemProgram. │
│ Arweave via │◄───│ raw proof       │   │  transfer       │
│ Irys (perm) │    │ anchored        │   │                 │
└─────────────┘    └─────────────────┘   └─────────────────┘
```

---

## 7. Database schema

Both **v1** (`creators`, `users`) and **v2** tables live side by side —
additive, non-destructive migration. The v2 tables drive the new flow:

```
profiles_v2
  id, wallet, role, displayName, avatarUrl, bio
  instagramHandle / youtubeHandle / twitterHandle / tiktokHandle
  reputation, totalEarned
  banned, banReason, bannedAt, disqualificationCount

campaigns_v2
  id, brandWallet, title, description, platform, iconUrl, ctaLabel
  budget, cpv, escrowPubkey, status
  paymentModel, topNCount, platformFeeBps
  termsVersion, termsSignature, termsSignedAt
  requiredHashtag, requiredMention, requiredPhrase
  startsAt, endsAt, settlementWindowDays, settledAt

participations_v2
  id, campaignId, creatorWallet, postUrl
  termsVersion, termsSignature, termsSignedAt
  disqualified, disqualificationReason, disqualifiedAt
  pendingViews, lastSyncedAt
  trustMode, trustedUntil, lastProofCheckpointAt (display-only auto-sync)
  joinProofId, finalProofId        ← 2-proof settlement anchors
  settlementStatus, settledAt, forfeited
  joinedAt

proofs_v2
  id, participationId, reclaimProofId, arweaveTx
  verifiedViews, rawProof (jsonb), status, verifiedAt, createdAt

payouts_v2
  id, proofId, amount, txSig, status, paidAt, createdAt

notifications_v2
  id, wallet, kind, title, body, payload (jsonb), readAt, createdAt
```

Notification `kind` values in use:
`proof_join_recorded · proof_final_recorded · proof_verified · proof_rejected ·
proof_flagged · banned · payout_sent · participation_joined · join_proof_due ·
final_proof_due · pending_views · forfeited · settled`

---

## 8. API reference

### Auth
- `GET /api/auth/nonce?address=<pubkey>` → `{ nonce, message }`
- `POST /api/auth/verify` — body: `{ address, signature, nonce, role }` → sets cookie
- `POST /api/auth/logout`
- `GET /api/auth/me` → `{ session }`

### Campaigns
- `GET /api/v2/campaigns?status=active&platform=instagram&brand=<wallet>`
- `POST /api/v2/campaigns` — brand creates (signed T&C required)
- `GET /api/v2/campaigns/[id]` — full details
- `PATCH /api/v2/campaigns/[id]` — status updates
- `POST /api/v2/campaigns/[id]/participate` — creator joins (signed T&C required)
- `GET /api/v2/campaigns/[id]/leaderboard` — per-campaign rankings

### Proofs
- `POST /api/v2/proofs` — submit join or final proof (routed by settlement window)

### Auto-sync + settlement
- `GET /api/v2/sync` — 30-min cron; polls public view counters, fires nudges
- `POST /api/v2/participations/[id]/sync` — manual single-participation sync
- `GET /api/v2/settle` — 6-hour cron; closes ripe campaigns, forfeits no-shows, distributes pool payouts

### Notifications
- `GET /api/v2/notifications?wallet=<pubkey>`
- `POST /api/v2/notifications/[id]/read`

### Analytics / Leaderboard
- `GET /api/v2/analytics/summary?wallet=<optional>` → `{ totals, verifiedPerDay, campaignsByPlatform }`
- `GET /api/v2/leaderboard` → top creators by verified engagement

---

## 9. File map

```
src/
├── app/
│   ├── page.tsx                       Landing
│   ├── layout.tsx
│   ├── globals.css                    Type scale, Solana palette
│   ├── (app)/                         Authenticated shell (sidebar + header)
│   │   ├── layout.tsx
│   │   ├── dashboard/                 Explore mode
│   │   ├── creatordashboard/          Create mode (Studio)
│   │   ├── form/                      Campaign-creation wizard
│   │   ├── discover/                  Campaign feed
│   │   ├── analytics/
│   │   ├── leaderboard/               Gamified tiers + podium
│   │   ├── notifications/             Mode-aware inbox
│   │   ├── terms/                     Brand + Creator + Ban policy
│   │   ├── onboarding/                4-step wizard
│   │   └── how-it-works/              Visual flow walkthrough (new)
│   ├── verifyClaim/[uid]/             Reclaim proof generator
│   └── api/
│       ├── auth/                      SIWS
│       └── v2/                        All new endpoints
├── components/
│   ├── app-sidebar                    Mode-aware nav
│   ├── header                         RoleToggle + PrimaryCTA + Bell
│   ├── role-toggle                    Explore/Create pill
│   ├── primary-cta                    "Get Started" → becomes "Open Dashboard"
│   ├── back-bar                       Breadcrumbs
│   ├── campaign-card                  Grid tile
│   ├── campaign-details-modal         Full-info + leaderboard + T&C + sign
│   ├── pending-views-banner           Join/final proof nudges
│   ├── stat-card, bar-chart
│   └── referral-card
├── lib/
│   ├── auth/siws.ts + session.ts      SIWS + JWT cookies
│   ├── db/schema.ts + schema-v2.ts    Drizzle schemas
│   ├── reclaim/{types, adapters/*, verify}
│   ├── validation/{campaign, auth}    Zod schemas
│   ├── terms.ts                       Brand + Creator + Ban policy
│   ├── tiers.ts                       Leaderboard gamification
│   ├── trust.ts                       Auto-sync guardrails (now display-only)
│   ├── settlement.ts                  2-proof rules
│   ├── payouts.ts                     Delta-aware computation
│   ├── modes.ts + hooks/use-mode      Mode single source of truth
│   ├── ratelimit.ts                   In-memory bucket
│   ├── arweave.ts                     Irys anchoring
│   └── platform-poll.ts               Public-counter polling
tests/
├── reclaim-adapters.test.ts
├── verify.test.ts
├── payouts.test.ts
├── terms.test.ts
├── trust.test.ts
└── settlement.test.ts
docs/
└── PROJECT.md                         This file
scripts/
└── seed.mjs                           Demo data
.github/workflows/
└── ci.yml                             Lint + typecheck + test + build
vercel.json                            Cron schedules
```

---

## 10. Running locally

```bash
pnpm install                # or npm install

cp .env.example .env.local  # fill in DATABASE_URL + Reclaim creds
                            # + SIWS_SESSION_SECRET (≥32 chars)

npx drizzle-kit push        # create tables in Neon
node --env-file=.env.local scripts/seed.mjs   # demo data

npm run dev                 # http://localhost:3000
npm test                    # run the 45-test suite
npx tsc --noEmit            # typecheck
```

Demo wallets in localStorage console:
```js
// brand view
localStorage.setItem('dashh_wallet', 'BRaNdAaQkzZwQFkNpRzTJVTnMjPxYcQvxFyXmKqpHtTc')
// creator view
localStorage.setItem('dashh_wallet', 'CrEaToR1qKwQFkNpRzTJVTnMjPxYcQvxFyXmKqpHtTc')
```

---

## 11. Tests & CI

**45 unit tests across 6 files** (as of the last pass):
- `reclaim-adapters.test.ts` — each adapter parses its platform's proof shape
- `verify.test.ts` — all 8 disqualification scenarios (owner mismatch, old
  post, missing hashtag, velocity, engagement ratio, view drop, etc.)
- `payouts.test.ts` — delta-aware payment math, budget cap, deferred models
- `terms.test.ts` — constants, message builders, version strings
- `trust.test.ts` — auto-verify guardrails (legacy display-only)
- `settlement.test.ts` — 2-proof routing, deadlines, forfeiture rules

CI workflow in `.github/workflows/ci.yml`:
```yaml
on: [push, pull_request]
jobs:
  check: lint → typecheck → vitest → build
```

---

## 12. What's still missing for full production

Honest gaps a reader should know about:

1. **Real Solana escrow program** — `payouts_v2` rows are created but no
   on-chain release tx is issued. An Anchor program holding brand funds and
   releasing per verified proof is the next substantial piece of work.
2. **Platform polling APIs** — YouTube uses the free Data API v3 when a key
   is set; Instagram / X / TikTok need paid providers or OAuth flows.
3. **Sybil resistance** — phone-verify via Reclaim + wallet-age heuristics
   not yet implemented.
4. **Upstash Redis rate limiter** — in-memory bucket works for single
   instance; horizontal scale needs Upstash.
5. **Playwright E2E** — we have 45 unit tests; end-to-end Reclaim → proof
   → payout golden path is a future add.
6. **Staked ban appeals** — described in T&C but not built.
7. **Admin-free dispute flagging** — a way for brands to flag a campaign
   without reverting its payouts, triggering community re-review, is future.

---

## 13. Glossary

- **Blink** — A Solana Action URL (`dial.to/?action=…`) that lets any user
  participate in a campaign with one click, anywhere on the web.
- **zkTLS** — Zero-knowledge TLS. A cryptographic receipt that a specific
  HTTPS response came from a specific real server. Produced by Reclaim.
- **Join proof** — Reclaim proof submitted during a campaign. Anchors
  ownership. No payout.
- **Final proof** — Reclaim proof submitted in the 7-day window after a
  campaign ends. Triggers the on-chain payout.
- **Settlement** — The post-campaign finalisation: forfeit no-shows,
  distribute pool-based payouts, mark campaign `settledAt`.
- **Trust mode** — Historical flag (kept in schema for display) that
  indicated auto-verification was active. The shipped 2-proof model does
  NOT auto-pay; sync is display-only.
- **CPV** — Cost per verified view. Used by `per_view` payment model.
- **Payment models** — `per_view`, `top_performer`, `split_top_n`,
  `equal_split`. The last three settle at campaign end.
- **Platform fee** — Flat 20 % of every campaign budget goes to DASHH,
  80 % forms the creator pool. Encoded in `platformFeeBps = 2000`.

---

*This is the living doc. Update it when you change anything material.*
