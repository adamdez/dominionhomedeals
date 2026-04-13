import { NextRequest, NextResponse } from "next/server";

import { refreshOpenCursorJobs } from "@/lib/al-cursor";

function isAuthorizedCronRequest(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET?.trim();
  const authHeader = request.headers.get("authorization") || "";
  const bearer = authHeader.replace(/^Bearer\s+/i, "").trim();
  const isVercelCron = request.headers.has("x-vercel-cron");

  if (cronSecret) {
    return bearer === cronSecret || isVercelCron;
  }

  return isVercelCron;
}

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const summary = await refreshOpenCursorJobs({
    limit: 20,
    force: true,
    minAgeSeconds: 0,
  });

  return NextResponse.json({
    ok: true,
    summary,
    generatedAt: new Date().toISOString(),
  });
}
