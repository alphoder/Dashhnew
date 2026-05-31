'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, LogOut, Check } from 'lucide-react';
import { isDemoMode } from '@/lib/demo-mode';

interface ConnectPhantomWalletProps {
  walletAddress: string | null;
  setWalletAddress: (address: string | null) => void;
}

/**
 * Phantom wallet connect button.
 *
 * The original implementation only called `window.solana.isConnected` on
 * mount — but Phantom doesn't auto-connect on a fresh page load. The user
 * approved the site once, and Phantom remembers, but the page has to ASK
 * via `solana.connect({ onlyIfTrusted: true })` to silently re-establish
 * the connection. Without that, every navigation looked like a
 * disconnect.
 *
 * This version:
 *   1. Hydrates from localStorage immediately so the UI doesn't flicker.
 *   2. Calls `connect({ onlyIfTrusted: true })` on mount — if Phantom
 *      previously approved this site, it silently reconnects with no
 *      popup. If not, it rejects and we show the Connect button.
 *   3. Listens for Phantom's `connect`, `disconnect`, and `accountChanged`
 *      events to keep state in sync across tabs.
 */
export default function ConnectPhantomWallet({
  walletAddress,
  setWalletAddress,
}: ConnectPhantomWalletProps) {
  const [isClient, setIsClient] = useState(false);
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const isConnected = !!walletAddress;

  async function copyAddress() {
    if (!walletAddress) return;
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard API can fail in iframes — ignore */
    }
  }

  // Hydrate from localStorage + try a silent reconnect
  useEffect(() => {
    setIsClient(true);
    if (typeof window === 'undefined') return;

    // Skip silent reconnect check if in demo mode to prevent
    // Phantom extension from clearing the fake demo wallet.
    if (isDemoMode()) return;

    const { solana } = window as any;

    // 1. Optimistic hydrate — if localStorage has a wallet, trust it
    //    until the silent-reconnect attempt either confirms or denies.
    const stored = window.localStorage.getItem('dashh_wallet');
    if (stored && !walletAddress) {
      setWalletAddress(stored);
    }

    if (!solana?.isPhantom && !solana?.isMobile) return;

    // 2. Silent reconnect — only triggers a popup if the user has NEVER
    //    approved this site. If they have, Phantom returns the public
    //    key without any UI prompt.
    solana
      .connect({ onlyIfTrusted: true })
      .then((res: any) => {
        const pk = res?.publicKey?.toString();
        if (pk) setWalletAddress(pk);
      })
      .catch(() => {
        // User has never trusted this site, or revoked. Clear the stale
        // localStorage entry so we don't keep "remembering" a wallet that
        // Phantom no longer authorises.
        if (stored && !solana.isConnected) {
          window.localStorage.removeItem('dashh_wallet');
          setWalletAddress(null);
        }
      });

    // 3. Real-time sync — Phantom emits events when the user changes
    //    wallets in the extension UI or disconnects from outside our app.
    const onConnect = (publicKey: any) => {
      const pk = publicKey?.toString();
      if (pk) setWalletAddress(pk);
    };
    const onDisconnect = () => {
      setWalletAddress(null);
      window.localStorage.removeItem('dashh_wallet');
    };
    const onAccountChanged = (publicKey: any) => {
      if (publicKey) setWalletAddress(publicKey.toString());
      else {
        setWalletAddress(null);
        window.localStorage.removeItem('dashh_wallet');
      }
    };

    solana.on?.('connect', onConnect);
    solana.on?.('disconnect', onDisconnect);
    solana.on?.('accountChanged', onAccountChanged);
    return () => {
      // Phantom's event emitter API uses `off` (matches EventEmitter v3).
      try {
        solana.off?.('connect', onConnect);
        solana.off?.('disconnect', onDisconnect);
        solana.off?.('accountChanged', onAccountChanged);
      } catch {
        /* ignore */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isPhantomInstalled = () => {
    return (
      typeof window !== 'undefined' &&
      (window as any).solana &&
      ((window as any).solana.isPhantom || (window as any).solana.isMobile)
    );
  };

  const connectPhantomWallet = async () => {
    if (!isPhantomInstalled()) {
      alert('Phantom Wallet not installed. Please install it.');
      return;
    }
    try {
      const { solana } = window as any;
      const response = await solana.connect();
      setWalletAddress(response.publicKey.toString());
    } catch (error) {
      console.error('Error connecting to Phantom wallet:', error);
    }
  };

  const disconnect = async () => {
    if (!isPhantomInstalled()) return;
    try {
      const { solana } = window as any;
      await solana.disconnect();
      setWalletAddress(null);
      window.localStorage.removeItem('dashh_wallet');
    } catch (error) {
      console.error('Error disconnecting from Phantom wallet:', error);
    }
  };

  return (
    <main className="font-mono">
      {isClient && !isConnected ? (
        <button
          onClick={connectPhantomWallet}
          className="relative overflow-hidden rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2 text-white shadow-lg transition-all duration-300 ease-in-out hover:scale-105 hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 w-full"
        >
          Connect Wallet
          <div className="absolute inset-0 -translate-x-full animate-slide bg-gradient-to-r from-transparent via-white to-transparent opacity-50"></div>
          <style jsx>{`
            @keyframes slide {
              0% {
                transform: translateX(-100%);
              }
              100% {
                transform: translateX(100%);
              }
            }
            .animate-slide {
              animation: slide 2s infinite;
            }
          `}</style>
        </button>
      ) : isClient ? (
        <div className="inline-flex items-stretch overflow-hidden rounded-lg border border-white/10 bg-black/40 text-sm">
          {/* Address pill — clicking copies the full address. */}
          <button
            type="button"
            onClick={copyAddress}
            title={
              copied
                ? 'Copied!'
                : `Click to copy · ${walletAddress ?? ''}`
            }
            className="flex items-center gap-1.5 px-3 py-2 font-mono text-xs text-white hover:bg-white/5"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-[#14F195]" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-zinc-400" />
            )}
            {walletAddress
              ? `${walletAddress.slice(0, 4)}…${walletAddress.slice(-4)}`
              : ''}
          </button>
          {/* Dedicated disconnect button — distinct so it's obvious how to leave. */}
          <button
            type="button"
            onClick={() => {
              disconnect();
              router.push('/');
            }}
            title="Disconnect wallet"
            aria-label="Disconnect wallet"
            className="border-l border-white/10 px-3 text-zinc-400 hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      ) : null}
    </main>
  );
}
