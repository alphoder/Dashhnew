# DASHH

> Peer-to-peer, zkTLS-verified influencer marketing settled on Solana.
> No middlemen. No admins. No fake views.

![Status: Devnet, mainnet-pending](https://img.shields.io/badge/Status-Solana%20Devnet-9945FF?style=flat-square)
![Stack: Next.js 14 + TypeScript](https://img.shields.io/badge/Stack-Next.js%2014%20%2B%20TS-000?style=flat-square&logo=next.js)
![Solana: Devnet](https://img.shields.io/badge/Solana-Devnet-14F195?style=flat-square&logo=solana&logoColor=000)
![Reclaim: 4 platforms](https://img.shields.io/badge/Reclaim-zkTLS-9945FF?style=flat-square)
![Tests: 45 passing](https://img.shields.io/badge/Tests-45%20passing-14F195?style=flat-square)
![Builder: Solo](https://img.shields.io/badge/Builder-Solo-zinc?style=flat-square)

DASHH is a decentralised advertising platform that connects brands
directly to creators using **Reclaim Protocol's zkTLS proofs** for
real-time engagement verification and **Solana** for instant on-chain
settlement. Brands escrow their budget, creators post content and submit
cryptographic proofs of their views, and the platform pays out only the
verified delta — no platform-reported metrics, no manual reconciliation,
no fraud surface.

**Live:** <https://dashhnew.vercel.app>
**Builder:** Vedant Singh ([@dashhhee](https://x.com/dashhhee) ·
[vedant1609singh@gmail.com](mailto:vedant1609singh@gmail.com))

---

## What's inside

- 🔐 **Sign-In With Solana (SIWS)** with HMAC-signed JWT cookies
- ⚡️ **22+ versioned REST endpoints** under `/api/v2/*` with Zod
  validation and per-wallet + per-IP rate limiting
- 🧠 **Two-proof settlement model** — Join Proof + Final Proof in a
  7-day window, with delta-aware payout math
- 🚫 **13-rule disqualification pipeline** + 3-strike ban policy,
  fully deterministic
- 💸 **Four payment models** — per-view, top-performer, split-top-N,
  equal-split
- 🪞 **Brand auto-refund** when no creator submits a final proof
- 📜 **Solana Actions / Blinks** support for sharing campaigns outside
  the app
- 🧾 **Arweave anchoring** of every verified proof for permanent audit
- 📊 Live brand + creator dashboards, public case studies, FAQ, docs
- 🛡️ **Sentry, PostHog, Cloudflare Turnstile, kill-switch** all wired
  (gated by env vars — no-op until configured)

---

## Quick start

```bash
git clone <this repo>          # private — accept the invite first
cd major-project-
npm install
cp .env.example .env           # fill in DATABASE_URL + Reclaim keys
npx drizzle-kit push           # set up the schema in Neon
npm run dev                    # → http://localhost:3000
```

Required env vars (see `.env.example` for the full list):

```
DATABASE_URL                                   # Neon Postgres
SIWS_SESSION_SECRET                            # 32-byte hex
NEXT_PUBLIC_APP_URL                            # public URL
NEXT_PUBLIC_SOLANA_CLUSTER                     # devnet | mainnet-beta
NEXT_PUBLIC_SOLANA_RPC                         # RPC endpoint
SOLANA_RECIPIENT_ADDRESS                       # platform wallet
NEXT_PUBLIC_RECLAIM_APP_ID
NEXT_PUBLIC_RECLAIM_APP_SECRET
NEXT_PUBLIC_RECLAIM_PROVIDER_ID_INSTAGRAM
NEXT_PUBLIC_RECLAIM_PROVIDER_ID_YOUTUBE
NEXT_PUBLIC_RECLAIM_PROVIDER_ID_TWITTER
NEXT_PUBLIC_RECLAIM_PROVIDER_ID_TIKTOK
```

Optional but recommended for production:

```
PLATFORM_SIGNING_KEY                           # base58 secret key for payouts
CRON_SECRET                                    # gates /api/v2/settle
NEXT_PUBLIC_SENTRY_DSN                         # error monitoring
NEXT_PUBLIC_POSTHOG_KEY                        # analytics
TURNSTILE_SECRET                               # CAPTCHA on form
DASHH_KILL_SWITCH=true                         # halt all writes (operational)
```

---

## Architecture

```
src/
├─ app/
│  ├─ (app)/                  # authenticated app shell — sidebar + mode toggle
│  │  ├─ analytics/           # brand analytics dashboard
│  │  ├─ creatordashboard/    # brand-side dashboard (legacy v1)
│  │  ├─ dashboard/           # creator-side earnings (v2)
│  │  ├─ discover/            # campaign browse + verified-brands filter
│  │  ├─ form/                # campaign create (template picker + payment model)
│  │  ├─ leaderboard/         # top creators
│  │  ├─ notifications/       # in-app notification feed
│  │  ├─ onboarding/          # 4-step wizard
│  │  └─ terms/               # T&C + disqualification rules
│  ├─ api/
│  │  ├─ auth/                # SIWS nonce / verify / me / logout
│  │  ├─ donate/[id]/         # Solana Actions / Blinks endpoint
│  │  └─ v2/                  # canonical product API
│  │     ├─ analytics/
│  │     ├─ campaigns/
│  │     │   └─ [id]/{participate,cancel,refund,leaderboard}/
│  │     ├─ creators/me/
│  │     ├─ notifications/
│  │     ├─ proofs/
│  │     ├─ referrals/me/
│  │     ├─ settle/           # cron-driven settlement runner
│  │     └─ sync/             # public-API view-count poll
│  ├─ case-studies/           # public case study pages
│  ├─ docs/                   # lightweight docs site
│  ├─ embed/campaign/[id]/    # iframe-able campaign widget
│  ├─ invoice/[campaignId]/   # print-friendly brand invoice
│  ├─ legal/                  # Privacy / Terms / Cookies
│  ├─ og/                     # dynamic Open Graph image generator
│  └─ verifyClaim/[uid]/      # Reclaim zkTLS proof submission UI
├─ components/
│  ├─ landing/                # LiveMetrics, CompareTable, FAQ
│  ├─ motion/                 # FadeIn, Stagger, CountUp, HoverLift
│  └─ ui/                     # Skeleton, EmptyState, ErrorState, StatCard, ...
└─ lib/
   ├─ auth/session.ts         # SIWS HMAC session
   ├─ db/                     # Drizzle schemas (v1 + v2)
   ├─ reclaim/                # zkTLS adapters + 13-rule verify
   ├─ solana/escrow.ts        # SystemProgram.transfer + signing
   ├─ blink-url.ts            # deployment-agnostic Blink URL builder
   ├─ captcha.ts              # Cloudflare Turnstile verify
   ├─ kill-switch.ts          # operational halt-all-writes
   ├─ modes.ts                # Explore / Create — single source of truth
   ├─ payouts.ts              # computePayoutForProof — 4 models
   ├─ posthog.ts              # consent-gated analytics
   ├─ ratelimit.ts            # token-bucket + LIMITS + walletKey()
   ├─ settlement.ts           # routeProofByWindow, readyToSettle
   └─ terms.ts                # signed T&C + 13 disqualification rules
```

Database tables (all `_v2` suffixed): `profiles_v2`, `campaigns_v2`,
`participations_v2`, `proofs_v2`, `payouts_v2`, `notifications_v2`.

---

## Common commands

```bash
npm run dev                   # local dev (port 3000)
npm run build                 # production build
npm test                      # 45 Vitest tests across 6 files
npm run typecheck             # tsc --noEmit

npx drizzle-kit push          # apply schema to live DB
npx drizzle-kit generate      # generate migration SQL
node scripts/seed.mjs         # seed with 8 campaigns, 5 creators, 23 proofs

vercel deploy --prod --yes    # push to production
```

---

## Documentation

| Document | What it covers |
| --- | --- |
| `docs/PROJECT.md` | Architecture deep-dive, design decisions, problem log |
| `docs/PRODUCTION_ROADMAP.md` | Every remaining task tagged P0–P4, paste-ready prompts |
| `docs/SECURITY.md` | Threat model, multisig migration runbook, ops runbooks |
| `docs/strategy/` | Grant applications (Reclaim, Superteam, Solana Foundation), 28-day Twitter calendar, Founder NFT spec |

On-site docs: <https://dashhnew.vercel.app/docs>

---

## Status

- ✅ **Devnet:** live, fully functional end-to-end (form → join →
  proof → settle → payout)
- ✅ **45/45 Vitest tests** passing on CI
- ⏳ **Mainnet:** gated on (a) audited Anchor escrow program, (b)
  Squads multisig on the platform wallet, (c) basic KYB on high-value
  brands. See `docs/PRODUCTION_ROADMAP.md` P2.1, P2.2, P4.2.
- ⏳ **Founder NFT mint:** planned for after 300+ Twitter followers and
  one real-brand case study. Spec in `docs/strategy/founder-pass-spec.md`.

---

## Contact

- **Email:** [vedant1609singh@gmail.com](mailto:vedant1609singh@gmail.com)
- **Twitter:** [@dashhhee](https://x.com/dashhhee)
- **Solana wallet (grant + bounty receive):**
  `7ZyHfVPKqQN67LtQ6Drr1WhLfpYwbmAzQ5v8xpsAvqve`

If you're a grant reviewer, brand interested in piloting, or builder
working on adjacent infrastructure — DM works, email is fine, anything
goes.

---

*MIT licensed. Built solo by Vedant Singh, Indore.*
