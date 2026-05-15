# DASHH Strategy Folder — Solo Builder Edition

Drop-in deliverables for everything non-engineering — funding, marketing,
ops, legal. Updated for **Vedant Singh, solo operator**.

> Note: the academic project report retains the 5-name attribution per
> SGSITS rules. The public-facing project (grants, Twitter, future
> revenue) is solo Vedant going forward.

Read them in this order on day 1:

| # | File | What it is | Time to use |
| - | --- | --- | --- |
| 1 | [grants/reclaim-protocol.md](./grants/reclaim-protocol.md) | Reclaim builder-grant application — paste-ready | Submit this week |
| 2 | [grants/superteam-india.md](./grants/superteam-india.md) | Superteam India bounty/grant application | Submit this week |
| 3 | [grants/solana-foundation.md](./grants/solana-foundation.md) | Solana Foundation $25k grant application | Submit after Reclaim + Superteam (traction signal) |
| 4 | [twitter-28-day-calendar.md](./twitter-28-day-calendar.md) | Day-by-day Twitter content + DM templates | Start day 1, run for 28 days |
| 5 | [founder-pass-spec.md](./founder-pass-spec.md) | NFT mint specification for Magic Eden Launchpad | Use as the spec doc on the application |
| _archived_ | founder-agreement-template.archived.md | Co-founder agreement — archived (N/A for solo) | Only revive if you bring on co-founders later |

## Recommended sequence — solo edition

**Week 1 — apply, apply, apply (no entity needed yet)**
- [ ] Set up a dedicated DASHH treasury wallet (fresh Phantom, separate from
      personal). Use this address in every grant application.
- [ ] Sign up at <https://earn.superteam.fun> with your wallet
- [ ] Submit 3 Superteam bounties matching DASHH's skill set
- [ ] DM @reclaimprotocol on X with the Reclaim grant proposal
- [ ] Start day 1 of the 28-day Twitter calendar

**Week 2–4 — first money arrives**
- [ ] Expected: $200–$1000 USDC in Phantom from at least 1 Superteam bounty
- [ ] First Reclaim response (yes/no/clarify)
- [ ] Continue Twitter daily
- [ ] Apply to Helius / Metaplex / Magic Eden grants

**Month 2 — execution**
- [ ] Recruit 1–2 design-partner brands (DM 30 local micro-businesses)
- [ ] Run first real campaign — use it as a case study
- [ ] Submit Solana Foundation grant (only after the smaller wins come in)
- [ ] Continue Twitter daily
- [ ] Cumulative take by end of month 2: realistic $1,500–$5,000

**Month 3 — entity + NFT prep (only if money has come in)**
- [ ] Once revenue > ₹2L lifetime → register sole proprietorship +
      open a business current account (cost ~₹2k, 1–2 weeks)
- [ ] Hit 300+ Twitter followers (target from calendar)
- [ ] Lawyer-review the Founder Pass utility language
- [ ] Apply to Magic Eden Launchpad

**Month 4 — mint + mainnet**
- [ ] Founder Pass mint (target: $10k–$25k raise)
- [ ] Mainnet flip (gated on Anchor escrow audit completion)

## Solo builder advantages — lean into these

1. **No equity dilution.** Every dollar of grant + bounty + NFT mint
   stays with you.
2. **Faster decisions.** No team consensus on every API change, pricing
   tweak, mint date.
3. **Personal brand on Twitter.** The 28-day sprint is easier to run
   when there's one consistent voice.
4. **Lower funding bar.** Solo builders pre-revenue routinely get
   bounties + grants in the $200–$10k range. Just keep submitting.
5. **No co-founder breakup risk.** The #1 reason startups die in the
   first year is co-founder disputes. Zero risk here.

## Solo builder risks — guard against these

1. **Burnout.** No teammate to share emotional load. Schedule rest.
2. **Single technical brain.** No one to argue architecture with. Join
   Superteam India Discord + Solana Stack Exchange as your "external
   brain."
3. **Single point of security failure.** Your wallet, your laptop, your
   phone. Use a hardware wallet for >$500 balance. Backup seed phrase
   in 2 physical locations.
4. **Investor optics later.** Solo founders pre-Series-A take a slight
   discount on valuation. Doesn't matter for grants/bounties. Matters
   for VC. If you ever go that route, find a technical co-founder before
   pitching VCs — but only when there's real revenue to share.

## Tax + compliance (solo Indian)

See `docs/SECURITY.md` for operational security runbooks. For tax:

- **For first ₹5L of revenue**: stay as a student / individual professional.
  No GST, no business registration. File ITR-4 next year.
- **Crypto income**: receiving USDC as a grant payment = income tax at slab
  rate (likely 0–10% as a student). VDA 30% tax only applies to *gain* on
  later conversion — if you convert immediately, gain ≈ 0 → tax ≈ 0.
- **Get a CA familiar with VDA tax** before crossing ₹2L lifetime revenue.
  Cost: ₹5–15k/year. Don't skip.
- **Every grant wire** to a future business account needs a **FIRC**
  (Foreign Inward Remittance Certificate) from your bank.
- **NFT mint revenue**: 30% flat VDA tax + 1% TDS when converted. Plan
  for this. Hold USDC and pay vendors in crypto when possible.

## What's NOT in this folder

- **Anchor escrow program** — that's engineering, see P2.1 in
  `docs/PRODUCTION_ROADMAP.md`.
- **Public docs site** — already live at `/docs`, source in
  `src/app/docs/`.
- **Case studies** — live at `/case-studies`, source in
  `src/content/case-studies.ts`.

---

*Last updated: 15 May 2026. Solo edition.*
