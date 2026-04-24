"use client";
import React, { useEffect, useState } from "react";
import QRCode from "react-qr-code";
// NOTE: ReclaimProofRequest is dynamically imported inside the handler so that
// it never hits the SSR bundle. The SDK pulls in `pino` which requires
// `pino-pretty` as a transport — bundling it server-side breaks the build.
import CircularProgress from "@mui/material/CircularProgress";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "react-toastify";

const APP_ID = process.env.NEXT_PUBLIC_RECLAIM_APP_ID || "0x896b97E0915ae00C61D8bb88b9f6A76d273cfE76";
const APP_SECRET = process.env.NEXT_PUBLIC_RECLAIM_APP_SECRET || "0xa24f2911de618188e78d5981f62a3bba7497bc87b1e1789bac933ec614ca11a8";
const PROVIDER_INSTAGRAM =
  process.env.NEXT_PUBLIC_RECLAIM_PROVIDER_ID_INSTAGRAM ||
  process.env.NEXT_PUBLIC_RECLAIM_PROVIDER_ID ||
  "d18dcace-d59b-4432-b77e-655b7248334d";
const PROVIDER_TWITTER = process.env.NEXT_PUBLIC_RECLAIM_PROVIDER_ID_TWITTER || "";
const PROVIDER_YOUTUBE = process.env.NEXT_PUBLIC_RECLAIM_PROVIDER_ID_YOUTUBE || "";
const PROVIDER_TIKTOK = process.env.NEXT_PUBLIC_RECLAIM_PROVIDER_ID_TIKTOK || "";

type Platform = "instagram" | "twitter" | "youtube" | "tiktok";

const PROVIDER_MAP: Record<Platform, string> = {
  instagram: PROVIDER_INSTAGRAM,
  twitter: PROVIDER_TWITTER,
  youtube: PROVIDER_YOUTUBE,
  tiktok: PROVIDER_TIKTOK,
};

const Page = () => {
  const searchParams = useSearchParams();
  const preselectedPlatform = searchParams?.get("platform") as Platform | null;
  const campaignIdParam = searchParams?.get("campaignId");

  const [res, setRes] = useState("");
  const [activePlatform, setActivePlatform] = useState<Platform | null>(
    preselectedPlatform &&
      ["instagram", "twitter", "youtube", "tiktok"].includes(preselectedPlatform)
      ? preselectedPlatform
      : null,
  );
  const [qrState, setQrState] = useState<
    "none" | "loading" | "waiting" | "success"
  >("none");
  const [qrUrl, setQrUrl] = useState("");

  // When the user arrives here from the Join modal with ?platform=&campaignId=,
  // scroll the right platform button into view so the next step is obvious.
  useEffect(() => {
    if (preselectedPlatform) {
      const el = document.getElementById(`verify-btn-${preselectedPlatform}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [preselectedPlatform]);

  const verifyOnReclaim = async (platform: Platform) => {
    const providerId = PROVIDER_MAP[platform];
    if (!providerId) {
      toast.error(`${platform} verification is not configured yet.`);
      return;
    }
    setActivePlatform(platform);
    setQrState("loading");
    try {
      // Dynamic import so the SDK never lands in the SSR bundle.
      const { ReclaimProofRequest } = await import("@reclaimprotocol/js-sdk");
      const reclaimProofRequest = await ReclaimProofRequest.init(
        APP_ID,
        APP_SECRET,
        providerId,
      );
      const requestUrl = await reclaimProofRequest.getRequestUrl();
      if (requestUrl) {
        setQrUrl(requestUrl);
        setQrState("waiting");
      }
      await reclaimProofRequest.startSession({
        onSuccess: (proofs) => {
          setQrState("success");
          setRes((proofs as any)?.claimData?.context ?? "Verified");
          toast.success(`${platform} verification successful!`);
        },
        onError: (error) => {
          console.error("Verification failed", error);
          toast.error("Verification failed. Please try again.");
          setQrState("none");
        },
      });
    } catch (err) {
      console.error(err);
      toast.error("Could not start verification.");
      setQrState("none");
    }
  };

  const buttons: { platform: Platform; label: string; className: string }[] = [
    {
      platform: "instagram",
      label: "Verify Instagram Story Views",
      className:
        "w-80 mb-4 bg-gradient-to-r from-[#9945FF] to-[#14F195] text-white py-2.5 px-5 rounded cursor-pointer disabled:opacity-60",
    },
    {
      platform: "twitter",
      label: "Verify Tweets Insights",
      className:
        "w-80 mb-4 bg-[#1DA1F2] text-white py-2.5 px-5 rounded cursor-pointer disabled:opacity-60",
    },
    {
      platform: "youtube",
      label: "Verify YouTube Views",
      className:
        "w-80 mb-4 bg-[#FF0000] text-white py-2.5 px-5 rounded cursor-pointer disabled:opacity-60",
    },
    {
      platform: "tiktok",
      label: "Verify TikTok Views",
      className:
        "w-80 mb-4 bg-black border border-white text-white py-2.5 px-5 rounded cursor-pointer disabled:opacity-60",
    },
  ];

  return (
    <div
      style={{ textAlign: "center", padding: "20px" }}
      className="mt-40 text-white"
    >
      {campaignIdParam && (
        <div className="mx-auto mb-6 max-w-xl flex items-center justify-center gap-3 text-xs text-zinc-400">
          <Link href="/discover" className="text-[#14F195] hover:underline">
            \u2190 Back to Discover
          </Link>
          <span className="text-zinc-600">\u00B7</span>
          <span>Submitting proof for campaign</span>
          <code className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-zinc-300">
            {campaignIdParam.slice(0, 8)}\u2026
          </code>
        </div>
      )}

      <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Verify your engagement</h1>
      <p className="mt-2 text-sm text-zinc-400 max-w-md mx-auto">
        {preselectedPlatform
          ? `You\u2019re about to verify a ${preselectedPlatform} post. Scan the QR with your phone and log in through the Reclaim flow.`
          : "Pick a platform. We'll generate a zkTLS proof via Reclaim."}
      </p>

      <div className="mx-auto mt-5 max-w-xl rounded-xl border border-[#14F195]/20 bg-[#14F195]/5 p-4 text-left text-xs text-zinc-300">
        <p className="font-semibold text-[#14F195] uppercase tracking-widest text-[11px] mb-1.5">
          Resubmissions
        </p>
        <p>
          Each proof is a <span className="text-white font-medium">point-in-time snapshot</span> of
          your view count. As your post gathers more views, come back and verify again —
          you'll be paid on the <span className="text-white font-medium">delta</span> (new views
          since the last proof), never double-counted. Running with
          <span className="text-white font-medium"> Per-verified-view</span> pays each submission;
          <span className="text-white font-medium"> Winner-takes-all / Split-Top-N / Equal-split</span>
          {' '}record proofs now and settle payouts at campaign end.
        </p>
      </div>

      <div
        className="flex flex-col justify-center items-center"
        style={{ margin: "20px 0" }}
      >
        {buttons.map((b) => {
          const highlighted = preselectedPlatform === b.platform;
          return (
            <button
              key={b.platform}
              id={`verify-btn-${b.platform}`}
              onClick={() => verifyOnReclaim(b.platform)}
              disabled={qrState === "loading" || qrState === "waiting"}
              className={`${b.className} ${highlighted ? "ring-2 ring-[#14F195] ring-offset-2 ring-offset-black scale-[1.02]" : ""}`}
            >
              {qrState !== "none" && activePlatform === b.platform
                ? "Processing\u2026"
                : highlighted
                  ? `\u2192 ${b.label}`
                  : b.label}
            </button>
          );
        })}
      </div>

      <div
        className="text-white flex justify-center items-center"
        style={{ marginTop: "30px" }}
      >
        {qrState === "none" && <p>No QR code to display yet.</p>}
        {qrState === "loading" && <p>Loading QR code...</p>}
        {qrState === "success" && <p>Success! {res}</p>}
        {qrState === "waiting" && (
          <div className="flex flex-col items-center justify-center">
            <div className="bg-white p-4 rounded-lg">
              <QRCode value={qrUrl} />
            </div>
            <div className="mt-2 flex gap-2 justify-center items-center">
              <React.Fragment>
                <svg width={0} height={0}>
                  <defs>
                    <linearGradient
                      id="my_gradient"
                      x1="0%"
                      y1="0%"
                      x2="0%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#FF999E" />
                      <stop offset="100%" stopColor="#AE56F1" />
                    </linearGradient>
                  </defs>
                </svg>
                <CircularProgress
                  thickness={5}
                  sx={{ "svg circle": { stroke: "url(#my_gradient)" } }}
                />
              </React.Fragment>
              <p>Waiting for Proofs!</p>
            </div>
            <p className="mt-2">
              Scan this QR or click
              <Link
                className="underline bg-gradient-to-r from-[#9945FF] to-[#14F195] bg-clip-text text-transparent"
                href={qrUrl}
              >
                {" "}
                here
              </Link>{" "}
              to verify
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;
