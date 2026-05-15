'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV: { section: string; items: { href: string; label: string }[] }[] = [
  {
    section: 'Getting started',
    items: [
      { href: '/docs', label: 'Overview' },
      { href: '/docs/getting-started/brands', label: 'For brands' },
      { href: '/docs/getting-started/creators', label: 'For creators' },
    ],
  },
  {
    section: 'Concepts',
    items: [
      { href: '/docs/concepts/two-proof', label: 'Two-proof model' },
      { href: '/docs/concepts/payment-models', label: 'Payment models' },
      { href: '/docs/concepts/disqualification', label: '13 disqualification rules' },
    ],
  },
  {
    section: 'API',
    items: [{ href: '/docs/api', label: 'REST endpoints' }],
  },
];

export function DocsSidebar() {
  const pathname = usePathname() ?? '';
  return (
    <aside className="hidden lg:block w-60 flex-shrink-0">
      <div className="sticky top-24 space-y-6">
        {NAV.map((section) => (
          <div key={section.section}>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
              {section.section}
            </p>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== '/docs' && pathname.startsWith(item.href));
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`block rounded px-2 py-1 text-sm transition ${
                        active
                          ? 'bg-[#14F195]/10 text-[#14F195]'
                          : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  );
}
