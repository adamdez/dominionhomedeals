import { NextRequest, NextResponse } from "next/server";
import {
  getOpenClawCommandCatalog,
  inferOpenClawEnvelope,
  isOpenClawCommand,
  readOpenClawSharedSecret,
  runOpenClawCommand,
  type OpenClawEnvelope,
} from "@/lib/al-openclaw";

export const dynamic = "force-dynamic";

function unauthorized(message: string, status = 401) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function GET() {
  const sharedSecret = readOpenClawSharedSecret();
  return NextResponse.json(
    {
      ok: true,
      configured: Boolean(sharedSecret),
      commandCount: getOpenClawCommandCatalog().length,
      commands: getOpenClawCommandCatalog(),
    },
    { status: sharedSecret ? 200 : 503 },
  );
}

export async function POST(request: NextRequest) {
  const sharedSecret = readOpenClawSharedSecret();
  if (!sharedSecret) {
    return unauthorized("OpenClaw ingress is not configured.", 503);
  }

  const headerSecret = request.headers.get("x-al-openclaw-secret")?.trim() || "";
  if (!headerSecret || headerSecret !== sharedSecret) {
    return unauthorized("Unauthorized.");
  }

  let body: OpenClawEnvelope;
  try {
    body = (await request.json()) as OpenClawEnvelope;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const resolved = inferOpenClawEnvelope(body);
  if (!resolved?.command) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unknown OpenClaw command or message intent.",
        commands: getOpenClawCommandCatalog(),
      },
      { status: 400 },
    );
  }
  if (!isOpenClawCommand(resolved.command)) {
    return NextResponse.json({ ok: false, error: "Unknown OpenClaw command." }, { status: 400 });
  }

  const result = await runOpenClawCommand(resolved);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
