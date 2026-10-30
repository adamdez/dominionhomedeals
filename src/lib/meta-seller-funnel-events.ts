import "server-only";
import { createHash } from "node:crypto";
import { getDominionServiceClient } from "@/lib/dominion-supabase";

export const META_SELLER_EVENT_TYPES = [
  "landing_arrived",
  "form_viewed",
  "form_started",
  "field_completed",
  "field_focused",
  "form_ready",
  "cta_clicked",
  "gate_answered",
  "gate_exited",
  "validation_failed",
  "submit_attempted",
  "submit_failed",
  "lead_accepted",
] as const;

export const META_SELLER_STAGES = [
  "service_area",
  "timeline",
  "authority",
  "property_type",
  "listing_status",
  "offer_readiness",
  "price_tradeoff",
  "condition",
  "contact",
] as const;

type MetaSellerEventType = (typeof META_SELLER_EVENT_TYPES)[number];
type MetaSellerStage = (typeof META_SELLER_STAGES)[number];

const EVENT_TYPES = new Set<string>(META_SELLER_EVENT_TYPES);
const STAGES = new Set<string>(META_SELLER_STAGES);
const ATTRIBUTION_KEYS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "campaign_id",
  "adset_id",
  "ad_group_id",
  "ad_id",
  "creative_id",
  "landing_revision",
  "device_class",
]);

export interface MetaSellerFunnelEvent {
  eventId: string;
  visitId: string;
  eventType: MetaSellerEventType;
  occurredAt: string;
  stage: MetaSellerStage | null;
  detail: string | null;
  leadReceiptId: number | null;
  variant: "repairs" | "estate" | "direct";
  attribution: Record<string, string>;
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function normalizeAttribution(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key, entry]) => ATTRIBUTION_KEYS.has(key) && typeof entry === "string")
      .map(([key, entry]) => [key, String(entry).trim().slice(0, 300)] as const)
      .filter(([, entry]) => entry.length > 0),
  );
}

export function normalizeMetaSellerFunnelEvent(value: unknown): MetaSellerFunnelEvent | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  if (!isUuid(raw.eventId) || !isUuid(raw.visitId)) return null;
  if (typeof raw.eventType !== "string" || !EVENT_TYPES.has(raw.eventType)) return null;

  const occurredAt = typeof raw.occurredAt === "string" ? new Date(raw.occurredAt) : null;
  if (!occurredAt || !Number.isFinite(occurredAt.getTime())) return null;
  const ageMs = Date.now() - occurredAt.getTime();
  if (ageMs < -10 * 60 * 1000 || ageMs > 24 * 60 * 60 * 1000) return null;

  const detail = typeof raw.detail === "string" && /^[a-z0-9][a-z0-9_-]{0,63}$/.test(raw.detail)
    ? raw.detail
    : null;
  // Progress details contain fixed field names only, never user-entered values.
  if (["field_completed", "field_focused", "validation_failed"].includes(raw.eventType) && detail &&
    !new Set(["full_name", "phone", "email", "address", "service_area", "contact_permission", "contact_invalid", "contact_format"]).has(detail)) return null;
  const leadReceiptId = typeof raw.leadReceiptId === "string" && /^\d{1,18}$/.test(raw.leadReceiptId)
    ? Number(raw.leadReceiptId)
    : Number.isSafeInteger(raw.leadReceiptId) && Number(raw.leadReceiptId) > 0
      ? Number(raw.leadReceiptId)
      : null;

  return {
    eventId: raw.eventId.toLowerCase(),
    visitId: raw.visitId.toLowerCase(),
    eventType: raw.eventType as MetaSellerEventType,
    occurredAt: occurredAt.toISOString(),
    stage: typeof raw.stage === "string" && STAGES.has(raw.stage) ? raw.stage as MetaSellerStage : null,
    detail,
    leadReceiptId,
    variant: raw.variant === "estate" || raw.variant === "direct" ? raw.variant : "repairs",
    attribution: normalizeAttribution(raw.attribution),
  };
}

export async function recordMetaSellerFunnelEvent(
  event: MetaSellerFunnelEvent,
): Promise<{ duplicate: boolean }> {
  const supabase = getDominionServiceClient();
  if (!supabase) throw new Error("Meta seller funnel storage is unavailable.");
  const inserted = await supabase.from("dominion_meta_seller_funnel_events").insert({
    event_id: event.eventId,
    visit_id: event.visitId,
    event_type: event.eventType,
    occurred_at: event.occurredAt,
    stage: event.stage,
    detail: event.detail,
    lead_receipt_id: event.leadReceiptId,
    variant: event.variant,
    attribution: event.attribution,
  });
  if (!inserted.error) return { duplicate: false };
  if (inserted.error.code === "23505") return { duplicate: true };
  throw new Error(inserted.error.message || "Could not record the Meta seller funnel event.");
}

export function metaSellerEventRateLimitKey(ip: string): string {
  return createHash("sha256").update(`dominion-meta-seller:${ip}`).digest("hex");
}
