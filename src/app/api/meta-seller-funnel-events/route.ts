import { NextRequest, NextResponse } from "next/server";
import { SITE } from "@/lib/constants";
import {
  metaSellerEventRateLimitKey,
  normalizeMetaSellerFunnelEvent,
  recordMetaSellerFunnelEvent,
} from "@/lib/meta-seller-funnel-events";

const MAX_BODY_BYTES = 12_000;
const rateLimits = new Map<string, { count: number; resetAt: number }>();

function trustedOrigin(request: NextRequest): boolean {
  const candidate = request.headers.get("origin") || request.headers.get("referer");
  if (!candidate) return request.headers.get("sec-fetch-site") === "same-origin";
  try {
    const host = new URL(candidate).hostname.toLowerCase();
    const canonical = new URL(SITE.url).hostname.toLowerCase();
    return host === canonical || host === canonical.replace(/^www\./, "") ||
      host === "localhost" || host === "127.0.0.1";
  } catch {
    return false;
  }
}

function rateLimited(ip: string): boolean {
  const now = Date.now();
  if (rateLimits.size > 10_000) {
    for (const [key, entry] of rateLimits) if (now > entry.resetAt) rateLimits.delete(key);
  }
  const key = metaSellerEventRateLimitKey(ip);
  const current = rateLimits.get(key);
  if (!current || now > current.resetAt) {
    rateLimits.set(key, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  current.count += 1;
  return current.count > 80;
}

export async function POST(request: NextRequest) {
  if (!trustedOrigin(request)) {
    return NextResponse.json({ accepted: false, error: "Untrusted event origin." }, { status: 403 });
  }
  if (Number(request.headers.get("content-length") || "0") > MAX_BODY_BYTES) {
    return NextResponse.json({ accepted: false, error: "Payload too large." }, { status: 413 });
  }
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") || "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json({ accepted: false, error: "Rate limit exceeded." }, { status: 429 });
  }
  try {
    const event = normalizeMetaSellerFunnelEvent(await request.json());
    if (!event) {
      return NextResponse.json({ accepted: false, error: "Invalid funnel event." }, { status: 400 });
    }
    if (event.eventType === 'lead_accepted') {
      return NextResponse.json({ accepted: false, error: 'This milestone is server-owned.' }, { status: 400 });
    }
    const result = await recordMetaSellerFunnelEvent(event);
    return NextResponse.json({ accepted: true, eventId: event.eventId, duplicate: result.duplicate });
  } catch (error) {
    console.error("[META SELLER FUNNEL EVENT ERROR]", {
      message: error instanceof Error ? error.message : "Unknown funnel event error.",
    });
    return NextResponse.json({ accepted: false, error: "Event storage unavailable." }, { status: 503 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", endpoint: "/api/meta-seller-funnel-events" });
}
