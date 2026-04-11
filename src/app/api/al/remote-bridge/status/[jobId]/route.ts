import { NextRequest, NextResponse } from "next/server";
import { getRemoteBridgeBundle } from "@/lib/al-remote-bridge";
import { isAuthenticatedAlSession } from "@/lib/al-review";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ jobId: string }> },
) {
  const session = request.cookies.get("al_session");
  if (!isAuthenticatedAlSession(session?.value)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { jobId: rawJobId } = await context.params;
  const jobId = Number(rawJobId);
  if (!Number.isInteger(jobId) || jobId <= 0) {
    return NextResponse.json({ ok: false, error: "Invalid remote bridge job id." }, { status: 400 });
  }

  const bundle = await getRemoteBridgeBundle(jobId);
  if (!bundle) {
    return NextResponse.json({ ok: false, error: "Remote bridge bundle not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, bundle });
}
