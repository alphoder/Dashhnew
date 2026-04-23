import Link from "next/link";
import Footer from "@/components/footer";
import { HeroSection } from "@/components/hero-section";
import { PrimaryCTA } from "@/components/primary-cta";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion/fade-in";
import { HoverLift } from "@/components/motion/hover-lift";
import {
  Compass,
  LayoutDashboard,
  Megaphone,
  PlusCircle,
  BarChart3,
  Trophy,
  Bell,
  UserPlus,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Wallet,
  Eye,
  Coins,
} from "lucide-react";

export const dynamic = "force-dynamic";

type RouteGroup = {
  title: string;
  description: string;
  accent: string;
  items: {
    href: string;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }[];
};

const ROUTE_GROUPS: RouteGroup[] = [
  {
    title: "Get Started",
    description: "New to DASHH? Begin here — onboarding only takes 4 steps.",
    accent: "from-[#9945FF] via-[#9945FF] to-[#14F195]",
    items: [
      {
        href: "/onboarding",
        label: "Onboarding wizard",
        description: "Pick a role, connect your wallet, choose your platform.",
        icon: UserPlus,
        badge: "Start here",
      },
    ],
  },
  {
    title: "For Creators",
    description: "Browse campaigns, earn SOL, track your verified engagement.",
    accent: "from-[#9945FF] via-[#9945FF] to-[#14F195]",
    items: [
      {
        href: "/discover",
        label: "Discover campaigns",
        description: "Active campaigns on Instagram, YouTube, X and TikTok.",
        icon: Compass,
      },
      {
        href: "/creatordashboard",
        label: "Creator dashboard",
        description: "Your joined campaigns, payouts, and earnings.",
        icon: Megaphone,
      },
      {
        href: "/leaderboard",
        label: "Leaderboard",
        description: "Top creators ranked by verified views.",
        icon: Trophy,
      },
    ],
  },
  {
    title: "For Brands",
    description: "Launch campaigns, pay only for verified engagement.",
    accent: "from-[#9945FF] to-[#14F195]",
    items: [
      {
        href: "/dashboard",
        label: "Brand dashboard",
        description: "Manage active campaigns and Blink links.",
        icon: LayoutDashboard,
      },
      {
        href: "/form",
        label: "Create campaign",
        description: "Multi-step form with live Blink preview.",
        icon: PlusCircle,
      },
      {
        href: "/analytics",
        label: "Analytics",
        description: "Verified views, payouts, and CPV over time.",
        icon: BarChart3,
      },
    ],
  },
  {
    title: "Workspace",
    description: "Notifications and engagement verification — peer-to-peer, no gatekeepers.",
    accent: "from-sky-400 via-blue-500 to-indigo-500",
    items: [
      {
        href: "/how-it-works",
        label: "How DASHH works",
        description: "The full flow: two proofs, one payout, zero middlemen.",
        icon: CheckCircle2,
        badge: "Walkthrough",
      },
      {
        href: "/terms",
        label: "Terms & ban policy",
        description: "Brand + creator T&C, 13 disqualification rules, 3-strike bans.",
        icon: ShieldCheck,
      },
      {
        href: "/notifications",
        label: "Notifications",
        description: "Your inbox for proofs, payouts, and campaign updates.",
        icon: Bell,
      },
      {
        href: "/verifyClaim/demo",
        label: "Verify engagement",
        description: "Submit a zkTLS proof via the Reclaim Protocol.",
        icon: ShieldCheck,
      },
    ],
  },
];

const VALUE_PROPS = [
  {
    icon: Eye,
    title: "Verified views, not follower counts",
    body: "Every view is proven on-chain with zkTLS. No fake metrics, no inflated reach.",
  },
  {
    icon: Wallet,
    title: "On-chain escrow",
    body: "Solana escrow holds the budget; payouts release the instant proofs verify.",
  },
  {
    icon: Sparkles,
    title: "Multi-platform Reclaim",
    body: "Instagram, YouTube, X/Twitter and TikTok — plug in new providers in hours.",
  },
  {
    icon: Coins,
    title: "No middlemen",
    body: "Brands pay creators directly. No agency fees, no delays, no data broker.",
  },
];

export default function FrontPage() {
  return (
    <>
      <HeroSection />

      {/* Value propositions */}
      <section className="relative w-full py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <FadeIn className="mb-10 text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#14F195]">
              Why DASHH
            </p>
            <h2 className="text-3xl font-bold text-white md:text-4xl">
              Transparent advertising, end-to-end
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-zinc-400">
              DASHH rebuilds the influencer economy around cryptographic proof,
              instant Solana payouts, and creator ownership.
            </p>
          </FadeIn>

          <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {VALUE_PROPS.map((v) => {
              const Icon = v.icon;
              return (
                <StaggerItem key={v.title}>
                  <HoverLift className="h-full">
                    <div className="h-full rounded-xl border border-white/10 bg-gradient-to-br from-black/60 to-zinc-900/60 p-5 backdrop-blur-sm transition-colors hover:border-white/20">
                      <div className="mb-3 inline-flex rounded-lg bg-gradient-to-br from-[#9945FF]/20 to-[#14F195]/20 p-2">
                        <Icon className="h-5 w-5 text-[#14F195]" />
                      </div>
                      <h3 className="text-base font-semibold text-white">{v.title}</h3>
                      <p className="mt-2 text-sm text-zinc-400">{v.body}</p>
                    </div>
                  </HoverLift>
                </StaggerItem>
              );
            })}
          </Stagger>
        </div>
      </section>

      {/* Route explorer */}
      <section
        id="explore"
        className="relative w-full border-t border-white/5 py-16 md:py-24"
      >
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="mb-12 flex flex-col items-center gap-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#14F195]">
              Explore DASHH
            </p>
            <h2 className="text-3xl font-bold text-white md:text-4xl">
              Every page, one click away
            </h2>
            <p className="max-w-2xl text-zinc-400">
              DASHH ships with dedicated flows for creators, brands, and
              moderators — jump straight to what you need.
            </p>
            <PrimaryCTA variant="hero" className="mt-2" />
          </div>

          <div className="space-y-10">
            {ROUTE_GROUPS.map((group) => (
              <FadeIn key={group.title}>
                <div className="mb-5 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
                  <div>
                    <h3
                      className={`bg-gradient-to-r ${group.accent} bg-clip-text text-xl font-semibold text-transparent md:text-2xl`}
                    >
                      {group.title}
                    </h3>
                    <p className="mt-1 text-sm text-zinc-400">{group.description}</p>
                  </div>
                  <span className="text-xs text-zinc-600">
                    {group.items.length} {group.items.length === 1 ? "page" : "pages"}
                  </span>
                </div>

                <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" stagger={0.06}>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <StaggerItem key={item.href}>
                      <HoverLift>
                      <Link
                        href={item.href}
                        className="group relative flex h-full flex-col gap-3 overflow-hidden rounded-xl border border-white/10 bg-black/40 p-5 transition-colors hover:border-white/20 hover:bg-black/60"
                      >
                        <div
                          className={`absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${group.accent} opacity-0 blur-2xl transition-opacity group-hover:opacity-20`}
                        />
                        <div className="relative flex items-center justify-between">
                          <div
                            className={`inline-flex rounded-lg bg-gradient-to-br ${group.accent} bg-opacity-20 p-2`}
                          >
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          {item.badge && (
                            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <div className="relative">
                          <h4 className="font-semibold text-white">{item.label}</h4>
                          <p className="mt-1 text-sm text-zinc-400">
                            {item.description}
                          </p>
                        </div>
                        <div className="relative mt-1 flex items-center gap-1 text-xs text-[#14F195] opacity-80 transition-opacity group-hover:opacity-100">
                          Open
                          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                        </div>
                        <code className="relative mt-auto block truncate rounded bg-white/5 px-2 py-1 font-mono text-[11px] text-zinc-500">
                          {item.href}
                        </code>
                      </Link>
                      </HoverLift>
                      </StaggerItem>
                    );
                  })}
                </Stagger>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative w-full border-t border-white/5 py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-4 md:px-6">
          <FadeIn className="mb-12 text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#14F195]">
              How it works
            </p>
            <h2 className="text-3xl font-bold text-white md:text-4xl">
              From campaign to payout in 4 steps
            </h2>
          </FadeIn>

          <Stagger className="grid gap-6 md:grid-cols-2 lg:grid-cols-4" stagger={0.1}>
            {[
              {
                step: "01",
                title: "Launch a campaign",
                body: "Brand funds a Solana escrow, defines budget and cost-per-view, picks a platform.",
              },
              {
                step: "02",
                title: "Creator joins",
                body: "Creators browse Discover, one-click join via a Blink, post content on their social.",
              },
              {
                step: "03",
                title: "Verify engagement",
                body: "Reclaim Protocol emits a zkTLS proof of real views; proof is anchored on Arweave.",
              },
              {
                step: "04",
                title: "Payout on-chain",
                body: "Solana escrow auto-releases payment the moment the proof verifies.",
              },
            ].map((s) => (
              <StaggerItem key={s.step}>
              <HoverLift>
              <li
                className="relative h-full overflow-hidden rounded-xl border border-white/10 bg-black/40 p-5"
              >
                <p className="text-3xl font-bold text-transparent [background:linear-gradient(120deg,#9945FF,#14F195)] [background-clip:text]">
                  {s.step}
                </p>
                <h3 className="mt-3 text-base font-semibold text-white">{s.title}</h3>
                <p className="mt-1 text-sm text-zinc-400">{s.body}</p>
                <CheckCircle2 className="absolute right-4 top-4 h-4 w-4 text-green-400/60" />
              </li>
              </HoverLift>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="relative w-full py-20">
        <div className="mx-auto max-w-4xl px-4 md:px-6">
          <FadeIn y={32} duration={0.8} className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#9945FF]/10 via-[#9945FF]/10 to-[#14F195]/10 p-10 text-center md:p-14">
            <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[#9945FF] opacity-20 blur-3xl" />
            <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-[#14F195] opacity-20 blur-3xl" />
            <div className="relative">
              <h2 className="text-3xl font-bold text-white md:text-4xl">
                Ready to ship a campaign?
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-zinc-300">
                Jump into onboarding — pick your role, connect Phantom, and
                you're live in four steps.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <PrimaryCTA variant="hero" />
                <Link
                  href="/how-it-works"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  See how it works
                </Link>
                <Link
                  href="/discover"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-transparent px-6 py-3 text-sm text-zinc-300 hover:bg-white/5"
                >
                  Browse campaigns
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <Footer />
    </>
  );
}
