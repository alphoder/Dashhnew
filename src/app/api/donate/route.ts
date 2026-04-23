import { ACTIONS_CORS_HEADERS } from "@solana/actions";

export async function GET(_request: Request) {
  return Response.json(
    { message: "Use /api/donate/:id to access a specific campaign" },
    { headers: ACTIONS_CORS_HEADERS }
  );
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const amount = url.searchParams.get("amount") || "0.2";
  return Response.json(
    { message: "Use /api/donate/:id to participate in a specific campaign", amount },
    { headers: ACTIONS_CORS_HEADERS }
  );
}

export const OPTIONS = GET;
