import { ActionPostRequest, ActionPostResponse, ACTIONS_CORS_HEADERS, createActionHeaders } from "@solana/actions";

const headers = createActionHeaders();

export async function GET(request: Request) {
  const url = new URL(request.url);
  const redirectUrl = `${url.href}`;
  return Response.redirect(redirectUrl, 302);
}

export const OPTIONS = async () => Response.json(null, { headers });

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body: ActionPostRequest = await request.json();

  const payload: ActionPostResponse = {
    type: "external-link",
    externalLink: `https://reclaim-verify-xmm5.vercel.app/?id=${params.id}&wallet=${body.account}`,
    message: "Redirected to Reclaim verify",
  };

  return Response.json(payload, {
    headers: ACTIONS_CORS_HEADERS,
  });
}
