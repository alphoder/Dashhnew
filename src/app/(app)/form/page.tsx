"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import axios from "axios";
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShieldHalved } from "@fortawesome/free-solid-svg-icons";
import { useMemo, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "react-toastify";
import Link from "next/link";
import { BackBar } from "@/components/back-bar";
import { CheckCircle2, FileSignature, Rocket } from "lucide-react";
import {
  TERMS_VERSION,
  PLATFORM_FEE_BPS,
  PLATFORM_FEE_PERCENT,
  buildTermsMessage,
} from "@/lib/terms";

export const dynamic = "force-dynamic";

type PaymentModel = "per_view" | "top_performer" | "split_top_n" | "equal_split";

const PAYMENT_OPTIONS: {
  id: PaymentModel;
  title: string;
  blurb: string;
}[] = [
  {
    id: "per_view",
    title: "Per verified view",
    blurb:
      "Each verified view pays cpv SOL up to the budget. The classic model.",
  },
  {
    id: "top_performer",
    title: "Winner takes all",
    blurb:
      "Creator with the most verified views at campaign end receives the full pool.",
  },
  {
    id: "split_top_n",
    title: "Split across top N",
    blurb:
      "Top N creators split the creator pool equally. Pick N below.",
  },
  {
    id: "equal_split",
    title: "Equal split (all verified)",
    blurb:
      "Every creator who submits a valid proof gets an equal share of the pool.",
  },
];

export default function CreatorForm() {
  const [url_data, seturl_data] = useState("");
  const [endDate, setEndDate] = useState<Date | null>(
    new Date(Date.now() + 14 * 86_400_000),
  );
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [content, setContent] = useState({
    title: "",
    description: "",
    label: "",
    amount: "",
    icons: "",
    end: "",
  });

  // Payment criteria
  const [paymentModel, setPaymentModel] = useState<PaymentModel>("per_view");
  const [topNCount, setTopNCount] = useState<number>(3);
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Content-match rules — what the creator's post MUST contain
  const [requiredHashtag, setRequiredHashtag] = useState("");
  const [requiredMention, setRequiredMention] = useState("");
  const [requiredPhrase, setRequiredPhrase] = useState("");

  const [formamount, setFormAmount] = useState(0);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  // ─────────── Derived fee math ───────────
  const budgetNumber = Number(content.amount) || 0;
  const platformFee = +(budgetNumber * (PLATFORM_FEE_BPS / 10_000)).toFixed(4);
  const creatorPool = +(budgetNumber - platformFee).toFixed(4);
  const modelReady = paymentModel !== "split_top_n" || topNCount >= 2;
  const canSubmit =
    acceptTerms &&
    modelReady &&
    budgetNumber > 0 &&
    content.title.trim().length > 2 &&
    !submitting;

  // Fund-on-chain transfer (same behaviour as v1 — direct transfer acting as
  // a stand-in for a future escrow program).
  async function sendTransaction(sender: string, amount: number) {
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
    const recipientAddress = new PublicKey(
      "8vbaCLhg1SZmiGNZfFzV2DEJHenFtdgg7G2JtY5v74i1",
    );
    const senderPublicKey = new PublicKey(sender);

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: senderPublicKey,
        toPubkey: recipientAddress,
        lamports: Math.round(amount * LAMPORTS_PER_SOL),
      }),
    );

    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = senderPublicKey;

    const { solana }: any = window;
    const signedTransaction = await solana.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(
      signedTransaction.serialize(),
    );
    await connection.confirmTransaction(signature);
    return signature;
  }

  // Ask Phantom to sign the terms message.
  async function signTerms(senderWallet: string) {
    const { solana }: any = window;
    if (!solana?.signMessage) {
      throw new Error("Phantom signMessage is not available");
    }
    const issuedAt = new Date().toISOString();
    const message = buildTermsMessage({
      brandWallet: senderWallet,
      budget: budgetNumber,
      paymentModel,
      topNCount: paymentModel === "split_top_n" ? topNCount : undefined,
      cpv: 0.1,
      issuedAt,
    });
    const encoded = new TextEncoder().encode(message);
    const { signature } = await solana.signMessage(encoded, "utf8");
    // signature is a Uint8Array — convert to base58-ish string via base64 for storage
    const sigB64 = btoa(String.fromCharCode(...signature));
    return { signature: sigB64, issuedAt };
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    if (typeof window === "undefined") return;
    setSubmitting(true);

    try {
      const { solana }: any = window;
      const response = await solana.connect();
      const wallet: string = response.publicKey.toString();
      setWalletAddress(wallet);

      // Step 1: Sign the terms
      toast.info("Please sign the terms in your wallet to continue…");
      const { signature, issuedAt } = await signTerms(wallet);
      toast.success("Terms signed");

      // Step 2: Post to the API (includes payment + signed terms)
      const formData = new FormData(e.target as HTMLFormElement);
      const payload = {
        solAdd: wallet,
        title: formData.get("title"),
        description: formData.get("description"),
        label: formData.get("label"),
        amount: formData.get("amount"),
        icons: formData.get("icons"),
        end: endDate ? endDate.toISOString() : new Date().toISOString(),
        // v2 payment-terms fields — /api/posts stores what it knows, ignores the rest
        paymentModel,
        topNCount: paymentModel === "split_top_n" ? topNCount : undefined,
        platformFeeBps: PLATFORM_FEE_BPS,
        termsVersion: TERMS_VERSION,
        termsSignature: signature,
        termsSignedAt: issuedAt,
        // Content-match markers
        requiredHashtag: requiredHashtag.trim() || undefined,
        requiredMention: requiredMention.trim() || undefined,
        requiredPhrase: requiredPhrase.trim() || undefined,
      };

      const res = await axios.post("/api/posts", payload, {
        headers: { "Content-Type": "application/json" },
      });

      if (res.data?.data?.id) {
        // Step 3: Fund the escrow (20% platform fee + 80% creator pool all
        // go to the same recipient for now; future escrow program will split)
        toast.info("Funding campaign escrow…");
        setFormAmount(Number(formData.get("amount")));
        await sendTransaction(wallet, budgetNumber);

        seturl_data(res.data.data.id);
        setOpen(true);
        toast.success("Campaign created");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? "Failed to create campaign");
    } finally {
      setSubmitting(false);
    }
  };

  const isValidURL = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <>
      {open ? (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Share your Blink</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center space-y-4">
              <Button
                className="mt-4 w-full bg-gradient-to-r from-[#9945FF] to-[#14F195] text-white hover:opacity-90"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `https://dial.to/?action=solana-action:https://blinks.knowflow.study/api/donate/${url_data}&cluster=devnet`,
                  );
                  toast.success("Link copied to clipboard");
                }}
              >
                Copy Blink URL
              </Button>
            </div>
            <DialogFooter>
              <div className="flex flex-col items-center space-y-3 opacity-70">
                <div className="flex space-x-2">
                  <Link
                    href={`https://twitter.com/intent/tweet?text=New%20DASHH%20campaign%20live%20-%20join%20it!&url=https://dial.to/?action=solana-action:https://blinks.knowflow.study/api/donate/${url_data}&cluster=devnet`}
                  >
                    <Button className="bg-[#1DA1F2] text-white">Share on X</Button>
                  </Link>
                  <Link
                    href={`https://discord.com/channels/@me?url=https://dial.to/?action=solana-action:https://blinks.knowflow.study/api/donate/${url_data}&cluster=devnet`}
                  >
                    <Button className="bg-indigo-500 text-white">Share on Discord</Button>
                  </Link>
                </div>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : (
        <div>
          <BackBar
            crumbs={[
              { label: "Studio", href: "/creatordashboard" },
              { label: "New campaign" },
            ]}
            backHref="/creatordashboard"
          />

          {/* Hero */}
          <div className="relative mb-8 overflow-hidden rounded-2xl border border-[#14F195]/30 bg-gradient-to-br from-[#14F195]/15 via-black to-black p-6 md:p-8">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#14F195] opacity-20 blur-3xl" />
            <div className="relative flex items-start gap-4">
              <div className="rounded-xl bg-[#14F195]/20 p-3 ring-1 ring-[#14F195]/40">
                <Rocket className="h-6 w-6 text-[#14F195]" />
              </div>
              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#14F195]">
                  Create mode
                </p>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                  Launch a new{" "}
                  <span className="bg-gradient-to-r from-[#14F195] to-[#9945FF] bg-clip-text text-transparent">
                    Blink
                  </span>
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-zinc-300">
                  Fill in campaign details, pick a payment model, sign the
                  terms and fund the escrow — all in one flow.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] items-start">
            {/* LEFT column — form cards */}
            <div className="space-y-6">
              {/* Campaign details card */}
              <div className="rounded-xl border border-white/10 bg-black/60 text-zinc-200 shadow-lg">
                <CardHeader className="p-5 border-b border-white/10">
                  <CardTitle className="text-lg md:text-xl font-semibold text-white">
                    Campaign details
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title" className="text-xs font-medium uppercase tracking-wide text-zinc-400">Title</Label>
                    <Input id="title" name="title" required placeholder="Brew & Bloom Winter Drop"
                      value={content.title}
                      onChange={(e) => setContent({ ...content, title: e.target.value })}
                      className="bg-black/60 border-white/10 text-white placeholder:text-zinc-500 focus:border-[#14F195] focus:ring-[#14F195]" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="icons" className="text-xs font-medium uppercase tracking-wide text-zinc-400">Image URL</Label>
                    <Input id="icons" name="icons" type="url" required placeholder="https://…"
                      value={content.icons}
                      onChange={(e) => setContent({ ...content, icons: e.target.value })}
                      className="bg-black/60 border-white/10 text-white placeholder:text-zinc-500 focus:border-[#14F195] focus:ring-[#14F195]" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description" className="text-xs font-medium uppercase tracking-wide text-zinc-400">Description</Label>
                    <Textarea id="description" name="description" required rows={3} placeholder="What should creators post?"
                      value={content.description}
                      onChange={(e) => setContent({ ...content, description: e.target.value })}
                      className="bg-black/60 border-white/10 text-white placeholder:text-zinc-500 focus:border-[#14F195] focus:ring-[#14F195]" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="label" className="text-xs font-medium uppercase tracking-wide text-zinc-400">CTA label</Label>
                      <Input id="label" name="label" required placeholder="Participate"
                        value={content.label}
                        onChange={(e) => setContent({ ...content, label: e.target.value })}
                        className="bg-black/60 border-white/10 text-white placeholder:text-zinc-500 focus:border-[#14F195] focus:ring-[#14F195]" />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-xs font-medium uppercase tracking-wide text-zinc-400">End date</Label>
                      <DatePicker
                        selected={endDate}
                        onChange={(date: Date | null) => setEndDate(date)}
                        className="w-full rounded-md bg-black/60 border border-white/10 text-white placeholder:text-zinc-500 focus:border-[#14F195] focus:ring-[#14F195] px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="amount" className="text-xs font-medium uppercase tracking-wide text-zinc-400">Budget (SOL)</Label>
                    <Input id="amount" name="amount" type="number" step="0.01" required placeholder="0.00"
                      value={content.amount}
                      onChange={(e) => setContent({ ...content, amount: e.target.value })}
                      className="bg-black/60 border-white/10 text-white placeholder:text-zinc-500 focus:border-[#14F195] focus:ring-[#14F195]" />
                  </div>
                </CardContent>
              </div>

              {/* Content-match card — what the creator's post MUST contain */}
              <div className="rounded-xl border border-white/10 bg-black/60 text-zinc-200 shadow-lg">
                <CardHeader className="p-5 border-b border-white/10">
                  <CardTitle className="text-lg md:text-xl font-semibold text-white">
                    Content-match rules
                  </CardTitle>
                  <p className="mt-1 text-xs text-zinc-400">
                    Optional but strongly recommended. If a post's caption
                    doesn't contain the required hashtag / mention / phrase, the
                    proof is rejected and the payout is voided — even if views
                    are real. This stops creators from posting unrelated
                    content and still claiming.
                  </p>
                </CardHeader>
                <CardContent className="p-5 grid gap-4 sm:grid-cols-3">
                  <div className="grid gap-2">
                    <Label htmlFor="requiredHashtag" className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                      Hashtag
                    </Label>
                    <Input
                      id="requiredHashtag"
                      placeholder="#brewandbloom"
                      value={requiredHashtag}
                      onChange={(e) => setRequiredHashtag(e.target.value)}
                      className="bg-black/60 border-white/10 text-white placeholder:text-zinc-500 focus:border-[#14F195] focus:ring-[#14F195]"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="requiredMention" className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                      Mention
                    </Label>
                    <Input
                      id="requiredMention"
                      placeholder="@brewandbloom"
                      value={requiredMention}
                      onChange={(e) => setRequiredMention(e.target.value)}
                      className="bg-black/60 border-white/10 text-white placeholder:text-zinc-500 focus:border-[#14F195] focus:ring-[#14F195]"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="requiredPhrase" className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                      Phrase
                    </Label>
                    <Input
                      id="requiredPhrase"
                      placeholder="try our oat milk latte"
                      value={requiredPhrase}
                      onChange={(e) => setRequiredPhrase(e.target.value)}
                      className="bg-black/60 border-white/10 text-white placeholder:text-zinc-500 focus:border-[#14F195] focus:ring-[#14F195]"
                    />
                  </div>
                </CardContent>
              </div>

              {/* Payment criteria card */}
              <div className="rounded-xl border border-white/10 bg-black/60 text-zinc-200 shadow-lg">
                <CardHeader className="p-5 border-b border-white/10">
                  <CardTitle className="text-lg md:text-xl font-semibold text-white">
                    How creators get paid
                  </CardTitle>
                  <p className="mt-1 text-xs text-zinc-400">
                    Choose one. DASHH's {PLATFORM_FEE_PERCENT}% platform fee is deducted from
                    the budget; the remaining {100 - PLATFORM_FEE_PERCENT}% becomes the creator pool.
                  </p>
                </CardHeader>
                <CardContent className="p-5 space-y-3">
                  {PAYMENT_OPTIONS.map((opt) => {
                    const active = paymentModel === opt.id;
                    return (
                      <button
                        type="button"
                        key={opt.id}
                        onClick={() => setPaymentModel(opt.id)}
                        className={`w-full rounded-lg border p-4 text-left transition ${
                          active
                            ? "border-[#14F195] bg-[#14F195]/10"
                            : "border-white/10 bg-black/40 hover:border-white/20"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-white">{opt.title}</p>
                            <p className="mt-1 text-sm text-zinc-400">{opt.blurb}</p>
                          </div>
                          {active && <CheckCircle2 className="h-5 w-5 text-[#14F195] flex-shrink-0" />}
                        </div>
                      </button>
                    );
                  })}

                  {paymentModel === "split_top_n" && (
                    <div className="grid gap-2 pt-2">
                      <Label htmlFor="topN" className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                        Split across how many creators?
                      </Label>
                      <Input
                        id="topN"
                        type="number"
                        min={2}
                        max={100}
                        value={topNCount}
                        onChange={(e) => setTopNCount(Number(e.target.value))}
                        className="bg-black/60 border-white/10 text-white placeholder:text-zinc-500 focus:border-[#14F195] focus:ring-[#14F195]"
                      />
                    </div>
                  )}
                </CardContent>
              </div>

              {/* Terms & signing card */}
              <div className="rounded-xl border border-white/10 bg-black/60 text-zinc-200 shadow-lg">
                <CardHeader className="p-5 border-b border-white/10">
                  <CardTitle className="text-lg md:text-xl font-semibold text-white flex items-center gap-2">
                    <FileSignature className="h-5 w-5 text-[#14F195]" /> Fee breakdown &amp; terms
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  {/* Fee math */}
                  <div className="rounded-lg bg-black/40 border border-white/10 p-4 text-sm grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-zinc-500">Budget</p>
                      <p className="mt-1 font-semibold text-white">
                        {budgetNumber ? `${budgetNumber} SOL` : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-zinc-500">
                        Platform ({PLATFORM_FEE_PERCENT}%)
                      </p>
                      <p className="mt-1 font-semibold text-[#9945FF]">
                        {budgetNumber ? `${platformFee} SOL` : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-zinc-500">Creator pool</p>
                      <p className="mt-1 font-semibold text-[#14F195]">
                        {budgetNumber ? `${creatorPool} SOL` : "—"}
                      </p>
                    </div>
                  </div>

                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      className="mt-1 h-4 w-4 accent-[#14F195]"
                    />
                    <span className="text-sm text-zinc-300">
                      I agree to the{" "}
                      <Link href="/terms" target="_blank" className="text-[#14F195] underline">
                        DASHH {TERMS_VERSION} Terms
                      </Link>
                      , including the {PLATFORM_FEE_PERCENT}% platform fee, and I will
                      sign this acknowledgement with my Phantom wallet on submit.
                    </span>
                  </label>

                  <Button
                    type="submit"
                    disabled={!canSubmit}
                    className="w-full bg-gradient-to-r from-[#14F195] to-[#9945FF] text-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                  >
                    {submitting ? "Signing & publishing…" : "Sign terms & launch campaign"}
                  </Button>
                </CardContent>
              </div>
            </div>

            {/* RIGHT column — Blink preview, sticky */}
            <aside className="lg:sticky lg:top-24 space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#14F195]">
                Live preview
              </p>
              <p className="text-sm text-zinc-400">
                How the Blink will render on Twitter, Discord and dial.to.
              </p>
              <div className="flex flex-col w-full bg-black border border-white/10 rounded-xl shadow-xl overflow-hidden p-4">
                <div className="relative h-48">
                  <div className="p-3 h-full relative">
                    <Image
                      src={
                        isValidURL(content.icons)
                          ? content.icons
                          : "https://t3.ftcdn.net/jpg/07/46/54/88/360_F_746548833_Cw1ZK4jF4S6SEg4yXQ3aQwv9cfIpJxBR.jpg"
                      }
                      alt="Blink preview"
                      fill
                      sizes="(max-width: 768px) 100vw, 350px"
                      className="rounded-md object-cover transition-transform duration-300 hover:scale-105"
                    />
                  </div>
                </div>
                <div className="text-zinc-500 flex gap-2 items-center mt-3">
                  <p className="text-[12px] font-semibold">blinks.knowflow.study</p>
                  <FontAwesomeIcon icon={faShieldHalved} size="sm" />
                </div>
                <h2 className="mt-2 text-lg font-semibold text-white">
                  {content.title || "Title"}
                </h2>
                <p className="text-sm text-zinc-300 mt-1 line-clamp-3">
                  {content.description || "Description"}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    toast.info(
                      "This is a preview. The live Blink will open a Solana transaction.",
                    )
                  }
                  className="mt-3 w-full rounded-lg bg-gradient-to-r from-[#9945FF] to-[#14F195] py-2.5 px-4 text-sm font-semibold text-black hover:opacity-90 transition"
                >
                  {content.label || "Participate"} {content.amount || "0.1"} SOL
                </button>
              </div>
            </aside>
          </form>
        </div>
      )}
    </>
  );
}
