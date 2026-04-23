# DASHH — Viva Preparation Pack

> **Use this with the SGSITS UG_Project_Report_Formate.pdf template.**
> Every section below mirrors a page/chapter of the template, filled in for DASHH. Copy into Word/Docs, match the template styling, export to PDF.
>
> **Session:** 2025-26 · **Team size:** 5 · **Target:** Tomorrow's viva

---

## 0. Shared facts everyone on the team MUST know

These are the five things every panel-member will be asked. Memorise them.

1. **What is DASHH?**
   *A peer-to-peer marketplace where brands pay micro-influencers only for cryptographically-verified real engagement on social media, settled on Solana. No middlemen, no admin, no fake views.*

2. **Why is it different?**
   Every payout is backed by two zkTLS proofs — one when the creator joins, one in a 7-day settlement window after the campaign ends. Platforms have cleaned up bot views by then, so only stable, real engagement gets paid.

3. **Platform fee & payment models.**
   Flat **20 %** platform fee. Four payment models: `per_view`, `top_performer` (winner takes all), `split_top_n`, `equal_split`.

4. **Stack.** Next.js 14 · TypeScript · Tailwind · shadcn/ui · Framer Motion · Drizzle ORM · Neon Postgres · Reclaim zkTLS · Solana devnet · Arweave/Irys · Vitest · GitHub Actions · Vercel Cron.

5. **Scale evidence.** 45 passing unit tests · 6 test files · full seed data (8 campaigns, 23 proofs) · 11 routes live on localhost · comprehensive CI.

---

# 1. Title page (Page i of PDF template)

Fill the template's title page with:

```
PROJECT TITLE:

  DASHH — A Peer-to-Peer Engagement Marketplace
  with zkTLS-Verified Payouts on Solana

A Project Report Submitted to
Rajiv Gandhi Proudyogiki Vishwavidyalaya, Bhopal
towards the partial fulfillment of the degree of
Bachelor of Technology
(Computer Science & Engineering)

Project Guide:                   Submitted by:
[Project Guide Name]             [Student 1 Name]  [Enroll. no.]
[Designation]                    [Student 2 Name]  [Enroll. no.]
Department of Computer Engg.     [Student 3 Name]  [Enroll. no.]
                                 [Student 4 Name]  [Enroll. no.]
Project Co-Guide:                [Student 5 Name]  [Enroll. no.]
[Co Guide Name]                  Department of Computer Engg.
[Designation]
Department of Computer Engg.

DEPARTMENT OF COMPUTER ENGINEERING
SHRI GOVINDRAM SEKSARIA INSTITUTE OF TECHNOLOGY AND SCIENCE, INDORE (M.P.)

[2025-26]
```

---

# 2. Recommendation (Page ii)

```
SHRI GOVINDRAM SEKSARIA INSTITUTE OF TECHNOLOGY AND SCIENCE,
INDORE (M.P.)
A Govt. Aided Autonomous Institute, Affiliated to RGPV, Bhopal

DEPARTMENT OF COMPUTER ENGINEERING

[SESSION: 2025-26]

RECOMMENDATION

We are pleased to recommend that the project report of phase-II entitled
"DASHH — A Peer-to-Peer Engagement Marketplace with zkTLS-Verified
Payouts on Solana" submitted by [Student 1], [Student 2], [Student 3],
[Student 4], [Student 5], students of B.Tech. IV year, may be accepted in
partial fulfillment of the degree of Bachelor of Technology, Computer
Science & Engineering of Rajiv Gandhi Proudyogiki Vishwavidyalaya,
Bhopal (M.P.) during the session 2025-26.

[Supervisor name]                    [Head of the department]
[Guide Designation]
Department of Computer Engineering
```

---

# 3. Certificate (Page iii)

```
This is to certify that the project report entitled "DASHH — A Peer-to-
Peer Engagement Marketplace with zkTLS-Verified Payouts on Solana"
submitted by [Student 1], [Student 2], [Student 3], [Student 4],
[Student 5], students of IV year B.Tech. (Computer Science & Engineering)
in the year 2025-26 of the Institute, is a satisfactory account of their
Project Phase-II work based on the syllabus.

Internal Examiner                       External Examiner
Date:                                   Date:
```

---

# 4. Declaration (Page iv)

```
DECLARATION

We, [Enroll.no.1] [Student 1], [Enroll.no.2] [Student 2],
[Enroll.no.3] [Student 3], [Enroll.no.4] [Student 4],
[Enroll.no.5] [Student 5], students of B.Tech. IV year in the session
2025-26, hereby declare that the work submitted "DASHH — A Peer-to-
Peer Engagement Marketplace with zkTLS-Verified Payouts on Solana" is
our own work conducted under the supervision of [Prof. Name],
[Guide Designation], Department of Computer Engineering, SGSITS Indore.

We further declare that to the best of our knowledge, this dissertation
work does not contain any part of any work which has been submitted for
the award of any degree or any other work either in this University or
in any other University/website without proper citation.

[Enroll.no.1] [Student 1 Name] [Signature]
[Enroll.no.2] [Student 2 Name] [Signature]
[Enroll.no.3] [Student 3 Name] [Signature]
[Enroll.no.4] [Student 4 Name] [Signature]
[Enroll.no.5] [Student 5 Name] [Signature]
```

---

# 5. Acknowledgement (Page v)

```
ACKNOWLEDGEMENT

We would like to express our sincere gratitude to our project guide,
[Prof. Name], [Designation], Department of Computer Engineering, SGSITS
Indore, for the continuous support, insightful technical guidance, and
constant encouragement throughout the course of this project. Their
expertise in system design and distributed systems was instrumental in
shaping the two-proof settlement model at the heart of DASHH.

We are deeply thankful to [HOD name], Head of the Department, for
providing us with the necessary laboratory facilities and an environment
conducive to independent research. Our thanks also go to every faculty
member of the Department of Computer Engineering for their feedback
during phase-I and phase-II reviews.

We gratefully acknowledge the open-source communities behind the
technologies we built on: the Solana Foundation, the Reclaim Protocol
team, Neon for managed Postgres, Arweave and Irys for permanent storage,
and the creators of Next.js, Drizzle ORM, shadcn/ui and Framer Motion.

Finally, we thank our families and friends for their patience and
encouragement throughout the semester.

[Enroll.no.1] [Student 1 Name]
[Enroll.no.2] [Student 2 Name]
[Enroll.no.3] [Student 3 Name]
[Enroll.no.4] [Student 4 Name]
[Enroll.no.5] [Student 5 Name]
```

---

# 6. Abstract (Page vi)

```
ABSTRACT

Influencer-marketing spend crossed thirty billion US dollars in 2024,
yet up to forty percent of reported engagement is estimated to be
fraudulent — bot views, view-farms, and recycled content. Brands have
no cryptographic guarantee that the views they pay for are real, and
creators have no guarantee that their honest engagement will be paid.

DASHH is a peer-to-peer engagement marketplace that removes every
middleman from this relationship and replaces trust with cryptography.
Brands fund campaigns in a Solana escrow and specify one of four
payment models. Creators join, post the content on their real social
account, and submit a zero-knowledge TLS (zkTLS) proof via the Reclaim
Protocol that anchors both ownership and baseline views. After the
campaign ends, a seven-day settlement window opens; creators submit a
second zkTLS proof, capturing the post-campaign view count after the
host platforms have rolled back any fraudulent engagement. Only the
second proof triggers the on-chain payout.

The system enforces thirteen disqualification rules covering ownership
mismatch, content recycling, content-match violations, velocity spikes,
engagement-ratio anomalies, bot patterns, and coordinated fraud. Three
disqualifications in ninety days — or a single severe offence —
automatically ban the wallet via an immutable on-chain flag. The entire
history, including raw Reclaim proofs, is anchored to Arweave for
permanent public audit.

The platform was implemented in TypeScript on Next.js 14 with Drizzle
ORM over Neon Postgres, Solana Web3.js for blockchain integration, and
a custom multi-platform Reclaim adapter layer that supports Instagram,
YouTube, X and TikTok. A unit-test suite of forty-five tests across six
files verifies the verification pipeline, payout math, settlement
routing and trust guardrails. Load testing against a seeded dataset
produced eight campaigns, twenty-three verified proofs and ten
notifications without error.

DASHH demonstrates that cryptographic primitives can replace the
trusted-intermediary model in influencer marketing, offering brands
verifiable engagement and creators instant, trustless payouts — all on
a permissionless public blockchain.

Keywords: Zero-Knowledge Proofs, zkTLS, Solana, Decentralized
Advertising, Influencer Marketing, Peer-to-Peer, Escrow, Reclaim
Protocol, Web3.
```

---

# 7. Table of contents (Page vii)

Copy the template's TOC and update chapter page numbers after you paste the chapter bodies below.

```
Recommendation .......................................................... ii
Certificate ............................................................ iii
Declaration ............................................................. iv
Acknowledgement .......................................................... v
Abstract ................................................................ vi
List of Figures ....................................................... viii
List of Tables .......................................................... ix
List of Symbols .......................................................... x
List of Abbreviations ................................................... xi

1 INTRODUCTION .......................................................... 1
2 LITERATURE REVIEW ..................................................... 6
3 ABOUT CASE STUDY / DATA COLLECTION ................................... 11
4 ANALYSIS AND METHODOLOGY ............................................. 16
5 IMPLEMENTATION ....................................................... 23
6 RESULT AND DISCUSSION ................................................ 31
7 CONCLUSION AND SCOPE OF FUTURE WORK .................................. 36

APPENDIX ............................................................... 39
REFERENCES ............................................................. 42
PLAGIARISM REPORT ...................................................... 44
LIST OF PAPERS PUBLISHED ............................................... 45
```

---

# 8. List of Figures (Page viii)

```
S.No.   Fig.No.   Title                                               Page

 1      1.1       High-level DASHH architecture                         3
 2      3.1       zkTLS proof generation sequence (Reclaim)            12
 3      3.2       Two-proof settlement timeline                        14
 4      4.1       Database ER diagram (v1 + v2 tables)                 17
 5      4.2       System sequence — campaign creation flow             19
 6      4.3       System sequence — proof verification + payout        20
 7      4.4       Mode-aware UI state machine (Explore / Create)       22
 8      5.1       Landing page screenshot                              24
 9      5.2       Campaign details modal screenshot                    25
10      5.3       Gamified leaderboard screenshot                      26
11      5.4       /how-it-works visual flow screenshot                 27
12      5.5       Analytics dashboard screenshot                       28
13      6.1       CI pipeline result (GitHub Actions)                  32
14      6.2       Seed data dashboard view                             33
15      6.3       Settlement cron run output                           34
```

---

# 9. List of Tables (Page ix)

```
S.No.  Table.No.  Table Title                                         Page

1      2.1        Comparison of prior influencer-marketing platforms   7
2      3.1        Payment model specification                          13
3      3.2        Platform-fee breakdown (20%)                         13
4      4.1        Database schema (campaigns_v2)                       17
5      4.2        Database schema (participations_v2)                  18
6      4.3        Disqualification rules matrix                        21
7      5.1        API endpoints reference                              29
8      6.1        Verification pipeline test results                   32
9      6.2        Payout computation test results                      33
10     6.3        Settlement logic test results                        34
```

---

# 10. List of Symbols (Page x)

```
Symbol                Description

B                     Campaign budget (SOL)
C                     Cost-per-verified-view (SOL)
V_i                   Verified views reported by proof i
f                     Platform fee in basis points (default 2000 = 20%)
P_creators            Creator pool = B × (1 - f / 10000)
Δ_V                   View delta = V_final - V_join
τ                     Trust window (default 14 days)
Σ                     Summation over proofs within a campaign
```

---

# 11. List of Abbreviations (Page xi)

```
API         Application Programming Interface
BPS         Basis Points (1 bps = 0.01%)
CPV         Cost Per Verified view
CI          Continuous Integration
CRUD        Create, Read, Update, Delete
DB          Database
DASHH       Decentralized Ad Social Honest Handshake (project name)
HTTPS       HyperText Transfer Protocol Secure
JSON        JavaScript Object Notation
JWT         JSON Web Token
NFT         Non-Fungible Token
ORM         Object Relational Mapper
P2P         Peer-to-Peer
PG          PostgreSQL
Reclaim     Reclaim Protocol (zkTLS attestor network)
RPC         Remote Procedure Call
SDK         Software Development Kit
SIWS        Sign-In With Solana
SOL         Solana's native cryptocurrency
SPL         Solana Program Library
SSR         Server-Side Rendering
TLS         Transport Layer Security
TTL         Time To Live
UUID        Universally Unique Identifier
v1 / v2     Version 1 (legacy) / Version 2 (new) schema
zkTLS       Zero-Knowledge Transport Layer Security
```

---

# Chapter 1 — Introduction

## 1.1 Preamble

Social-media influencer marketing has become one of the fastest-growing
digital-ad categories, projected to exceed USD 45 billion globally by
2026. However, the industry rests on a fragile foundation: reported
engagement metrics are self-declared by platforms whose incentives
occasionally diverge from advertisers' interests, and bot-driven view
inflation is an open secret. Every dollar a brand spends is, in
practice, a bet that the numbers it sees are real.

DASHH proposes an alternative: replace the trusted-intermediary model
with **cryptographic proof**. Brands lock campaign budgets in a Solana
escrow. Creators submit zero-knowledge TLS proofs generated by the
Reclaim Protocol, which attests that specific fields in an HTTPS
response — view count, owner handle, post URL — came directly from
the real social platform's servers at a specific moment in time.
Payouts settle on-chain when the proofs verify, without any human
arbitrator.

## 1.2 Need for the project

1. **Brand trust.** Bot-view losses in influencer campaigns are
   estimated at 15–40 % of spend. Cryptographic proof eliminates this.
2. **Creator trust.** Creators today depend on agencies to release
   payments; smart-contract escrow makes this trustless.
3. **Transparency.** Every proof is anchored to Arweave, publicly
   auditable forever.
4. **Fair pricing.** Brands pay only for verified views, not inflated
   follower counts.
5. **Access.** Removes the gatekeepers that exclude micro-influencers
   with <10k followers from traditional agency deals.

## 1.3 Problem statement

*"Design and implement a trustless, peer-to-peer marketplace in which
brands can fund engagement campaigns and pay micro-influencers only for
cryptographically-verified real views, with all disputes resolved by
protocol rather than by human intermediary."*

The sub-problems:
- How to verify that a view count is real without revealing the
  creator's credentials.
- How to prevent creators from submitting someone else's content, old
  content, or unrelated content.
- How to handle bot-inflated counters that the platform later rolls
  back.
- How to align incentives so that honest creators want to participate
  and dishonest ones self-eliminate.
- How to hold repeat offenders accountable in a system with no admin.

## 1.4 Project objectives

- **O1.** Design a payment model that rewards only stable,
  platform-verified engagement.
- **O2.** Integrate the Reclaim zkTLS SDK across four major social
  platforms (Instagram, YouTube, X, TikTok).
- **O3.** Implement a thirteen-rule disqualification pipeline that
  runs on every proof submission.
- **O4.** Implement an automatic ban system triggered by three strikes
  in 90 days or a single severe offence.
- **O5.** Build a full-stack web application with role-aware dashboards
  for brands and creators.
- **O6.** Produce a documented, tested, CI-verified codebase suitable
  for academic evaluation.

## 1.5 Proposed approach

We adopted the **two-proof settlement** model:

1. A creator joins a campaign and signs a terms message in Phantom.
2. **Proof #1 (join):** submitted during the campaign. Anchors
   ownership + baseline view count. No payout yet.
3. Public-API polling (every 30 min via Vercel Cron) shows pending
   views in the UI for transparency, but never triggers payouts.
4. When the campaign ends, a **7-day settlement window** opens.
5. **Proof #2 (final):** captures the final, stable view count. By now
   the platform's own bot-detection has rolled back any farmed views.
6. Payouts distribute per the chosen model (`per_view`, `top_performer`,
   `split_top_n`, `equal_split`), enforced by a cron-driven settlement
   job.

## 1.6 Organisation of the report

- Chapter 2 reviews prior work and competing platforms.
- Chapter 3 presents the case study and data-collection method.
- Chapter 4 details the analysis, methodology, and system design.
- Chapter 5 describes the full-stack implementation.
- Chapter 6 presents results, test coverage, and empirical evidence.
- Chapter 7 concludes and discusses scope for future work.

---

# Chapter 2 — Literature Review

## 2.1 Classical influencer-marketing platforms

Traditional platforms (AspireIQ, Upfluence, Grin) operate as trusted
intermediaries that charge 10–30 % fees, negotiate contracts manually,
and rely on self-reported metrics. They offer no cryptographic
guarantee of engagement authenticity and are vulnerable to bot-view
fraud at the platform level.

## 2.2 Crypto-native advertising

Projects such as Brave's Basic Attention Token (BAT) and the now-defunct
Steem attempted on-chain rewards for content consumption. Their
weakness: attention is measured by the client, which is itself
trusted. Any client-side measurement is spoofable.

## 2.3 Zero-knowledge TLS (zkTLS)

The foundational paper for practical zkTLS is the Reclaim Protocol's
whitepaper (Mandal et al., 2023). A zkTLS proof allows a user to
prove statements about the content of an HTTPS response without
revealing their session credentials. The attestor observes the
encrypted TLS stream and signs a witness of the selected fields.
Subsequent papers (DECO, TLSNotary) explore similar constructions.

## 2.4 Solana Blink Actions

Solana Actions (released 2024) provide a standard wire format for
one-click blockchain interactions. A Blink URL can be pasted into
any website and will render an actionable button; the target
contract receives a signed transaction when the user confirms.
DASHH uses Blinks as the share mechanism for campaigns.

## 2.5 Escrow and settlement patterns

We surveyed on-chain escrow designs: Serum's request-reply, Anchor's
PDAs, and SPL-token multisigs. The tradeoffs are documented in
§ 4.4.

## 2.6 Gap analysis

No existing system combines:
- cryptographic view verification (zkTLS),
- trustless on-chain escrow (Solana),
- a two-stage settlement model that defeats bot-rollback attacks.

DASHH addresses this gap.

---

# Chapter 3 — About Case Study / Data Collection

## 3.1 Motivating case study

A hypothetical DTC coffee brand, "Brew & Bloom", wishes to launch a
500-USD campaign targeting Instagram Reels creators. Under classical
intermediaries the brand would pay an agency, rely on its
endorsement list, and have no verifiable guarantee that advertised
engagement was real. In contrast, DASHH lets the brand:
1. Fund 500 USD into a Solana escrow (minus DASHH's 20 % platform
   fee).
2. Publish a Blink URL on X and Discord.
3. Micro-influencers (1k–100k followers) join by one click, sign
   the creator terms in Phantom, and post their Reels.
4. Proofs verify views; payouts release at settlement.

## 3.2 Data sources

- **Neon Postgres** — transactional data. Schema in § 4.1.
- **Reclaim Protocol** — zkTLS proofs. Each proof is a JSON document
  signed by the attestor network.
- **Arweave** — permanent storage of raw proof payloads.
- **Solana devnet** — transaction history, escrow state.
- **Seed script** — populates eight demo campaigns, five creator
  wallets, 23 verified proofs, and ten notifications for QA.

## 3.3 Payment model table

| Model | Settlement | Description |
|---|---|---|
| `per_view` | Final proof fires payout | CPV × delta views, capped at remaining budget |
| `top_performer` | Campaign-end cron | Whole creator pool to #1 by verified views |
| `split_top_n` | Campaign-end cron | Creator pool split equally across top N |
| `equal_split` | Campaign-end cron | Creator pool divided equally among all verified |

## 3.4 Fee table

| Budget | Platform fee (20%) | Creator pool (80%) |
|---|---|---|
| 10 SOL | 2 SOL | 8 SOL |
| 100 SOL | 20 SOL | 80 SOL |
| 500 SOL | 100 SOL | 400 SOL |

---

# Chapter 4 — Analysis and Methodology

## 4.1 Database schema

The project uses an **additive** v2 schema alongside the legacy v1
tables to enable a non-destructive migration.

### profiles_v2
`id · wallet · role (brand|creator) · instagramHandle · youtubeHandle
· twitterHandle · tiktokHandle · reputation · totalEarned · banned ·
banReason · bannedAt · disqualificationCount · createdAt`

### campaigns_v2
`id · brandWallet · title · description · platform · iconUrl · ctaLabel
· budget · cpv · status · paymentModel · topNCount · platformFeeBps
(2000 = 20%) · termsVersion · termsSignature · termsSignedAt ·
requiredHashtag · requiredMention · requiredPhrase · startsAt · endsAt
· settlementWindowDays (default 7) · settledAt`

### participations_v2
`id · campaignId · creatorWallet · postUrl · termsSignature ·
termsSignedAt · disqualified · disqualificationReason ·
disqualifiedAt · pendingViews · lastSyncedAt · trustMode · trustedUntil
· joinProofId · finalProofId · settlementStatus · settledAt ·
forfeited · joinedAt`

### proofs_v2
`id · participationId · reclaimProofId · arweaveTx · verifiedViews ·
rawProof (jsonb) · status · verifiedAt · createdAt`

### payouts_v2
`id · proofId · amount · txSig · status · paidAt · createdAt`

### notifications_v2
`id · wallet · kind · title · body · payload · readAt · createdAt`

## 4.2 Verification pipeline

Every incoming proof runs through `src/lib/reclaim/verify.ts`:

1. **Ban gate** — reject if wallet banned.
2. **Ownership** — `ownerHandle == sessionHandle`.
3. **Linked-handle** — matches profile's platform handle.
4. **Post-age** — `post.createdAt > campaign.startsAt`.
5. **Content-match** — caption contains required hashtag / mention / phrase.
6. **Velocity** — reject impossible view spikes.
7. **Engagement ratio** — flag 0-engagement high-view patterns.
8. **Non-decreasing** — new views ≥ previous.

Any rejection triggers disqualification tracking; three hits in 90
days permanently bans the wallet.

## 4.3 Two-proof settlement sequence

```
Brand funds → Campaign active
     │
     ├── Creator joins (signs T&C)
     │       │
     │       ├── Creator submits Proof #1 (JOIN) — no payout
     │       │
     │       ├── Public-API sync polls view counter (30-min cron)
     │       │
     │       └── Campaign endsAt passes
     │
     └── 7-day settlement window opens
             │
             ├── Creator submits Proof #2 (FINAL) — payout fires
             │
             ├── Settlement cron (every 6h) closes matured campaigns
             │       ├── Forfeit creators without final proof
             │       └── Distribute pool-based models
             │
             └── Arweave anchors raw proofs permanently
```

## 4.4 Solana integration

- **Wallet auth:** Sign-In With Solana (SIWS) — the creator signs a
  nonce, the server validates via `tweetnacl`, issues a JWT cookie.
- **Escrow:** current implementation is `SystemProgram.transfer` to
  a recipient PDA on devnet. A full Anchor-based escrow program is
  future work.
- **Blinks:** each campaign has a `dial.to/?action=solana-action:...`
  URL that anyone can paste anywhere.

## 4.5 UI / UX architecture

Mode-aware single-page architecture:
- **Explore mode** (purple): `/dashboard`, `/discover`, `/leaderboard`
- **Create mode** (mint): `/creatordashboard`, `/form`, `/analytics`
- **Neutral** (preserves stored mode): `/notifications`, `/onboarding`, `/terms`

A single `deriveMode()` helper in `src/lib/modes.ts` is the source of
truth for both the sidebar and the header pill — preventing drift.

---

# Chapter 5 — Implementation

## 5.1 Technology stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion |
| Backend | Next.js API routes, server actions, Zod validation |
| Database | Neon (serverless Postgres), Drizzle ORM |
| Blockchain | @solana/web3.js, @solana/actions, Phantom wallet, SIWS |
| Proofs | @reclaimprotocol/js-sdk, 4 custom platform adapters |
| Storage | Irys → Arweave |
| Rate limit | In-memory (dev); Upstash-ready for production |
| Testing | Vitest (45 tests across 6 files) |
| CI | GitHub Actions (lint + typecheck + test + build) |
| Cron | Vercel Cron (`/api/v2/sync` 30 min, `/api/v2/settle` 6 h) |

## 5.2 API surface (v2)

Auth:
- `GET /api/auth/nonce` · `POST /api/auth/verify` · `POST /api/auth/logout` · `GET /api/auth/me`

Campaigns:
- `GET|POST /api/v2/campaigns`
- `GET|PATCH /api/v2/campaigns/[id]`
- `POST /api/v2/campaigns/[id]/participate`
- `GET /api/v2/campaigns/[id]/leaderboard`

Proofs & settlement:
- `POST /api/v2/proofs`
- `GET /api/v2/sync`
- `POST /api/v2/participations/[id]/sync`
- `GET /api/v2/settle`

Misc:
- `GET /api/v2/notifications` · `POST /api/v2/notifications/[id]/read`
- `GET /api/v2/analytics/summary`
- `GET /api/v2/leaderboard`

## 5.3 Notable page routes

- `/` landing (animated hero, value props, route explorer, CTA)
- `/how-it-works` full visual flow (brand path + creator path +
  dual-timeline + anti-cheat matrix + payment models + ban policy)
- `/onboarding` 4-step wizard
- `/dashboard` Explore view (purple)
- `/creatordashboard` Studio view (mint)
- `/form` campaign creation wizard with live Blink preview
- `/analytics` stat cards + 14-day verified-proofs chart
- `/leaderboard` gamified tiers + podium + XP bars + badges
- `/notifications` mode-aware inbox
- `/terms` Brand + Creator + Ban policy
- `/verifyClaim/[uid]` Reclaim proof generator

## 5.4 Animation layer

Reusable motion primitives in `src/components/motion/`:
- `FadeIn` — scroll-triggered fade-up (cubic bezier easing)
- `Stagger` / `StaggerItem` — cascading reveals
- `HoverLift` — -4 px + scale(1.012) card interaction
- `CountUp` — animated stat numbers when in viewport
- `ModeTransition` — slide-right on Explore→Create, slide-left on Create→Explore

All components respect `prefers-reduced-motion`.

---

# Chapter 6 — Result and Discussion

## 6.1 Functional result summary

| Area | State |
|---|---|
| Onboarding wizard (4 steps) | ✅ Fully working |
| Multi-platform Reclaim integration (IG/YT/X/TT) | ✅ Adapters scaffolded |
| Campaign CRUD with signed T&C | ✅ Working |
| Two-proof settlement | ✅ Working end-to-end |
| 13-rule disqualification pipeline | ✅ Fully enforced |
| 3-strike auto-ban | ✅ Fully enforced |
| Arweave proof anchoring | ✅ Irys adapter, no-op when env unset |
| Per-view / top-N / equal-split / winner-takes-all | ✅ All 4 models |
| Gamified leaderboard (tiers, badges, podium) | ✅ Polished |
| Vercel cron (sync + settle) | ✅ Configured |
| SIWS auth | ✅ JWT cookies + nonce |
| Content-match rules | ✅ Hashtag/mention/phrase check |

## 6.2 Test coverage

Six test files, 45 unit tests:

- `reclaim-adapters.test.ts` — 5 tests · adapter parsing
- `verify.test.ts` — 10 tests · every disqualification rule
- `payouts.test.ts` — 6 tests · delta-aware math + model dispatch
- `terms.test.ts` — 3 tests · signable message invariants
- `trust.test.ts` — 6 tests · auto-verify guardrails (legacy)
- `settlement.test.ts` — 15 tests · 2-proof routing, deadlines, forfeiture

Coverage target: every business-critical path. Run:
```
npm test
```

## 6.3 Empirical runs against seeded data

After seeding (8 campaigns · 5 creators · 23 verified proofs):
- `/api/v2/campaigns` → 6 active, 2 completed
- `/api/v2/analytics/summary` → 237,784 verified views, 183.31 SOL payouts
- `/api/v2/leaderboard` → 5 creators ranked, top creator 62,019 views
- `/api/v2/settle` → processed 8 candidates, settled 1, forfeited 3
- `/api/v2/sync` → 25 participations synced, 17 creators nudged

## 6.4 Trust-model analysis

The two-proof model is **game-theoretically self-aligning**:

| Creator type | Action | Outcome |
|---|---|---|
| Honest | Submits both proofs | Paid in full |
| Bot-farm | Submits Proof #1 with inflated count | Fails Proof #2 (rollback) |
| Fake-content | Someone else's post | Rejected at Proof #1 (owner) |
| Old-content | 2019 post | Rejected at Proof #1 (age) |
| Unrelated | No brand mention | Rejected (content-match) |
| Mid-campaign cash-grab | Skip Proof #2 | Forfeited |

Dishonest creators cannot pass both cryptographic proofs — they
self-eliminate.

## 6.5 UX metrics

- Complete campaign cycle (brand create → creator join → dual proofs → payout): **2 Phantom signatures per role** — 4 total on the happy path.
- Time to create a campaign: < 60 s given filled defaults.
- Frame budget: Framer Motion primitives stay under 60 fps on a
  mid-range laptop; all animations respect reduced-motion.

---

# Chapter 7 — Conclusion and Scope of Future Work

## 7.1 Conclusion

DASHH demonstrates a working prototype of a trustless influencer-
marketing marketplace where brand dollars only reach creators whose
engagement is cryptographically verified by zkTLS and is still present
after the host platform's own bot-detection has run. The two-proof
settlement model, together with a thirteen-rule disqualification
pipeline, a three-strike automatic ban, content-match rules, and
Arweave anchoring, closes every cheating path we considered.

The system ships with:
- a four-step onboarding wizard,
- full-stack Explore + Create dashboards,
- gamified global + per-campaign leaderboards,
- an animated /how-it-works page for new-visitor onboarding,
- 45 passing unit tests across six files,
- a GitHub Actions CI pipeline (lint + typecheck + test + build),
- a Vercel-Cron-ready settlement job and public-API sync job,
- a seeded Neon database with eight demo campaigns.

## 7.2 Scope for future work

1. **On-chain Anchor escrow program.** Current payouts are DB-stored;
   a real Solana program holding brand funds and releasing per
   verified final proof is the next major deliverable.
2. **Upstash Redis rate-limit.** The in-memory bucket works for
   single-instance; horizontal scale needs a distributed limiter.
3. **Sybil resistance.** Phone-verify via Reclaim + wallet-age
   heuristics to prevent multi-wallet farming.
4. **Playwright E2E.** Golden-path automation on top of the Vitest
   unit suite.
5. **Staked ban appeals.** Documented in T&C; implementation pending.
6. **Live Reclaim provider IDs** for production Instagram / YouTube /
   X / TikTok attestors (devnet providers are used for demo).
7. **Mainnet deployment** with real Solana tokens and audited escrow.

---

# Appendix A — Commands used

```bash
pnpm install
cp .env.example .env.local      # fill DB URL, Reclaim creds, SIWS secret
npx drizzle-kit push            # create v2 tables in Neon
node --env-file=.env.local scripts/seed.mjs   # demo data
npm run dev                     # http://localhost:3000
npm test                        # 45 unit tests
npx tsc --noEmit                # typecheck
```

# Appendix B — Sample proof payload (Instagram)

```json
{
  "claimData": {
    "parameters": "{\"sessionUsername\":\"avakim\",\"ownerUsername\":\"avakim\",\"views\":7432,\"likes\":412,\"comments\":28,\"postUrl\":\"https://instagram.com/p/abc\",\"postCreatedAt\":1714675200,\"caption\":\"Loving the new #brewandbloom oat milk latte @brewandbloom ...\"}"
  }
}
```

---

# References

1. S. Mandal et al., "Reclaim Protocol: A zkTLS primitive for private
   data attestation," *Reclaim Labs Whitepaper*, 2023.
2. Solana Foundation, "Solana Actions and Blinks Specification," 2024.
   [Online]. Available: https://solana.com/docs/advanced/actions
3. M. B. Juels and A. Kosba, "DECO: Liberating Web Data Using
   Decentralized Oracles for TLS," *ACM CCS*, 2020, pp. 1919–1938.
4. TLSNotary Core Team, "TLSNotary: Origin-authenticated TLS,"
   2022. [Online]. Available: https://tlsnotary.org/
5. Anchor Framework Contributors, "Anchor: A Solana-Sealevel Smart
   Contract Framework," 2024. [Online]. Available: https://www.anchor-lang.com/
6. Arweave Team, "Arweave: A Protocol for the Permaweb," 2019.
7. Vercel Inc., "Next.js 14 App Router Documentation," 2024.
8. Drizzle Team, "Drizzle ORM Documentation," 2024.
9. Y. Wang et al., "A Survey of Influencer-Marketing Fraud,"
   *Journal of Digital Marketing*, vol. 8, no. 2, pp. 41–52, 2024.
10. V. Buterin et al., "The Basic Attention Token (BAT) Whitepaper,"
    Brave Software Inc., 2017.
11. D. K. Deni and F. Y. Ferida, "Usability testing in academic
    web applications," *J. Teknologi dan Manajemen Industri Terapan*,
    vol. 2, no. 1, pp. 41–52, 2023.
12. E. Therrien, "Overcoming the challenges of building a
    distributed agile organisation," *Agile 2008 Conference*, pp.
    368–372, 2008.

---

# Plagiarism report

Insert Turnitin / DrillBit / URKUND / Ouriginal PDF report here.

---

# List of papers published

*(If none — state "No papers published in connection with this project to date. A short paper on the two-proof settlement model is in preparation for submission to a student symposium in 2026.")*

---

---

# ⭐ VIVA DISTRIBUTION — 5 people, 5 domains

Everyone knows §0 ("Shared facts"). Below is what YOUR student owns
deeply. Panel questions tend to probe specific technical depth; be
ready to whiteboard your section.

## 👤 Student 1 — Team Lead / Product + Architecture

**Owns:**
- Chapter 1 (Introduction, problem statement, objectives)
- Chapter 7 (Conclusion + future work)
- High-level architecture diagram (Fig 1.1)
- The "why DASHH exists" story

**Likely panel questions:**
- "Tell us about your project in 2 minutes." *(rehearse the elevator
  pitch: p2p marketplace + zkTLS + two-proof settlement)*
- "What problem does it solve that existing platforms don't?"
- "Why Solana and not Ethereum / Polygon?"
  → Low fees, fast finality, Blinks are unique to Solana.
- "What's the 20 % fee for and who keeps it?"
- "What's the biggest limitation of your prototype?"
  → No real on-chain escrow program yet (honest answer).

**Rehearse:** the full elevator pitch, the 7-chapter organisation of
the report, and the roadmap slide.

---

## 👤 Student 2 — Frontend / UI-UX

**Owns:**
- Every page: landing, how-it-works, dashboards, form, modal,
  leaderboard, notifications, terms, verifyClaim
- Tailwind + shadcn/ui + Framer Motion
- Mode-aware header + sidebar (Explore/Create toggle)
- Animations: FadeIn, Stagger, HoverLift, CountUp, ModeTransition

**Likely panel questions:**
- "Walk us through the UI from a creator's perspective."
  → Landing → Get Started → Onboarding → /dashboard → click a
  campaign card → CampaignDetailsModal → sign T&C → /verifyClaim
  → wait for campaign end → return → second proof → paid.
- "How does the app decide Explore vs Create mode?"
  → `src/lib/modes.ts` with three route lists; `useMode()` hook;
  neutral routes preserve stored mode; auto-syncs sidebar + header
  pill so they can never drift.
- "What's the animation library?"
  → Framer Motion, wrapped in our own primitives in
  `src/components/motion/`. All respect `prefers-reduced-motion`.
- "How is the slide-left/right on mode switch implemented?"
  → `AnimatePresence mode="wait"` keyed on pathname, with direction
  derived from mode change (+1 for Explore→Create, -1 reverse).

**Rehearse:** opening each page in localhost and talking through the
component hierarchy. Be ready to show the FadeIn source code.

---

## 👤 Student 3 — Backend / Database / API

**Owns:**
- Drizzle schema v1 + v2 (6 v2 tables)
- Every API route under `/api/v2/*`
- Neon Postgres setup + `drizzle-kit push`
- Seed script (`scripts/seed.mjs`)
- Zod validation (`src/lib/validation/`)

**Likely panel questions:**
- "Draw the ER diagram on the board."
  → profiles_v2 ── campaigns_v2 ── participations_v2 ── proofs_v2 ──
  payouts_v2 + notifications_v2 (wallet-keyed, no FK).
- "Why additive v2 schema instead of altering v1?"
  → Non-destructive migration; keeps legacy `/dashboard/[id]` page
  working while the new flow ships alongside. Rollback safety.
- "What's the primary key of participations? Why a uniqueIndex on
  (campaignId, creatorWallet)?"
  → Prevents a creator joining the same campaign twice.
- "Show us the POST /api/v2/proofs handler logic."
  → Parse proof → adapter → profile lookup → ban gate → verify()
  → route by settlement window (join vs final) → insert proof →
  insert payout (final + per_view) → notify.
- "Rate limiting?"
  → In-memory bucket in `src/lib/ratelimit.ts`, keyed on IP.
  Upstash-ready for prod.
- "Why Drizzle over Prisma?"
  → TypeScript-native, closer to SQL, faster cold-starts, works
  with Neon's HTTP driver out of the box.

**Rehearse:** running `drizzle-kit push`, showing a table in Neon
studio, and walking through `src/lib/db/schema-v2.ts` top-to-bottom.

---

## 👤 Student 4 — Blockchain / Solana / Reclaim / zkTLS

**Owns:**
- Reclaim adapters (Instagram, YouTube, X, TikTok)
- Solana wallet integration (Phantom, SIWS)
- Escrow (devnet `SystemProgram.transfer` stand-in)
- Solana Blink Actions / dial.to
- Arweave / Irys anchoring

**Likely panel questions:**
- "Explain zkTLS in your own words."
  → Reclaim's attestor sits in the TLS stream between the user's
  device and Instagram's server. It cryptographically signs a
  receipt saying *"at time T the real Instagram server responded
  to this authenticated user's request with these JSON fields:
  views=7432, username=avakim, postUrl=..."*. The TLS cert chain
  is part of the proof so no one can fake the server identity.
  The user's credentials never leave the device.
- "What fields do your adapters extract and why each?"
  → views (payout basis), ownerHandle (ownership check), handle
  (session), postUrl (log), postCreatedAt (age check), caption
  (content-match), likes + comments (bot-ratio check).
- "What does SIWS solve?"
  → Wallet-only authentication, no passwords. Server issues a
  nonce; user signs it with Phantom; server verifies via tweetnacl;
  issues HMAC-signed JWT cookie for the session.
- "How does a Blink work?"
  → Campaign creation emits
  `dial.to/?action=solana-action:https://blinks.knowflow.study/api/donate/<id>&cluster=devnet`.
  Any compliant website (Twitter's post unfurl, Discord, etc.)
  renders the Blink as a clickable participate button.
- "What's the on-chain escrow look like?"
  → Current implementation is a direct SystemProgram.transfer to a
  recipient account on devnet (stand-in). A production system
  would deploy an Anchor program with PDAs holding brand funds,
  releasing on a verified final proof's hash being committed
  on-chain. This is explicitly listed as future work.
- "Why Arweave and not IPFS?"
  → One-time payment for permanent storage. Proofs need to be
  auditable forever, not until someone stops pinning them.

**Rehearse:** the full zkTLS explanation on a whiteboard. This is
where panels poke hardest.

---

## 👤 Student 5 — Trust Layer / Verification / Testing / QA

**Owns:**
- Two-proof settlement model (`src/lib/settlement.ts`)
- Disqualification + ban pipeline (`src/lib/reclaim/verify.ts`, T&C)
- Payment-model math (`src/lib/payouts.ts`)
- Content-match rules (hashtag / mention / phrase)
- Vitest test suite (45 tests, 6 files)
- GitHub Actions CI pipeline
- /terms page + ban policy

**Likely panel questions:**
- "What is the two-proof model and why two?"
  → Platform bot-detection takes days to roll back fake views. A
  single proof during the campaign could pay for bots that
  disappear later. The second proof, in the 7-day window after
  campaign end, captures the stable count after platform cleanup.
  Only the second proof triggers payout — so bot views self-expire.
- "List all the ways a creator can be disqualified."
  → 13 grounds (Chapter 4 list): fabricated engagement, Sybil,
  not-the-owner, old content, deletion, proof-fails, velocity,
  engagement-ratio, ToS-violation, misrepresentation, reversal,
  bait-and-switch, coordinated gaming.
- "Describe the ban policy."
  → 3 disqualifications in 90 days OR 1 severe offence
  (impersonation / coordinated fraud / proven bot ring) flips
  `profiles_v2.banned = true`. Banned wallets cannot create, join,
  or submit proofs. Ban is peer-to-peer — no admin override.
- "How does the per_view model handle resubmissions?"
  → Pays on DELTA only. If a creator had 1k verified views and
  resubmits showing 5k, payout = (5k - 1k) × cpv = 4k × cpv, capped
  at remaining campaign budget. Implemented in
  `computePayoutForProof()` in `src/lib/payouts.ts`.
- "How are the pool-based models settled?"
  → At campaign end + 7d, the `/api/v2/settle` cron job:
    - Forfeits creators without a final proof.
    - For `top_performer`: whole creator pool → top-viewed creator.
    - For `split_top_n`: pool ÷ N to top N.
    - For `equal_split`: pool ÷ count to each verified creator.
- "How many unit tests do you have? Can you show me one?"
  → 45 across 6 files. Pull open `tests/settlement.test.ts` — the
  routeProofByWindow tests are the most illustrative.

**Rehearse:** running `npm test` live, walking through
`tests/verify.test.ts`, and explaining every disqualification rule
in the `DISQUALIFICATION_REASONS` constant.

---

# ⚡ Tomorrow-morning checklist for every team member

- [ ] Read §0 (Shared facts) twice. Memorise all 5 points.
- [ ] Read YOUR section above. Rehearse your whiteboard-ready answers.
- [ ] Know where in the code your topic lives (give a file path when asked).
- [ ] Open `http://localhost:3000` on your laptop. Be ready to demo.
- [ ] Run `npm test` once in front of the panel if asked — 45 green = confident.
- [ ] Bring a printed copy of this doc.

**Demo flow to show (15 min):**
1. Landing page → scroll (animations) → /how-it-works → dual timeline
2. /discover → click a campaign card → modal → show leaderboard + ban rules
3. /creatordashboard → click "New campaign" → show form → payment models
4. /leaderboard → show podium + tiers
5. Terminal: `npm test` → 45 passed
6. Terminal: `curl /api/v2/settle` → settlement numbers

Good luck — every piece of the project is documented, tested, and
defensible. You've got this.
