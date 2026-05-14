# DASHH — Production Readiness Roadmap

> **Purpose of this document:** every task below is written as a self-contained
> work-prompt. When you (or another AI agent) wants to pick something up later,
> you can copy-paste a single task into the chat and have enough context to
> finish it without re-reading the entire codebase. Read the **"How to use this
> document"** section first; everything else can be skimmed in any order.

**Last updated:** 24 April 2026
**Repo:** https://github.com/alphoder/Dashhnew
**Production URL:** https://dashhnew.vercel.app
**Status:** Live on Solana **Devnet**. Not production. Not on Mainnet.

---

## How to use this document

1. **Task IDs.** Every task has an ID like `P0.1`, `P1.4`. When you want to
   start work, paste the entire task block (Title → Verification) into the
   agent chat and say *"Implement P0.1 now."* That's enough context.

2. **Priority tiers.** Strictly ordered:
   - **P0 — Loop closures.** Demo-blocking bugs. The product looks finished
     but doesn't actually work end-to-end. Fix these first.
   - **P1 — Production polish.** Makes the existing product *land*. Skip P1
     entirely if you're crunched for time; the product still works.
   - **P2 — Trust + safety.** Required before any real money flows on mainnet.
     Optional for devnet showcase.
   - **P3 — Growth + virality.** Distribution surface. Only matters once the
     core product is solid.
   - **P4 — Mainnet readiness.** Don't touch until P0–P2 are done.

3. **Effort estimates** assume one focused developer. Add 50% if you're
   context-switching.

4. **Dependencies.** Each task says what must be done first. Skipping a
   dependency creates rework.

5. **Acceptance criteria.** Every task has a measurable definition of done.
   "It works" is not enough — there's a specific test.

---

## Quick reference: current architecture

Skim this before doing any task — saves repeated questions.

### Stack
- **Framework:** Next.js 14 (App Router, route groups)
- **Language:** TypeScript end-to-end
- **DB:** Neon Postgres + Drizzle ORM (schema in `src/lib/db/schema-v2.ts`)
- **Auth:** Sign-In With Solana (SIWS), HMAC-signed JWT cookies in
  `src/lib/auth/session.ts`
- **Chain:** Solana Web3.js + Phantom + Solana Actions/Blinks
- **Verification:** Reclaim Protocol zkTLS (4 adapters in `src/lib/reclaim/`)
- **UI:** Tailwind + shadcn/ui + Framer Motion
- **Testing:** Vitest (45 tests / 6 files)
- **Hosting:** Vercel Hobby (1 cron/day cap)

### Tables (all `_v2` suffixed)
1. `profiles_v2` — wallet-keyed user profile, strike count, ban status
2. `campaigns_v2` — brand campaigns, signed terms, payout model
3. `participations_v2` — creator's enrolment per campaign
4. `proofs_v2` — Reclaim proofs (Join + Final), parsed metrics
5. `payouts_v2` — settlement records, tx signatures
6. `notifications_v2` — per-wallet notification stream

### Key files (memorize these paths)
- `src/lib/modes.ts` — Explore/Create mode, single source of truth
- `src/lib/settlement.ts` — two-proof routing, final-window logic
- `src/lib/payouts.ts` — `computePayoutForProof()`, four payment models
- `src/lib/terms.ts` — TERMS_BODY, 13 disqualification rules, ban policy
- `src/lib/reclaim/verify.ts` — zkTLS verification + 13-rule pipeline
- `src/lib/blink-url.ts` — deployment-agnostic Blink URL builder
- `src/app/(app)/layout.tsx` — authenticated app shell
- `src/app/api/v2/*` — v2 API routes

### Environment variables (production)
```
DATABASE_URL=postgres://...neon.tech/neondb
SIWS_SESSION_SECRET=<32-byte hex>
NEXT_PUBLIC_APP_URL=https://dashhnew.vercel.app
NEXT_PUBLIC_SOLANA_CLUSTER=devnet
NEXT_PUBLIC_SOLANA_RPC=https://api.devnet.solana.com
SOLANA_RECIPIENT_ADDRESS=8vbaCLhg1SZmiGNZfFzV2DEJHenFtdgg7G2JtY5v74i1
NEXT_PUBLIC_RECLAIM_APP_ID=0x4f5C9deCb26Fd1b7633AEBA319994791182696A3
NEXT_PUBLIC_RECLAIM_APP_SECRET=***REMOVED***
NEXT_PUBLIC_RECLAIM_PROVIDER_ID_INSTAGRAM=65e26669-e083-4b67-91fa-6a4fadfbefb1
NEXT_PUBLIC_RECLAIM_PROVIDER_ID_YOUTUBE=c4f06d5f-9a7f-4de0-a5e4-253bd9807c81
NEXT_PUBLIC_RECLAIM_PROVIDER_ID_TWITTER=e6fe962d-8b4e-4ce5-abcc-3d21c88bd64a
NEXT_PUBLIC_RECLAIM_PROVIDER_ID_TIKTOK=9ec60ce1-e131-428c-b4fc-865f9782a09c
```

### Existing strengths (don't rebuild these)
- ✅ Live deployment on Vercel
- ✅ All Reclaim provider IDs configured for 4 platforms
- ✅ Form → campaigns_v2 → Discover flow works
- ✅ Blink URLs work (deployment-agnostic via `src/lib/blink-url.ts`)
- ✅ Post-join "What's next" UI in `CampaignDetailsModal`
- ✅ 45 Vitest tests pass on CI

### Known gotchas (don't waste time rediscovering)
- Solana devnet RPC is rate-limited — use `'finalized'` commitment for
  `getLatestBlockhash` and pass full `{blockhash, lastValidBlockHeight}`
  to `confirmTransaction`. See `src/app/(app)/form/page.tsx::sendTransaction`.
- Vercel Hobby plan only allows daily crons. Production cron schedule in
  `vercel.json` runs `/api/v2/sync` and `/api/v2/settle` once per day each.
- Vercel CLI must be ≥47.2.2 to deploy.
- Form payload must use v2 field names (`budget`, `iconUrl`, `ctaLabel`,
  `startsAt`, `endsAt`, `platform`), not v1 (`amount`, `icons`, `label`,
  `end`).
- `participations_v2` uses `settlementStatus` (not `status`) as the lifecycle
  column: `awaiting_join | active | awaiting_final | settled | forfeited`.
- TypeScript `noUnusedLocals: false` and `noUnusedParameters: false` in
  `tsconfig.json` — left disabled to keep Vercel builds green. Don't
  re-enable without a cleanup pass.
- The platform recipient wallet
  `8vbaCLhg1SZmiGNZfFzV2DEJHenFtdgg7G2JtY5v74i1` is a single-key wallet on
  devnet. Do NOT reuse for mainnet — see P2.2.

---

# Priority 0 — Loop Closures (demo-blocking bugs)

The product cannot complete a single end-to-end campaign without these. They
look like polish gaps but are actually broken loops.

---

## P0.1 — Reclaim proofs don't save to the database

### Why it matters
The `/verifyClaim/[uid]` page runs the Reclaim SDK flow, shows "Verified" in
the local React state, and **does nothing else**. The proof is never POSTed
back to DASHH. As a result:
- `participations_v2.settlementStatus` stays at `awaiting_join` forever
- No view count is recorded
- The 13-rule disqualification pipeline never runs
- Settlement has no proofs to process
- No creator ever gets paid

This is the **single most critical missing piece in the entire product.** The
two-proof settlement model — the headline feature — doesn't function without
this.

### Current state
- File: `src/app/verifyClaim/[uid]/page.tsx`
- The `verifyOnReclaim()` function calls Reclaim SDK's `startSession()`
- The `onSuccess` callback fires with proofs object but only updates local
  state: `setRes((proofs as any)?.claimData?.context ?? "Verified")`
- No fetch to DASHH backend
- `/api/v2/proofs/route.ts` exists but is incomplete — verify its current
  implementation before writing the client-side POST

### What to build
1. **Server side: `/api/v2/proofs` POST endpoint**
   - Accept body: `{ participationId: string, platform: string,
     reclaimProof: object }`
   - Validate the requesting wallet matches the participation's
     `creatorWallet` (via SIWS session)
   - Call `verify()` from `src/lib/reclaim/verify.ts` to run the 13-rule
     pipeline
   - Decide proof type via `routeProofByWindow()` from `src/lib/settlement.ts`
     — is it a Join or Final proof?
   - Extract view count from the proof using the appropriate adapter in
     `src/lib/reclaim/adapters/`
   - Insert into `proofs_v2` with:
     - `participationId`, `campaignId`, `creatorWallet`
     - `kind: 'join' | 'final'`
     - `viewCount` (parsed from proof)
     - `rawProof` (the entire JSON for audit)
     - `status: 'verified' | 'rejected'`
     - `rejectionReason` if rejected (one of the 13 rules)
   - Update `participations_v2`:
     - If Join proof verified: set `joinProofId`, `settlementStatus = 'active'`
     - If Final proof verified: set `finalProofId`,
       `settlementStatus = 'awaiting_final'` → `'settled'` after payout
     - If rejected: increment `strikeCount` on profiles_v2; if ≥3 strikes,
       set `bannedUntil` to now+90 days
   - Insert notification to brand wallet (`kind: 'proof_submitted'`)
   - Return `{ proof: { id, status, kind, viewCount } }`

2. **Client side: trigger the POST in `onSuccess`**
   - In `verifyOnReclaim()`, after Reclaim's `onSuccess`, fetch
     `/api/v2/proofs` with the proof object
   - Show a loading spinner while server-side verification runs
   - On 200: redirect to `/creatordashboard?participation={id}&proof=verified`
   - On 400 (rejected by 13-rule pipeline): show the rejection reason inline
     with a "Try again" CTA

3. **Optional: Arweave anchoring**
   - After saving to `proofs_v2`, upload the raw proof to Arweave via
     `src/lib/arweave.ts`
   - Store the Arweave TX ID in `proofs_v2.arweaveAnchor`
   - This is what makes the proof permanently auditable

### Files to touch
- `src/app/verifyClaim/[uid]/page.tsx` — add POST + redirect logic
- `src/app/api/v2/proofs/route.ts` — implement POST handler
- `src/lib/reclaim/verify.ts` — confirm the `verify()` signature accepts a
  raw Reclaim proof; add adapter dispatch by platform
- `src/lib/reclaim/adapters/*.ts` — confirm each adapter exports a
  `parseProof()` that returns `{ viewCount, caption, handle }`
- `src/lib/db/schema-v2.ts` — verify `proofs_v2` columns include `kind`,
  `viewCount`, `rawProof`, `arweaveAnchor`; add if missing

### Acceptance criteria
- [ ] Creator joins a campaign, submits a Join proof, the proof appears in
      `proofs_v2` with `kind='join'`, `status='verified'`
- [ ] `participations_v2.settlementStatus` updates from `'awaiting_join'`
      to `'active'`
- [ ] Brand wallet receives a `notifications_v2` entry of kind
      `'proof_submitted'`
- [ ] Submitting a deliberately invalid proof (e.g., wrong caption) returns
      400 with a specific rejection reason
- [ ] After campaign endsAt, submitting a Final proof routes correctly via
      `routeProofByWindow()` and sets `finalProofId`
- [ ] A unit test in `tests/proofs.test.ts` covers the happy path

### Test plan
1. Seed a campaign with `endsAt` in the past
2. Manually call `/api/v2/proofs` POST with a fake Reclaim proof object
3. Verify the participation transitions through the correct states
4. Run `npm test` — payouts + settlement tests should still pass

### Effort
**3 hours.** This is the single most important task in the whole document.

### Dependencies
None. This is the foundation everything else depends on.

---

## P0.2 — No settlement runner (cron does nothing useful)

### Why it matters
The `vercel.json` schedules `/api/v2/settle` to run daily. But the actual
implementation of that route either doesn't exist or is incomplete. So:
- Even when creators submit Final proofs, no SOL ever flows from the platform
  wallet to the creator
- Brands' escrowed SOL sits in the recipient wallet indefinitely
- The "automatic settlement" claim in the report is currently a lie

### Current state
- File: `src/app/api/v2/settle/route.ts`
- Verify what it currently does — likely either an empty handler or a
  no-op
- The function `readyToSettle()` exists in `src/lib/settlement.ts` and
  identifies campaigns past their final window
- `computePayoutForProof()` in `src/lib/payouts.ts` handles the per-creator
  math but is never called from a scheduled job

### What to build
1. **Implement `/api/v2/settle` POST handler**
   - Verify the request includes a valid Vercel Cron secret header
     (`Authorization: Bearer ${CRON_SECRET}`)
   - Query campaigns where:
     - `endsAt + settlementWindowDays < NOW()`
     - `settledAt IS NULL`
     - `status = 'active'`
   - For each such campaign, in a transaction:
     - Fetch all `participations_v2` for the campaign with
       `settlementStatus = 'awaiting_final'`
     - For each participation:
       - Fetch the `finalProof` and `joinProof`
       - Compute Δv = `finalProof.viewCount - joinProof.viewCount`
       - Call `computePayoutForProof()` with the campaign's payout model
         and the creator's Δv
       - If payout > 0:
         - Build a Solana SystemProgram.transfer from platform wallet to
           creator wallet
         - Sign with the platform's signing key (env var
           `PLATFORM_SIGNING_KEY` — see P2.2 for mainnet upgrade)
         - Submit transaction
         - On success: insert into `payouts_v2` with the tx signature;
           update participation `settlementStatus = 'settled'`,
           `settledAt = NOW()`
         - Send notification of kind `'payout_settled'` to creator
       - If payout = 0 (disqualified or no views): set
         `settlementStatus = 'forfeited'`; send `'forfeited'` notification
     - For participations still in `awaiting_join` or `active` (i.e., never
       submitted Final proof): set `settlementStatus = 'forfeited'`,
       `forfeited = true`
     - After processing all participations:
       - Sum total paid out
       - If `totalPaidOut < creatorPool`: the unspent residual stays in the
         platform wallet (or refund to brand — see P0.3)
       - Set campaign `settledAt = NOW()`, `status = 'completed'`

2. **Add the CRON_SECRET env var**
   - Generate via `openssl rand -hex 32`
   - Add to Vercel project env vars
   - Configure Vercel cron to send `Authorization: Bearer ${CRON_SECRET}`

3. **Manual trigger endpoint (for testing)**
   - Add a dev-only `?force=true` param that lets you trigger settlement
     for one campaign without waiting for the cron
   - Gate behind a check: only allowed if `NODE_ENV !== 'production'` OR
     the requester wallet is in an admin allow-list

### Files to touch
- `src/app/api/v2/settle/route.ts` — main implementation
- `src/lib/settlement.ts` — add `settleCampaign(campaignId)` helper
- `src/lib/solana/escrow.ts` — verify `buildPayoutTransaction()` is correct
  and works with the recipient wallet (for now; mainnet needs a real PDA)
- `vercel.json` — confirm cron path is correct

### Acceptance criteria
- [ ] A test campaign with `endsAt` in the past + valid Join/Final proofs
      can be settled by hitting `/api/v2/settle?force=true&campaign={id}`
- [ ] Creator's wallet receives the correct SOL amount (verifiable on
      Solana Explorer)
- [ ] `payouts_v2` has a row with the tx signature
- [ ] `participations_v2.settlementStatus` updates to `'settled'`
- [ ] Creator receives a notification of kind `'payout_settled'` with
      the amount in the payload
- [ ] Disqualified or no-show creators get `'forfeited'` status
- [ ] Campaign `settledAt` and `status='completed'` are set

### Test plan
1. Seed a campaign with `endsAt = NOW() - 8 days` (past final window)
2. Seed participations with both Join and Final proofs
3. Hit `/api/v2/settle?force=true` from a dev machine
4. Check Neon DB: payouts row, participation status updates
5. Check Solana devnet explorer for the transfer transactions
6. Run `npm test`: settlement.test.ts should still pass

### Effort
**6 hours.** This is the second most critical task.

### Dependencies
- **P0.1 must be complete** — settlement reads from `proofs_v2`. Without
  P0.1, there are no proofs to settle.

---

## P0.3 — Brand refund path when no creators participate

### Why it matters
You publicly committed to this in your "Risk Analysis" section of the
project report — *"If no creators submit Final proofs, the entire escrow
returns to the brand."* If this doesn't actually work, your defense against
the "why would brands invest?" question collapses.

### Current state
- No refund endpoint exists
- The settlement runner (P0.2) handles the case where SOME creators settled
  but never the case where ZERO did

### What to build
1. **In P0.2's settlement runner**, after processing all participations,
   check if `payouts_v2` rows for this campaign is empty:
   - If empty: build a SystemProgram.transfer from platform wallet back to
     `campaign.brandWallet` for the full `budget` amount
   - Send the transaction
   - Insert into `payouts_v2` with `kind = 'brand_refund'`,
     `recipientWallet = brandWallet`, `amount = budget`,
     `txSignature = ...`
   - Set campaign `status = 'refunded'`, `settledAt = NOW()`
   - Send notification to brand of kind `'campaign_refunded'`

2. **Manual brand-triggered refund endpoint**
   - `POST /api/v2/campaigns/[id]/refund` (brand-wallet-only)
   - Requirements:
     - Campaign's `endsAt + settlementWindowDays < NOW()` (past final window)
     - No paid-out settlements exist
     - Caller's wallet matches `brandWallet` (via SIWS)
   - Same refund logic as the cron path
   - Idempotent — if already refunded, return 409 with the existing payout

### Files to touch
- `src/app/api/v2/settle/route.ts` — add refund branch
- `src/app/api/v2/campaigns/[id]/refund/route.ts` — new manual refund route
- `src/lib/db/schema-v2.ts` — add `'brand_refund'` to payout kinds enum if
  not present

### Acceptance criteria
- [ ] A campaign that ends with 0 settled creators gets a brand_refund
      payout row + tx signature
- [ ] Brand wallet receives the full budget back (verifiable on explorer)
- [ ] Brand sees a notification "Your campaign was refunded"
- [ ] Manual refund endpoint rejects calls before the final-window deadline
      with 400 "campaign still active"
- [ ] Manual refund endpoint rejects calls from non-brand wallets with 403
- [ ] Idempotent: hitting the endpoint twice returns 409 the second time

### Test plan
1. Seed a campaign that's past its window with zero participations
2. Run settlement — verify brand_refund payout appears
3. Verify brand wallet balance increased by `campaign.budget` on devnet
4. Seed another campaign past window, hit `/refund` manually as brand —
   should succeed
5. Hit `/refund` again — should return 409

### Effort
**2 hours.** Lower than the others because P0.2 does most of the heavy
lifting.

### Dependencies
- P0.2 (settlement runner). Refund is a branch of that logic.

---

## P0.4 — Brand-side campaign cancellation

### Why it matters
Brands will mistype budgets, choose wrong payout models, or change their
mind in the first 24 hours. Right now there's no escape hatch. The campaign
runs whether they like it or not. A real product has a cancel button.

### Current state
- No cancel endpoint or UI exists

### What to build
1. **`POST /api/v2/campaigns/[id]/cancel`**
   - Brand-wallet-only (SIWS check + match `brandWallet`)
   - Reject if:
     - `participations_v2` has ≥1 row (someone already joined — too late to
       cancel)
     - Campaign has a settled or refunded payout already
     - Campaign is past `endsAt`
   - On success:
     - Build SystemProgram.transfer from platform wallet → brandWallet for
       the full `budget`
     - Insert payout row with `kind = 'cancellation_refund'`
     - Set `campaign.status = 'cancelled'`, `cancelledAt = NOW()`
     - Notify brand

2. **UI: Cancel button**
   - In `/creatordashboard` (brand-side view), show a "Cancel campaign"
     button on each campaign card if eligible (status='active' AND 0
     participants)
   - Confirmation modal: "This will refund the full {budget} SOL to your
     wallet. This action is permanent."
   - On confirm: call the cancel API
   - On success: toast + refresh

### Files to touch
- `src/app/api/v2/campaigns/[id]/cancel/route.ts` — new route
- `src/app/(app)/creatordashboard/page.tsx` — add Cancel button
- `src/components/campaign-card.tsx` — add an optional `onCancel` prop

### Acceptance criteria
- [ ] Brand can cancel an unstarted campaign and get a full refund
- [ ] Cancel button doesn't appear when ineligible
- [ ] API rejects cancellation if ≥1 participant has joined
- [ ] API rejects cancellation from non-brand wallets

### Test plan
1. Create a fresh campaign as brand → click Cancel → verify refund tx
2. Create a campaign, have a different wallet join → try to cancel —
   should be blocked

### Effort
**2 hours.**

### Dependencies
None.

---

## P0.5 — Verify the existing creator-side join flow end-to-end

### Why it matters
We fixed the "campaign listed but not showing in Explore" bug
(commit `fcd447c`) and added the "What's next" panel after join
(commit `f097bb7`). But these changes were made in isolation. We need
one end-to-end pass to confirm nothing else is broken.

### Current state
- Form posts to `/api/v2/campaigns` ✓
- Discover reads from `/api/v2/campaigns` ✓
- Join modal calls `/api/v2/campaigns/[id]/participate` ✓
- Post-join UI shows the "What's next" panel with deep-link to
  `/verifyClaim/{participationId}?platform=...&campaignId=...` ✓

### What to verify
Walk through the full flow once, on production, as both personas:

**As a brand:**
1. Visit `/form`, fill in all fields including the new platform selector
2. Sign Phantom prompts (terms + escrow tx)
3. Verify campaign appears on `/discover` immediately
4. Verify modal data matches what was entered

**As a creator (different wallet):**
1. Click into the campaign on `/discover`
2. Tick the terms checkbox
3. Click "Sign terms & join"
4. Sign the creator T&C with Phantom
5. Verify the "What's next" panel appears
6. Click "Submit zkTLS proof now" — verify the URL contains the
   participation ID + platform + campaignId
7. Verify the verifyClaim page highlights the correct platform button

**Then test:**
8. Reclaim flow runs (after P0.1, the proof should save)
9. Wait for settlement window (or use force flag from P0.2)
10. Verify payout transaction on explorer

### Files to touch
None — this is a verification task. Any bugs found become their own
sub-tasks.

### Acceptance criteria
- [ ] End-to-end flow works without console errors
- [ ] All toasts fire correctly at each step
- [ ] No 500 errors in Vercel logs
- [ ] No mismatch between form input and DB state
- [ ] No mismatch between DB state and UI render

### Effort
**1 hour.** Mostly clicking through.

### Dependencies
- P0.1 + P0.2 must be done for the full flow to work end-to-end.

---

# Priority 1 — Production Polish (showcase impact)

These don't fix bugs — they make the working product *land*. A polished
product wins grants and gets retweets. An unpolished one gets a 5-min demo
and forgotten.

---

## P1.1 — Landing page rebuild

### Why it matters
The current landing page works but doesn't sell. A landing page has 5
seconds to convey "what does this do + why should I care." The current one
doesn't pass that bar.

### Current state
- File: `src/app/page.tsx`
- Components: `src/components/hero-section.tsx`, `team-spotlight.tsx`,
  `highlights-section.tsx`, `footer.tsx`
- Generic hero, no problem statement up top, no live metrics, no compare
  table, no clear single CTA

### What to build

**Above-the-fold (hero):**
- Headline: "Brands paid $1.4B for fake influencer views in 2025. We make
  that mathematically impossible."
- Sub-headline: "DASHH escrows your ad budget on Solana, verifies engagement
  with zkTLS proofs, and pays creators only for real, verified views."
- One CTA button: "Launch a campaign" → `/form` (with secondary link "I'm
  a creator → join one" → `/discover`)
- **Animated hero visual** (use Framer Motion):
  - Frame 1: a view count ticker climbing fast (suggests bots)
  - Frame 2: a cryptographic seal stamps over it
  - Frame 3: a smaller, "real views: X" appears with green checkmark
  - Loop every 8 seconds

**Live counters section** (data pulled from `/api/v2/analytics/summary`):
- Total verified views across the platform
- Total SOL escrowed
- Total creators paid out
- Active campaigns right now
- Use `<CountUp>` from `src/components/motion/count-up.tsx` (already
  exists) to animate the counters on scroll-in

**3-step "How it works" infographic:**
- Step 1: "Brand escrows SOL into a smart contract. Signs the 20% platform
  fee directly into the terms."
- Step 2: "Creators post content, then submit a zkTLS proof via Reclaim
  showing real view counts."
- Step 3: "After campaign ends + 7 days, automated settlement pays creators
  for verified view deltas. Disqualified content is automatically filtered."
- Each step has an icon + 1 illustrative screenshot
- Use scroll-anchored animations (Framer Motion's `useScroll`)

**Compare table:**
| | DASHH | Instagram Creator Marketplace | Brave Ads | Traditional agencies |
|---|---|---|---|---|
| Platform fee | 20% | 30% | ~50% | 40–60% |
| View verification | Cryptographic (zkTLS) | Platform-reported | None | Manual reports |
| Time to payout | Automatic after final proof | 60 days | Monthly | 30–90 days |
| Brand can audit views | Yes (on-chain) | No | No | No |
| Refund if no creators | Automatic | Not available | No | No |

**Social proof section:**
- "Pilot brands" logos (use placeholder logos for now; add real ones as you
  onboard them)
- "Built with" — Solana, Reclaim Protocol, Vercel, Neon — with their
  official logos
- "Backed by" or "Grants from" — leave blank until grants come in

**FAQ section** (at the bottom):
- "Why on Solana?"
- "How does zkTLS prevent fraud?"
- "Can I cancel a campaign?"
- "What if no creators join?"
- "Is this on mainnet?"
- "How much SOL do I need to start?"
- "How are creators verified?"
- "What's the disqualification policy?"
- Each answer = 2–4 sentences. Use a shadcn `Accordion` component.

**Footer:**
- Keep the existing `src/components/footer.tsx` — it's good

### Files to touch
- `src/app/page.tsx` — restructure
- `src/components/hero-section.tsx` — rewrite
- `src/components/highlights-section.tsx` — replace with new components
- New: `src/components/landing/live-metrics.tsx`
- New: `src/components/landing/how-it-works.tsx`
- New: `src/components/landing/compare-table.tsx`
- New: `src/components/landing/faq.tsx`
- New: `src/app/api/v2/analytics/landing-counters/route.ts` — endpoint
  that returns aggregated counts for the hero metrics

### Acceptance criteria
- [ ] Hero clearly states the problem + solution in <10 words
- [ ] Single primary CTA above the fold
- [ ] Live counters fetch real data (even if seeded)
- [ ] 3-step infographic visible on a 13" laptop without scrolling past
      hero
- [ ] Compare table renders correctly on mobile
- [ ] FAQ accordion expands/collapses smoothly
- [ ] Lighthouse score: Performance ≥ 80, Accessibility ≥ 90, SEO ≥ 95

### Test plan
1. Open landing on a phone — every section readable, no horizontal scroll
2. Run Lighthouse audit
3. Run `npm run build` — no errors
4. Share the URL on Twitter / WhatsApp — verify the OG card looks correct
   (depends on P1.10)

### Effort
**8 hours.** Highest ROI of any P1 task.

### Dependencies
None. Can be done in parallel with P0 tasks.

---

## P1.2 — 60-second demo video

### Why it matters
This is the single artifact that goes in every grant application, every
tweet, every pitch deck. Without it, you're describing your product. With
it, you're showing it. Conversion difference is ~10x.

### Current state
No video exists.

### What to build

**Tool:** Loom (free) or CapCut (free, more editing power).

**Script (read at conversational pace, ~60 seconds total):**

```
[0:00-0:08] "Influencer marketing has a $1.4 billion fraud problem.
            Brands pay creators based on view counts that anyone can fake."
[0:08-0:12] [Show: a fake-looking view counter ticking up rapidly,
            zoom-in on the number]
[0:12-0:20] "I built DASHH so brands only pay for cryptographically
            verified views. Here's the entire flow."
[0:20-0:30] [Screen record: brand creates a campaign on dashhnew.vercel.app/form,
            picks Instagram, sets budget 0.5 SOL, signs terms with Phantom]
[0:30-0:35] [Show the campaign appearing on /discover]
[0:35-0:48] [Switch personas: second Phantom wallet joins the campaign,
            signs creator T&C, opens Reclaim QR, scans, proof verifies]
[0:48-0:55] [Show the settlement transaction on Solana Explorer]
[0:55-0:60] "Built on Solana with Reclaim Protocol zkTLS.
            Live now at dashhnew.vercel.app."
```

**Production tips:**
- 1080p minimum, 30fps
- No music in the first version (test silence vs background — silence often
  converts better for B2B audiences)
- Subtitles burned-in (Auto-caption in CapCut, then proofread)
- Hard cuts, no transitions (transitions look amateur)
- End frame: DASHH logo + URL + Twitter handle, hold for 3 seconds

**Post-production:**
- Export as MP4, max 10MB (Twitter's video size limit)
- Upload to YouTube (unlisted) as backup
- Embed directly in tweets, NOT as a link (links de-prioritized by algorithm)

### Files to touch
- New: `public/demo.mp4` — committed to the repo
- `src/app/page.tsx` — embed in the hero section if appropriate
- `docs/MARKETING.md` — store the script + reusable variations

### Acceptance criteria
- [ ] Video is exactly 60 seconds (±2 seconds OK)
- [ ] All claims in the voiceover are verifiable on the live site
- [ ] Subtitles match audio
- [ ] Watchable with audio off (subtitles + visual flow)
- [ ] File size <10MB for Twitter
- [ ] Posted as pinned tweet on the team's Twitter

### Effort
**4 hours.** Includes 2–3 takes.

### Dependencies
None. Can be done now even before P0 tasks finish.

---

## P1.3 — Brand analytics dashboard

### Why it matters
Brands need to know "is my money working?" within seconds of opening the
app. Right now `/analytics` is sparse. A real product shows real-time
campaign performance.

### Current state
- File: `src/app/(app)/analytics/page.tsx`
- Currently shows minimal data; may be only a placeholder

### What to build
Brand-only page (gate by SIWS session + check that wallet has ≥1 row in
`campaigns_v2` where `brandWallet = session.wallet`).

**Top stat cards (4 across):**
- Total SOL committed (sum of `campaigns_v2.budget` where brandWallet
  matches)
- Total verified views (sum of all `proofs_v2.viewCount` for this brand's
  campaigns)
- Active campaigns
- Total creators reached (distinct `creatorWallet`)

**Line chart: verified views per day** (last 30 days)
- X-axis: day
- Y-axis: total verified Δv across all brand's campaigns
- Use Recharts (already in dependencies if not, add it)

**Top creators table:**
- Top 10 creators across all brand's campaigns this month
- Columns: Wallet (truncated), Campaigns joined, Total Δv, Total earned
- Sort by total Δv descending

**Cost-per-verified-view trend:**
- Calculate: total SOL paid out / total verified views
- Show trend over last 30 days
- Compare to industry benchmarks ("typical Instagram CPM: $20" etc.)

**Disqualification breakdown (pie chart):**
- For all rejected proofs against this brand's campaigns
- Slice per rule (rule 1: "missing hashtag", rule 5: "missed window", etc.)
- Helps brands tune their `requiredHashtag`/`Mention`/`Phrase` over time

**Per-campaign drill-down:**
- Below the dashboard, list each campaign with a clickable expand
- Expand shows: leaderboard of participating creators, settlement status

### Files to touch
- `src/app/(app)/analytics/page.tsx` — main rewrite
- `src/app/api/v2/analytics/summary/route.ts` — already exists, extend it
- New: `src/components/analytics/views-line-chart.tsx`
- New: `src/components/analytics/disqualification-pie.tsx`
- New: `src/components/analytics/top-creators-table.tsx`

### Acceptance criteria
- [ ] Loads in <2s with 100+ proofs in DB
- [ ] All charts have a meaningful "no data" empty state
- [ ] Brand sees only their own data (no cross-tenant leakage)
- [ ] Mobile-responsive (charts collapse to single column)

### Test plan
1. Login as the demo brand wallet
2. Seed 8 campaigns with varying proof counts
3. Verify totals match manual SQL queries
4. Try as a wallet with no campaigns — should show empty state with CTA
   to create one

### Effort
**6 hours.**

### Dependencies
- P0.1 (proofs need to exist in DB for charts to have data)

---

## P1.4 — Creator earnings page

### Why it matters
Creators need a single page showing their entire DASHH journey. Right now
`/creatordashboard` exists but doesn't tell a coherent story.

### Current state
- File: `src/app/(app)/creatordashboard/page.tsx`
- Shows campaigns but no aggregated earnings, no clear next-actions

### What to build

**Top stat cards (4 across):**
- Lifetime SOL earned (sum of `payouts_v2.amount` where
  `recipientWallet = session.wallet`)
- Active campaigns (joined, not yet settled)
- Pending payouts (settled but tx still confirming)
- Verified views lifetime

**Reputation badge:**
- Show on-chain "clean settlements" count
- Show strike count (0 / 1 / 2 / 3 — banned)
- Tier based on lifetime earnings:
  - <0.5 SOL: "Rookie"
  - 0.5–5 SOL: "Verified"
  - 5–50 SOL: "Pro"
  - >50 SOL: "Elite"
- Each tier unlocks something (early campaign access, higher CPV, etc.)

**My campaigns, grouped by status:**

Section 1: **"Action needed"** (highest priority)
- Participations where `settlementStatus = 'active'` AND campaign is past
  `endsAt` (creator needs to submit Final proof)
- Big "Submit Final Proof" button per row, deep-linking to
  `/verifyClaim/{participationId}?platform=...`

Section 2: **"Awaiting your post"** (campaigns joined but no Join proof yet)
- Same shape, "Submit Join Proof" CTA

Section 3: **"In progress"** (between join and end)
- Shows current view count (from Reclaim's last polled data)
- "Submit follow-up proof" CTA (optional)

Section 4: **"Settled"** (all done)
- Shows amount earned
- Link to Solana Explorer for the tx
- Star rating if creator wants to leave brand feedback (future)

Section 5: **"Disqualified / Forfeited"** (with reason shown)

### Files to touch
- `src/app/(app)/creatordashboard/page.tsx` — full rewrite
- `src/app/(app)/creatordashboard/creatorpage.tsx` — consolidate or delete
- New: `src/components/creator/reputation-badge.tsx`
- New: `src/components/creator/participation-row.tsx`
- New: `src/app/api/v2/creators/me/route.ts` — endpoint returning aggregated
  creator data

### Acceptance criteria
- [ ] Shows only the current wallet's data
- [ ] Action-needed section appears at the top with red border
- [ ] Each row has a clear next-step button (or "—" if nothing to do)
- [ ] Lifetime SOL number animates with CountUp on first load
- [ ] Empty state ("you haven't joined any campaigns yet") links to
      Discover

### Effort
**5 hours.**

### Dependencies
- P0.1 (for proof status)
- P0.2 (for settlement amounts to populate)

---

## P1.5 — End-to-end notifications

### Why it matters
The `notifications_v2` table gets populated by various flows, but no UI
displays them. Users have no way to know their proof was verified, payout
settled, etc. without manually refreshing.

### Current state
- `src/components/notification-bell.tsx` exists
- `src/app/(app)/notifications/page.tsx` exists
- API: `src/app/api/v2/notifications/route.ts` exists
- The wiring is incomplete

### What to build

**1. Bell icon with unread count in `AppSidebar`**
- Poll `/api/v2/notifications/unread-count` every 30 seconds
- Show a red dot + count when > 0
- Click → opens dropdown with last 5 notifications + "View all" link to
  `/notifications`

**2. Mark-as-read flow**
- When dropdown opens, mark visible notifications as read
- Mark-all-as-read button
- Existing endpoint: `/api/v2/notifications/[id]/read`

**3. Browser push notifications (optional but high-impact)**
- On first visit (`/onboarding` page), prompt for browser notification
  permission
- If granted, register a service worker that pings on new notifications
- Use Web Push API (vanilla, no need for third-party service)

**4. Email notifications via Resend**
- Sign up for Resend (free tier: 3,000 emails/month)
- Add `RESEND_API_KEY` env var
- Create email templates (React Email) for:
  - "Your campaign was joined"
  - "Your proof was verified"
  - "Your payout settled — X SOL"
  - "Action needed: submit Final proof for {campaign}"
- Trigger sends from the same code that inserts into `notifications_v2`
- Add `email` column to `profiles_v2` (optional — wallet-only users skip
  email)

**5. Notification preferences**
- Add `/settings/notifications` page
- Toggles: in-app, email, browser push for each notification kind
- Persist in `profiles_v2.notificationPrefs` (JSONB)

### Files to touch
- `src/components/notification-bell.tsx` — implement polling
- `src/app/(app)/notifications/page.tsx` — list view with mark-read
- New: `src/app/api/v2/notifications/unread-count/route.ts`
- New: `src/lib/email/resend-client.ts`
- New: `src/lib/email/templates/*.tsx`
- New: `public/service-worker.js` — for push
- `src/lib/db/schema-v2.ts` — add `email` and `notificationPrefs` columns

### Acceptance criteria
- [ ] Bell shows correct unread count, refreshes every 30s
- [ ] Click bell → dropdown shows latest 5 with read/unread state
- [ ] Click a notification → marks read + navigates to relevant page
- [ ] Emails fire for major events (settled payout, etc.)
- [ ] Browser push works on Chrome (Safari support optional)
- [ ] User can disable any channel from settings

### Effort
**5 hours** (without email/push), **8 hours** with both.

### Dependencies
- P0.1, P0.2 (those flows write the notification rows)

---

## P1.6 — Polished empty + error + loading states

### Why it matters
Empty states ("no campaigns yet") and error states ("network failed") are
the first thing users see when they explore. Right now most are bare
"No results." text. A real product treats these as opportunities.

### Current state
- Mixed. Some pages have decent empty states (Discover), some don't.

### What to build

Audit every page and ensure each one has:

**Loading state:**
- Skeleton screens (use `<Skeleton />` from shadcn/ui or hand-roll)
- NOT a centered spinner — that feels broken
- For lists, render N skeleton rows where N is realistic for non-empty data

**Empty state:**
- SVG illustration (use `unDraw` — free, open-source, on-brand-able)
- Clear headline ("No campaigns yet" / "You haven't joined anything")
- Primary CTA button ("Create your first campaign" / "Browse Discover")
- Optional secondary CTA ("Learn how it works" → `/how-it-works`)

**Error state:**
- Distinct from empty (red border or icon)
- Show what went wrong (network? auth? validation?)
- "Try again" button
- "Contact support" link (mailto for now)

**Pages to cover:**
- `/discover` (empty + error)
- `/leaderboard` (empty + error)
- `/dashboard` (empty + error)
- `/creatordashboard` (empty + error)
- `/analytics` (empty + error)
- `/notifications` (empty)
- `/form` (validation errors — already decent)
- Campaign details modal (loading + 404)

### Files to touch
- `src/components/ui/empty-state.tsx` — already exists, extend
- New: `src/components/ui/error-state.tsx`
- New: `src/components/ui/skeleton-list.tsx`
- Updates across the listed pages

### Acceptance criteria
- [ ] Disconnect network mid-load: error state appears with retry button
- [ ] Sign out: page redirects to a clear "log in to continue" state
- [ ] Each empty state has a working CTA leading somewhere useful
- [ ] No raw "undefined" or stack traces visible to end-users

### Effort
**4 hours.**

### Dependencies
None.

---

## P1.7 — Mobile responsive pass

### Why it matters
50%+ of casual visitors will check the URL on their phone first. If forms
break, modals overflow, or text is unreadable at 375px width, you lose
them.

### Current state
- Tailwind responsive classes are used in many places but not consistently
- No formal mobile testing has happened

### What to build

Open Chrome DevTools → toggle device toolbar → walk every route at these
widths:
- 375px (iPhone SE)
- 414px (iPhone 14 Pro Max)
- 768px (iPad)

Fix breakages in:
- Hero section (text wrapping)
- Campaign form (multi-column grids collapse)
- Campaign details modal (overflows, image sizing)
- Discover grid (3 col → 1 col)
- Sidebar (becomes a hamburger menu)
- Analytics charts (responsive width)
- Tables (horizontal scroll or stacked)

Also test:
- Phantom wallet flow on mobile Chrome (it deep-links to the Phantom app)
- QR code generation on small screens
- Touch targets ≥44px (iOS HIG)

### Files to touch
- Most components — apply Tailwind responsive prefixes (`sm:`, `md:`, `lg:`)
- `src/components/app-sidebar.tsx` — add mobile hamburger
- `src/components/campaign-details-modal.tsx` — ensure scrollable

### Acceptance criteria
- [ ] Every page is usable on iPhone SE (375px) without horizontal scroll
- [ ] All buttons hit-target ≥44px
- [ ] Modals don't trap focus or break on overflow
- [ ] Phantom wallet flow completes from mobile Safari

### Test plan
1. Use BrowserStack (free trial) or actual iPhone/Android
2. Walk Discover → join → verifyClaim flow on each viewport

### Effort
**3 hours.**

### Dependencies
None.

---

## P1.8 — Campaign templates

### Why it matters
The blank form has a 60%+ abandonment rate in marketplaces. Pre-filled
templates reduce friction and teach brands what good campaigns look like.

### Current state
- The form starts blank

### What to build

Add a step before the form: **"Choose a template"** (or skip → blank).

Templates:
1. **Instagram Reel Drop**
   - Title: "[Your brand] — 30s Reel promo"
   - Platform: Instagram
   - Payment model: per_view
   - CPV: 0.0005 SOL
   - Budget: 1.0 SOL
   - End date: +14 days
   - Required hashtag: empty (brand fills)

2. **YouTube Short Promo**
   - Same pattern, YouTube, +30 days

3. **X Thread Push**
   - X (Twitter), 7-day campaign, top_performer model

4. **TikTok GRWM**
   - TikTok, equal_split model

5. **Custom** (blank form)

Implementation:
- New `/form/templates` page with 4 cards
- Selecting a template pre-fills the form state and routes to `/form?template=instagram-reel`
- `useEffect` on `/form` reads the query param and sets initial state

### Files to touch
- New: `src/app/(app)/form/templates/page.tsx`
- `src/app/(app)/form/page.tsx` — accept template query param

### Acceptance criteria
- [ ] Templates page loads with 4 + 1 custom option
- [ ] Selecting a template fills the form with sensible defaults
- [ ] Custom template = the current blank form behavior

### Effort
**2 hours.**

### Dependencies
None.

---

## P1.9 — "Try it" demo mode

### Why it matters
Currently, you can't see the join flow without a wallet. That's a barrier.
A `?demo=1` mode lets evaluators (grant reviewers, hackathon judges, VCs)
experience the product in 60 seconds without setting up Phantom.

### Current state
- No demo mode exists

### What to build

Add a global `?demo=1` query param handler:
- When set, store `demo=true` in sessionStorage
- All wallet-related code paths check for this flag

**In demo mode:**
- Skip Phantom prompts — use a pre-defined demo wallet
  (`DEMO_WALLET_ADDRESS` env var)
- Don't actually submit Solana transactions; simulate the tx confirmation
  with a 1-second timeout
- Don't actually run Reclaim flow; simulate a successful proof after 3
  seconds with mock view data
- Show a persistent banner: "Demo mode — no real transactions occurring.
  Exit demo mode →"
- The "Exit demo mode" link removes the flag and reloads

**A demo button on the landing page:**
- Big secondary CTA next to "Launch a campaign": "**Try the live demo
  (no wallet needed)**"
- Routes to `/discover?demo=1`

### Files to touch
- New: `src/lib/demo-mode.ts` — central flag + mock data
- `src/app/page.tsx` — add CTA button
- `src/app/(app)/layout.tsx` — show demo banner if active
- Various wallet-using components — branch on `isDemoMode()`

### Acceptance criteria
- [ ] Visiting `/?demo=1` shows the demo banner
- [ ] Can browse Discover → join → simulate proof → see settlement, all
      without Phantom
- [ ] Exiting demo mode reloads and clears the flag

### Effort
**4 hours.**

### Dependencies
None.

---

## P1.10 — SEO + Open Graph + favicon

### Why it matters
When someone shares `dashhnew.vercel.app` on Twitter, Discord, WhatsApp,
they see... what? Right now: probably nothing useful. A polished OG image
makes the link clickable.

### Current state
- Default Next.js favicon
- No OG images
- No metadata on most routes

### What to build

**1. Favicon set**
- Design a 1024x1024 logo (use the existing DASHH brand)
- Generate the full icon set using realfavicongenerator.net
- Replace `public/favicon.ico` and add all the iOS, Android, Windows
  variants

**2. Open Graph images**
- Design one master 1200x630 OG image for the landing
- Per-route variants:
  - `/discover`: "Browse verified campaigns on DASHH"
  - `/form`: "Launch a verified influencer campaign"
  - `/how-it-works`: "How DASHH works in 3 steps"
- Save in `public/og/` directory

**3. Next.js metadata**
- Use Next.js 14's `generateMetadata` function in each route
- Set: `title`, `description`, `openGraph.title`, `openGraph.description`,
  `openGraph.images`, `twitter.card`, `twitter.images`, `twitter.creator`
- For dynamic routes (e.g., `/discover/[id]`), generate dynamic OG images
  using `@vercel/og`

**4. robots.txt + sitemap**
- Next.js can auto-generate both
- Configure in `src/app/robots.ts` and `src/app/sitemap.ts`

**5. Structured data (JSON-LD)**
- Add `Organization` schema to landing
- Add `WebSite` schema with `SearchAction`
- Helps Google rich results

### Files to touch
- `public/favicon.ico`, `public/icon-*.png`, `public/og/*.png`
- `src/app/layout.tsx` — root metadata
- `src/app/page.tsx` — landing metadata
- Various route files — per-route metadata
- New: `src/app/robots.ts`
- New: `src/app/sitemap.ts`

### Acceptance criteria
- [ ] Sharing the URL on Twitter shows the OG card preview
- [ ] Sharing on WhatsApp shows preview
- [ ] Favicon shows in browser tab on all browsers
- [ ] Google PageSpeed Insights: SEO ≥ 95
- [ ] Twitter Card Validator passes

### Effort
**2 hours.**

### Dependencies
None.

---

# Priority 2 — Trust + Safety

These don't add features — they make the product credible to evaluators.

---

## P2.1 — Anchor escrow program (audited)

### Why it matters
Currently, all escrow is `SystemProgram.transfer` from the brand to a
hardcoded recipient wallet. That single wallet is controlled by one person
(via private key). Any evaluator immediately asks: "What stops the platform
from running away with the funds?" The answer right now is: "nothing."

This is the **single biggest red flag** for any serious grant evaluator,
investor, or auditor.

### Current state
- `src/lib/solana/escrow.ts` — placeholder helper, doesn't deploy a contract
- The form flow `sendTransaction()` sends SOL to
  `8vbaCLhg1SZmiGNZfFzV2DEJHenFtdgg7G2JtY5v74i1`

### What to build

**1. Write the Anchor program**

New directory: `programs/dashh-escrow/`

Functions:
- `initialize_campaign(brand: Pubkey, campaign_id: [u8; 16], budget: u64,
   ends_at: i64, settlement_window_days: u8)`
  - Creates a PDA owned by the program: seed = ["campaign", campaign_id]
  - Transfers `budget` SOL from brand → PDA
  - Stores campaign metadata in the PDA

- `settle(campaign_id, creator: Pubkey, amount: u64, verifier_sig: [u8; 64])`
  - Verifies the platform's verifier signature over
    (campaign_id, creator, amount, nonce)
  - Transfers `amount` SOL from PDA → creator
  - Updates a tracking field to prevent double-pay for same nonce

- `refund_brand(campaign_id)`
  - Only callable after `ends_at + settlement_window_days`
  - Only callable if no `settle` calls have happened
  - Transfers all remaining PDA balance → brand
  - Closes the PDA

- `cancel(campaign_id)`
  - Only callable by brand before any participation
  - Transfers PDA balance → brand
  - Closes the PDA

**2. Test thoroughly**
- Unit tests in `tests/escrow.test.ts` covering happy path + every revert
  condition
- Mutation tests: try to settle without verifier sig, try to refund early,
  try to double-settle

**3. Deploy to devnet first**
- Build: `anchor build`
- Deploy: `anchor deploy --provider.cluster devnet`
- Save the program ID; add to `.env` as
  `NEXT_PUBLIC_DASHH_ESCROW_PROGRAM_ID`

**4. Update the form flow**
- Replace `SystemProgram.transfer` with a call to `initialize_campaign`
- Update `/api/v2/settle` to call `settle` instead of direct transfer
- Update refund logic in P0.3 to call `refund_brand`
- Update cancel logic in P0.4 to call `cancel`

**5. Get it audited**
- Apply to **Superteam India audit grant** —
  https://earn.superteam.fun/listings/?tag=audit
- OR **OtterSec builder audit program** —
  https://osec.io
- Audit cost: $0 if grant approved, otherwise $5k–$15k
- Audit duration: 2–4 weeks

**6. After audit passes**
- Publish the audit report in `docs/AUDIT_REPORT.pdf`
- Verify on Solscan that the deployed program matches the audited
  source (publish verifiable build)
- Add audit badge to landing page

### Files to touch
- New: `programs/dashh-escrow/src/lib.rs`
- New: `programs/dashh-escrow/Cargo.toml`
- New: `Anchor.toml`
- New: `tests/escrow.test.ts`
- `src/app/(app)/form/page.tsx` — replace direct transfer
- `src/app/api/v2/settle/route.ts` — call program
- `src/lib/solana/escrow.ts` — full rewrite as a program-interaction layer

### Acceptance criteria
- [ ] Program deploys cleanly to devnet
- [ ] All four functions work via Anchor tests
- [ ] No double-spend possible
- [ ] No early-refund possible
- [ ] Audit report exists in docs/

### Effort
**3–4 weeks** total (writing: 1 week, testing: 1 week, audit wait: 2 weeks).

### Dependencies
- P0.1 + P0.2 must be done first — we need to know the exact data flow
  before designing the program's state.

---

## P2.2 — Multisig the platform wallet

### Why it matters
Even before the Anchor program is ready, the current recipient wallet should
be a multisig. Single-key wallets are a "rugpull risk" red flag.

### Current state
- `8vbaCLhg1SZmiGNZfFzV2DEJHenFtdgg7G2JtY5v74i1` is single-key
- Private key is held by one team member's Phantom

### What to build

**1. Create a Squads multisig**
- Go to https://app.squads.so
- Create new multisig: 3-of-5 signature threshold
- Add all 5 team members' wallets as members
- Get the multisig address (a new Solana address)

**2. Migrate funds**
- Transfer all SOL from the current recipient wallet to the new Squads
  multisig
- This requires the current key holder to sign the migration tx

**3. Update env vars**
- Vercel: `SOLANA_RECIPIENT_ADDRESS = <new multisig address>`
- Redeploy

**4. Test**
- Run a test campaign with 0.01 SOL
- Verify the SOL lands in the multisig
- Attempt to withdraw from the multisig with 2-of-5 signatures — should
  fail (threshold is 3)
- Withdraw with 3-of-5 — should succeed

### Files to touch
- `.env.example` (update placeholder comment)
- `docs/SECURITY.md` — document the multisig setup

### Acceptance criteria
- [ ] All campaign escrows route to the new multisig
- [ ] No single team member can drain it
- [ ] Documentation explains the multisig governance

### Effort
**30 minutes.**

### Dependencies
None. Do this immediately.

---

## P2.3 — Rate limiting + bot protection

### Why it matters
The current `src/lib/ratelimit.ts` provides basic rate limiting on a few
endpoints. But campaign creation is wide open. A bad actor could script
10,000 spam campaigns and choke the DB.

### Current state
- `src/lib/ratelimit.ts` exists with `rateLimit()` + `clientKey()`
- Some endpoints (`POST /api/v2/campaigns`, `POST /participate`) use it
- No CAPTCHA on any flow

### What to build

**1. Tighten existing rate limits**
- Campaign creation: 5 per wallet per hour (not 10 per minute)
- Participation: 20 per wallet per hour
- Proof submission: 10 per wallet per hour
- Auth nonce: 30 per IP per minute (prevent nonce flooding)

**2. CAPTCHA on critical flows**
- Add Cloudflare Turnstile (free) to:
  - Campaign creation form
  - Brand sign-up (after wallet connect)
- Server-side verification via `/api/v2/captcha/verify`
- Store `CLOUDFLARE_TURNSTILE_SECRET` in env vars

**3. IP-based throttling on auth nonce**
- Track requests per IP in Redis (or in-memory if Vercel is fine with it)
- Block IPs that exceed 60 nonce requests in 1 minute for 1 hour

**4. Per-wallet limits**
- Add a check: any wallet creating its 6th campaign in 1 hour gets a 429
- Use a Redis-backed counter (or DB column on profiles_v2)

### Files to touch
- `src/lib/ratelimit.ts` — extend with per-wallet variants
- New: `src/lib/captcha.ts` — Turnstile verification
- Various API routes — apply new limits
- `src/components/forms/campaign-form.tsx` — add Turnstile widget

### Acceptance criteria
- [ ] Trying to create a 6th campaign in an hour gets 429
- [ ] CAPTCHA appears on the form
- [ ] Form fails to submit without solving CAPTCHA
- [ ] Repeated nonce requests from one IP get blocked

### Effort
**3 hours.**

### Dependencies
None.

---

## P2.4 — Error monitoring (Sentry)

### Why it matters
Right now, server errors in production are invisible. The only way to find
them is reading Vercel logs manually. Sentry gives real-time alerts.

### Current state
- No error monitoring

### What to build

1. **Sign up** at https://sentry.io (free tier: 5k events/month)
2. **Install** `@sentry/nextjs`:
   ```bash
   npm install @sentry/nextjs
   npx @sentry/wizard@latest -i nextjs
   ```
   The wizard creates config files and updates `next.config.js`
3. **Add env var:** `SENTRY_DSN` (provided by Sentry)
4. **Configure** in `sentry.client.config.ts` and `sentry.server.config.ts`:
   - `environment: process.env.VERCEL_ENV` ("production"/"preview"/"development")
   - `tracesSampleRate: 0.1` (10% of transactions)
   - User context: tag with `session.wallet` if available
5. **Test** by throwing a test error in a temporary `/api/test-sentry`
   route, hitting it once, and confirming it appears in Sentry
6. **Set up alerts:** Slack webhook for any error in production

### Files to touch
- `sentry.client.config.ts`, `sentry.server.config.ts` (auto-generated)
- `next.config.js` (auto-updated by wizard)
- Various API routes — wrap critical handlers in try/catch and call
  `Sentry.captureException`

### Acceptance criteria
- [ ] Errors in production appear in Sentry within 1 minute
- [ ] Stack traces show de-minified source (sourcemaps uploaded)
- [ ] User wallet is attached to error context
- [ ] Slack alert fires on first occurrence of new error type

### Effort
**1 hour.**

### Dependencies
None.

---

## P2.5 — Analytics (PostHog)

### Why it matters
You have no data on:
- Where users drop off
- Which features are used
- What % of visitors connect a wallet
- What % of campaign-form opens result in submissions
- Cohort behavior (do creators come back?)

Without this, every product decision is a guess.

### Current state
- No analytics

### What to build

1. **Sign up** at https://posthog.com (free tier: 1M events/month)
2. **Install** `posthog-js`:
   ```bash
   npm install posthog-js
   ```
3. **Add env var:** `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`
4. **Initialize** in a top-level component:
   ```tsx
   // src/lib/posthog.ts
   import posthog from 'posthog-js'

   if (typeof window !== 'undefined') {
     posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
       api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
       person_profiles: 'identified_only',
     })
   }
   ```
5. **Track key events:**
   - `landing_view`
   - `wallet_connected` (props: walletAddress)
   - `campaign_form_opened`
   - `campaign_submitted` (props: budget, paymentModel, platform)
   - `campaign_join_clicked` (props: campaignId)
   - `campaign_join_signed` (props: campaignId)
   - `proof_submitted` (props: participationId, platform)
   - `payout_received` (props: amount)

6. **Identify users:**
   - On wallet connect: `posthog.identify(walletAddress)`
   - On SIWS: set user property `isAuthenticated: true`

7. **Set up funnels in PostHog dashboard:**
   - "Landing → Wallet → Campaign Created"
   - "Discover → Join → Proof Submitted → Payout"

### Files to touch
- New: `src/lib/posthog.ts`
- `src/app/layout.tsx` — initialize once
- Various components — fire events at key moments

### Acceptance criteria
- [ ] Events appear in PostHog within 30s of firing
- [ ] User identification persists across sessions
- [ ] At least 2 funnels visible in the dashboard
- [ ] Privacy: no PII tracked (just wallet addresses, which are public)

### Effort
**2 hours.**

### Dependencies
None.

---

## P2.6 — Privacy Policy + Terms of Service pages

### Why it matters
Legal pages aren't optional. Most grant evaluators and ad networks check
that you have them. Magic Eden's Launchpad won't approve a project without
proper legal pages. Stripe/payment processors require them.

### Current state
- `src/lib/terms.ts` has the on-chain T&C (campaign-level, signed terms)
- No standalone Privacy Policy or ToS pages

### What to build

1. **Generate base templates** using Termly (free for basic) or Iubenda
   ($10/year)
   - Privacy Policy
   - Terms of Service
   - Cookie Policy

2. **Customize for DASHH:**
   - Data collected: wallet address, IP (for rate limit), email if provided
   - Data NOT collected: passwords, PII beyond wallet
   - Third parties: Vercel, Neon, Reclaim, Sentry, PostHog
   - User rights: GDPR (delete account), CCPA (do not sell)

3. **Create pages:**
   - `/legal/privacy` — Privacy Policy
   - `/legal/terms` — Terms of Service
   - `/legal/cookies` — Cookie Policy (only if you set cookies, which
     PostHog does)
   - All linked from the footer

4. **Cookie banner:**
   - First-visit modal asking for analytics consent
   - If declined, don't initialize PostHog
   - Use the `js-cookie-consent` library or hand-roll a simple version

5. **Update `/terms` route:**
   - Currently shows the campaign T&C signed by brands/creators
   - Add a link "DASHH platform terms" → `/legal/terms` at the top

### Files to touch
- New: `src/app/legal/privacy/page.tsx`
- New: `src/app/legal/terms/page.tsx`
- New: `src/app/legal/cookies/page.tsx`
- New: `src/components/cookie-banner.tsx`
- `src/components/footer.tsx` — update legal links
- `src/lib/posthog.ts` — gate behind consent

### Acceptance criteria
- [ ] All 3 legal pages exist with reasonable copy
- [ ] Cookie banner appears on first visit
- [ ] Declining the banner disables analytics
- [ ] Pages are linked from the footer
- [ ] No legal page is older than 6 months (add a "Last updated" line)

### Effort
**1 hour** (mostly copy-paste from generator + customize).

### Dependencies
None.

---

# Priority 3 — Growth + Virality Features

After P0–P2 are done, these drive distribution.

---

## P3.1 — Public case study page

### Why it matters
A single real case study is worth 100 marketing posts. The first time a
brand can point to a settled campaign with real numbers, your conversion
rate doubles.

### Current state
- No case study pages

### What to build

1. **`/case-studies/[slug]` route**
   - One MDX file per case study in `src/content/case-studies/`
   - Frontmatter: brand name, logo, campaign ID, period, results
   - Body: storytelling narrative with embedded screenshots

2. **Auto-populated data:**
   - Pull live numbers from the DB (total verified views, total paid out,
     disqualification rate)
   - Show the actual settlement transactions with explorer links

3. **Embedded media:**
   - Embed the social media posts that earned views (Instagram embed
     iframe, YouTube embed, X tweet embed)
   - Privacy: only for posts the creator opts to publish

4. **CTA at bottom:**
   - "Run a similar campaign" → /form with template pre-filled
   - "Become a verified creator" → /onboarding

5. **`/case-studies` index page:**
   - Grid of all case studies
   - Filter by platform, payment model

### Files to touch
- New: `src/app/case-studies/page.tsx`
- New: `src/app/case-studies/[slug]/page.tsx`
- New: `src/content/case-studies/*.mdx`
- New: `src/lib/case-studies.ts` — MDX loader

### Acceptance criteria
- [ ] At least 1 case study exists (use a seeded/test campaign initially)
- [ ] Live numbers in the case study match DB
- [ ] Mobile-responsive
- [ ] OG image generated per case study

### Effort
**4 hours** (per case study, including writing).

### Dependencies
- Real settled campaign (from P0.1 + P0.2)

---

## P3.2 — Referral system

### Why it matters
The `ReferralCard` component already exists in your codebase, partially
wired. Finishing it creates a viral loop: creators recruit other creators,
earning a cut.

### Current state
- `src/components/referral-card.tsx` exists but isn't fully functional

### What to build

1. **Unique referral codes per wallet**
   - Generate a 6-char alphanumeric code on first wallet connect
   - Store in `profiles_v2.referralCode`
   - URL format: `dashhnew.vercel.app/discover?ref=ABC123`

2. **Track referrals**
   - When a new wallet connects via `?ref=X`, store
     `profiles_v2.referredBy = wallet of X`
   - One-time only; can't change after first set

3. **Reward logic**
   - When a referred creator completes their first 3 settlements, the
     referrer gets a 1% bonus on those settlements
   - Implement in `/api/v2/settle` route: after computing a creator's
     payout, check `profiles_v2.referredBy` and if their first 3
     settlements, send 1% extra to the referrer (from platform fee share)

4. **UI**
   - On creator dashboard, show: "Your referrals: X joined, Y earning"
   - Big "Copy referral link" button
   - Leaderboard tab: top referrers

5. **Anti-abuse:**
   - Sybil resistance: same IP / device can't refer themselves (track
     fingerprint)
   - Cap: referrer gets max 0.5 SOL bonus per referred creator

### Files to touch
- `src/components/referral-card.tsx` — finish wiring
- `src/lib/db/schema-v2.ts` — add `referralCode`, `referredBy` to
  `profiles_v2`
- `src/app/api/v2/settle/route.ts` — add bonus logic
- `src/app/api/v2/profile/me/route.ts` — generate code on first access
- `src/app/(app)/discover/page.tsx` — handle `?ref=` query param

### Acceptance criteria
- [ ] Every wallet has a referral code
- [ ] Visiting `/discover?ref=X` and signing up associates the new wallet
      with X's referral
- [ ] After 3 settlements, the referrer's wallet receives the 1% bonus tx
- [ ] Leaderboard shows top 10 referrers

### Effort
**3 hours.**

### Dependencies
- P0.2 (settlement needs to be working)

---

## P3.3 — Documentation site (`/docs`)

### Why it matters
Developers, integrators, and serious evaluators want documentation. Without
it, your project looks half-built.

### Current state
- README exists
- Various docs in `docs/` folder
- No public-facing docs site

### What to build

Use **Nextra** (Next.js MDX docs framework — works inside this monorepo
without a separate deployment).

1. **Install Nextra:**
   ```bash
   npm install nextra nextra-theme-docs
   ```
   Configure `next.config.js` to use Nextra theme for `/docs/*` routes only

2. **Structure:**
   ```
   src/pages/docs/
     ├── index.mdx                  # Overview
     ├── getting-started/
     │   ├── brands.mdx             # "I'm a brand"
     │   ├── creators.mdx           # "I'm a creator"
     │   └── wallets.mdx            # Wallet setup
     ├── concepts/
     │   ├── two-proof-model.mdx
     │   ├── payment-models.mdx
     │   ├── disqualification.mdx
     │   └── settlement.mdx
     ├── api/
     │   ├── overview.mdx
     │   ├── campaigns.mdx
     │   ├── proofs.mdx
     │   └── webhooks.mdx
     └── faq.mdx
   ```

3. **Content priorities (write these first):**
   - Getting started for brands (15-min read)
   - Getting started for creators (10-min read)
   - The two-proof model explained
   - Payment models compared
   - Full disqualification rules with examples
   - API reference for `/api/v2/campaigns`

4. **Hosted at `dashhnew.vercel.app/docs`** — sub-path of main app

### Files to touch
- New: many `.mdx` files
- `next.config.js` — Nextra integration
- `src/components/footer.tsx` — link to docs

### Acceptance criteria
- [ ] Docs site live at /docs
- [ ] At least 8 pages of real content (no Lorem Ipsum)
- [ ] Search works (Nextra ships with a search component)
- [ ] Mobile-responsive

### Effort
**6 hours.**

### Dependencies
None.

---

## P3.4 — Brand verification badges

### Why it matters
Once you onboard real brands, signal trust visually. A "verified" checkmark
on a campaign card converts more creators.

### Current state
- All campaigns look equally trustworthy

### What to build

1. **Add to schema:**
   - `profiles_v2.verified: boolean DEFAULT false`
   - `profiles_v2.verifiedAt: timestamp`
   - `profiles_v2.verificationLevel: enum('none', 'basic', 'kyb')`

2. **Manual verification process:**
   - Brand applies via a form at `/become-verified`
   - Email goes to team
   - Manually flip the flag in the DB after due diligence
   - Email the brand confirming

3. **UI:**
   - Blue checkmark next to brand wallet on campaign cards
   - Tooltip: "Verified brand — manually vetted by DASHH team"
   - Filter on Discover: "Verified only" toggle

4. **Later (P4):** automate via Sumsub / Veriff KYB

### Files to touch
- `src/lib/db/schema-v2.ts` — add columns
- `src/components/campaign-card.tsx` — show badge
- New: `src/app/become-verified/page.tsx`
- New: `src/app/api/v2/profile/verify-request/route.ts`

### Acceptance criteria
- [ ] Verified brands get a visible badge
- [ ] Filter toggle works on Discover
- [ ] Application form sends an email to admin

### Effort
**3 hours.**

### Dependencies
None.

---

## P3.5 — Embed widget for brands

### Why it matters
Brands want to embed their DASHH campaign on their own marketing site.
Currently they can only share a link. An embeddable iframe = free
distribution.

### Current state
- No embed widget

### What to build

1. **Public embed route:** `/embed/campaign/[id]`
   - Renders a minimal, brand-customizable campaign card
   - Shows: title, image, budget, days left, current participants
   - Single CTA: "Join campaign" → opens DASHH in new tab
   - No header/sidebar/auth gating

2. **`iframe` snippet generator:**
   - In the campaign details (brand view), add a "Get embed code" button
   - Modal shows: `<iframe src="https://dashhnew.vercel.app/embed/campaign/{id}" width="400" height="300" />`
   - Copy button

3. **Styling options:**
   - Theme: light / dark / auto
   - Accent color: query param `?accent=14F195`
   - Hide elements: `?hide=image,description`

### Files to touch
- New: `src/app/embed/campaign/[id]/page.tsx`
- New: `src/components/campaign-card-embed.tsx`
- Campaign details modal — add "Get embed code" button

### Acceptance criteria
- [ ] Embed page renders correctly in an iframe (no X-Frame-Options block)
- [ ] Embed code is copyable
- [ ] Embed updates live as the campaign progresses

### Effort
**3 hours.**

### Dependencies
None.

---

# Priority 4 — Mainnet Launch Readiness

Don't touch these until P0–P2 are done.

---

## P4.1 — Switch to Solana Mainnet

### Why it matters
Devnet is play money. Real economics only happen on mainnet.

### Pre-requisites checklist
- [ ] P2.1 (audited Anchor escrow) is complete
- [ ] P2.2 (multisig platform wallet) is complete
- [ ] P2.3 (rate limiting + CAPTCHA) is complete
- [ ] P2.4 (Sentry) is complete
- [ ] P2.6 (legal pages) is complete
- [ ] At least 2 design-partner brands ready to run real campaigns

### What to build

1. **New environment variables (Vercel production):**
   ```
   NEXT_PUBLIC_SOLANA_CLUSTER=mainnet-beta
   NEXT_PUBLIC_SOLANA_RPC=https://mainnet.helius-rpc.com/?api-key=<your_key>
   SOLANA_RECIPIENT_ADDRESS=<new mainnet multisig address>
   NEXT_PUBLIC_DASHH_ESCROW_PROGRAM_ID=<mainnet deployment of audited program>
   ```

2. **Get a real RPC endpoint:**
   - Sign up at https://helius.dev (free tier: 100k requests/day)
   - Or QuickNode ($9/month for serious usage)
   - Do NOT use `api.mainnet-beta.solana.com` (rate-limited)

3. **Deploy the Anchor program to mainnet:**
   - `anchor deploy --provider.cluster mainnet-beta`
   - Costs ~5 SOL in deploy fees
   - Verify on Solscan: source matches deployed binary

4. **Migrate test data:**
   - Don't migrate. Mainnet starts with empty DB.
   - Create a separate Neon project for mainnet (different DATABASE_URL)
   - Keep devnet env as a staging URL

5. **Reclaim provider IDs:**
   - The same provider IDs work on mainnet (Reclaim doesn't care which
     blockchain you're on)
   - Update RECLAIM_APP_ID to a mainnet-tier Reclaim application if
     Reclaim requires it

6. **Smoke test:**
   - Run a 0.01 SOL test campaign end-to-end
   - Have a teammate join, submit proofs, get paid
   - Verify on Solscan: every tx looks correct

### Files to touch
- Vercel env vars (production)
- `programs/dashh-escrow/Anchor.toml` — mainnet cluster config

### Acceptance criteria
- [ ] One real test campaign settles end-to-end on mainnet
- [ ] All UI shows "mainnet" badges, not devnet
- [ ] Phantom prompts say "Solana Mainnet" (not devnet)
- [ ] Settlement transactions appear on Solscan main explorer

### Effort
**1 day** (mostly config + smoke testing).

### Dependencies
- ALL of P2 must be complete

---

## P4.2 — KYB (Know Your Brand) for large campaigns

### Why it matters
Once real money flows, regulatory exposure starts. For campaigns over a
threshold (say 100 SOL), brands need to be KYC'd. This is also required
for stablecoin payouts via Stripe (future).

### Current state
- No KYC/KYB at all

### What to build

1. **Provider:** Sumsub (~$1.50/verification) or Veriff (~$1.40)
   - Both have free trials
   - Integration: their hosted iframe

2. **Threshold rule:**
   - Brands with cumulative escrow ≤ 50 SOL: no KYB required
   - 50–500 SOL: basic KYB (business email, business name, country)
   - >500 SOL: full KYB (business registration, beneficial owner ID)

3. **Implementation:**
   - When a brand creates a campaign that would push them over a threshold,
     redirect to `/onboarding/kyb`
   - Embed Sumsub iframe
   - On completion, set `profiles_v2.kybLevel` and `profiles_v2.kybProviderId`
   - Allow campaign creation to proceed

4. **Per-jurisdiction rules:**
   - For India: GST number for businesses, PAN for individuals
   - For US: EIN for businesses
   - For EU: VAT number for businesses (with VIES validation)

### Files to touch
- `src/lib/db/schema-v2.ts` — add `kybLevel`, `kybProviderId`, `kybCountry`
- New: `src/app/onboarding/kyb/page.tsx`
- New: `src/app/api/v2/kyb/callback/route.ts` (Sumsub webhook)
- `src/app/api/v2/campaigns/route.ts` — gate creation by KYB level

### Acceptance criteria
- [ ] Brands under threshold can create campaigns without KYB
- [ ] Over-threshold brands redirected to KYB before creation
- [ ] KYB completion stored persistently
- [ ] India-resident brands prompted for GST/PAN as appropriate

### Effort
**8 hours.**

### Dependencies
- P4.1 (mainnet)

---

## P4.3 — GST registration + invoicing (India-specific)

### Why it matters
If DASHH's platform fee revenue exceeds ₹20 lakhs/year, GST registration
is mandatory. Brands paying you in SOL still trigger GST.

### Current state
- No invoicing infrastructure

### What to build

1. **LLP / Pvt Ltd formation** (out of scope for this doc, but
   pre-requisite):
   - Form LLP (₹6k, 1 week) — see "Strategic Roadmap" section below
   - Open business bank account
   - Apply for GST number (₹0, online, takes 2 weeks)
   - Get a CA who handles crypto income (₹5-15k/year)

2. **Auto-invoicing:**
   - For every campaign, generate a GST-compliant invoice for the brand:
     - Platform's GST number
     - Brand's name (from KYB)
     - Service description: "Influencer marketing platform fee"
     - Amount: 20% of campaign budget in SOL → INR conversion at tx time
     - GST: 18% on services
   - PDF format
   - Email to brand after campaign creation
   - Store in DB: `invoices_v2` table

3. **Monthly GSTR-1 filing:**
   - Export all invoices to JSON
   - Upload to GST portal via your CA

### Files to touch
- New: `src/lib/db/schema-v2.ts` — `invoices_v2` table
- New: `src/lib/invoicing/pdf-generator.ts`
- New: `src/app/api/v2/invoices/[id]/route.ts`

### Acceptance criteria
- [ ] Brand receives a PDF invoice after campaign creation
- [ ] Invoice includes GST number + correct breakdown
- [ ] Monthly export to JSON works for GSTR-1

### Effort
**6 hours.**

### Dependencies
- LLP formation (manual, ~1 week)
- P4.1 (mainnet)

---

# Strategic Roadmap (Marketing, Funding, Operations)

This section is NOT engineering tasks. It's the meta-plan for getting DASHH
to a fundable / launchable state.

---

## SR.1 — Twitter audience building (4-week sprint)

### Goal
Grow from 0 to 300–400 quality followers in 4 weeks.

### Daily routine (40 minutes/day, one founder)
- Morning (15 min): post 1 substantive tweet (thread or single + image)
- Midday (10 min): reply to 5 Solana/Reclaim ecosystem accounts with
  substance (not "🔥🔥🔥")
- Afternoon (10 min): reply to 5 more accounts
- Evening (5 min): DM 1 micro-influencer or design partner

### Seed accounts to follow (~200 accounts)
**Tier 1 — Solana ecosystem (60 accounts):**
- @solana, @SolanaFndn, @aeyakovenko, @rajgokal, @toly_eg
- @phantom, @solflare_wallet, @backpack, @magicedenSOL, @tensor_hq
- @0xmert_, @trentdotsol, @armaniferrante, @questbook_

**Tier 2 — Reclaim / zkTLS (20 accounts):**
- @reclaimprotocol + all listed team members
- Other zkTLS app teams

**Tier 3 — Indian Web3 (50 accounts):**
- @SuperteamIN + all coordinators
- @kashdhanda (Solana India lead)
- @anubhavj_ (Buidlers Tribe)
- College Web3 clubs (BITS, IIT, NIT)

**Tier 4 — Creator economy thought leaders (40 accounts):**
- @thejustinwelsh, @dickiebush, @nicolasco_le
- @cdixon, @balajis

**Tier 5 — Hackathon/grant gatekeepers (30 accounts):**
- @colosseum_org, @MetaplexDAO, @HeliusLabs
- VCs: @multicoincap, @ParadigmCap

### Week 1 content
- Day 1-2: Pinned tweet + 60-second demo video (P1.2)
- Day 3: "Why I built DASHH" thread
- Day 4-7: Build-in-public micro-posts (1 per day)

### Week 2 content
- Apply to Reclaim grant + Superteam bounties publicly (tweet about applying)
- Long-form technical threads (3-4 per week)

### Week 3 content
- 1 viral-aim post per week ("Most influencer marketing platforms are
  scams" format)
- Comparison content
- DM 30 micro-influencers for design partnerships

### Week 4 content
- First case study post (the most important post)
- Open Discord
- Cross-post to Discord

### What NOT to do
- ❌ Don't buy followers
- ❌ Don't follow-for-follow
- ❌ Don't shill in others' replies
- ❌ Don't tweet GM 50 times a day
- ❌ Don't promise utility you can't deliver
- ❌ Don't run multiple accounts (algorithm flags)
- ❌ Don't post wallet address publicly

---

## SR.2 — Grant applications (priority order)

### 1. Reclaim Protocol grant — APPLY FIRST
- URL: https://reclaimprotocol.org/grants (or DM @reclaimprotocol on X)
- Expected: $1k–$10k
- Approval rate: high (you're a flagship use case)
- Application material:
  - Project summary (1 page)
  - GitHub link
  - Live demo URL
  - Reclaim integration overview (show the verify.ts + adapters)
  - 60-sec demo video (P1.2)

### 2. Superteam India bounties
- URL: https://earn.superteam.fun
- Pick bounties matching your skillset
- Reply with how DASHH solves the bounty
- Expected: $500–$5k per bounty

### 3. Solana Foundation grants
- URL: https://solana.org/grants
- Tier 1 (early-stage builder): $5k–$25k
- Application material:
  - Detailed roadmap (use this doc!)
  - Team bios
  - Architecture diagram
  - Budget justification

### 4. Metaplex grant
- URL: https://www.metaplex.com/grants
- Pre-requisite: Founder NFT mint planned with Metaplex Core
- Expected: $5k–$25k

### 5. Helius cNFT grants
- URL: https://www.helius.dev (apply via their team)
- Pre-requisite: use Helius infrastructure (RPC, indexer)
- Expected: $5k–$20k

### 6. Colosseum hackathon
- URL: https://www.colosseum.org
- Submit when there's an active hackathon
- Prize range: top 10 = $5k–$25k, top 3 = $50k+

### Total realistic 3-month total: $10k–$30k

---

## SR.3 — Founder NFT mint plan

### Pre-mint requirements (must hit ALL before launching)
- [ ] Twitter ≥ 300 quality followers
- [ ] Discord ≥ 50 members
- [ ] At least 1 settled case study
- [ ] Audited Anchor escrow live on mainnet (P2.1)
- [ ] LLP or offshore entity formed (for clean tax treatment)

### NFT spec
- Name: DASHH Founder Pass
- Supply: 2,000 NFTs
- Standard: Metaplex Core (modern, cheap)
- Mint price: 0.05 SOL (~$10) for whitelist, 0.07 SOL (~$14) public
- Total raise potential: 100–140 SOL ($20k–$28k)

### Tiers
- Genesis (NFTs #1–50): Lifetime 0% platform fee + 1% of platform revenue
  shared among Genesis holders (CAUTION: this is securities-adjacent;
  consult lawyer first OR remove this tier)
- Founder (NFTs #51–500): Lifetime 50% platform fee discount (so 10%
  instead of 20%)
- Supporter (NFTs #501–2000): Lifetime 25% platform fee discount (so 15%
  instead of 20%)

### Safe utility language (rewrite the Genesis tier as):
- "Holders get a 100% discount on their own platform fees (lifetime)"
- "Access to a private Discord channel for early access to features"
- DO NOT use phrases like "share of revenue", "investment", "value
  appreciation"

### Launch sequence
1. Apply to Magic Eden Launchpad (5-day review)
2. Generate art (10k variants of a base design via generative script)
3. Upload to Arweave via Irys
4. Deploy Metaplex Candy Machine v3
5. Day -7: Countdown thread on Twitter
6. Day -3: Drop utility doc + roadmap
7. Day -1: Allowlist opens (Discord members)
8. Day 0: Public mint at 0.05–0.07 SOL
9. Day +1 to +7: Open mint until sold out or window closes

### Risks
- 95% of NFT collections trade below mint price within 6 months
- Magic Eden sell-through rate is < 30% for new collections
- Indian VDA tax: 30% flat + 1% TDS on all sales
- Securities risk if utility is framed wrong

---

## SR.4 — Founder agreement + LLP formation

### Co-founder equity split

Recommended for 5-person teams: **20% each with 4-year vesting and 1-year
cliff.**

What this means:
- Year 0: All 5 founders own 0% (technically they have rights to vest)
- Year 1 (cliff): Each founder gets 5% (1/4 of their 20%) all at once
- Year 1–4: Remaining 15% vests monthly (5% per year)
- Year 4: Each founder owns full 20%

If a founder leaves before Year 4, they keep only what's vested. The
rest goes back to the company pool (redistributable to remaining
founders or future hires).

### Sign-now document
A 1-page co-founder agreement covering:
1. Founder list (names, addresses, contributions to date)
2. Equity split (20% each, vesting schedule)
3. IP ownership (all DASHH code/IP belongs to the LLP, not individuals)
4. Decision-making (3-of-5 majority for major decisions)
5. Departure handling (vested equity kept, unvested forfeited)
6. Dispute resolution (arbitration in [city])

Even a Google Doc signed by all 5 is legally enforceable in India.

### LLP formation
- Cost: ₹6k–₹12k
- Timeline: 7–10 days
- Required documents:
  - PAN for all partners
  - Aadhaar for all partners
  - Proof of registered office (rent agreement or utility bill)
  - DPIN (Designated Partner Identification Number) for each partner
- Online via MCA portal or via a CA (recommended)

### Bank account
- After LLP formation: open current account at Axis/HDFC/ICICI
- Get FIRC certification capability (for foreign wire transfers)
- Optional: Wise Business account (UK-incorporated, easier for foreign
  payments)

---

## SR.5 — Tax compliance checklist (India)

### Records to keep (from Day 1)
- Every grant/prize/payment received (date, amount, source, txn hash if
  crypto)
- Every operating expense (Vercel, Neon, domain, design tools)
- Every founder time-contribution (rough hours/week)

### Tax events
1. **Receiving grants in USD/USDC:**
   - Get FIRC from bank for every wire
   - Income tax at slab rates (0–30% depending on bracket)
   - File quarterly TDS returns if total > ₹2L/year

2. **Receiving SOL platform fees on mainnet:**
   - Every conversion SOL → INR is a VDA event
   - 30% flat tax on gains
   - 1% TDS on every transaction over ₹10k

3. **NFT mint proceeds:**
   - Same as #2 — VDA tax applies

4. **GST registration:**
   - Mandatory above ₹20L/year revenue
   - 18% GST on services rendered

5. **Founder salaries (if any):**
   - LLP can pay partners as "remuneration"
   - Deductible at LLP level, taxable at partner level

### CA requirements
- Find a CA familiar with VDA tax (most regular CAs aren't updated)
- Cost: ₹5–15k/year
- Quarterly meetings to file GST returns and book closures

---

## SR.6 — When to incorporate as Pvt Ltd (vs LLP)

Stay LLP unless:
- Taking equity funding from a VC (Pvt Ltd is required)
- Issuing ESOPs to employees (Pvt Ltd is required)
- Going for IPO (definitely Pvt Ltd)

LLP is cheaper, simpler, and sufficient for first 12-18 months.

### Pvt Ltd vs LLP comparison
| | LLP | Pvt Ltd |
|---|---|---|
| Formation cost | ₹6k–₹12k | ₹15k–₹30k |
| Annual compliance | ₹3–5k | ₹15–25k |
| Can issue ESOPs | No | Yes |
| Can take VC equity | No (only partner buy-in) | Yes |
| Limited liability | Yes | Yes |
| Number of partners/shareholders | 2–unlimited | 2–200 |

---

# Recommended Build Order (calendar view)

This is the practical execution plan. Use it as a checklist.

## Week 1: P0 closures (the foundation)
- [ ] Day 1: P0.1 — Reclaim proof submission (3h)
- [ ] Day 2: P0.2 — Settlement runner (6h)
- [ ] Day 3: P0.3 — Brand refund + P0.4 — Cancel campaign (4h)
- [ ] Day 4: P0.5 — End-to-end verification (1h) + write demo video script
- [ ] Day 5: P1.2 — Record + edit demo video (4h)

**Output:** Product works end-to-end. One demo video.

## Week 2: P1 polish
- [ ] Day 6-7: P1.1 — Landing page rebuild (8h)
- [ ] Day 8: P1.3 — Brand analytics (6h)
- [ ] Day 9: P1.4 — Creator earnings (5h)
- [ ] Day 10: P1.5 — Notifications (5h)
- [ ] Day 11: P1.6 + P1.7 — Empty states + mobile (7h)
- [ ] Day 12: P1.10 — SEO + OG (2h) + P1.9 — Demo mode (4h)

**Output:** Showcase-grade product.

## Week 3: P2 trust + safety
- [ ] Day 13: P2.2 — Multisig (30 min) + P2.4 — Sentry (1h) + P2.5 —
      PostHog (2h) + P2.6 — Legal (1h)
- [ ] Day 14-15: P2.3 — Rate limiting + CAPTCHA (3h)
- [ ] Day 16-19: P2.1 — Begin Anchor escrow design (12h spread over 4 days)

**Output:** Product is credible to evaluators. Audit submission ready.

## Week 4: SR (strategic)
- [ ] Day 20: Submit Reclaim grant + Superteam bounties (3h)
- [ ] Day 21: Submit Solana Foundation grant + Metaplex grant (3h)
- [ ] Day 22-26: Twitter content sprint — 5 long-form threads, 1/day
- [ ] Day 26: Open Discord server, invite first 50 followers
- [ ] Day 27-28: P3.1 — First case study page (4h)

**Output:** First grant responses expected within 2-4 weeks. First $1k-$5k
in funding.

## Month 2: Growth + audit wait
- [ ] Continue Twitter (40 min/day)
- [ ] Reach 200+ followers
- [ ] Recruit 2 design-partner brands (10 DMs/day to local cafes, sneaker
      stores)
- [ ] Run first real campaign with one design partner
- [ ] First case study published
- [ ] P3.2 — Referral system (3h)
- [ ] P3.3 — Documentation site (6h)

**Output:** First real settled campaign. $10k–$20k grant total.

## Month 3: NFT mint preparation
- [ ] 300+ Twitter followers
- [ ] 50+ Discord members
- [ ] Apply to Magic Eden Launchpad
- [ ] Design Founder Pass art (Fiverr designer, ~₹5k)
- [ ] Form LLP (₹6-12k)
- [ ] Anchor program audit complete
- [ ] Migrate to mainnet (P4.1)

**Output:** Mint readiness.

## Month 4+: Real launch
- [ ] Founder NFT mint (target: $5k–$25k)
- [ ] Submit to Colosseum hackathon
- [ ] Onboard 5 brands
- [ ] First profitable month (platform fee revenue exceeds costs)

---

# Appendix — Skills + tools the team needs to learn

## For everyone
- Phantom wallet (basic)
- Reading Solana Explorer / Solscan
- Git + GitHub workflows
- Reading the project's `PROJECT.md` and `VIVA_PREP.md`

## For the lead dev
- Anchor framework (Rust + Solana programs)
- Drizzle ORM basics
- Vercel deployment + env vars
- Tailwind responsive design

## For the marketer
- Twitter algorithm 2026 — what gets boosted vs de-boosted
- CapCut or Loom for video editing
- Basic Figma for graphics
- Discord server setup + moderation bots (MEE6, Carl-bot)

## For the ops person
- LLP formation process
- GST filing basics
- FIRC certificate process
- Indian tax law for VDA

---

# Appendix — Critical contact list (build this as you go)

- **CA:** [Name + email] — handles VDA tax
- **Lawyer:** [Name + email] — handles securities review for NFT utility
- **Designer:** [Fiverr URL] — landing page graphics + NFT art
- **Auditor:** [via Superteam / OtterSec] — Anchor program audit
- **Domain registrar:** Currently using vercel.app subdomain. Buy a real
  domain (dashh.io, dashhfun, etc.) for ~$30/year
- **Email provider:** Resend (free 3k emails/month) for transactional
- **Project management:** Linear (free) or Notion for task tracking
- **Twitter:** Single team account, run by one founder

---

# Appendix — Files / scripts that already exist (don't recreate)

These are the artifacts already produced:
- `docs/PROJECT.md` — comprehensive project doc
- `docs/VIVA_PREP.md` + `VIVA_PREP.pdf` — viva pack with 90 Q&As
- `docs/ABBREVIATIONS.md` — symbols + abbreviations list
- `docs/PROJECT_REPORT.pdf` — SGSITS-format report
- `scripts/seed.mjs` — DB seeder (8 campaigns, 5 creators, 23 proofs)
- `scripts/viva-to-pdf.py` — viva PDF generator
- `scripts/report-to-pdf.py` — report PDF generator
- `.github/workflows/ci.yml` — CI pipeline
- `vercel.json` — cron schedule
- `vitest.config.ts` — test runner config
- 45 Vitest tests across 6 files

---

# Final notes

**This document is the single source of truth for what's missing from
DASHH.** When you (or an agent) wants to make progress:

1. Pick a task by ID
2. Read just that task's full block
3. Implement it
4. Tick the acceptance criteria as you go
5. Update this document marking the task as ✅ DONE

**Don't try to do everything at once.** The biggest mistake teams make is
parallel work without finishing anything. Finish P0.1 fully before
starting P0.2.

**Update this doc as you ship.** Mark items DONE. Add new items if you
find gaps. This is a living document.

**When applying to grants, attach this document.** It's evidence of
engineering discipline. Most teams don't have anything like it.

---

*Last updated: 24 April 2026. Built by DASHH team.*
