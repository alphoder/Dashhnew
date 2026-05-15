# DASHH Founder Pass — NFT Mint Specification

> A drop-in spec doc for the Magic Eden Launchpad application, the
> Metaplex grant, and the public mint page. Designed to be securities-law
> safe (no revenue share, no profit promise) and to deliver real utility
> the holder can verify on-chain.
>
> **Status:** spec only. DO NOT mint yet — pre-requisites in the final
> section must be met first.

---

## Summary

- **Collection name:** DASHH Founder Pass
- **Symbol:** DSHFP
- **Standard:** Metaplex Core (modern, cheap, transferable)
- **Chain:** Solana mainnet (devnet trial run first)
- **Supply:** 2,000 NFTs
- **Mint price:** 0.05 SOL (allowlist) / 0.07 SOL (public)
- **Total raise ceiling:** 100–140 SOL (~$20k–$28k at current rates)
- **Royalty:** 5% on secondary sales (best-effort; Magic Eden makes
  optional)

---

## Tiers

Three tiers by mint order. Same art template, different background colour
and tier text:

| Tier | Token IDs | Fee discount | Other perks |
| --- | --- | --- | --- |
| **Genesis** | #1–50 | 100% off platform fees for life on campaigns this wallet creates | Private "Genesis" Discord channel, monthly call with the founding team, early access to every feature |
| **Founder** | #51–500 | 50% off (10% platform fee instead of 20%) | Founder Discord channel, early-access mainnet beta |
| **Supporter** | #501–2000 | 25% off (15% instead of 20%) | Public Discord, "Verified Supporter" badge on Discover |

### Utility, technically

The discount is enforced at settlement time. When the settlement
runner builds a payout, it queries `profiles_v2.verified` AND checks
the brand wallet against the Founder Pass holder list. If a match, the
`platformFeeBps` for that specific campaign is reduced server-side
before the payout split is computed.

**This is reduction in fees the holder pays themselves, NOT a share
of someone else's fees.** Critical distinction for securities-law
safety.

### Utility, in plain words

If you hold token #47 (Founder tier) and you launch a campaign with 1
SOL budget, the platform fee taken from your campaign drops from 0.20
SOL to 0.10 SOL. The other 0.10 SOL stays in your creator pool.

---

## What we DO promise

- Lifetime fee discount as described above, **for this specific
  holder's own campaigns**.
- Discord access at the relevant tier.
- Early access to future features (mainnet beta, new platform
  adapters, Anchor escrow).
- Open-source code, transparent governance, public docs.

## What we explicitly do NOT promise (and never will)

- ❌ Revenue share — holders do NOT receive a cut of platform fees
  paid by other users.
- ❌ Token airdrop — there is no governance token planned.
- ❌ Price floor — we do not commit to buy-backs or any floor support.
- ❌ Profit / appreciation — holding the NFT is for utility, not
  investment.
- ❌ Resale royalties beyond what marketplaces choose to enforce.

These are securities-law landmines. Crystallise them in the mint
page's FAQ before going live.

---

## Mint mechanics

### Phase 1 — Allowlist (24 hours)

- Open to: Discord members at "Founder Pass Wait List" role.
- Price: 0.05 SOL per NFT.
- Cap: 1 NFT per wallet (no whaling during AL).
- Tooling: Magic Eden Launchpad with Solana wallet auth.

### Phase 2 — Public mint (until sold out or 7 days, whichever first)

- Open to: anyone with a Solana wallet.
- Price: 0.07 SOL per NFT.
- Cap: 3 NFTs per wallet (allows light whales).
- Same Magic Eden Launchpad collection.

### Unsold supply policy

If the mint doesn't sell out in 7 days, remaining tokens are **burned**
and a public "remaining supply burned" tweet is posted. We do not
extend the window — scarcity matters.

---

## Art

### Constraints

- 1080×1080 square (Magic Eden recommended).
- Generative variants by tier:
  - Genesis: gold/black background, "GENESIS" wordmark
  - Founder: purple/mint gradient (DASHH brand)
  - Supporter: silver/dark
- Common foreground: stylised "DASHH" wordmark + token number + tier
  ribbon.

### Production

Outsource to a Fiverr designer in the $50–$200 bracket OR generate via
a Python script + PIL. The pieces don't need to be artistically
ambitious — they need to look professional and consistent.

---

## Smart contract

### Standard: Metaplex Core

```bash
# Install
npm install @metaplex-foundation/mpl-core

# Deploy collection
metaplex umi … (full command in docs/launch-playbook.md when written)
```

Core NFTs are ~$0.001 each to mint vs ~$0.05 for legacy Metaplex
Token Metadata. For 2,000 NFTs that's $2 vs $100 in fees.

### On-chain metadata

Per-NFT metadata JSON includes:

- `name`: "DASHH Founder Pass #N"
- `symbol`: "DSHFP"
- `description`: tier-specific
- `image`: Arweave URL (uploaded via Irys)
- `attributes`:
  - `Tier`: "Genesis" | "Founder" | "Supporter"
  - `Fee Discount`: "100%" | "50%" | "25%"
  - `Mint Date`: ISO timestamp
  - `Collection`: "DASHH Founder Pass"

### Treasury wallet

A 3-of-5 Squads multisig of the five founder wallets. Mint proceeds
deposit directly here. Disbursement to founders is governance-voted
(documented separately).

---

## Marketing timeline

(Paired with the 28-day Twitter calendar — milestone dates assume mint
launches on Day 56, i.e., 4 weeks after Twitter sprint completes.)

| Day from mint | Action |
| --- | --- |
| **−21** | Announce existence on Twitter (Day 17 of sprint) |
| **−14** | Open Discord allowlist form |
| **−7** | Drop the utility doc (this file) publicly |
| **−3** | Reminder thread, "what mint mode" countdown sticker |
| **−1** | AL claim opens (24 hours) |
| **0** | Public mint opens |
| **+1** | "Sold out / X% minted" post |
| **+7** | Public-mint window closes; unsold burned (if any) |

---

## Pre-requisites — DO NOT MINT until ALL are met

- [ ] Twitter following ≥ 300 quality followers
- [ ] Discord ≥ 100 members with an active conversation
- [ ] One real-brand case study live on /case-studies
- [ ] LLP formed + business bank account opened
- [ ] Lawyer review of utility language (recommend Indian crypto-securities
      counsel)
- [ ] Magic Eden Launchpad pre-approval received
- [ ] Audited Anchor escrow live on mainnet (P2.1) — so the fee-discount
      utility is enforceable on-chain, not just promised
- [ ] Squads multisig live as treasury wallet
- [ ] First three holders' fee discounts manually tested on devnet end-
      to-end before public mint

Total realistic pre-requisite timeline: **4–8 weeks** after the 28-day
Twitter sprint.

---

## Failure modes + mitigations

| Risk | Mitigation |
| --- | --- |
| < 30% sell-through | Most launches end here. Plan finances around 200 NFTs sold, treat anything above as bonus. |
| Royalty bypass | Marketplaces are deprecating enforced royalties. Plan around 0% royalty income; treat any received as bonus. |
| Holder complaints about utility | Ship the fee-discount enforcement BEFORE mint. Test with 3 holders manually. |
| Securities investigation | Strict utility-only language. No revenue share. No token. Independent legal review. |
| Indian VDA tax | 30% flat + 1% TDS per sale. Account for this in financial planning; talk to a CA. |

---

## Tax (India-specific)

Every NFT sale is a VDA transaction. For the buyer: 30% on gain (held >
month). For us: gain on sale = price received minus mint cost (negligible).

The full mint revenue is income to whichever entity holds the
multisig — LLP if formed, otherwise the lead founder as professional
income. **Form the LLP before mint.**

---

## Open questions to decide before launch

1. **Refund policy** if a holder is dissatisfied? Default: none.
2. **Burn-to-redeem** for any future feature? Default: no.
3. **Discord access** — does the NFT actually gate Discord channels via
   Collab.Land, or is it honour-system?
4. **Free-mint for design partners**? E.g. give the first 3 case-study
   brands a Genesis pass at 0 SOL.

---

*Last updated: 15 May 2026.*
