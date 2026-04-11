import { NextRequest, NextResponse } from "next/server";
import { buildOperationalProofReport } from "@/lib/al-operational-proof";
import { isAuthenticatedAlSession } from "@/lib/al-review";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = request.cookies.get("al_session");
  if (!isAuthenticatedAlSession(session?.value)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const report = await buildOperationalProofReport({
    host: request.headers.get("host"),
    origin: request.nextUrl.origin,
  });

  return NextResponse.json({ ok: true, report });
}
