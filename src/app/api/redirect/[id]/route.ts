import { ActionPostResponse, ACTIONS_CORS_HEADERS, createActionHeaders } from "@solana/actions";

const headers = createActionHeaders();

export async function GET(request: Request) {
  const url = new URL(request.url);
  const redirectUrl = `${url.href}`;
  return Response.redirect(redirectUrl, 302);
}

export const OPTIONS = async () => Response.json(null, { headers });

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const url = new URL(request.url);

  const payload: ActionPostResponse = {
    type: "external-link",
    externalLink: `${url.origin}/dashboard/${params.id}`,
    message: "Redirected to Leaderboard",
  };

  return Response.json(payload, {
    headers: ACTIONS_CORS_HEADERS,
  });
}
