# DASHH Security Posture

This document covers the security guarantees we provide today, the known
gaps before mainnet, and the operational runbooks the team must follow.

**Last updated:** 15 May 2026

---

## Threat model in one line

> Brands escrow real money. We must guarantee that (a) no DASHH operator can
> drain the escrow, (b) no creator can fake a proof of engagement, and (c)
> no third party can hijack a settled payout.

Today we achieve (b) and (c) via Reclaim zkTLS + Solana finality. We do
NOT yet achieve (a) cleanly — see "Open gaps" below.

---

## What we run today

### On-chain
- **Cluster:** Solana Devnet (`mainnet-beta` migration gated on P2.1)
- **Platform recipient wallet:** `8vbaCLhg1SZmiGNZfFzV2DEJHenFtdgg7G2JtY5v74i1`
  — single-key Phantom wallet held by one team member.
- **Escrow mechanism:** `SystemProgram.transfer` to the platform wallet,
  then a second `SystemProgram.transfer` out to the creator on settlement.
  Signed by `PLATFORM_SIGNING_KEY` env var (a base58 secret key).

### Off-chain
- **Database:** Neon Postgres (us-east-1), TLS in transit, encrypted at rest.
- **Hosting:** Vercel — serverless functions, no persistent compute.
- **Auth:** SIWS (Sign-In With Solana). HMAC-signed JWT cookies, 32-byte
  secret in `SIWS_SESSION_SECRET`.
- **Error monitoring:** Sentry (P2.4) — only active when
  `NEXT_PUBLIC_SENTRY_DSN` is set.
- **Analytics:** PostHog (P2.5) — opt-in via cookie banner.
- **CAPTCHA:** Cloudflare Turnstile (P2.3) — only enforced when
  `TURNSTILE_SECRET` is set.
- **Rate limiting:** In-memory token bucket per IP AND per wallet.
  Hourly hard caps on campaign create / participate / proof submit.

---

## Open gaps (must close before mainnet)

### 1. Single-key platform wallet — HIGH SEVERITY

**Risk:** Anyone with the private key (which a single team member holds in
Phantom) can drain every campaign's escrow. There is no on-chain check
that prevents withdrawal.

**Fix:** Migrate to a 3-of-5 Squads multisig. **Run this BEFORE the audit.**

#### Runbook: migrate to a Squads multisig

1. **Pre-flight**
   - Decide who the 5 signers are. Recommend all 5 founders.
   - Each signer needs Phantom installed and a wallet with at least
     0.01 SOL for transaction fees.
   - Be on Solana **Devnet** in Phantom for the trial run, then
     re-do on **Mainnet** when you're ready for real money.

2. **Create the multisig**
   - Go to <https://app.squads.so>
   - Connect Phantom (the one that currently holds the platform wallet)
   - "Create a new Squad"
   - Add each of the 5 founder wallets as members
   - Set threshold to **3 of 5**
   - Confirm — a new on-chain account is created (the multisig PDA).
     Copy that address — it's your new platform recipient.

3. **Move the funds**
   - Send a small test amount (e.g. 0.01 SOL) from the old single-key
     wallet to the new multisig address.
   - Verify on Solana Explorer that the transaction confirmed and the
     multisig balance increased.
   - Send the rest of the platform balance.

4. **Update DASHH config**
   - In Vercel project settings, update:
     - `SOLANA_RECIPIENT_ADDRESS` → the new multisig address
   - **Decision point:** does `PLATFORM_SIGNING_KEY` need to change?
     - Squads has TWO types of withdrawals: governance-vote (requires
       3-of-5 signature collection) and "vault transactions" where you
       publish an on-chain proposal and members vote.
     - For DASHH's automated settlement to work, we'd need to either
       (a) keep using the single-key wallet for settlement and treat
       the multisig as cold storage only, OR (b) replace the runner
       with a contract that the multisig pre-authorizes.
     - **Recommended interim state:** keep a "hot" settlement wallet
       (single-key, low balance, refilled from the multisig as needed)
       and the multisig as cold storage for the bulk of the funds.
       Limits damage if the hot key leaks.

5. **Test cycle**
   - Run an end-to-end campaign on devnet using the new addresses.
   - Verify settlement still pays out correctly.
   - Verify cancellation/refund still pays back the brand.

6. **Document the runbook**
   - Record the multisig address in `docs/SECURITY.md` (this file).
   - Record the threshold and the 5 signer wallets.
   - Record the cold-storage / hot-wallet refill cadence.

#### Current multisig (TODO — update once created)

| Field | Value |
| --- | --- |
| Multisig address | `<not yet created>` |
| Threshold | `3 of 5` |
| Signer 1 | `<wallet>` |
| Signer 2 | `<wallet>` |
| Signer 3 | `<wallet>` |
| Signer 4 | `<wallet>` |
| Signer 5 | `<wallet>` |
| Hot wallet | `8vbaCLhg…74i1` (current platform wallet, demoted to hot) |
| Refill cadence | Manual, when hot balance < 0.1 SOL |

### 2. No audited Anchor escrow program — HIGH SEVERITY

**Risk:** Even with a multisig, the platform wallet is still a custodial
intermediary. A proper escrow program would hold each campaign's funds in
its own PDA, releasing only on a signed verifier instruction. The team's
multisig couldn't unilaterally drain it.

**Fix:** P2.1 — write + audit an Anchor program. 3-4 weeks.

### 3. Hot wallet exposure

Even with a hot/cold split, the hot wallet's private key lives in a Vercel
env var. Vercel staff (or anyone who compromises the Vercel account) can
read it.

**Mitigations:**
- Keep the hot-wallet balance low (≤ 0.5 SOL on mainnet).
- Rotate the hot-wallet key quarterly.
- Enable Vercel 2FA on the account.
- Restrict env var read access to project admins only.
- Long-term: replace with a Cubist or Turnkey wallet service.

### 4. CRON_SECRET not yet set in production

The `/api/v2/settle?force=true` endpoint is gated by `CRON_SECRET`. If
that secret isn't set, the production cron still works (the GET handler
runs without a secret as long as none is configured) but force-mode is
fully disabled.

**Fix:** Generate a 32-byte hex secret:
```bash
openssl rand -hex 32 | pbcopy
```
Add to Vercel as `CRON_SECRET`. Then update `vercel.json` to send the
secret on cron invocations:
```jsonc
{
  "crons": [
    {
      "path": "/api/v2/settle",
      "schedule": "0 0 * * *",
      "headers": { "Authorization": "Bearer @CRON_SECRET" }
    }
  ]
}
```

### 5. CAPTCHA not yet enforced in production

`TURNSTILE_SECRET` is unset, so CAPTCHA bypasses with a "no-secret" reason.

**Fix:**
1. Sign up at <https://dash.cloudflare.com/sign-up?to=/:account/turnstile>
2. Create a Turnstile site for `dashhnew.vercel.app`
3. Copy the site key → set as `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
4. Copy the secret → set as `TURNSTILE_SECRET`
5. Render the Turnstile widget in the campaign-create form (5 lines of
   JSX using the official `<Turnstile />` React component)
6. The server-side `verifyTurnstile()` helper already verifies tokens —
   no code change needed.

---

## Operational runbooks

### Rotating the SIWS session secret

```bash
# Generate a fresh secret
openssl rand -hex 32

# Update Vercel env var
vercel env rm SIWS_SESSION_SECRET production
printf '<new secret>' | vercel env add SIWS_SESSION_SECRET production

# Redeploy
vercel deploy --prod --yes
```

**Effect:** All existing user sessions are invalidated. Users have to
re-sign with SIWS on next visit.

### Banning a wallet manually

If a wallet is gaming the platform faster than the strike system catches
it, an operator can ban it directly:

```sql
UPDATE profiles_v2
SET banned = true,
    ban_reason = '<operator-supplied reason>',
    banned_at = NOW()
WHERE wallet = '<wallet pubkey>';
```

The next campaign-join attempt by that wallet returns 403 with the ban
reason.

### Responding to a leaked private key

1. **Immediately:** transfer all funds out of the leaked wallet to a
   freshly-generated wallet.
2. Update `PLATFORM_SIGNING_KEY` / `SOLANA_RECIPIENT_ADDRESS` env vars
   in Vercel.
3. Redeploy.
4. Revoke any sessions: rotate `SIWS_SESSION_SECRET` (see above).
5. Post-mortem: what's the leak source? Vercel env var read? Local dev
   `.env` committed? Phantom export? Fix the source before resuming.

### Pausing the platform

If something is on fire and you need to stop new writes immediately:

```bash
# Set the kill switch flag
printf 'true' | vercel env add DASHH_KILL_SWITCH production
vercel deploy --prod --yes
```

(NOTE: the kill switch is not yet implemented. Roadmap item — add a
single check at the top of every write endpoint that returns 503 if the
flag is set.)

---

## Disclosure

Found a security issue? Open a private security advisory at
<https://github.com/alphoder/Dashhnew/security/advisories/new>.

We do not yet run a bug bounty. We'll acknowledge serious reports and
fix promptly.
