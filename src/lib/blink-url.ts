/**
 * Blink URL builder — deployment-agnostic.
 *
 * The old v1 deployment lived at blinks.knowflow.study and every Blink URL
 * on the client was hardcoded to that domain. That hostname is no longer
 * owned by this project, so every campaign created against the new
 * dashhnew.vercel.app deployment produced a Blink that Dial.to could not
 * resolve — the user saw a blank Blink card.
 *
 * This helper picks the right origin at render time, with this priority:
 *
 *   1. NEXT_PUBLIC_APP_URL              — the canonical, signed-terms URL
 *   2. window.location.origin           — whatever tab the brand is using
 *   3. https://dashhnew.vercel.app      — final safety net
 *
 * Using it everywhere means the Blink URL automatically follows the current
 * deployment — preview builds, production, localhost — without touching
 * hardcoded strings ever again.
 */

const FALLBACK_ORIGIN = "https://dashhnew.vercel.app";

export function appOrigin(): string {
  const envOrigin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (envOrigin) return envOrigin;
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return FALLBACK_ORIGIN;
}

/** The raw Solana Action endpoint Dial.to / the wallet will POST back to. */
export function actionEndpoint(campaignId: string): string {
  return `${appOrigin()}/api/donate/${campaignId}`;
}

/** The user-facing Dial.to URL that renders the Blink card. */
export function dialtoBlinkUrl(
  campaignId: string,
  cluster: "devnet" | "mainnet-beta" = "devnet",
): string {
  const action = encodeURI(actionEndpoint(campaignId));
  return `https://dial.to/?action=solana-action:${action}&cluster=${cluster}`;
}
