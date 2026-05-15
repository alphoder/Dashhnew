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
