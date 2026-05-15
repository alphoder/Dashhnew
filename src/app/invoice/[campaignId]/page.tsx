// Print-friendly campaign invoice.
//
// Brands open /invoice/<campaignId> in a new tab, hit Cmd+P, and "Save as
// PDF" through the browser dialog. No server-side PDF library needed —
// the @media print CSS hides our chrome and renders a clean, A4-shaped
// document.
//
// This is a stand-in for proper GST invoicing (P4.3 full). It already
// includes a GST line item with a placeholder GSTIN that the team will
// replace once LLP formation completes.

import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import * as schema from '@/lib/db/schemas';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Invoice',
  robots: { index: false, follow: false },
};

const GST_RATE = 0.18; // 18% on platform-fee revenue
const PLATFORM_GSTIN =
  process.env.NEXT_PUBLIC_PLATFORM_GSTIN || '<GSTIN TBD — LLP pending>';
const PLATFORM_LEGAL_NAME =
  process.env.NEXT_PUBLIC_PLATFORM_LEGAL_NAME || 'DASHH (LLP pending)';
const PLATFORM_REGISTERED_ADDRESS =
  process.env.NEXT_PUBLIC_PLATFORM_ADDRESS ||
  'Indore, Madhya Pradesh, India';

function getDb() {
  return drizzle(neon(process.env.DATABASE_URL!), { schema });
}

async function loadCampaign(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const db = getDb();
  const [campaign] = await db
    .select()
    .from(schema.campaignsV2)
    .where(eq(schema.campaignsV2.id, id))
    .limit(1);
  return campaign ?? null;
}

export default async function InvoicePage({
  params,
}: {
  params: { campaignId: string };
}) {
  const campaign = await loadCampaign(params.campaignId);
  if (!campaign) notFound();

  // Money breakdown — all on devnet SOL today. When SOL→INR conversion
  // becomes relevant we'll snapshot the rate at settlement time.
  const platformFeeBps = campaign.platformFeeBps ?? 2000;
  const platformFeeSol = campaign.budget * (platformFeeBps / 10_000);
  const creatorPoolSol = campaign.budget - platformFeeSol;
  const gstOnFee = platformFeeSol * GST_RATE;

  const invoiceNumber = `DASHH-${campaign.id.slice(0, 8).toUpperCase()}`;
  const issueDate = campaign.createdAt
    ? new Date(campaign.createdAt)
    : new Date();

  return (
    <>
      <style>{`
        body > nav,
        body > header,
        body > div.fixed,
        body > div[role="dialog"],
        body > .Toastify,
        body > [data-radix-popper-content-wrapper] { display: none !important; }
        body { background: white !important; color: #111 !important; }
        @media print {
          body { padding: 0 !important; }
          .invoice-no-print { display: none !important; }
          .invoice-page { box-shadow: none !important; padding: 24px !important; }
        }
      `}</style>

      <div className="mx-auto my-8 max-w-3xl bg-white p-12 text-zinc-900 shadow-xl invoice-page">
        {/* No-print toolbar */}
        <div className="invoice-no-print mb-6 flex items-center justify-between rounded-md bg-zinc-100 p-3 text-xs text-zinc-700">
          <span>
            Press <kbd className="rounded border border-zinc-300 bg-white px-1.5 py-0.5">Cmd / Ctrl + P</kbd>,
            choose &ldquo;Save as PDF&rdquo;.
          </span>
          <Link
            href={`/discover?campaign=${campaign.id}`}
            className="text-[#9945FF] underline"
          >
            View campaign →
          </Link>
        </div>

        {/* Header */}
        <header className="mb-10 flex items-start justify-between border-b border-zinc-200 pb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Tax Invoice</h1>
            <p className="mt-1 text-xs text-zinc-500">
              Generated {new Date().toLocaleDateString()} ·{' '}
              {new Date().toLocaleTimeString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold tracking-tight">
              <span
                style={{
                  background: 'linear-gradient(90deg,#9945FF,#14F195)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                DASHH
              </span>
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-widest text-zinc-500">
              On-chain influencer marketing
            </p>
          </div>
        </header>

        {/* Issuer + customer panel */}
        <section className="mb-10 grid grid-cols-2 gap-8 text-sm">
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
              From
            </p>
            <p className="font-semibold">{PLATFORM_LEGAL_NAME}</p>
            <p className="text-xs text-zinc-600 whitespace-pre-line">
              {PLATFORM_REGISTERED_ADDRESS}
            </p>
            <p className="mt-1 text-xs text-zinc-600">
              GSTIN: {PLATFORM_GSTIN}
            </p>
          </div>
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
              To (Brand wallet)
            </p>
            <p className="font-mono text-xs break-all">
              {campaign.brandWallet}
            </p>
            <p className="mt-1 text-xs text-zinc-600">
              Solana wallet identifier
            </p>
          </div>
        </section>

        {/* Invoice meta */}
        <section className="mb-8 grid grid-cols-3 gap-4 rounded-md bg-zinc-50 p-4 text-sm">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500">
              Invoice #
            </p>
            <p className="mt-1 font-mono">{invoiceNumber}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500">
              Issue date
            </p>
            <p className="mt-1">{issueDate.toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500">
              Campaign
            </p>
            <p className="mt-1 truncate" title={campaign.title}>
              {campaign.title}
            </p>
          </div>
        </section>

        {/* Line items */}
        <section className="mb-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-300">
                <th className="py-2 text-left text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                  Description
                </th>
                <th className="py-2 text-right text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                  SAC
                </th>
                <th className="py-2 text-right text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-zinc-200">
                <td className="py-3">
                  <p className="font-medium">
                    DASHH platform fee — campaign{' '}
                    <span className="font-mono text-xs">
                      {campaign.id.slice(0, 8)}…
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {platformFeeBps / 100}% of {campaign.budget.toFixed(4)}{' '}
                    SOL escrow
                  </p>
                </td>
                <td className="py-3 text-right text-xs text-zinc-500">
                  998361
                </td>
                <td className="py-3 text-right font-mono">
                  {platformFeeSol.toFixed(6)} SOL
                </td>
              </tr>
              <tr className="border-b border-zinc-200">
                <td className="py-3 text-zinc-600">
                  CGST + SGST @ 18% on platform fee
                </td>
                <td className="py-3 text-right text-xs text-zinc-500">—</td>
                <td className="py-3 text-right font-mono">
                  {gstOnFee.toFixed(6)} SOL
                </td>
              </tr>
              <tr>
                <td className="pt-4 text-right font-semibold" colSpan={2}>
                  Total payable to DASHH
                </td>
                <td className="pt-4 text-right font-mono font-semibold">
                  {(platformFeeSol + gstOnFee).toFixed(6)} SOL
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Settlement detail (informational) */}
        <section className="mb-8 rounded-md border border-zinc-200 bg-zinc-50 p-4 text-xs text-zinc-600">
          <p className="mb-1 font-semibold text-zinc-700">
            Settlement breakdown
          </p>
          <ul className="space-y-1">
            <li>
              Total escrow funded:{' '}
              <span className="font-mono">
                {campaign.budget.toFixed(6)} SOL
              </span>
            </li>
            <li>
              Creator pool (released to creators per payment model):{' '}
              <span className="font-mono">
                {creatorPoolSol.toFixed(6)} SOL
              </span>
            </li>
            <li>
              Platform fee retained by DASHH:{' '}
              <span className="font-mono">
                {platformFeeSol.toFixed(6)} SOL
              </span>
            </li>
          </ul>
        </section>

        {/* Footer */}
        <footer className="border-t border-zinc-200 pt-4 text-[10px] text-zinc-500">
          <p>
            All amounts are in SOL on the Solana blockchain. SOL → INR
            conversion is recorded at settlement time when applicable.
          </p>
          <p className="mt-1">
            This invoice is auto-generated. Questions: open an issue at
            https://github.com/alphoder/Dashhnew/issues
          </p>
        </footer>
      </div>
    </>
  );
}
