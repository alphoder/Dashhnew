// Seed DASHH with realistic demo data.
// Run with: node --env-file=.env.local scripts/seed.mjs
//
// Safe to re-run: wipes v1+v2 tables first, then inserts fresh rows.

import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL not set. Run via:  node --env-file=.env.local scripts/seed.mjs");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

// ─────────── Fake wallets (stable so the UI can filter by them) ───────────
const BRAND = "BRaNdAaQkzZwQFkNpRzTJVTnMjPxYcQvxFyXmKqpHtTc";
const C1 = "CrEaToR1qKwQFkNpRzTJVTnMjPxYcQvxFyXmKqpHtTc";
const C2 = "CrEaToR2qKwQFkNpRzTJVTnMjPxYcQvxFyXmKqpHtTc";
const C3 = "CrEaToR3qKwQFkNpRzTJVTnMjPxYcQvxFyXmKqpHtTc";
const C4 = "CrEaToR4qKwQFkNpRzTJVTnMjPxYcQvxFyXmKqpHtTc";
const C5 = "CrEaToR5qKwQFkNpRzTJVTnMjPxYcQvxFyXmKqpHtTc";

const CREATORS = [C1, C2, C3, C4, C5];

const IMG = {
  coffee: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800",
  sneakers: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800",
  gaming: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800",
  beauty: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800",
  crypto: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800",
  food: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800",
  fitness: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800",
  travel: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800",
};

// ─────────── 1. Clear existing rows ───────────
console.log("🧹 Clearing existing rows…");
const clearOrder = [
  "payouts_v2",
  "proofs_v2",
  "notifications_v2",
  "participations_v2",
  "campaigns_v2",
  "profiles_v2",
  "users",
  "creators",
];
for (const t of clearOrder) {
  try {
    await sql(`DELETE FROM ${t}`);
  } catch (err) {
    console.log(`  (skipping ${t}: ${err.message.slice(0, 60)})`);
  }
}

// ─────────── 2. v1 creators (powers /dashboard + /creatordashboard) ───────────
console.log("📣 Seeding v1 creators…");

const daysFromNow = (n) => new Date(Date.now() + n * 86_400_000);

const v1Campaigns = [
  {
    solAdd: BRAND,
    title: "Brew & Bloom Winter Drop",
    description: "Post an Instagram story featuring our new oat-milk latte for a chance to win.",
    label: "Brew & Bloom",
    amount: 250,
    icons: IMG.coffee,
    users: [C1, C2, C3],
    end: daysFromNow(14),
  },
  {
    solAdd: BRAND,
    title: "Solana Hoodie Launch",
    description: "Show off your Solana-merch fit in a TikTok video for USDC rewards.",
    label: "Solana Merch",
    amount: 500,
    icons: IMG.sneakers,
    users: [C1, C4, C5],
    end: daysFromNow(7),
  },
  {
    solAdd: BRAND,
    title: "Phantom Wallet Onboarding",
    description: "Help a friend set up Phantom on Solana and share the story.",
    label: "Phantom",
    amount: 800,
    icons: IMG.crypto,
    users: [C2, C3, C4, C5],
    end: daysFromNow(21),
  },
  {
    solAdd: BRAND,
    title: "Neon Glow Beauty Haul",
    description: "Feature our SPF primer in a 15s Reel — best engagement wins.",
    label: "Neon Glow",
    amount: 350,
    icons: IMG.beauty,
    users: [C2, C3],
    end: daysFromNow(10),
  },
  {
    solAdd: BRAND,
    title: "Gamer Energy Drink",
    description: "Stream gameplay with our can in-frame. Real views, on-chain.",
    label: "Watts",
    amount: 600,
    icons: IMG.gaming,
    users: [C1, C4],
    end: daysFromNow(5),
  },
  {
    solAdd: BRAND,
    title: "Street Food Series (CLOSED)",
    description: "Document three street-food spots in your city.",
    label: "Bites",
    amount: 300,
    icons: IMG.food,
    users: [C1, C2, C3, C4, C5],
    end: daysFromNow(-3),
  },
  {
    solAdd: BRAND,
    title: "Fit Over 30 Campaign",
    description: "Share a 30-day progress story using our resistance bands.",
    label: "FitBand",
    amount: 420,
    icons: IMG.fitness,
    users: [C3, C5],
    end: daysFromNow(18),
  },
  {
    solAdd: BRAND,
    title: "Weekend in Lisbon (CLOSED)",
    description: "Old campaign — archived for the leaderboard.",
    label: "Voyage",
    amount: 700,
    icons: IMG.travel,
    users: [C1, C2, C4],
    end: daysFromNow(-10),
  },
];

// We'll need each campaign's returned id to wire up v2 participations
const v1CampaignRows = [];
for (const c of v1Campaigns) {
  const [row] = await sql`
    INSERT INTO creators (sol_add, title, description, label, amount, icons, users, "end")
    VALUES (${c.solAdd}, ${c.title}, ${c.description}, ${c.label}, ${c.amount}, ${c.icons}, ${c.users}, ${c.end.toISOString()})
    RETURNING id, title
  `;
  v1CampaignRows.push({ ...c, id: row.id });
}
console.log(`  inserted ${v1CampaignRows.length} creators rows`);

// ─────────── 3. v1 users — leaderboard participants ───────────
console.log("👥 Seeding v1 users (leaderboard entries)…");
for (const camp of v1CampaignRows) {
  for (const creator of camp.users) {
    const views = Math.floor(500 + Math.random() * 9500);
    const winning = Math.round(Math.random() * (camp.amount / 2));
    await sql`
      INSERT INTO users (sol_add, post, is_awarded, ig_profile, views, winning_amount)
      VALUES (
        ${creator},
        ${`https://dial.to/?action=solana-action:https://blinks.knowflow.study/api/donate/${camp.id}`},
        ${Math.random() > 0.5},
        ${`https://instagram.com/${creator.slice(0, 10).toLowerCase()}`},
        ${views},
        ${winning}
      )
    `;
  }
}
console.log("  leaderboard seeded");

// ─────────── 4. v2 profiles ───────────
console.log("👤 Seeding v2 profiles…");
const profileRows = [
  { wallet: BRAND, role: "brand", displayName: "DASHH Studio" },
  { wallet: C1, role: "creator", displayName: "Ava Kim", instagram: "avakim" },
  { wallet: C2, role: "creator", displayName: "Ravi Mehta", youtube: "ravigaming" },
  { wallet: C3, role: "creator", displayName: "Lena Park", tiktok: "lena.park" },
  { wallet: C4, role: "creator", displayName: "Carlos Silva", twitter: "csilva" },
  { wallet: C5, role: "creator", displayName: "Mia Chen", instagram: "miachen" },
];
for (const p of profileRows) {
  await sql`
    INSERT INTO profiles_v2 (wallet, role, display_name, instagram_handle, youtube_handle, twitter_handle, tiktok_handle, reputation, total_earned)
    VALUES (
      ${p.wallet}, ${p.role}, ${p.displayName},
      ${p.instagram ?? null}, ${p.youtube ?? null},
      ${p.twitter ?? null}, ${p.tiktok ?? null},
      ${Math.floor(Math.random() * 500)},
      ${Math.round(Math.random() * 80 * 100) / 100}
    )
  `;
}

// ─────────── 5. v2 campaigns — multi-platform ───────────
console.log("📢 Seeding v2 campaigns…");
const v2CampaignsData = [
  { title: "Autumn Latte IG Drop", description: "Instagram story views for our oat-milk latte.", platform: "instagram", icon: IMG.coffee, cta: "Join the drop", budget: 25, cpv: 0.0005, status: "active", offset: 12 },
  { title: "YouTube Shorts Sneaker Unbox", description: "Unbox our limited sneakers in a 60s Short.", platform: "youtube", icon: IMG.sneakers, cta: "Claim", budget: 40, cpv: 0.001, status: "active", offset: 20 },
  { title: "Phantom Onboarding Thread", description: "Write a 5-post thread on X onboarding a friend to Phantom.", platform: "twitter", icon: IMG.crypto, cta: "Start", budget: 30, cpv: 0.0008, status: "active", offset: 8 },
  { title: "TikTok GRWM with Neon Glow", description: "Get Ready With Me featuring our SPF primer.", platform: "tiktok", icon: IMG.beauty, cta: "Create", budget: 18, cpv: 0.0003, status: "active", offset: 5 },
  { title: "Gamer Energy IG Reel", description: "Your best 30s gameplay reel with our can in frame.", platform: "instagram", icon: IMG.gaming, cta: "Submit reel", budget: 22, cpv: 0.0007, status: "active", offset: 3 },
  { title: "Street Food X Campaign (CLOSED)", description: "Archived — 3 street food spots, X thread.", platform: "twitter", icon: IMG.food, cta: "Closed", budget: 15, cpv: 0.0005, status: "completed", offset: -5 },
  { title: "Fit Over 30 YT Short", description: "30-day progress using our resistance bands.", platform: "youtube", icon: IMG.fitness, cta: "Share", budget: 35, cpv: 0.001, status: "active", offset: 16 },
  { title: "Weekend in Lisbon TikTok (CLOSED)", description: "Legacy travel campaign.", platform: "tiktok", icon: IMG.travel, cta: "Closed", budget: 45, cpv: 0.0009, status: "completed", offset: -14 },
];

const v2Rows = [];
for (const c of v2CampaignsData) {
  const [row] = await sql`
    INSERT INTO campaigns_v2 (
      brand_wallet, title, description, platform, icon_url, cta_label,
      budget, cpv, status, starts_at, ends_at
    ) VALUES (
      ${BRAND}, ${c.title}, ${c.description}, ${c.platform}::platform_v2,
      ${c.icon}, ${c.cta}, ${c.budget}, ${c.cpv},
      ${c.status}::campaign_status_v2,
      ${new Date(Date.now() - 14 * 86_400_000).toISOString()},
      ${new Date(Date.now() + c.offset * 86_400_000).toISOString()}
    )
    RETURNING id, title
  `;
  v2Rows.push({ ...c, id: row.id });
}
console.log(`  inserted ${v2Rows.length} v2 campaigns`);

// ─────────── 6. v2 participations + proofs + payouts ───────────
console.log("🔗 Seeding participations, proofs, payouts…");
let proofCount = 0;
let payoutCount = 0;
for (const camp of v2Rows) {
  // 3–5 random creators per campaign
  const shuffled = [...CREATORS].sort(() => Math.random() - 0.5);
  const picks = shuffled.slice(0, 3 + Math.floor(Math.random() * 3));

  for (const creator of picks) {
    const [p] = await sql`
      INSERT INTO participations_v2 (campaign_id, creator_wallet, post_url, joined_at)
      VALUES (
        ${camp.id}, ${creator},
        ${`https://${camp.platform}.com/p/${Math.random().toString(36).slice(2, 10)}`},
        ${new Date(Date.now() - Math.random() * 10 * 86_400_000).toISOString()}
      )
      RETURNING id
    `;

    // 70 % of participations have a verified proof
    if (Math.random() > 0.3) {
      const views = Math.floor(500 + Math.random() * 19_500);
      const daysAgo = Math.floor(Math.random() * 14);
      const [pr] = await sql`
        INSERT INTO proofs_v2 (
          participation_id, reclaim_proof_id, arweave_tx,
          verified_views, status, verified_at, raw_proof
        ) VALUES (
          ${p.id},
          ${`reclaim_${Math.random().toString(36).slice(2, 12)}`},
          ${`ar_${Math.random().toString(36).slice(2, 12)}`},
          ${views}, 'verified'::proof_status_v2,
          ${new Date(Date.now() - daysAgo * 86_400_000).toISOString()},
          ${JSON.stringify({ platform: camp.platform, demo: true })}
        )
        RETURNING id
      `;
      proofCount++;

      // Payout for verified proofs
      const amount = Math.min(camp.budget, views * camp.cpv);
      await sql`
        INSERT INTO payouts_v2 (proof_id, amount, tx_sig, status, paid_at)
        VALUES (
          ${pr.id}, ${Number(amount.toFixed(4))},
          ${`sig_${Math.random().toString(36).slice(2, 14)}`},
          'paid'::payout_status_v2,
          ${new Date(Date.now() - daysAgo * 86_400_000).toISOString()}
        )
      `;
      payoutCount++;
    }
  }
}
console.log(`  ${proofCount} proofs, ${payoutCount} payouts`);

// ─────────── 7. v2 notifications ───────────
console.log("🔔 Seeding notifications…");
const notifs = [
  { wallet: C1, kind: "proof_verified", title: "Proof verified", body: "7,432 views verified on Autumn Latte. Payout: 3.72 SOL" },
  { wallet: C1, kind: "payout_sent", title: "Payout sent", body: "3.72 SOL landed in your wallet" },
  { wallet: C2, kind: "proof_verified", title: "Proof verified", body: "11,204 views verified on Phantom Onboarding Thread" },
  { wallet: C3, kind: "participation_joined", title: "Campaign joined", body: "You joined TikTok GRWM with Neon Glow" },
  { wallet: C3, kind: "proof_rejected", title: "Proof rejected", body: "Couldn't parse engagement. Try re-verifying." },
  { wallet: C4, kind: "payout_sent", title: "Payout sent", body: "1.85 SOL for Gamer Energy IG Reel" },
  { wallet: C5, kind: "proof_verified", title: "Proof verified", body: "4,891 views on Autumn Latte IG Drop" },
  { wallet: BRAND, kind: "participation_joined", title: "New creator joined", body: "Ava Kim joined Autumn Latte IG Drop" },
  { wallet: BRAND, kind: "participation_joined", title: "New creator joined", body: "Ravi Mehta joined YouTube Shorts Sneaker Unbox" },
  { wallet: BRAND, kind: "proof_verified", title: "Engagement verified", body: "11,204 verified views on Phantom Onboarding Thread" },
];

for (const [i, n] of notifs.entries()) {
  await sql`
    INSERT INTO notifications_v2 (wallet, kind, title, body, payload, read_at, created_at)
    VALUES (
      ${n.wallet}, ${n.kind}, ${n.title}, ${n.body},
      ${JSON.stringify({ demo: true })},
      ${i < 3 ? new Date().toISOString() : null},
      ${new Date(Date.now() - i * 3600 * 1000).toISOString()}
    )
  `;
}
console.log(`  ${notifs.length} notifications seeded`);

// ─────────── Summary ───────────
const [{ count: c1Count }] = await sql`SELECT COUNT(*)::int AS count FROM creators`;
const [{ count: c2Count }] = await sql`SELECT COUNT(*)::int AS count FROM campaigns_v2`;
const [{ count: uCount }] = await sql`SELECT COUNT(*)::int AS count FROM users`;
const [{ count: pCount }] = await sql`SELECT COUNT(*)::int AS count FROM proofs_v2`;
const [{ count: nCount }] = await sql`SELECT COUNT(*)::int AS count FROM notifications_v2`;

console.log("\n✅ Seed complete");
console.log(`   creators (v1):        ${c1Count}`);
console.log(`   users (v1):           ${uCount}`);
console.log(`   campaigns_v2:         ${c2Count}`);
console.log(`   proofs_v2:            ${pCount}`);
console.log(`   notifications_v2:     ${nCount}`);
console.log(`\n🔑 Demo wallets you can paste into localStorage as dashh_wallet:`);
console.log(`   Brand:    ${BRAND}`);
console.log(`   Creator1: ${C1}`);
console.log(`   Creator2: ${C2}`);
console.log(`   Creator3: ${C3}`);
