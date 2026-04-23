"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";

export function NotificationBell({ wallet }: { wallet: string | null }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!wallet) return;
    const fetchCount = async () => {
      try {
        const res = await fetch(`/api/v2/notifications?wallet=${wallet}`);
        if (res.ok) {
          const { notifications } = await res.json();
          const unread = Array.isArray(notifications)
            ? notifications.filter((n: any) => !n.readAt).length
            : 0;
          setCount(unread);
        }
      } catch {
        /* ignore */
      }
    };
    fetchCount();
    const t = setInterval(fetchCount, 30_000);
    return () => clearInterval(t);
  }, [wallet]);

  return (
    <Link
      href="/notifications"
      className="relative inline-flex items-center justify-center h-9 w-9 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
      aria-label="Notifications"
    >
      <Bell className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-[#9945FF] text-white text-[10px] font-semibold flex items-center justify-center">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
