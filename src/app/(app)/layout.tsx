import type { Metadata } from 'next';
import { AppSidebar } from '@/components/app-sidebar';
import { ModeTransition } from '@/components/motion/mode-transition';

export const metadata: Metadata = {
  title: 'Dashh — Dashboard',
};

export default function AppShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen text-white">
      <AppSidebar />
      <main className="md:pl-60">
        <div className="mx-auto max-w-7xl px-4 pb-20 pt-24 md:px-8 overflow-x-hidden">
          <ModeTransition>{children}</ModeTransition>
        </div>
      </main>
    </div>
  );
}
