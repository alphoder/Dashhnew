"""
Generate DASHH Viva Prep PDF.

Produces docs/VIVA_PREP.pdf from hardcoded content so we can style it
properly with reportlab rather than parsing markdown. Covers:
  · Cover page
  · Shared facts every student must know
  · 5 student partitions, each with 18 viva Q&As (one-to-one format)
  · Tomorrow-morning checklist + live-demo script
  · Concise SGSITS report-template sections for copy-paste

Usage:  python3 scripts/viva-to-pdf.py
"""

from reportlab.lib import colors
from reportlab.lib.enums import TA_JUSTIFY, TA_LEFT, TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    PageBreak,
    Table,
    TableStyle,
    KeepTogether,
)
from reportlab.pdfgen import canvas


# ───────────────────────────── Theme ─────────────────────────────

PURPLE = colors.HexColor("#9945FF")
MINT = colors.HexColor("#14F195")
DARK = colors.HexColor("#0a0a0a")
MUTED = colors.HexColor("#5b5b5b")
LIGHT_BG = colors.HexColor("#f5f3ff")
MINT_BG = colors.HexColor("#ecfdf5")

styles = getSampleStyleSheet()

COVER_TITLE = ParagraphStyle(
    "CoverTitle",
    parent=styles["Title"],
    fontSize=34,
    leading=40,
    textColor=DARK,
    alignment=TA_CENTER,
    spaceAfter=10,
)
COVER_SUBTITLE = ParagraphStyle(
    "CoverSubtitle",
    parent=styles["Normal"],
    fontSize=14,
    leading=20,
    textColor=MUTED,
    alignment=TA_CENTER,
)
COVER_BADGE = ParagraphStyle(
    "CoverBadge",
    parent=styles["Normal"],
    fontSize=11,
    leading=16,
    textColor=PURPLE,
    alignment=TA_CENTER,
    fontName="Helvetica-Bold",
)

H1 = ParagraphStyle(
    "H1",
    parent=styles["Heading1"],
    fontSize=22,
    leading=28,
    textColor=DARK,
    spaceBefore=18,
    spaceAfter=10,
    alignment=TA_LEFT,
)
H2 = ParagraphStyle(
    "H2",
    parent=styles["Heading2"],
    fontSize=16,
    leading=22,
    textColor=PURPLE,
    spaceBefore=14,
    spaceAfter=6,
)
H3 = ParagraphStyle(
    "H3",
    parent=styles["Heading3"],
    fontSize=12,
    leading=16,
    textColor=DARK,
    spaceBefore=10,
    spaceAfter=4,
    fontName="Helvetica-Bold",
)
BODY = ParagraphStyle(
    "Body",
    parent=styles["Normal"],
    fontSize=10.5,
    leading=15,
    textColor=DARK,
    alignment=TA_JUSTIFY,
    spaceAfter=6,
)
BULLET = ParagraphStyle(
    "Bullet",
    parent=BODY,
    leftIndent=16,
    bulletIndent=4,
    spaceAfter=3,
)
QUESTION = ParagraphStyle(
    "Question",
    parent=styles["Normal"],
    fontSize=11,
    leading=15,
    textColor=DARK,
    fontName="Helvetica-Bold",
    spaceBefore=10,
    spaceAfter=4,
)
ANSWER = ParagraphStyle(
    "Answer",
    parent=styles["Normal"],
    fontSize=10,
    leading=14.5,
    textColor=colors.HexColor("#1f2937"),
    alignment=TA_JUSTIFY,
    leftIndent=12,
    spaceAfter=8,
)
CODE = ParagraphStyle(
    "Code",
    parent=styles["Code"],
    fontSize=8.5,
    leading=11,
    textColor=colors.HexColor("#1f2937"),
    backColor=colors.HexColor("#f3f4f6"),
    borderColor=colors.HexColor("#e5e7eb"),
    borderWidth=0.5,
    borderPadding=6,
    leftIndent=8,
    rightIndent=8,
    spaceAfter=8,
    fontName="Courier",
)
EYEBROW = ParagraphStyle(
    "Eyebrow",
    parent=styles["Normal"],
    fontSize=8,
    leading=12,
    textColor=MINT,
    fontName="Helvetica-Bold",
    spaceAfter=2,
)


# ───────────────────────────── Content data ─────────────────────────────

# Each student partition: (heading, subtitle, owns, q_and_a list of (q, a))
STUDENTS = [
    dict(
        n="Student 1",
        role="Team Lead — Product, Problem & Architecture",
        owns=(
            "Project story, Chapter 1 (Introduction), Chapter 7 (Conclusion), "
            "high-level system architecture, the elevator pitch, product "
            "positioning, and the full roadmap."
        ),
        qas=[
            ("Tell us about your project in 2 minutes.",
             "DASHH is a peer-to-peer marketplace where brands pay micro-influencers "
             "only for cryptographically-verified engagement on social media. Brands "
             "fund campaigns in a Solana escrow; creators submit two zkTLS proofs via "
             "the Reclaim Protocol — one when they join, one in a 7-day settlement "
             "window after campaign end. Only the second proof triggers the on-chain "
             "payout, so platform bot-rollbacks have already happened and brands only "
             "pay for real, stable engagement. No admin, no middleman, flat 20% fee."),
            ("What problem does DASHH solve that Instagram's creator marketplace doesn't?",
             "Instagram, Upfluence and Grin rely on self-reported metrics and trust "
             "intermediaries. There is no cryptographic guarantee that a view was real, "
             "and up to 40% of influencer spend is estimated to be bot-fraud. DASHH "
             "replaces the trusted intermediary with a cryptographic proof that the "
             "engagement came directly from the platform's real server."),
            ("Why Solana and not Ethereum or Polygon?",
             "Three reasons. One, low fees — our per-view CPV can be as low as 0.0005 "
             "SOL; on Ethereum mainnet the gas alone would dwarf the payout. Two, "
             "fast finality (~400ms) so creators see confirmation in under a second. "
             "Three, Solana Blinks — a unique standard that lets a campaign be a "
             "one-click participation URL on any website. Ethereum has no equivalent."),
            ("Why is there no admin or moderator role?",
             "Because an admin is a trusted party and we are explicitly removing "
             "trusted parties. Disputes are resolved cryptographically — a proof is "
             "either valid or it isn't. Bans are automatic: 3 disqualifications in 90 "
             "days flips a flag. Future versions may add staked community appeals."),
            ("Why two proofs and not one?",
             "Bot views get rolled back by the platform within days. A single proof "
             "submitted mid-campaign could pay on inflated numbers that disappear "
             "later. The second proof, inside a 7-day settlement window after campaign "
             "end, captures the stable count. Dishonest creators fail proof #2 "
             "automatically — they self-eliminate."),
            ("Why a 20% platform fee?",
             "It covers Reclaim attestor costs, Arweave storage, Solana RPC, server "
             "infrastructure, and product development. Traditional agencies charge "
             "15–30%. 20% matches the market while being fully transparent: the fee "
             "is shown to brands before they sign, encoded as platformFeeBps=2000, "
             "and the brand signs a terms message acknowledging it."),
            ("What's the biggest limitation of your current prototype?",
             "There is no real on-chain Solana escrow program yet. Campaign funds go "
             "through SystemProgram.transfer, and payout rows sit in Postgres. A "
             "production deployment needs an Anchor program that holds brand funds "
             "and releases them only when a verified final proof's hash is committed "
             "on-chain. This is the top future-work item."),
            ("Who are your competitors and how is DASHH different?",
             "Upfluence, AspireIQ and Grin — traditional tools. BAT/Brave — client-"
             "side attention tokens (spoofable). None combine zkTLS-backed engagement "
             "verification with on-chain settlement and a two-proof model. DASHH is "
             "the only system where brands pay on cryptographically-stable views."),
            ("Who does what on the team?",
             "Student 1 owns product and architecture. Student 2 owns all frontend "
             "and UI/UX. Student 3 owns backend, schema and APIs. Student 4 owns "
             "blockchain, zkTLS and wallet integration. Student 5 owns the trust "
             "layer — verification, disqualification, tests and CI."),
            ("What was your biggest technical challenge?",
             "Designing the trust model. We iterated through three versions: naive "
             "single-proof (broken — pays on bot views); rolling-trust with auto-"
             "sync (approximately correct but heuristic); and finally the two-proof "
             "settlement model which is cryptographically final at the boundary where "
             "money moves. The third version is what shipped."),
            ("How long did the project take?",
             "Two phases. Phase I — research, gap analysis, base code scaffolding. "
             "Phase II — full implementation, 45-test test suite, production-"
             "readiness polish, UI animation layer, documentation. The live "
             "codebase is ~10,000 LOC across 80+ files."),
            ("What would you change if you started over?",
             "Build the Anchor escrow program first instead of leaving it for later. "
             "Every downstream decision — payout cron, forfeiture, settlement — is "
             "shaped by the escrow design. Doing it last means we had to hand-wave "
             "the final SOL transfer in the demo."),
            ("What's your revenue projection?",
             "Conservative: at 20% fee, a $10M GMV marketplace yields $2M ARR. "
             "Influencer-marketing spend is projected at $45B by 2026; even 0.01% "
             "market share clears $900k ARR. Micro-influencer segment is the "
             "fastest-growing and least served."),
            ("How would you onboard users at scale?",
             "Creators — Discord/Reddit/Twitter crypto-native communities, Solana "
             "Foundation creator grants. Brands — direct outreach to DTC e-com brands "
             "already spending on Instagram Reels. Network effects kick in once we "
             "have ~50 active campaigns — creators pull new brands and vice versa."),
            ("How is this different from a platform like Steem?",
             "Steem rewarded content directly on-chain but measured attention "
             "client-side — spoofable. We measure attention on the host platform "
             "itself via zkTLS and only use the chain for settlement. We ride on "
             "existing social graphs instead of trying to build a new network."),
            ("What's on the roadmap for next semester?",
             "Anchor escrow program, mainnet-beta deployment, Playwright E2E tests, "
             "Upstash Redis rate-limiter, real Reclaim provider IDs for live IG/YT, "
             "phone-based Sybil resistance, staked ban-appeal mechanism, mobile PWA."),
            ("How would you scale to 1 million creators?",
             "Neon's serverless Postgres scales horizontally with branching. Solana "
             "handles ~65,000 TPS, well above anything we'd produce. The bottleneck "
             "is Reclaim's attestor throughput and our cron worker — we'd sharded "
             "the sync/settle jobs across multiple Vercel functions and introduce "
             "an event queue (SQS or Upstash Kafka)."),
            ("Is this open source?",
             "The project is structured to be open-source friendly — MIT-licensed, "
             "documented in docs/PROJECT.md, full test suite, CI pipeline in "
             ".github/workflows/ci.yml. We plan to publish it after the viva."),
        ],
    ),
    dict(
        n="Student 2",
        role="Frontend — UI, UX, Animations",
        owns=(
            "Every user-facing page and component — landing, how-it-works, "
            "Explore/Create dashboards, campaign form, modals, leaderboard, "
            "notifications, onboarding. All Framer-Motion animations. The "
            "mode-aware header and sidebar."
        ),
        qas=[
            ("Walk us through the UI from a creator's perspective.",
             "Land on /, click Get Started, run the 4-step onboarding wizard. Pick "
             "Creator role, connect Phantom, choose platform. Dropped onto /dashboard "
             "in Explore mode. Click a campaign card — CampaignDetailsModal opens "
             "with full description, payment model, fee breakdown, brand's signed "
             "terms, and 4 disqualification rules in a red box. Tick the T&C checkbox, "
             "click Sign terms & join — Phantom pops up. Post content on IG/YT. Come "
             "back, open /verifyClaim, run Reclaim — that's proof #1. Wait for campaign "
             "end. Come back in the 7-day window, run Reclaim again — proof #2. Get paid."),
            ("Walk us through from a brand's perspective.",
             "Onboarding → pick Brand → redirected to /creatordashboard (Studio). "
             "Click + New campaign — lands on /form with 3 cards: campaign details, "
             "payment model picker with live fee math, content-match rules. Sign "
             "T&C in Phantom, second Phantom popup funds escrow. Success dialog "
             "with the dial.to Blink URL + social-share buttons. Monitor from "
             "/analytics (live stat cards with count-up animations)."),
            ("Why Next.js 14 over vanilla React or Vite?",
             "App Router's co-located layouts and server components. We use (app) "
             "route group for the authenticated shell — it inherits sidebar + header "
             "automatically. Server components fetch campaigns from Neon in the same "
             "file that renders them, no REST layer needed for read paths."),
            ("Why App Router instead of Pages?",
             "Route groups like (app) for shared layouts without changing URLs. "
             "Streaming SSR. Per-route loading + error boundaries. Server actions "
             "for form mutations. Pages router doesn't support any of those cleanly."),
            ("Why Tailwind instead of CSS Modules or styled-components?",
             "Speed of iteration — we restyle by editing the class string, no "
             "context-switch to a CSS file. Dead-code elimination via PurgeCSS. "
             "Design-token discipline (spacing, colour scales) built in. Pairs "
             "perfectly with shadcn/ui."),
            ("Why shadcn/ui and not Material or Chakra?",
             "shadcn is copy-paste, not a dependency — we own the component source "
             "so we can restyle to the Solana palette. No runtime overhead, no "
             "version-lock. Material is too opinionated; Chakra too heavy."),
            ("Why Framer Motion over CSS animations?",
             "Declarative React-native API, IntersectionObserver built in via "
             "whileInView, AnimatePresence for enter/exit transitions on route "
             "change, spring physics for natural feel, and prefers-reduced-motion "
             "respected by default via useReducedMotion."),
            ("How does the Explore/Create toggle work?",
             "Single source of truth in src/lib/modes.ts — three route arrays "
             "(EXPLORE_ROUTES, CREATE_ROUTES, NEUTRAL_ROUTES) and a deriveMode() "
             "helper. The useMode() hook in src/hooks/use-mode.ts wraps it. Both "
             "the sidebar and the header pill call useMode(), so they can never "
             "drift. Neutral routes preserve the user's last explicit mode."),
            ("How does the slide-left/right transition on mode switch work?",
             "src/components/motion/mode-transition.tsx — wraps {children} in "
             "AnimatePresence keyed on pathname. Direction is computed from the "
             "mode delta: +1 for Explore→Create, -1 for Create→Explore, 0 for same "
             "mode. New page slides in 48px; old page slides out 60% of that."),
            ("What are Next.js route groups and why use (app)?",
             "Parentheses-wrapped folders don't contribute to the URL path. So "
             "src/app/(app)/dashboard/page.tsx resolves to /dashboard but inherits "
             "src/app/(app)/layout.tsx — which renders the sidebar. Public pages "
             "like / and /how-it-works live outside the group and don't get the "
             "sidebar."),
            ("How do you handle responsive design?",
             "Tailwind breakpoints: sm (640px), md (768px), lg (1024px). Sidebar "
             "is md:flex (visible on desktop, hidden on mobile). Header's "
             "RoleToggle drops below the logo on mobile. Cards reflow from 1 to 2 "
             "to 3-4 columns with grid-cols-1 sm:grid-cols-2 lg:grid-cols-4."),
            ("What accessibility features does the app have?",
             "Semantic landmarks (<nav>, <main>, <aside>), aria-label on every icon "
             "button, aria-checked on the RoleToggle radio group, focus-visible "
             "outlines on all interactive elements, sr-only labels where icons stand "
             "alone, and prefers-reduced-motion respected in every motion primitive."),
            ("How do you respect prefers-reduced-motion?",
             "Every motion primitive (FadeIn, Stagger, HoverLift, CountUp, "
             "ModeTransition) calls useReducedMotion() from framer-motion. When "
             "true, animations degrade to opacity-only or are skipped entirely. "
             "Layout is never animation-dependent."),
            ("How do you validate forms on the frontend?",
             "Native HTML validation (required, type='url', min/max) plus controlled "
             "state in React. Submit is disabled until canSubmit is true. Backend "
             "validates with Zod as defense-in-depth. On error, we show toasts via "
             "react-toastify."),
            ("How do you handle loading, empty and error states?",
             "Every data-fetching page has three branches — loading (Loader2 icon + "
             "text), empty (Inbox icon + call-to-action link), and data (grid/card). "
             "Server errors become red toasts. Optimistic UI on mark-as-read."),
            ("What's your state management strategy?",
             "Local component state with useState/useEffect for page-scoped data. "
             "localStorage for persistent preferences (dashh_wallet, dashh_mode, "
             "dashh_onboarded). URL for routing state. No Redux — for an app this "
             "size it's overkill."),
            ("How do you keep the bundle size down?",
             "Next.js automatic code-splitting per route. Dynamic imports for the "
             "Reclaim SDK (it's only loaded when /verifyClaim mounts — fixed a "
             "nasty pino-pretty SSR bug in the process). Tailwind purges unused "
             "classes. shadcn is copy-paste not a library."),
            ("Describe the animation principles you followed.",
             "Short (350-600ms), eased with cubic-bezier(0.16,1,0.3,1), purposeful "
             "not gratuitous. Content reveals on scroll via IntersectionObserver. "
             "Cards lift -4px on hover. Numbers count up. Mode switches slide "
             "horizontally. Premium-feeling without being flashy."),
        ],
    ),
    dict(
        n="Student 3",
        role="Backend — Database, API, Server",
        owns=(
            "Drizzle schema (v1 + v2), every /api/v2/* route, Neon Postgres setup, "
            "drizzle-kit migrations, the seed script, Zod validation layer, "
            "rate-limiting, and API auth guards."
        ),
        qas=[
            ("Draw the ER diagram on the board.",
             "profiles_v2 (wallet+role unique) — no FKs into it, just wallet matching. "
             "campaigns_v2 (PK id, brandWallet). participations_v2 (FK campaignId, "
             "unique on campaignId+creatorWallet). proofs_v2 (FK participationId). "
             "payouts_v2 (FK proofId). notifications_v2 (wallet column, no FK). "
             "join_proof_id and final_proof_id on participations reference proofs_v2."),
            ("Why an additive v2 schema instead of altering v1?",
             "Non-destructive migration. The original /dashboard/[id] leaderboard "
             "page depends on v1 tables (creators, users). Altering them would "
             "have required rewriting that page and risked data loss. Additive "
             "lets both schemas live side by side — new routes use v2, old ones "
             "keep v1 until they're retired."),
            ("Why a unique index on (campaignId, creatorWallet)?",
             "Prevents a creator joining the same campaign twice from the same "
             "wallet. It's our primary Sybil-within-campaign guard at the database "
             "level — even if the application layer had a bug, Postgres would "
             "reject the duplicate insert."),
            ("Why Drizzle ORM instead of Prisma?",
             "TypeScript-native: the schema IS the types, no code-gen step. Closer "
             "to SQL so complex joins are readable. Faster cold starts on Vercel "
             "(important for serverless). Works natively with Neon's HTTP driver. "
             "Smaller footprint in the bundle."),
            ("Why Neon over AWS RDS or Supabase?",
             "Serverless pricing — we pay for actual usage, not an always-on instance. "
             "Branching for preview deploys. Built-in HTTP driver means we can "
             "connect from edge functions without a TCP pool. Sub-second cold starts."),
            ("Walk us through the POST /api/v2/proofs handler.",
             "Rate-limit bucket → parse body with Zod → fetch participation + "
             "campaign from DB → session guard (wallet must match participation's "
             "creator) → run adapter.parseProof → lookup profile for linked handle "
             "→ ban gate → call verify() → route via routeProofByWindow (join or "
             "final) → insert proof row → if final + verified → insert payout → "
             "fire notification → anchor raw proof to Arweave. Response includes "
             "the verdict and payout decision."),
            ("Why Zod for validation?",
             "Schema-first validation that also infers TypeScript types. Same "
             "Zod schema guards the API and types the handler's body parameter. "
             "Excellent error messages out of the box. Tiny runtime footprint."),
            ("How is rate-limiting implemented?",
             "src/lib/ratelimit.ts — in-memory token-bucket keyed on IP from "
             "x-forwarded-for. 20 requests per 60-second window on /api/v2/proofs, "
             "10 per 60 on campaign creation. Good for single-instance dev; "
             "production would swap for @upstash/ratelimit with Redis."),
            ("How does the seed script work?",
             "scripts/seed.mjs — idempotent: DELETEs everything first, then INSERTs "
             "fresh rows. 8 campaigns across 4 platforms, 6 profiles (1 brand + 5 "
             "creators), ~23 participations with random views, verified proofs, "
             "pending payouts, 10 notifications. Ran via node --env-file=.env.local."),
            ("How do you handle migrations?",
             "drizzle-kit push — reads src/lib/db/schemas.ts (barrel of schema.ts "
             "and schema-v2.ts) and diffs against the live database. Applies "
             "changes incrementally. No separate migration files; Drizzle generates "
             "them on demand."),
            ("How do you ensure transaction safety on proof submission?",
             "Each proofs insert and related payout insert share a single request "
             "context. For the settlement cron, we wrap each campaign's distribution "
             "in a sequential loop — in a full production deployment we'd wrap that "
             "in Postgres-level transactions; currently we rely on Drizzle's "
             "serialised writes and idempotent logic (checking settledAt before "
             "re-settling)."),
            ("How do you avoid the N+1 query problem?",
             "Settlement cron pre-fetches all proofs and all payouts once, then "
             "builds in-memory Maps keyed on participationId and proofId. Similarly "
             "the leaderboard endpoint does 3 SELECTs not N. The campaign-details "
             "endpoint fetches the campaign + its leaderboard in 2 queries."),
            ("How does connection pooling work?",
             "Neon's serverless driver uses HTTPS under the hood — no persistent "
             "TCP connection. Every request is stateless. This is ideal for Vercel's "
             "execution model. For higher throughput we could switch to the "
             "websocket driver with PgBouncer in front."),
            ("How does error handling work in the API routes?",
             "Every handler wraps its body in try/catch, returns NextResponse.json "
             "with a 4xx or 500 status and a readable error message. Zod errors are "
             "flattened to a field-keyed map. 403s on auth failures, 404s on "
             "missing resources, 429s on rate limits, 409s on conflict states."),
            ("How do auth guards work?",
             "src/lib/auth/session.ts reads the dashh_session cookie, verifies the "
             "HMAC signature, returns the decoded SIWS payload (wallet + role). "
             "Mutating routes call getSession() and reject if the session's wallet "
             "doesn't match the body's wallet. Currently falls back to body-wallet "
             "while the SIWS flow is still opt-in for older pages."),
            ("Which indexes have you added and why?",
             "campaigns_v2_brand_idx on brand_wallet — filtering a brand's own "
             "campaigns. campaigns_v2_status_idx on status — filtering actives. "
             "campaigns_v2_platform_idx on platform — Discover filter chips. "
             "notifications_v2_wallet_idx on wallet — user's inbox. Composite "
             "unique on participations (campaign,creator) — Sybil prevention."),
            ("What's your backup / disaster recovery plan?",
             "Neon has point-in-time recovery via branching — we can roll back to "
             "any minute in the last 7 days. Arweave anchoring provides immutable "
             "off-chain backup of every verified proof. For production we'd add "
             "nightly logical dumps to S3 via pg_dump."),
            ("When should a route be GET vs POST vs PATCH?",
             "GET — idempotent reads (list campaigns, fetch leaderboard). POST — "
             "creates / mutations (submit proof, participate). PATCH — partial "
             "updates (pause a campaign's status). All GET responses use "
             "cache: 'no-store' in the client fetch to prevent stale data."),
        ],
    ),
    dict(
        n="Student 4",
        role="Blockchain — Solana, Reclaim, zkTLS, Wallet",
        owns=(
            "Reclaim SDK integration, per-platform adapters, Phantom wallet, "
            "Sign-In With Solana (SIWS), Blink URLs, campaign-funding transaction, "
            "and Arweave proof anchoring via Irys."
        ),
        qas=[
            ("Explain zkTLS in your own words.",
             "Reclaim's attestor sits inside the TLS stream between the user's "
             "device and a social platform like Instagram. The user authenticates "
             "normally. The attestor watches the encrypted response and signs a "
             "cryptographic receipt that says: 'at time T, the real Instagram "
             "server responded to this authenticated user's request with the "
             "following JSON fields — views=7432, username=avakim, postUrl=...'. "
             "The TLS certificate chain is part of the receipt, so no one can "
             "fake the server identity. The user's cookies and password never "
             "leave the device."),
            ("What does the Reclaim attestor actually do?",
             "It relays the TLS stream and produces a zero-knowledge witness of "
             "selected response fields. Multiple attestors run in a decentralized "
             "network to avoid single-attestor trust. The proof bundles the TLS "
             "metadata, the signed witness, and the attested field values. Our "
             "server checks the signature and the TLS cert chain before trusting "
             "the fields."),
            ("Describe the full SIWS flow.",
             "Client asks GET /api/auth/nonce?address=... → server returns a random "
             "nonce + a human-readable message saying 'domain wants to sign you in "
             "with wallet X'. Phantom signs the message via signMessage. Client "
             "POSTs { address, signature, nonce } to /api/auth/verify. Server "
             "reconstructs the same message, verifies the Ed25519 signature via "
             "tweetnacl, and if valid issues an HMAC-signed JWT cookie with wallet "
             "and role claims. Cookie expiry: 7 days."),
            ("What's the difference between signMessage and signTransaction?",
             "signMessage — signs arbitrary bytes, no on-chain effect, free. Used "
             "for authentication and terms acceptance. signTransaction — signs a "
             "Solana transaction that the network will execute, costs lamports, "
             "moves funds or state. The creator signs 2 messages and 0 transactions "
             "to join a campaign in our flow; the brand signs 1 message and 1 "
             "transaction to fund."),
            ("How does a Solana Blink URL work?",
             "Format: dial.to/?action=solana-action:<our_api>&cluster=devnet. Any "
             "compliant website (Twitter, Discord, dial.to itself) fetches our API "
             "at that URL, which returns a JSON Actions spec describing the "
             "participate button. The user clicks, Phantom opens, confirms the "
             "transaction, and they're enrolled. It turns any link into a "
             "participate-able campaign."),
            ("Why Solana instead of Ethereum for this use case?",
             "Per-view CPV can be 0.0005 SOL (~$0.05). Ethereum L1 gas alone is "
             "~$1 per tx; that kills micro-payouts. Even L2s like Arbitrum are "
             "$0.05-0.20 per tx. Solana is consistently sub-cent and sub-second. "
             "Blinks are a Solana-only standard. For a high-frequency micro-payment "
             "system, Solana is the right choice."),
            ("Devnet vs mainnet — what's the difference and why devnet for now?",
             "Devnet is a free-to-use Solana cluster where SOL is worthless — we "
             "airdrop it for testing. Mainnet-beta is production with real SOL. "
             "We're on devnet because we're still iterating on the escrow design "
             "and don't want real funds at risk. Moving to mainnet requires "
             "auditing the escrow program."),
            ("Describe your escrow design.",
             "Current implementation: SystemProgram.transfer from the brand wallet "
             "to a hardcoded recipient on devnet — a stand-in. Production design: "
             "an Anchor program with a Program-Derived-Address (PDA) holding the "
             "campaign budget. Release instruction validates that a final proof's "
             "Reclaim proof ID has been anchored and the verifier committed. Splits "
             "20% to platform-fee PDA, remainder to creator pool PDA."),
            ("Why Anchor over raw Solana programs?",
             "Anchor's IDL-first design removes hand-written serialization "
             "boilerplate. Built-in account validation macros prevent classic "
             "Solana bugs (owner checks, signer checks, seeds). TypeScript "
             "client generated from the IDL. Audit-friendly — most Solana "
             "programs are written in Anchor."),
            ("How do you prevent replay attacks on SIWS?",
             "The nonce is single-use and server-tracked for its TTL (~5 min). "
             "The signed message contains the nonce, issued-at timestamp, and "
             "domain. Even if an attacker captures a signature, they can't replay "
             "it — the server rejects nonces it's already consumed or expired."),
            ("How fresh must the nonce be?",
             "Our server generates a fresh nonce per GET /api/auth/nonce call, and "
             "the verify endpoint requires issuedAt within a 5-minute window. "
             "Beyond that the signature is rejected even if cryptographically "
             "valid. This bounds the replay window tightly."),
            ("How is the session cookie signed?",
             "HS256 HMAC using SIWS_SESSION_SECRET (at least 32 bytes). Cookie "
             "is httpOnly, sameSite=lax, secure in production, path=/, 7-day "
             "expiry. Payload: { wallet, role, iat, exp }. Reading uses the jose "
             "library's jwtVerify on every authenticated request."),
            ("Why do you anchor proofs to Arweave?",
             "Three reasons. Permanence — Arweave guarantees storage for at least "
             "200 years via the endowment model. Public auditability — anyone can "
             "retrieve the raw proof to re-verify a payout. Tamper-evidence — if "
             "our Postgres DB is ever tampered with, the on-chain arweaveTx id "
             "still points at the original proof."),
            ("Why Irys and not direct Arweave uploads?",
             "Irys (formerly Bundlr) bundles thousands of small uploads into a "
             "single Arweave transaction, dropping per-upload cost to cents. You "
             "can pay in Solana instead of AR. The API is much simpler than raw "
             "Arweave."),
            ("What multi-signature considerations matter for the escrow?",
             "For production, the escrow PDA's authority should be a squads-v4 "
             "multisig — we should not be able to unilaterally drain it. Release "
             "instructions should be keyed on verifier attestations rather than a "
             "single admin signature. This is part of the 'real escrow program' "
             "future work."),
            ("How do you handle upgradability of the Solana program?",
             "Anchor programs deploy with an upgrade authority by default. For "
             "production we'd freeze the program after audit (set upgrade auth "
             "to null) or transfer it to a multisig with timelocks. No program "
             "authority means true immutability — the tradeoff is we can't patch "
             "bugs without redeploying as a new program ID."),
            ("How do you prevent front-running on payouts?",
             "Payouts are deterministic — given a verified final proof, the "
             "amount is computed from the campaign's payment model and budget. "
             "There's no price-sensitive ordering for an attacker to exploit. "
             "For pool-based models the settlement cron processes all proofs "
             "at once at campaign end, so ordering within the window doesn't "
             "change the outcome."),
            ("Is there a slashing mechanism?",
             "Not yet, but conceptually: the disqualification counter on "
             "profiles_v2 is a reputation slash. A future extension could make "
             "creators stake SOL at join time that's slashed on proof rejection. "
             "This would economically align 'don't cheat' beyond the ban threat."),
        ],
    ),
    dict(
        n="Student 5",
        role="Trust, Verification, Testing & QA",
        owns=(
            "The two-proof settlement logic, the 13-rule disqualification "
            "pipeline, ban policy, content-match rules, payment-model math, "
            "Vitest test suite, GitHub Actions CI, and the /terms page."
        ),
        qas=[
            ("Explain the two-proof settlement model.",
             "Creator submits Proof #1 when they join the campaign — anchors "
             "ownership and baseline view count. No payout. Platform's public "
             "API is polled for display only. At campaign end, a 7-day "
             "settlement window opens. Creator submits Proof #2 — captures "
             "the stable post-rollback view count. This triggers the on-chain "
             "payout. If the creator misses the window, the payout is forfeited."),
            ("Why does two-proof defeat bot-view attacks that one-proof can't?",
             "Instagram, YouTube and TikTok all run bot-detection that rolls "
             "back fake views within 3-14 days. A single mid-campaign proof "
             "could pay on numbers that later disappear — budget leaks. The "
             "second proof, in the 7-day window AFTER campaign end, captures "
             "the number AFTER the platform has cleaned up. Bot-farm creators "
             "can't pass proof #2 because their inflated counts have dropped."),
            ("List the 13 disqualification grounds.",
             "1) Bot / view-farm traffic. 2) Sybil (multi-wallet). 3) Not the "
             "post owner. 4) Post created before campaign startsAt. 5) Deleting "
             "or hiding content. 6) Reclaim proof fails crypto check. 7) "
             "Impossible view velocity. 8) Zero-engagement high-view ratio. "
             "9) Platform ToS violation. 10) Misrepresenting the brand. 11) "
             "Attempting payout reversal. 12) Bait-and-switch edit after proof. "
             "13) Coordinated rank-gaming."),
            ("Describe the ban policy.",
             "Three disqualifications in 90 days, OR a single severe offence "
             "(impersonation, coordinated fraud, proven bot ring), automatically "
             "flips profiles_v2.banned = true. Banned wallets cannot create "
             "campaigns, join campaigns, or submit proofs. Pending payouts are "
             "forfeited. Reputation zeroes. Peer-to-peer — no admin override, "
             "no appeal process in v1 (staked appeals are future work)."),
            ("How do content-match rules work?",
             "Brands optionally set required hashtag, mention, and/or free-text "
             "phrase on the campaign. The Reclaim adapter extracts the post's "
             "caption field. The verifier checks that every required marker is "
             "present (case-insensitive). Missing any = reject. This stops "
             "creators from posting unrelated content and still claiming."),
            ("What velocity heuristics do you apply?",
             "In the legacy auto-sync mode (src/lib/trust.ts): prior verified "
             "rate × 10 max. AUTO_VERIFY_SPIKE_CAP = 50,000 views per sync. In "
             "the verify() pipeline: first proof > 100k views is flagged 'warn' "
             "(held for review rather than auto-rejected). These stop obvious "
             "bot injections."),
            ("What engagement-ratio rules do you check?",
             "Views ≥ 10,000 with 0 likes/comments is flagged — bot farms pump "
             "views but not comments. If views/engagement > 500 (one engagement "
             "per 500 views) we flag as suspicious. Real content has a narrower "
             "ratio."),
            ("How does per_view math work on resubmission?",
             "Payout = max(0, newViews - previousMax) * cpv, capped at (budget "
             "- totalAlreadyPaidOnCampaign). Delta-only — if a creator had 1k "
             "paid and resubmits 5k, they get (5k-1k) * cpv = 4k * cpv more, "
             "not 5k * cpv again. Tested in tests/payouts.test.ts."),
            ("How does top_performer settlement work?",
             "At campaign end + 7d window closure, the settlement cron selects "
             "all creators with a valid finalProofId, sorts by verifiedViews "
             "descending, and awards creatorPool = budget * (1 - feeBps/10000) "
             "entirely to the rank-1 creator. Ties broken by timestamp."),
            ("How does split_top_n work?",
             "creatorPool / topNCount goes to each of the top N creators. If "
             "fewer than N creators submitted a final proof, the pool is split "
             "across whoever did — we don't leave money unclaimed among honest "
             "creators. topNCount is validated ≥ 2 in Zod."),
            ("How does equal_split work?",
             "creatorPool / (count of verified final proofs). Every creator "
             "who submitted a valid proof #2 gets the same amount. Participation-"
             "first rewards, good for awareness campaigns where winning 'views' "
             "competitions is not the point."),
            ("Walk us through the settlement cron.",
             "GET /api/v2/settle (every 6 hours via Vercel Cron). Picks "
             "campaigns where endsAt + settlementWindowDays < now and "
             "settledAt is null. For each: forfeit participations without a "
             "finalProofId (mark forfeited=true). Distribute per payment model. "
             "Set campaign.settledAt = now, status='completed'. Notify every "
             "creator of their outcome."),
            ("What happens if a creator misses the 7-day window?",
             "Their participation's forfeited flag flips to true, settlement-"
             "Status goes to 'forfeited', and a notification lands in their "
             "inbox: 'payout forfeited — final proof not submitted'. Their "
             "share of a pool model redistributes to creators who did submit; "
             "in per_view, unspent budget stays with the brand's escrow."),
            ("How do you handle Sybil resistance?",
             "Three layers. DB level: unique index on (campaignId, creatorWallet) "
             "prevents duplicate joins. Crypto level: linked-handle check ties "
             "the wallet to the social handle declared at onboarding. "
             "Reputation: multiple wallets tied to the same handle raise the "
             "disqualification count together. Production will add phone-based "
             "identity via Reclaim."),
            ("How many tests do you have and what do they cover?",
             "45 unit tests across 6 files. reclaim-adapters.test.ts (5) — "
             "parser coverage per platform. verify.test.ts (10) — every "
             "disqualification branch. payouts.test.ts (6) — delta, cap, model "
             "dispatch. terms.test.ts (3) — signable-message invariants. "
             "trust.test.ts (6) — auto-verify guardrails. settlement.test.ts "
             "(15) — 2-proof routing, deadlines, forfeiture rules."),
            ("Why Vitest over Jest?",
             "Vite-native, no Babel/SWC config dance. TypeScript support works "
             "out of the box with tsconfig paths. Parallel test execution. "
             "Rich built-in mocking. API is Jest-compatible so migrating is "
             "painless. Snapshot support. Faster startup."),
            ("Describe your CI pipeline.",
             ".github/workflows/ci.yml runs on push and PR to main. Steps: "
             "checkout → setup-node 20 with npm cache → npm ci → npm run lint "
             "→ tsc --noEmit → vitest run → next build with env placeholders. "
             "Any failure blocks merge. Takes ~3 minutes end to end."),
            ("What production-readiness gaps remain?",
             "1) Real Anchor escrow program. 2) Upstash Redis rate-limit for "
             "horizontal scale. 3) Playwright E2E tests. 4) Phone-based Sybil "
             "resistance. 5) Staked ban-appeal mechanism. 6) Live Reclaim "
             "provider IDs for prod IG/YT/X/TT. 7) Mainnet deployment with "
             "audited escrow. All documented in docs/PROJECT.md section 12."),
        ],
    ),
]


# ───────────────────────────── Shared facts ─────────────────────────────

SHARED_FACTS = [
    ("What is DASHH?",
     "A peer-to-peer marketplace where brands pay micro-influencers only for "
     "cryptographically-verified real engagement on social media, settled on "
     "Solana. No middlemen, no admin, no fake views."),
    ("Why is it different?",
     "Every payout is backed by two zkTLS proofs — one when the creator joins, "
     "one in a 7-day settlement window after the campaign ends. Platforms have "
     "cleaned up bot views by then, so only stable, real engagement gets paid."),
    ("Platform fee & payment models",
     "Flat 20% platform fee. Four payment models: per_view, top_performer "
     "(winner-takes-all), split_top_n, equal_split."),
    ("Tech stack",
     "Next.js 14 · TypeScript · Tailwind · shadcn/ui · Framer Motion · "
     "Drizzle ORM · Neon Postgres · Reclaim zkTLS · Solana devnet · "
     "Arweave/Irys · Vitest · GitHub Actions · Vercel Cron."),
    ("Scale evidence",
     "45 passing unit tests across 6 files · 11 live routes · seed data with "
     "8 campaigns and 23 proofs · comprehensive CI pipeline · full /how-it-works "
     "walkthrough for new visitors."),
]

CHECKLIST = [
    "Read the Shared Facts section twice. Memorise all 5 points.",
    "Read YOUR partition section. Rehearse the whiteboard-ready answers.",
    "Know where in the code your topic lives (give a file path when asked).",
    "Open http://localhost:3000 on your laptop — be ready to demo.",
    "Run 'npm test' once in front of the panel if asked — 45 green builds confidence.",
    "Bring a printed copy of this PDF.",
    "Arrive 15 minutes early; sanity-check that the dev server boots.",
]

DEMO_FLOW = [
    "1.  Landing page → scroll (see FadeIn + Stagger animations) → /how-it-works → dual timeline",
    "2.  /discover → click a campaign card → CampaignDetailsModal → point at T&C, leaderboard, payment model",
    "3.  /creatordashboard → click '+ New campaign' → /form → walk through fee math + payment model picker",
    "4.  /leaderboard → show podium + tier system + XP bars",
    "5.  Terminal: npm test → show 45 passed",
    "6.  Terminal: curl http://localhost:3000/api/v2/settle → show settlement numbers",
]


# ───────────────────────────── PDF render ─────────────────────────────

class NumberedCanvas(canvas.Canvas):
    """Canvas that writes footer with page X of Y on every page."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        total = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self._draw_footer(total)
            super().showPage()
        super().save()

    def _draw_footer(self, total):
        self.setFont("Helvetica", 8)
        self.setFillColor(MUTED)
        self.drawString(2 * cm, 1.2 * cm, "DASHH — Viva Prep Pack · Session 2025-26")
        self.drawRightString(
            A4[0] - 2 * cm,
            1.2 * cm,
            f"Page {self._pageNumber} of {total}",
        )
        # Top accent bar
        self.setFillColor(PURPLE)
        self.rect(0, A4[1] - 0.15 * cm, A4[0] * 0.5, 0.15 * cm, stroke=0, fill=1)
        self.setFillColor(MINT)
        self.rect(A4[0] * 0.5, A4[1] - 0.15 * cm, A4[0] * 0.5, 0.15 * cm, stroke=0, fill=1)


def build_cover(story):
    story.append(Spacer(1, 5 * cm))
    story.append(Paragraph("DASHH", COVER_TITLE))
    story.append(Spacer(1, 0.3 * cm))
    story.append(Paragraph("Viva Preparation Pack", COVER_SUBTITLE))
    story.append(Spacer(1, 1.5 * cm))

    story.append(Paragraph(
        "A peer-to-peer marketplace where brands pay<br/>"
        "micro-influencers only for cryptographically-verified<br/>"
        "engagement, settled on Solana.",
        ParagraphStyle(
            "CoverPitch", parent=COVER_SUBTITLE, fontSize=12, leading=18,
            textColor=DARK,
        ),
    ))
    story.append(Spacer(1, 3 * cm))

    story.append(Paragraph("SESSION 2025-26", COVER_BADGE))
    story.append(Paragraph("5-person team · One-to-one viva", COVER_SUBTITLE))
    story.append(Spacer(1, 0.5 * cm))
    story.append(Paragraph(
        "Bachelor of Technology (Computer Science & Engineering)<br/>"
        "Department of Computer Engineering<br/>"
        "Shri Govindram Seksaria Institute of Technology and Science, Indore<br/>"
        "Affiliated to Rajiv Gandhi Proudyogiki Vishwavidyalaya, Bhopal",
        ParagraphStyle(
            "CoverInstitute", parent=COVER_SUBTITLE, fontSize=10, leading=16,
        ),
    ))
    story.append(PageBreak())


def build_toc(story):
    story.append(Paragraph("Table of Contents", H1))
    story.append(Spacer(1, 0.3 * cm))
    toc_rows = [
        ["1.", "Shared Facts — every student must know", "3"],
        ["2.", "Student 1 — Team Lead / Architecture", "4"],
        ["3.", "Student 2 — Frontend / UI-UX", "8"],
        ["4.", "Student 3 — Backend / Database / API", "12"],
        ["5.", "Student 4 — Blockchain / Solana / zkTLS", "16"],
        ["6.", "Student 5 — Trust / Verification / Testing", "20"],
        ["7.", "Tomorrow-Morning Checklist", "24"],
        ["8.", "Live-Demo Script", "24"],
        ["9.", "Report-Template Sections (copy-paste)", "25"],
    ]
    tbl = Table(toc_rows, colWidths=[1.2 * cm, 12 * cm, 2 * cm])
    tbl.setStyle(TableStyle([
        ("FONT", (0, 0), (-1, -1), "Helvetica", 11),
        ("TEXTCOLOR", (0, 0), (-1, -1), DARK),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("ALIGN", (2, 0), (2, -1), "RIGHT"),
        ("LINEBELOW", (0, 0), (-1, -1), 0.3, colors.HexColor("#e5e7eb")),
    ]))
    story.append(tbl)
    story.append(PageBreak())


def build_shared_facts(story):
    story.append(Paragraph("Shared Facts", EYEBROW))
    story.append(Paragraph("Every student must know these", H1))
    story.append(Paragraph(
        "These are the five things every panel member will probe on first. "
        "Memorise them — they are non-negotiable.",
        BODY,
    ))
    story.append(Spacer(1, 0.3 * cm))
    for i, (q, a) in enumerate(SHARED_FACTS, 1):
        story.append(Paragraph(f"{i}. {q}", QUESTION))
        story.append(Paragraph(a, ANSWER))
    story.append(PageBreak())


def build_student(story, s):
    story.append(Paragraph(s["n"], EYEBROW))
    story.append(Paragraph(s["role"], H1))
    story.append(Paragraph("<b>What you own:</b> " + s["owns"], BODY))
    story.append(Spacer(1, 0.3 * cm))
    story.append(Paragraph("Viva questions", H2))
    for i, (q, a) in enumerate(s["qas"], 1):
        story.append(KeepTogether([
            Paragraph(f"Q{i}. {q}", QUESTION),
            Paragraph(a, ANSWER),
        ]))
    story.append(PageBreak())


def build_checklist(story):
    story.append(Paragraph("Tomorrow-Morning Checklist", H1))
    story.append(Paragraph(
        "Go through this list first thing tomorrow. Everyone on the team.",
        BODY,
    ))
    story.append(Spacer(1, 0.2 * cm))
    for item in CHECKLIST:
        story.append(Paragraph(f"\u25A1 &nbsp;&nbsp; {item}", BODY))
    story.append(Spacer(1, 0.8 * cm))

    story.append(Paragraph("Live-Demo Script", H1))
    story.append(Paragraph(
        "If the panel asks to see the project running, follow this exact order. "
        "Fifteen minutes covers all six steps comfortably.",
        BODY,
    ))
    story.append(Spacer(1, 0.2 * cm))
    for item in DEMO_FLOW:
        story.append(Paragraph(item, BODY))
    story.append(PageBreak())


def build_report_sections(story):
    """Short copy-paste sections for the SGSITS template."""
    story.append(Paragraph("Report-Template Sections", H1))
    story.append(Paragraph(
        "The sections below are ready to paste into the SGSITS UG Project "
        "Report template. Replace placeholders in square brackets with your "
        "actual names, enrolment numbers, and guide details.",
        BODY,
    ))

    story.append(Paragraph("Project Title", H2))
    story.append(Paragraph(
        "DASHH — A Peer-to-Peer Engagement Marketplace with "
        "zkTLS-Verified Payouts on Solana",
        BODY,
    ))

    story.append(Paragraph("Abstract", H2))
    story.append(Paragraph(
        "Influencer-marketing spend crossed thirty billion US dollars in 2024, "
        "yet up to forty percent of reported engagement is estimated to be "
        "fraudulent — bot views, view-farms, and recycled content. Brands "
        "have no cryptographic guarantee that the views they pay for are real, "
        "and creators have no guarantee that their honest engagement will be "
        "paid.",
        BODY,
    ))
    story.append(Paragraph(
        "DASHH is a peer-to-peer engagement marketplace that removes every "
        "middleman from this relationship and replaces trust with "
        "cryptography. Brands fund campaigns in a Solana escrow and specify "
        "one of four payment models. Creators join, post content on their "
        "real social account, and submit a zero-knowledge TLS (zkTLS) proof "
        "via the Reclaim Protocol that anchors both ownership and baseline "
        "views. After the campaign ends, a seven-day settlement window opens; "
        "creators submit a second zkTLS proof, capturing the post-campaign "
        "view count after host platforms have rolled back any fraudulent "
        "engagement. Only the second proof triggers the on-chain payout.",
        BODY,
    ))
    story.append(Paragraph(
        "The system enforces thirteen disqualification rules covering "
        "ownership mismatch, content recycling, content-match violations, "
        "velocity spikes, engagement-ratio anomalies, bot patterns, and "
        "coordinated fraud. Three disqualifications in ninety days — or a "
        "single severe offence — automatically ban the wallet via an immutable "
        "on-chain flag. The entire history, including raw Reclaim proofs, is "
        "anchored to Arweave for permanent public audit.",
        BODY,
    ))
    story.append(Paragraph(
        "The platform was implemented in TypeScript on Next.js 14 with "
        "Drizzle ORM over Neon Postgres, Solana Web3.js for blockchain "
        "integration, and a custom multi-platform Reclaim adapter layer that "
        "supports Instagram, YouTube, X and TikTok. A unit-test suite of "
        "forty-five tests across six files verifies the verification pipeline, "
        "payout math, settlement routing and trust guardrails.",
        BODY,
    ))
    story.append(Paragraph(
        "<b>Keywords:</b> Zero-Knowledge Proofs, zkTLS, Solana, Decentralized "
        "Advertising, Influencer Marketing, Peer-to-Peer, Escrow, Reclaim "
        "Protocol, Web3.",
        BODY,
    ))

    story.append(Paragraph("Chapter 1 — Introduction (key points)", H2))
    bullets = [
        "Social-media influencer marketing projected to exceed USD 45B by 2026.",
        "Self-reported metrics + bot fraud undermine brand trust; 15-40% waste.",
        "Problem: design a trustless marketplace where brands pay only for "
        "cryptographically-verified engagement.",
        "Objectives: (1) design a payment model rewarding stable engagement; "
        "(2) multi-platform Reclaim integration; (3) 13-rule disqualification "
        "pipeline; (4) automatic 3-strike ban; (5) full-stack dashboards; "
        "(6) documented, tested, CI-verified codebase.",
        "Proposed approach: two-proof settlement — join proof + final proof "
        "in a 7-day window after campaign end — so platform bot-rollbacks "
        "have completed before payout.",
    ]
    for b in bullets:
        story.append(Paragraph("• " + b, BULLET))

    story.append(Paragraph("Chapter 7 — Conclusion", H2))
    story.append(Paragraph(
        "DASHH demonstrates a working prototype of a trustless influencer-"
        "marketing marketplace where brand dollars only reach creators whose "
        "engagement is cryptographically verified by zkTLS and is still "
        "present after the host platform's own bot-detection has run. The "
        "two-proof settlement model, combined with thirteen disqualification "
        "rules, automatic three-strike bans, content-match rules, and Arweave "
        "anchoring, closes every cheating path we considered.",
        BODY,
    ))
    story.append(Paragraph(
        "Future work: on-chain Anchor escrow program, Upstash Redis rate-"
        "limiter, Sybil resistance via phone-verify, Playwright E2E suite, "
        "staked ban appeals, mainnet deployment with audited escrow.",
        BODY,
    ))


def main():
    import os
    out = "/Users/vedantsingh/Documents/Projects/Dashh/major-project-/docs/VIVA_PREP.pdf"
    os.makedirs(os.path.dirname(out), exist_ok=True)
    doc = SimpleDocTemplate(
        out,
        pagesize=A4,
        title="DASHH Viva Prep Pack",
        author="DASHH Team",
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=1.8 * cm,
        bottomMargin=2 * cm,
    )
    story = []
    build_cover(story)
    build_toc(story)
    build_shared_facts(story)
    for s in STUDENTS:
        build_student(story, s)
    build_checklist(story)
    build_report_sections(story)

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Wrote {out}")


if __name__ == "__main__":
    main()
