import { NextRequest, NextResponse } from "next/server";
import {
  claimNextRemoteBridgeBundle,
  readRemoteBridgeSharedSecret,
} from "@/lib/al-remote-bridge";

export const dynamic = "force-dynamic";

function unauthorized(message: string, status = 401) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function POST(request: NextRequest) {
  const sharedSecret = readRemoteBridgeSharedSecret();
  if (!sharedSecret) {
    return unauthorized("Remote bridge relay is not configured.", 503);
  }

  const headerSecret = request.headers.get("x-al-remote-bridge-secret")?.trim() || "";
  if (!headerSecret || headerSecret !== sharedSecret) {
    return unauthorized("Unauthorized.");
  }

  let body: { clientId?: string };
  try {
    body = (await request.json()) as { clientId?: string };
  } catch {
    body = {};
  }

  const clientId =
    typeof body.clientId === "string" && body.clientId.trim()
      ? body.clientId.trim().slice(0, 120)
      : "desktop-bridge";
  const bundle = await claimNextRemoteBridgeBundle(clientId);
  if (!bundle) {
    return NextResponse.json({ ok: true, bundle: null });
  }

  return NextResponse.json({ ok: true, bundle });
}
