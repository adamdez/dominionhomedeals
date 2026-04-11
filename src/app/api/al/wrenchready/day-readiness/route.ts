import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedAlSession } from "@/lib/al-review";
import {
  getWrenchReadyDayReadinessSummary,
  upsertWrenchReadyDayReadiness,
  type DayReadinessOwner,
  type DayReadinessRisk,
} from "@/lib/wrenchready-day-readiness";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = request.cookies.get("al_session");
  if (!isAuthenticatedAlSession(session?.value)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const date = request.nextUrl.searchParams.get("date");
  const summary = await getWrenchReadyDayReadinessSummary(date);
  return NextResponse.json(summary);
}

export async function POST(request: NextRequest) {
  const session = request.cookies.get("al_session");
  if (!isAuthenticatedAlSession(session?.value)) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: {
    date?: string | null;
    jobsPlanned?: number;
    routeReady?: boolean;
    customersConfirmed?: boolean;
    partsReady?: boolean;
    fluidsReady?: boolean;
    toolsReady?: boolean;
    paymentRisk?: DayReadinessRisk;
    blockerOwner?: DayReadinessOwner;
    blockerNote?: string;
    notes?: string;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const record = await upsertWrenchReadyDayReadiness(body);
  return NextResponse.json({ ok: true, record });
}
