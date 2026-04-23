import { ActionPostRequest, ActionPostResponse, ACTIONS_CORS_HEADERS, createActionHeaders } from "@solana/actions";
import { APP_CONFIG } from "@/lib/constants";

const headers = createActionHeaders();

export async function GET(request: Request) {
  const url = new URL(request.url);
  const redirectUrl = `${url.href}`;
  return Response.redirect(redirectUrl, 302);
}

export const OPTIONS = async () => Response.json(null, { headers });

export async function POST(request: Request) {
  const body: ActionPostRequest = await request.json();

  const payload: ActionPostResponse = {
    type: "external-link",
    externalLink: `${APP_CONFIG.url}/creatordashboard?id=${body.account}`,
    message: "Redirected to Creator Dashboard",
  };

  return Response.json(payload, {
    headers: ACTIONS_CORS_HEADERS,
  });
}
