import { NextRequest, NextResponse } from "next/server";
import { buildOperationalProofReport } from "@/lib/al-operational-proof";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const report = await buildOperationalProofReport({
    host: request.headers.get("host"),
    origin: request.nextUrl.origin,
  });

  const publicChecks = report.checks.map((check) => ({
    id: check.id,
    title: check.title,
    status: check.status,
    summary: check.summary,
  }));

  return NextResponse.json({
    ok: true,
    report: {
      generatedAt: report.generatedAt,
      summary: report.summary,
      topNextMove: report.topNextMove,
      checks: publicChecks,
    },
  });
}
