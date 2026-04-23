'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Wallet, UserCircle, Sparkles, ArrowRight } from 'lucide-react';

type Role = 'brand' | 'creator';
type Platform = 'instagram' | 'youtube' | 'twitter' | 'tiktok';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<Role | null>(null);
  const [wallet, setWallet] = useState<string | null>(null);
  const [platform, setPlatform] = useState<Platform>('instagram');
  const [isConnecting, setIsConnecting] = useState(false);

  async function connectPhantom() {
    setIsConnecting(true);
    try {
      if (typeof window === 'undefined') return;
      const { solana }: any = window;
      if (!solana?.isPhantom) {
        toast.info('Install Phantom to continue', {
          onClick: () => window.open('https://phantom.app/', '_blank'),
        });
        return;
      }
      const resp = await solana.connect();
      const addr = resp.publicKey.toString();
      setWallet(addr);
      window.localStorage.setItem('dashh_wallet', addr);
      if (role) window.localStorage.setItem('dashh_role', role);
      toast.success('Wallet connected');
      setStep(3);
    } catch (e) {
      console.error(e);
      toast.error('Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  }

  function finish() {
    if (role) {
      window.localStorage.setItem('dashh_role', role);
      // Also set the header-toggle mode so the right pill is active next time
      window.localStorage.setItem('dashh_mode', role === 'brand' ? 'create' : 'explore');
    }
    window.localStorage.setItem('dashh_onboarded', 'true');
    window.localStorage.setItem('dashh_platform', platform);
    toast.success("You're all set!");
    // Brands land in Create mode to manage campaigns,
    // creators land in Explore mode to browse and join.
    router.push(role === 'brand' ? '/creatordashboard' : '/dashboard');
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white">Welcome to DASHH</h1>
        <p className="mt-2 text-zinc-400">Four quick steps to get you started.</p>
      </div>

      {/* Stepper */}
      <div className="mb-10 flex items-center gap-2">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="flex flex-1 items-center gap-2">
            <div
              className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                n < step
                  ? 'bg-gradient-to-r from-[#9945FF] to-[#14F195] text-white'
                  : n === step
                    ? 'bg-white text-black'
                    : 'bg-white/10 text-zinc-400'
              }`}
            >
              {n < step ? <Check className="h-4 w-4" /> : n}
            </div>
            {n < 4 && (
              <div className={`h-px flex-1 ${n < step ? 'bg-white/60' : 'bg-white/10'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Role */}
      {step === 1 && (
        <Card className="border-white/10 bg-black/60 text-white">
          <CardHeader>
            <CardTitle>Step 1 — Who are you?</CardTitle>
            <CardDescription className="text-zinc-400">
              Pick the role that fits you best. You can switch later.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {(
              [
                {
                  id: 'brand' as Role,
                  title: 'Brand',
                  desc: 'Launch campaigns and pay for verified engagement.',
                  icon: Sparkles,
                },
                {
                  id: 'creator' as Role,
                  title: 'Creator',
                  desc: 'Join campaigns and earn for real views.',
                  icon: UserCircle,
                },
              ]
            ).map((opt) => {
              const Icon = opt.icon;
              const selected = role === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setRole(opt.id)}
                  className={`rounded-xl border p-5 text-left transition-all ${
                    selected
                      ? 'border-transparent bg-gradient-to-br from-[#9945FF]/30 to-[#14F195]/30 ring-2 ring-[#14F195]'
                      : 'border-white/10 bg-black/40 hover:border-white/20'
                  }`}
                >
                  <Icon className="mb-3 h-6 w-6 text-[#14F195]" />
                  <p className="font-semibold">{opt.title}</p>
                  <p className="mt-1 text-sm text-zinc-400">{opt.desc}</p>
                </button>
              );
            })}
            <div className="sm:col-span-2 mt-2 flex justify-end">
              <Button
                disabled={!role}
                onClick={() => setStep(2)}
                className="bg-gradient-to-r from-[#9945FF] to-[#14F195] text-white"
              >
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Wallet */}
      {step === 2 && (
        <Card className="border-white/10 bg-black/60 text-white">
          <CardHeader>
            <CardTitle>Step 2 — Connect your wallet</CardTitle>
            <CardDescription className="text-zinc-400">
              DASHH uses Phantom on Solana. No passwords, no email.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={connectPhantom}
              disabled={isConnecting}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
            >
              <Wallet className="mr-2 h-4 w-4" />
              {isConnecting ? 'Connecting…' : 'Connect Phantom'}
            </Button>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(1)} className="text-zinc-400">
                Back
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Verify / Platform pick */}
      {step === 3 && (
        <Card className="border-white/10 bg-black/60 text-white">
          <CardHeader>
            <CardTitle>Step 3 — Pick your platform</CardTitle>
            <CardDescription className="text-zinc-400">
              {role === 'brand'
                ? 'Where do you want engagement verified for your campaigns?'
                : 'Which platform do you create on?'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  { id: 'instagram' as Platform, label: 'Instagram' },
                  { id: 'youtube' as Platform, label: 'YouTube' },
                  { id: 'twitter' as Platform, label: 'X / Twitter' },
                  { id: 'tiktok' as Platform, label: 'TikTok' },
                ]
              ).map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPlatform(p.id)}
                  className={`rounded-lg border px-4 py-3 text-sm transition ${
                    platform === p.id
                      ? 'border-[#14F195] bg-[#14F195]/10 text-white'
                      : 'border-white/10 bg-black/40 text-zinc-300 hover:border-white/20'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <p className="rounded-md bg-white/5 p-3 text-xs text-zinc-400">
              Wallet: <span className="font-mono text-zinc-200">{wallet}</span>
            </p>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(2)} className="text-zinc-400">
                Back
              </Button>
              <Button
                onClick={() => setStep(4)}
                className="bg-gradient-to-r from-[#9945FF] to-[#14F195] text-white"
              >
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Done */}
      {step === 4 && (
        <Card className="border-white/10 bg-black/60 text-white">
          <CardHeader>
            <CardTitle>Step 4 — You're all set</CardTitle>
            <CardDescription className="text-zinc-400">
              {role === 'brand'
                ? 'Create your first campaign and start paying for real engagement.'
                : 'Browse the discovery feed and start earning.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-sm text-zinc-300">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-400" /> Role: <b>{role}</b>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-400" /> Wallet connected
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-400" /> Platform: <b>{platform}</b>
              </li>
            </ul>
            <div className="flex gap-2">
              <Button
                onClick={finish}
                className="flex-1 bg-gradient-to-r from-[#9945FF] to-[#14F195] text-white"
              >
                Enter DASHH
              </Button>
              <Link
                href="/discover"
                className="flex-1 rounded-md border border-white/10 py-2.5 text-center text-sm text-zinc-300 hover:bg-white/5"
              >
                Skip to Discover
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
