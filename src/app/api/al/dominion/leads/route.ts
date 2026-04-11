import { NextRequest, NextResponse } from "next/server";
import { getDominionLeadDashboard } from "@/lib/dominion-leads";
import { isAuthenticatedAlSession } from "@/lib/al-review";

export async function GET(request: NextRequest) {
  const session = request.cookies.get("al_session");
  if (!isAuthenticatedAlSession(session?.value)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const limitParam = Number(request.nextUrl.searchParams.get("limit") || 24);
  const dashboard = await getDominionLeadDashboard(
    Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 60) : 24,
  );
  return NextResponse.json({ ok: true, dashboard });
}
