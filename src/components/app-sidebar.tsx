"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import logo from "@/images/whiteDASHH.png";
import {
  Compass,
  Rocket,
  BarChart3,
  Trophy,
  Bell,
  UserCircle,
  PlusCircle,
  LayoutGrid,
} from "lucide-react";
import { useMode } from "@/hooks/use-mode";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const EXPLORE_NAV: NavItem[] = [
  { href: "/onboarding", label: "Get Started", icon: UserCircle },
  { href: "/dashboard", label: "Explore", icon: Compass },
  { href: "/discover", label: "Feed", icon: LayoutGrid },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/notifications", label: "Notifications", icon: Bell },
];

const CREATE_NAV: NavItem[] = [
  { href: "/onboarding", label: "Get Started", icon: UserCircle },
  { href: "/creatordashboard", label: "Studio", icon: Rocket },
  { href: "/form", label: "New campaign", icon: PlusCircle },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/notifications", label: "Notifications", icon: Bell },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { mode } = useMode();
  const [onboarded, setOnboarded] = useState(false);

  useEffect(() => {
    setOnboarded(
      typeof window !== "undefined" &&
        window.localStorage.getItem("dashh_onboarded") === "true",
    );
  }, [pathname]);

  const baseNav = mode === "create" ? CREATE_NAV : EXPLORE_NAV;
  const nav = onboarded
    ? baseNav.filter((n) => n.href !== "/onboarding")
    : baseNav;

  const accent =
    mode === "create"
      ? {
          label: "Create mode",
          color: "text-[#14F195]",
          gradient: "from-[#14F195]/20 to-[#9945FF]/20",
          ring: "ring-[#14F195]/30",
          dot: "bg-[#14F195]",
        }
      : {
          label: "Explore mode",
          color: "text-[#9945FF]",
          gradient: "from-[#9945FF]/20 to-[#14F195]/20",
          ring: "ring-[#9945FF]/30",
          dot: "bg-[#9945FF]",
        };

  return (
    <aside className="fixed hidden md:flex flex-col left-0 top-20 bottom-0 w-60 border-r border-white/10 bg-black/40 backdrop-blur-xl z-20">
      <div className="flex items-center gap-2 px-5 pt-4 pb-4">
        <Image src={logo} alt="DASHH" width={32} height={32} />
        <span className="text-white font-semibold tracking-wide">DASHH</span>
      </div>

      <div
        className={cn(
          "mx-4 mb-4 flex items-center gap-2 rounded-full border px-3 py-1.5 ring-1",
          `border-white/10 ${accent.ring}`,
        )}
      >
        <span className={cn("h-2 w-2 rounded-full", accent.dot)} />
        <span
          className={cn(
            "text-[11px] font-semibold uppercase tracking-widest",
            accent.color,
          )}
        >
          {accent.label}
        </span>
      </div>

      <nav className="flex flex-col gap-1 px-3">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname?.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                active
                  ? `bg-gradient-to-r ${accent.gradient} text-white`
                  : "text-zinc-400 hover:text-white hover:bg-white/5",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-4 text-[11px] text-zinc-500 border-t border-white/10">
        Switch modes from the header
        <br />
        <span className="text-zinc-600">DASHH · Devnet</span>
      </div>
    </aside>
  );
}
