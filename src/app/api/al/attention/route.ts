import { NextRequest, NextResponse } from "next/server";
import { buildAttentionBrief } from "@/lib/al-attention-brief";
import { isAuthenticatedAlSession } from "@/lib/al-review";

export async function GET(request: NextRequest) {
  const session = request.cookies.get("al_session");
  if (!isAuthenticatedAlSession(session?.value)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const brief = await buildAttentionBrief({
    host: request.headers.get("host"),
    origin: request.nextUrl.origin,
  });
  return NextResponse.json({ ok: true, brief });
}
