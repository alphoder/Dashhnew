"use client";
import React, { useEffect, useState } from "react";
import QRCode from "react-qr-code";
// NOTE: ReclaimProofRequest is dynamically imported inside the handler so that
// it never hits the SSR bundle. The SDK pulls in `pino` which requires
// `pino-pretty` as a transport — bundling it server-side breaks the build.
import CircularProgress from "@mui/material/CircularProgress";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { CheckCircle2, AlertTriangle, Loader2, Shield } from "lucide-react";

// Standard UUID v4 shape — used to gate the proof-submission flow so we don't
// fire requests for legacy v1 campaign IDs (which were not UUIDs).
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

// State machine for the DASHH-side submission step. Reclaim verifies the proof
// cryptographically; this state covers what happens AFTER, when we POST the
// proof to /api/v2/proofs and the 13-rule pipeline runs.
type SubmitState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "join"; views: number; deadline?: string }
  | { kind: "final"; views: number; amount: number; deferredToEnd: boolean; reason?: string }
  | { kind: "flagged"; reason: string }
  | { kind: "rejected"; reason: string }
  | { kind: "banned"; reason: string }
  | { kind: "error"; reason: string };

const Page = () => {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  // For routes coming from the Join modal, `uid` IS the participationId
  // (a UUID). Legacy routes may pass a v1 campaign id — we detect and skip
  // the DASHH-side submission in that case.
  const uid = (params?.uid as string) || "";
  const isParticipationUuid = UUID_REGEX.test(uid);

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
  const [submitState, setSubmitState] = useState<SubmitState>({ kind: "idle" });

  // When the user arrives here from the Join modal with ?platform=&campaignId=,
  // scroll the right platform button into view so the next step is obvious.
  useEffect(() => {
    if (preselectedPlatform) {
      const el = document.getElementById(`verify-btn-${preselectedPlatform}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [preselectedPlatform]);

  // POST the verified Reclaim proof to DASHH so the 13-rule pipeline runs,
  // the proof lands in proofs_v2, and the participation transitions out of
  // 'awaiting_join'. Without this, the rest of the settlement model has no
  // proofs to act on.
  async function submitProofToDashh(rawProof: unknown, platform: Platform) {
    if (!isParticipationUuid) {
      // No participation context — the proof verified cryptographically with
      // Reclaim but we have nowhere to store it inside DASHH. This happens
      // when the user lands here directly without going through Join.
      toast.info(
        "Verified with Reclaim, but no participation context — join a campaign first to record this against your wallet.",
      );
      return;
    }

    setSubmitState({ kind: "submitting" });

    // Reclaim returns either a single proof object or an array. Normalise.
    const proofArr = Array.isArray(rawProof) ? rawProof : [rawProof];
    const firstProof = proofArr[0] as any;
    const reclaimProofId =
      firstProof?.identifier ??
      firstProof?.claimData?.identifier ??
      firstProof?.taskId ??
      `${platform}-${Date.now()}`;

    try {
      const resp = await fetch("/api/v2/proofs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participationId: uid,
          reclaimProofId: String(reclaimProofId),
          rawProof: firstProof,
        }),
      });
      const data = await resp.json().catch(() => ({}));

      // 403 banned → terminal state
      if (resp.status === 403 && data?.banned) {
        setSubmitState({
          kind: "banned",
          reason:
            data?.verdict?.disqualificationReason ??
            data?.verdict?.reason ??
            "Your wallet has been banned from DASHH.",
        });
        toast.error("Your wallet has been banned");
        return;
      }

      // 400 / 409 with a verdict → disqualification or non-monotonic views
      if (!resp.ok) {
        const reason =
          data?.verdict?.disqualificationReason ??
          data?.verdict?.reason ??
          data?.refused ??
          data?.error ??
          "Proof was rejected by the verification pipeline.";
        setSubmitState({ kind: "rejected", reason: String(reason) });
        toast.error(`Proof rejected: ${reason}`);
        return;
      }

      // 2xx — happy path with classification (join / final / flagged)
      const verifiedViews =
        data?.proof?.verifiedViews ??
        data?.engagement?.views ??
        0;

      if (data?.kind === "join") {
        setSubmitState({
          kind: "join",
          views: verifiedViews,
          deadline: data?.payload?.deadline,
        });
        toast.success("Join proof recorded — content live, now wait for the final window.");
      } else if (data?.kind === "final") {
        setSubmitState({
          kind: "final",
          views: verifiedViews,
          amount: data?.payout?.amount ?? 0,
          deferredToEnd: !!data?.payout?.deferredToEnd,
          reason: data?.payout?.reason,
        });
        toast.success("Final proof verified — payout queued.");
      } else if (data?.verdict?.severity === "warn") {
        setSubmitState({
          kind: "flagged",
          reason:
            data?.verdict?.reason ?? "Proof flagged for community review.",
        });
        toast.info("Proof flagged for review.");
      } else {
        setSubmitState({ kind: "join", views: verifiedViews });
        toast.success("Proof recorded.");
      }

      // Auto-redirect to creator dashboard after 3s on success states.
      // Banned / rejected stays put so the user can read the reason.
      setTimeout(() => {
        router.push(`/creatordashboard?participation=${uid}&proof=verified`);
      }, 3000);
    } catch (err: any) {
      console.error("submitProofToDashh failed", err);
      setSubmitState({
        kind: "error",
        reason: err?.message ?? "Could not reach the DASHH server.",
      });
      toast.error("Could not submit to DASHH. Try again.");
    }
  }

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
        onSuccess: async (proofs) => {
          setQrState("success");
          setRes((proofs as any)?.claimData?.context ?? "Verified");
          toast.success(
            `${platform} verified with Reclaim. Submitting to DASHH…`,
          );
          // Fire-and-await: push the verified proof into DASHH so the
          // 13-rule pipeline runs, the proof is anchored to Arweave,
          // and the participation transitions to its next settlement state.
          await submitProofToDashh(proofs, platform);
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
        {qrState === "none" && submitState.kind === "idle" && (
          <p>No QR code to display yet.</p>
        )}
        {qrState === "loading" && <p>Loading QR code...</p>}
        {qrState === "success" && submitState.kind === "idle" && (
          <p>Success! {res}</p>
        )}
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

      {/* DASHH-side submission status — what happened after Reclaim verified */}
      {submitState.kind !== "idle" && (
        <div className="mx-auto mt-8 max-w-xl rounded-xl border bg-black/40 p-5 text-left">
          {submitState.kind === "submitting" && (
            <div className="flex items-center gap-3 text-zinc-200">
              <Loader2 className="h-5 w-5 animate-spin text-[#14F195]" />
              <div>
                <p className="text-sm font-semibold">
                  Verifying on DASHH server…
                </p>
                <p className="text-xs text-zinc-400">
                  Running the 13-rule disqualification pipeline and anchoring
                  the proof to Arweave.
                </p>
              </div>
            </div>
          )}

          {submitState.kind === "join" && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[#14F195]">
                <CheckCircle2 className="h-5 w-5" />
                <p className="text-sm font-semibold uppercase tracking-wider">
                  Join proof recorded
                </p>
              </div>
              <p className="text-base text-white">
                Baseline view count anchored:{" "}
                <span className="font-mono text-[#14F195]">
                  {submitState.views.toLocaleString()}
                </span>
              </p>
              <p className="text-xs text-zinc-400">
                Now go post the content on your platform. Come back inside the
                7-day window after the campaign ends to submit your Final
                proof.
                {submitState.deadline && (
                  <>
                    {" "}
                    Final-proof deadline:{" "}
                    <span className="text-white">
                      {new Date(submitState.deadline).toLocaleDateString()}
                    </span>
                  </>
                )}
              </p>
              <p className="text-xs text-zinc-500">
                Redirecting to your dashboard…
              </p>
            </div>
          )}

          {submitState.kind === "final" && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[#14F195]">
                <CheckCircle2 className="h-5 w-5" />
                <p className="text-sm font-semibold uppercase tracking-wider">
                  Final proof verified
                </p>
              </div>
              <p className="text-base text-white">
                Verified views:{" "}
                <span className="font-mono text-[#14F195]">
                  {submitState.views.toLocaleString()}
                </span>
              </p>
              {submitState.deferredToEnd ? (
                <p className="text-sm text-zinc-300">
                  This campaign uses a pool-based payout model. Your share is
                  reserved and pays out automatically when the campaign
                  settles.
                </p>
              ) : submitState.amount > 0 ? (
                <p className="text-sm text-zinc-300">
                  Payout queued:{" "}
                  <span className="font-semibold text-[#14F195]">
                    {submitState.amount.toFixed(4)} SOL
                  </span>
                </p>
              ) : (
                <p className="text-sm text-zinc-400">
                  {submitState.reason ?? "No additional payout for this proof."}
                </p>
              )}
              <p className="text-xs text-zinc-500">
                Redirecting to your dashboard…
              </p>
            </div>
          )}

          {submitState.kind === "flagged" && (
            <div className="space-y-2 border-amber-500/20">
              <div className="flex items-center gap-2 text-amber-400">
                <Shield className="h-5 w-5" />
                <p className="text-sm font-semibold uppercase tracking-wider">
                  Proof flagged for review
                </p>
              </div>
              <p className="text-sm text-zinc-300">{submitState.reason}</p>
              <p className="text-xs text-zinc-500">
                Your proof has been recorded but is held pending review. No
                strike has been counted.
              </p>
            </div>
          )}

          {submitState.kind === "rejected" && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="h-5 w-5" />
                <p className="text-sm font-semibold uppercase tracking-wider">
                  Proof rejected
                </p>
              </div>
              <p className="text-sm text-zinc-300">{submitState.reason}</p>
              <p className="text-xs text-zinc-500">
                A strike has been added to your wallet. Three strikes within
                90 days triggers a 90-day ban. See{" "}
                <Link
                  href="/terms#disqualification"
                  target="_blank"
                  className="text-[#14F195] underline"
                >
                  full disqualification rules
                </Link>
                .
              </p>
              <button
                onClick={() => setSubmitState({ kind: "idle" })}
                className="mt-2 rounded border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-200 hover:bg-white/10"
              >
                Try a different platform
              </button>
            </div>
          )}

          {submitState.kind === "banned" && (
            <div className="space-y-2 border-red-500/40">
              <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="h-5 w-5" />
                <p className="text-sm font-semibold uppercase tracking-wider">
                  Wallet banned
                </p>
              </div>
              <p className="text-sm text-zinc-300">{submitState.reason}</p>
              <p className="text-xs text-zinc-500">
                Your wallet has been banned from DASHH for 90 days per the
                3-strike policy. You can still browse Discover but cannot
                submit new proofs or join campaigns.
              </p>
            </div>
          )}

          {submitState.kind === "error" && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="h-5 w-5" />
                <p className="text-sm font-semibold uppercase tracking-wider">
                  Submission failed
                </p>
              </div>
              <p className="text-sm text-zinc-300">{submitState.reason}</p>
              <button
                onClick={() => setSubmitState({ kind: "idle" })}
                className="mt-2 rounded border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-200 hover:bg-white/10"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Page;
