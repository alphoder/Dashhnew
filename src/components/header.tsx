'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import ConnectPhantomWallet from '@/app/connectPhantomWallet/connectbtn';
import { NotificationBell } from './notification-bell';
import { RoleToggle } from './role-toggle';
import { PrimaryCTA } from './primary-cta';
import logo from '../images/whiteDASHH.png';
import { isAppRoute } from '@/lib/modes';

const Header = () => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const pathname = usePathname();
  const inApp = isAppRoute(pathname);

  // Keep localStorage in sync with the in-memory wallet state. When the
  // address goes from non-null to null (user clicked Logout, or Phantom
  // fired `disconnect`), we clear the cache so reloads don't resurrect a
  // dead session.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (walletAddress) {
      window.localStorage.setItem('dashh_wallet', walletAddress);
    }
    // NOTE: we intentionally don't auto-clear on null here because the
    // connect button's `disconnect()` handler does that — clearing on
    // every null transition would race with the silent-reconnect path.
  }, [walletAddress]);

  // Hydrate from localStorage on first mount so the header doesn't flash
  // empty between SSR and the connect-button's silent reconnect.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem('dashh_wallet');
    if (stored && !walletAddress) setWalletAddress(stored);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <nav
      className="fixed top-0 left-0 w-full z-30 bg-black/60 backdrop-blur-xl border-b border-white/5"
      aria-label="Main navigation"
    >
      <div className="flex h-16 items-center gap-4 px-4 md:px-6">
        {/* Logo */}
        <div className="flex-shrink-0">
          <Link href="/" aria-label="Home" className="inline-flex items-center">
            <Image
              src={logo}
              alt="DASHH"
              width={48}
              height={48}
              className="h-12 w-auto"
            />
          </Link>
        </div>

        {/* Centre slot — RoleToggle on app pages only; blank on public pages */}
        <div className="hidden sm:flex flex-1 justify-center">
          {inApp && <RoleToggle />}
        </div>

        {/* Right cluster */}
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <Link
            href="/how-it-works"
            className="hidden md:inline-flex items-center rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-white transition"
          >
            How it works
          </Link>
          {/* GitHub icon — Neon-style "star us on GitHub" anchor. Single
              icon, no label, ranks below How-it-works in the visual
              hierarchy. Opens the repo in a new tab. */}
          <a
            href="https://github.com/alphoder/Dashhnew"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View source on GitHub"
            title="View source on GitHub"
            className="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-transparent text-zinc-400 hover:bg-white/5 hover:text-white transition"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 fill-current"
              role="img"
              aria-hidden="true"
            >
              <path d="M12 .297a12 12 0 0 0-3.792 23.39c.6.111.82-.261.82-.581 0-.287-.01-1.049-.016-2.058-3.34.726-4.043-1.61-4.043-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.085 1.838 1.236 1.838 1.236 1.07 1.835 2.81 1.305 3.495.998.108-.776.42-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.93 0-1.31.467-2.382 1.236-3.222-.124-.303-.535-1.524.117-3.176 0 0 1.008-.323 3.301 1.23a11.5 11.5 0 0 1 6.003 0c2.292-1.553 3.298-1.23 3.298-1.23.653 1.652.242 2.873.119 3.176.77.84 1.236 1.911 1.236 3.222 0 4.609-2.807 5.621-5.479 5.92.43.371.815 1.103.815 2.222 0 1.604-.014 2.896-.014 3.293 0 .322.216.697.825.578A12.003 12.003 0 0 0 12 .297z" />
            </svg>
          </a>
          <PrimaryCTA variant="ghost" />
          <NotificationBell wallet={walletAddress} />
          <ConnectPhantomWallet
            walletAddress={walletAddress}
            setWalletAddress={setWalletAddress}
          />
        </div>
      </div>

      {/* Mobile centre row (below) — RoleToggle only on app pages */}
      {inApp && (
        <div className="flex sm:hidden justify-center pb-3">
          <RoleToggle />
        </div>
      )}
    </nav>
  );
};

export default Header;
