// Dynamic Open Graph image generator.
//
// /og returns a 1200×630 PNG that gets embedded as the share card on
// Twitter, Discord, WhatsApp, LinkedIn, etc. Next.js's edge runtime
// renders it with @vercel/og (Satori under the hood), so it stays fast
// without us hosting a static asset.

import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const titleOverride = searchParams.get('title');
  const subtitleOverride = searchParams.get('subtitle');

  const title = titleOverride ?? 'Brands paid $1.4B for fake views';
  const subtitle =
    subtitleOverride ??
    'DASHH makes that mathematically impossible — zkTLS-verified influencer marketing on Solana';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 100%)',
          padding: '80px',
          position: 'relative',
        }}
      >
        {/* Gradient accent ribbon */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 8,
            background: 'linear-gradient(90deg, #9945FF 0%, #14F195 100%)',
          }}
        />
        {/* Soft glow blobs */}
        <div
          style={{
            position: 'absolute',
            right: -200,
            top: -200,
            width: 600,
            height: 600,
            background: 'radial-gradient(circle, rgba(153,69,255,0.25) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: -200,
            bottom: -200,
            width: 600,
            height: 600,
            background: 'radial-gradient(circle, rgba(20,241,149,0.18) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />

        {/* Live badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: 'rgba(20, 241, 149, 0.12)',
            border: '1px solid rgba(20, 241, 149, 0.4)',
            color: '#14F195',
            padding: '8px 20px',
            borderRadius: 999,
            fontSize: 18,
            fontWeight: 600,
            marginBottom: 36,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              background: '#14F195',
              borderRadius: '50%',
            }}
          />
          Live on Solana · zkTLS-verified
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: 'white',
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
            display: 'flex',
            flexWrap: 'wrap',
            maxWidth: 1040,
          }}
        >
          {title}
        </div>

        {/* Subtitle */}
        <div
          style={{
            marginTop: 28,
            fontSize: 28,
            color: '#a1a1aa',
            lineHeight: 1.3,
            maxWidth: 980,
            display: 'flex',
            flexWrap: 'wrap',
          }}
        >
          {subtitle}
        </div>

        {/* Footer with brand wordmark */}
        <div
          style={{
            position: 'absolute',
            bottom: 60,
            left: 80,
            right: 80,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              fontSize: 44,
              fontWeight: 800,
              background:
                'linear-gradient(90deg, #9945FF 0%, #14F195 100%)',
              backgroundClip: 'text',
              color: 'transparent',
              letterSpacing: '-0.02em',
            }}
          >
            DASHH
          </div>
          <div
            style={{
              fontSize: 20,
              color: '#71717a',
              fontFamily: 'monospace',
            }}
          >
            dashhnew.vercel.app
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
