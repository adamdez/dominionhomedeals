import { NextRequest, NextResponse } from "next/server";
import {
  enqueueRemoteBridgeBundle,
  isRemoteBridgeConfigured,
  type RemoteBridgeRequest,
} from "@/lib/al-remote-bridge";
import { isAuthenticatedAlSession } from "@/lib/al-review";

export const dynamic = "force-dynamic";

function normalizeRequests(value: unknown): RemoteBridgeRequest[] {
  if (!Array.isArray(value)) return [];
  const requests: RemoteBridgeRequest[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    const record = entry as Record<string, unknown>;
    const id = typeof record.id === "string" ? record.id.trim() : "";
    const name = typeof record.name === "string" ? record.name.trim() : "";
    const input =
      record.input && typeof record.input === "object" && !Array.isArray(record.input)
        ? (record.input as Record<string, unknown>)
        : {};
    const accountabilityJobId =
      Number.isInteger(Number(record.accountabilityJobId)) && Number(record.accountabilityJobId) > 0
        ? Number(record.accountabilityJobId)
        : undefined;
    if (!id || !name) continue;
    requests.push({ id, name, input, accountabilityJobId });
  }
  return requests;
}

export async function POST(request: NextRequest) {
  const session = request.cookies.get("al_session");
  if (!isAuthenticatedAlSession(session?.value)) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!isRemoteBridgeConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Remote bridge relay is not configured." },
      { status: 503 },
    );
  }

  let body: { requests?: unknown };
  try {
    body = (await request.json()) as { requests?: unknown };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const requests = normalizeRequests(body.requests);
  if (requests.length === 0) {
    return NextResponse.json({ ok: false, error: "No remote bridge requests supplied." }, { status: 400 });
  }

  const dispatched = await enqueueRemoteBridgeBundle({
    requests,
    requestedBy: "authenticated_al_operator",
  });
  if ("error" in dispatched) {
    return NextResponse.json({ ok: false, error: dispatched.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true, jobId: dispatched.jobId });
}
