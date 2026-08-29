import "server-only";
import { createHash } from "node:crypto";
import { getDominionServiceClient } from "@/lib/dominion-supabase";

export const SELLER_FUNNEL_EVENT_TYPES = [
  "landing_arrived",
  "page_engaged",
  "engaged_7s",
  "form_viewed",
  "form_focused",
  "input_started",
  "validation_failed",
  "step_completed",
  "submit_attempted",
  "submit_failed",
  "lead_accepted",
  "call_clicked",
  "page_exited",
  "conversion_reported",
  "conversion_failed",
] as const;

export type SellerFunnelEventType = (typeof SELLER_FUNNEL_EVENT_TYPES)[number];
export type SellerFunnelStage = "address" | "name" | "phone" | "details";

const FUNNEL_EVENT_TYPES = new Set<string>(SELLER_FUNNEL_EVENT_TYPES);
const FUNNEL_STAGES = new Set<string>(["address", "name", "phone", "details"]);
const PLATFORMS = new Set<string>(["ios", "android", "desktop", "unknown"]);
const DEVICE_CLASSES = new Set<string>(["mobile", "tablet", "desktop", "unknown"]);
const VIEWPORT_BUCKETS = new Set<string>(["small", "medium", "large", "xlarge", "unknown"]);
const REFERRER_CLASSES = new Set<string>(["chatgpt", "search", "direct", "other", "unknown"]);
const ATTRIBUTION_KEYS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "oppref",
  "gclid",
  "gbraid",
  "wbraid",
  "gad_source",
  "gad_campaignid",
  "campaign_id",
  "ad_group_id",
  "ad_id",
  "creative_id",
]);

export interface SellerFunnelEvent {
  eventId: string;
  visitId: string;
  eventType: SellerFunnelEventType;
  occurredAt: string;
  pagePath: "/sell/options";
  stage: SellerFunnelStage | null;
  detail: string | null;
  elapsedMs: number | null;
  scrollDepth: number | null;
  leadReceiptId: number | null;
  platform: "ios" | "android" | "desktop" | "unknown";
  deviceClass: "mobile" | "tablet" | "desktop" | "unknown";
  viewportBucket: "small" | "medium" | "large" | "xlarge" | "unknown";
  referrerClass: "chatgpt" | "search" | "direct" | "other" | "unknown";
  attribution: Record<string, string>;
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function enumValue<T extends string>(value: unknown, choices: Set<string>, fallback: T): T {
  return typeof value === "string" && choices.has(value) ? value as T : fallback;
}

function optionalInteger(value: unknown, min: number, max: number): number | null {
  return Number.isInteger(value) && Number(value) >= min && Number(value) <= max
    ? Number(value)
    : null;
}

function optionalDetail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return /^[a-z0-9][a-z0-9_-]{0,63}$/.test(normalized) ? normalized : null;
}

function normalizeAttribution(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key, entry]) => ATTRIBUTION_KEYS.has(key) && typeof entry === "string")
      .map(([key, entry]) => {
        const raw = String(entry);
        if (key === "oppref") return [key, raw.length <= 8192 ? raw : ""] as const;
        return [key, raw.trim().slice(0, 300)] as const;
      })
      .filter(([, entry]) => entry.length > 0),
  );
}

export function normalizeSellerFunnelEvent(value: unknown): SellerFunnelEvent | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  if (!isUuid(raw.eventId) || !isUuid(raw.visitId)) return null;
  if (typeof raw.eventType !== "string" || !FUNNEL_EVENT_TYPES.has(raw.eventType)) return null;
  if (raw.pagePath !== "/sell/options") return null;

  const occurredAt = typeof raw.occurredAt === "string" ? new Date(raw.occurredAt) : null;
  if (!occurredAt || !Number.isFinite(occurredAt.getTime())) return null;
  const ageMs = Date.now() - occurredAt.getTime();
  if (ageMs < -10 * 60 * 1000 || ageMs > 24 * 60 * 60 * 1000) return null;

  const stage = typeof raw.stage === "string" && FUNNEL_STAGES.has(raw.stage)
    ? raw.stage as SellerFunnelStage
    : null;
  const leadReceiptId = typeof raw.leadReceiptId === "string" && /^\d{1,18}$/.test(raw.leadReceiptId)
    ? Number(raw.leadReceiptId)
    : optionalInteger(raw.leadReceiptId, 1, Number.MAX_SAFE_INTEGER);

  return {
    eventId: raw.eventId.toLowerCase(),
    visitId: raw.visitId.toLowerCase(),
    eventType: raw.eventType as SellerFunnelEventType,
    occurredAt: occurredAt.toISOString(),
    pagePath: "/sell/options",
    stage,
    detail: optionalDetail(raw.detail),
    elapsedMs: optionalInteger(raw.elapsedMs, 0, 1_800_000),
    scrollDepth: optionalInteger(raw.scrollDepth, 0, 100),
    leadReceiptId,
    platform: enumValue(raw.platform, PLATFORMS, "unknown"),
    deviceClass: enumValue(raw.deviceClass, DEVICE_CLASSES, "unknown"),
    viewportBucket: enumValue(raw.viewportBucket, VIEWPORT_BUCKETS, "unknown"),
    referrerClass: enumValue(raw.referrerClass, REFERRER_CLASSES, "unknown"),
    attribution: normalizeAttribution(raw.attribution),
  };
}

export async function recordSellerFunnelEvent(event: SellerFunnelEvent): Promise<{ duplicate: boolean }> {
  const supabase = getDominionServiceClient();
  if (!supabase) throw new Error("Seller funnel storage is unavailable.");

  const inserted = await supabase.from("dominion_seller_funnel_events").insert({
    event_id: event.eventId,
    visit_id: event.visitId,
    event_type: event.eventType,
    occurred_at: event.occurredAt,
    page_path: event.pagePath,
    stage: event.stage,
    detail: event.detail,
    elapsed_ms: event.elapsedMs,
    scroll_depth: event.scrollDepth,
    lead_receipt_id: event.leadReceiptId,
    platform: event.platform,
    device_class: event.deviceClass,
    viewport_bucket: event.viewportBucket,
    referrer_class: event.referrerClass,
    attribution: event.attribution,
  });

  if (!inserted.error) return { duplicate: false };
  if (inserted.error.code === "23505") return { duplicate: true };
  throw new Error(inserted.error.message || "Could not record the seller funnel event.");
}

export function anonymousRateLimitKey(ip: string): string {
  return createHash("sha256").update(`dominion-funnel:${ip}`).digest("hex");
}
