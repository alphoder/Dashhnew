"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Instagram, Youtube, Twitter, Music2 } from "lucide-react";
import { HoverLift } from "@/components/motion/hover-lift";

type Platform = "instagram" | "youtube" | "twitter" | "tiktok";

const ICONS: Record<Platform, React.ComponentType<{ className?: string }>> = {
  instagram: Instagram,
  youtube: Youtube,
  twitter: Twitter,
  tiktok: Music2,
};

export interface CampaignCardData {
  id: string;
  title: string;
  description: string;
  platform: Platform;
  iconUrl: string;
  budget: number;
  cpv: number;
  endsAt: string | Date;
  status: string;
}

export function CampaignCard({
  campaign,
  onView,
  onJoin,
}: {
  campaign: CampaignCardData;
  /** Open the campaign-details modal. Preferred over onJoin for transparency. */
  onView?: (id: string) => void;
  /** Legacy direct-join; kept for backward compatibility. */
  onJoin?: (id: string) => void;
}) {
  const Icon = ICONS[campaign.platform];
  const ends = new Date(campaign.endsAt);
  const daysLeft = Math.max(
    0,
    Math.ceil((ends.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
  );

  return (
    <HoverLift className="h-full">
    <Card className="h-full bg-black/60 border-white/10 text-white overflow-hidden hover:border-white/30 transition-colors">
      <div className="relative h-40 w-full bg-zinc-900">
        {campaign.iconUrl ? (
          <Image
            src={campaign.iconUrl}
            alt={campaign.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : null}
        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-black/70 backdrop-blur text-xs capitalize">
          <Icon className="h-3.5 w-3.5" />
          {campaign.platform}
        </div>
      </div>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-base leading-tight">{campaign.title}</h3>
          <span className="text-xs text-zinc-400 whitespace-nowrap">
            {daysLeft}d left
          </span>
        </div>
        <p className="text-sm text-zinc-400 line-clamp-2">{campaign.description}</p>
        <div className="flex items-center justify-between pt-1">
          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-wide text-zinc-500">
              Budget
            </span>
            <span className="font-medium">{campaign.budget.toFixed(2)} SOL</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[11px] uppercase tracking-wide text-zinc-500">CPV</span>
            <span className="font-medium">{campaign.cpv.toFixed(4)} SOL</span>
          </div>
        </div>
        {onView ? (
          <Button
            onClick={() => onView(campaign.id)}
            className="w-full bg-gradient-to-r from-[#9945FF] to-[#14F195] text-white hover:opacity-90"
          >
            View details & join
          </Button>
        ) : onJoin ? (
          <Button
            onClick={() => onJoin(campaign.id)}
            className="w-full bg-gradient-to-r from-[#9945FF] to-[#14F195] text-white hover:opacity-90"
          >
            Join campaign
          </Button>
        ) : (
          <Button asChild className="w-full bg-white/10 hover:bg-white/20 text-white">
            <Link href={`/dashboard/${campaign.id}`}>View details</Link>
          </Button>
        )}
      </CardContent>
    </Card>
    </HoverLift>
  );
}
