import type { Metadata } from 'next';
import { DocsSidebar } from './_components/docs-sidebar';

export const metadata: Metadata = {
  title: { default: 'DASHH Docs', template: '%s · DASHH Docs' },
  description:
    'Documentation for DASHH — peer-to-peer, zkTLS-verified influencer marketing on Solana.',
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-6xl px-4 pb-24 pt-32 md:px-6">
      <div className="flex gap-10">
        <DocsSidebar />
        <article className="flex-1 max-w-3xl prose prose-invert text-zinc-300 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-white [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-white [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-zinc-100 [&_p]:my-3 [&_p]:leading-relaxed [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-1 [&_a]:text-[#14F195] [&_a]:underline [&_code]:rounded [&_code]:bg-white/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs [&_pre]:overflow-x-auto [&_pre]:rounded [&_pre]:bg-black/60 [&_pre]:p-4 [&_pre]:text-xs">
          {children}
        </article>
      </div>
    </main>
  );
}
