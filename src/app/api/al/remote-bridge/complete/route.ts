import { NextRequest, NextResponse } from "next/server";
import {
  completeRemoteBridgeBundle,
  readRemoteBridgeSharedSecret,
  type RemoteBridgeRequestResult,
} from "@/lib/al-remote-bridge";

export const dynamic = "force-dynamic";

function unauthorized(message: string, status = 401) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function normalizeResults(value: unknown): RemoteBridgeRequestResult[] {
  if (!Array.isArray(value)) return [];
  const results: RemoteBridgeRequestResult[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    const record = entry as Record<string, unknown>;
    const id = typeof record.id === "string" ? record.id.trim() : "";
    const name = typeof record.name === "string" ? record.name.trim() : "";
    const result = record.result;
    if (!id || !name) continue;
    if (typeof result === "string") {
      results.push({ id, name, result });
      continue;
    }
    if (result && typeof result === "object" && !Array.isArray(result)) {
      const imageRecord = result as Record<string, unknown>;
      if (imageRecord.type === "image") {
        results.push({
          id,
          name,
          result: {
            type: "image",
            base64: String(imageRecord.base64 || ""),
            mimeType: String(imageRecord.mimeType || "image/png"),
            path: String(imageRecord.path || ""),
          },
        });
        continue;
      }
    }
    results.push({ id, name, result: JSON.stringify(result ?? "") });
  }
  return results;
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

  let body: {
    jobId?: number;
    clientId?: string;
    isError?: boolean;
    errorMessage?: string | null;
    results?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const jobId = Number(body.jobId);
  if (!Number.isInteger(jobId) || jobId <= 0) {
    return NextResponse.json({ ok: false, error: "Invalid remote bridge job id." }, { status: 400 });
  }

  const completed = await completeRemoteBridgeBundle({
    jobId,
    clientId:
      typeof body.clientId === "string" && body.clientId.trim()
        ? body.clientId.trim().slice(0, 120)
        : "desktop-bridge",
    isError: body.isError === true,
    errorMessage:
      typeof body.errorMessage === "string" && body.errorMessage.trim()
        ? body.errorMessage.trim().slice(0, 2000)
        : null,
    results: normalizeResults(body.results),
  });

  if (!completed) {
    return NextResponse.json({ ok: false, error: "Could not complete remote bridge bundle." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
