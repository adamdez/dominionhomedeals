import { NextRequest, NextResponse } from "next/server";
import {
  readRemoteBridgeSharedSecret,
  recordRemoteBridgeHeartbeat,
  type RemoteBridgeHeartbeatSnapshot,
} from "@/lib/al-remote-bridge";

export const dynamic = "force-dynamic";

function unauthorized(message: string, status = 401) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function normalizeCapabilities(value: unknown): Record<string, boolean> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, entry === true]),
  );
}

function normalizeCoworkProbe(value: unknown): RemoteBridgeHeartbeatSnapshot["coworkProbe"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  return {
    ok: record.ok === true,
    status:
      typeof record.status === "string" && record.status.trim()
        ? record.status.trim().slice(0, 120)
        : "unknown",
    detail:
      typeof record.detail === "string" && record.detail.trim()
        ? record.detail.trim().slice(0, 1000)
        : "No cowork detail reported.",
  };
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

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const observedAt = new Date().toISOString();
  const heartbeat: RemoteBridgeHeartbeatSnapshot = {
    clientId:
      typeof body.clientId === "string" && body.clientId.trim()
        ? body.clientId.trim().slice(0, 120)
        : "desktop-bridge",
    observedAt,
    relayApiBase:
      typeof body.relayApiBase === "string" && body.relayApiBase.trim()
        ? body.relayApiBase.trim().slice(0, 400)
        : null,
    bridgeAuthRequired: body.bridgeAuthRequired === true,
    capabilities: normalizeCapabilities(body.capabilities),
    coworkProbe: normalizeCoworkProbe(body.coworkProbe),
  };

  const recorded = await recordRemoteBridgeHeartbeat(heartbeat);
  if (!recorded) {
    return NextResponse.json({ ok: false, error: "Could not record remote bridge heartbeat." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, observedAt });
}
