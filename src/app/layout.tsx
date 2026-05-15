import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/header";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { DemoBanner } from "@/components/demo-banner";

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://dashhnew.vercel.app";
const SITE_NAME = "DASHH";
const SITE_TAGLINE =
  "Peer-to-peer, zkTLS-verified influencer marketing on Solana";
const SITE_DESCRIPTION =
  "Brands paid $1.4B for fake influencer views in 2025. DASHH makes that mathematically impossible — escrow on Solana, cryptographic view verification via Reclaim zkTLS, automatic settlement. No middlemen, no admins, no fake views.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "Solana",
    "Reclaim Protocol",
    "zkTLS",
    "influencer marketing",
    "ad fraud",
    "Web3",
    "blockchain advertising",
    "creator economy",
    "verified views",
    "DASHH",
  ],
  authors: [{ name: "DASHH team" }],
  creator: "DASHH team",
  category: "Decentralized Advertising",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: `${SITE_URL}/og`,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — verified influencer marketing on Solana`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    images: [`${SITE_URL}/og`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="fixed left-0 top-0 -z-10 h-full w-full">
          <div className="relative h-full w-full bg-black">
            <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
            </div>
            <div className="absolute right-[-25%] top-[-40%] h-[1000px] w-[1000px] rounded-full bg-[radial-gradient(circle_400px_at_50%_300px,#fbfbfb36,#000)]">
            </div>
            <div className="absolute left-[-25%] bottom-[-95%] h-[1000px] w-[1000px] rounded-full bg-[radial-gradient(circle_400px_at_50%_400px,#fbfbfb36,#000)]">
            </div>
          </div>
        </div>
        <DemoBanner />
        <Header /><ToastContainer />
        {children}
      </body>
    </html>
  );
}
