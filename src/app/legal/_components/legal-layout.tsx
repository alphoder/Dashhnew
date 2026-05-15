// Shared chrome for the /legal/* pages. Keeps typography + spacing
// consistent without us repeating Tailwind classes on every page.

import type { ReactNode } from 'react';

export function LegalLayout({
  title,
  effectiveDate,
  children,
}: {
  title: string;
  effectiveDate: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto max-w-3xl px-4 pb-24 pt-32 text-zinc-300 md:px-6">
      <div className="mb-10 border-b border-white/10 pb-6">
        <p className="text-xs uppercase tracking-widest text-[#14F195]">
          Legal
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white md:text-4xl">
          {title}
        </h1>
        <p className="mt-2 text-xs text-zinc-500">
          Effective {effectiveDate} · Last updated {effectiveDate}
        </p>
      </div>

      <article className="prose prose-invert max-w-none space-y-6 text-sm leading-relaxed [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-white [&_h3]:mt-4 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-zinc-100 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-1 [&_p]:my-3 [&_a]:text-[#14F195] [&_a]:underline">
        {children}
      </article>
    </main>
  );
}
