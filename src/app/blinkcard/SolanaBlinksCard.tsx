'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ICreator } from '@/lib/interface/creator';
import { Clock, Trophy, Eye } from 'lucide-react';

interface Props {
  content: ICreator;
  id: string;
  /**
   * When provided, the card shows a prominent "View details & join" button that
   * calls this handler with the campaign id — typically to open the details modal.
   * When omitted, the card falls back to the legacy BLINK NOW behaviour.
   */
  onView?: (id: string) => void;
}

export function SolanaBlinksCard({ content, id, onView }: Props) {
  const daysLeft = content.end
    ? Math.max(
        0,
        Math.floor(
          (new Date(content.end).getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      )
    : 'N/A';

  const getDashboardLink = () => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname === 'localhost') {
        return `/dashboard/${id}`;
      }
      return `https://blinks.knowflow.study/dashboard/${id}`;
    }
    return `https://blinks.knowflow.study/dashboard/${id}`;
  };

  return (
    <div className="relative w-full max-w-[22rem] min-w-80 rounded-xl overflow-hidden sm:w-[20rem] md:w-[25rem] bg-[#0a0a0a]/40 backdrop-blur-sm border border-white/5 shadow-xl">
      <div className="relative h-48">
        <Image
          src={content.icons}
          alt={content.title}
          layout="fill"
          objectFit="cover"
          className="brightness-90"
        />
        <div className="absolute top-2 left-2 px-2 py-1 bg-black/30 backdrop-blur-sm rounded-md text-white/80 text-xs">
          #blinks
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/50 to-transparent">
          <h2 className="text-lg md:text-xl font-semibold tracking-tight text-white">
            {content.title}
          </h2>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <p className="text-sm text-zinc-400 line-clamp-2 min-h-[2.5rem]">
          {content.description}
        </p>

        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center space-x-2 text-[#14F195]">
            <Trophy className="w-4 h-4" />
            <span>${content.amount}</span>
          </div>
          <div className="flex items-center space-x-2 text-[#9945FF]">
            <Clock className="w-4 h-4" />
            <span>{daysLeft}d left</span>
          </div>
        </div>

        <div className="text-center py-2 px-4 bg-[#1a1a1a]/40 rounded-lg backdrop-blur-sm">
          <span className="text-xs text-gray-400">
            Current participants:{' '}
            <span className="text-white font-medium">
              {content.users?.length ?? 0}
            </span>
          </span>
        </div>

        <div className="space-y-2">
          {onView ? (
            <button
              type="button"
              onClick={() => onView(id)}
              className="inline-flex w-full items-center justify-center gap-2 py-2 font-semibold text-white rounded-lg bg-gradient-to-r from-[#9945FF] to-[#14F195] hover:opacity-90 transition-all duration-300"
            >
              <Eye className="h-4 w-4" />
              View details &amp; join
            </button>
          ) : (
            <Link
              href={`https://dial.to/?action=solana-action:https://blinks.knowflow.study/api/donate/${id}&cluster=devnet`}
              className="block w-full py-2 text-center font-semibold text-white rounded-lg bg-gradient-to-r from-[#9945FF] to-[#14F195] hover:opacity-90 transition-all duration-300"
            >
              BLINK NOW
            </Link>
          )}
          <Link
            href={getDashboardLink()}
            className="block w-full py-2 text-center font-medium text-gray-400 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-300"
          >
            View leaderboard
          </Link>
        </div>
      </div>
    </div>
  );
}
