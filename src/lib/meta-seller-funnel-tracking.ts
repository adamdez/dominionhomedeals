import { isInternalQaSession, readSellerAttribution } from "@/lib/seller-funnel-tracking";

export type MetaSellerClientStage =
  | "service_area"
  | "timeline"
  | "authority"
  | "property_type"
  | "listing_status"
  | "offer_readiness"
  | "price_tradeoff"
  | "condition"
  | "contact";

export type MetaSellerClientEventType =
  | "landing_arrived"
  | "form_viewed"
  | "form_started"
  | "field_completed"
  | "field_focused"
  | "form_ready"
  | "cta_clicked"
  | "gate_answered"
  | "gate_exited"
  | "validation_failed"
  | "submit_attempted"
  | "submit_failed";

const VISIT_ID_KEY = "dominion_meta_seller_visit_id";
const VISIT_SIGNATURE_KEY = "dominion_meta_seller_visit_signature";
let fallbackVisitId = "";
const sentOnce = new Set<string>();

export function getMetaSellerVisitId(variant: "repairs" | "estate" | "direct"): string {
  if (typeof window === "undefined") return "";
  const attribution = readSellerAttribution();
  const signature = JSON.stringify({
    path: window.location.pathname,
    variant,
    campaign: attribution.utm_campaign || "",
    content: attribution.utm_content || "",
    ad: attribution.ad_id || "",
    revision: "offer_form_v2",
  });
  try {
    const existing = sessionStorage.getItem(VISIT_ID_KEY) || "";
    const existingSignature = sessionStorage.getItem(VISIT_SIGNATURE_KEY) || "";
    if (existing && existingSignature === signature) return existing;
    const next = crypto.randomUUID();
    sessionStorage.setItem(VISIT_ID_KEY, next);
    sessionStorage.setItem(VISIT_SIGNATURE_KEY, signature);
    return next;
  } catch {
    if (!fallbackVisitId) fallbackVisitId = crypto.randomUUID();
    return fallbackVisitId;
  }
}

export function trackMetaSellerFunnelEvent(
  eventType: MetaSellerClientEventType,
  options: {
    variant: "repairs" | "estate" | "direct";
    stage?: MetaSellerClientStage;
    detail?: string;
    onceKey?: string;
  },
): string {
  if (typeof window === "undefined" || isInternalQaSession()) return "";
  const visitId = getMetaSellerVisitId(options.variant);
  const onceKey = options.onceKey ? `${visitId}:${options.onceKey}` : "";
  if (onceKey && sentOnce.has(onceKey)) return visitId;
  if (onceKey) sentOnce.add(onceKey);

  const body = JSON.stringify({
    eventId: crypto.randomUUID(),
    visitId,
    eventType,
    occurredAt: new Date().toISOString(),
    stage: options.stage,
    detail: options.detail,
    variant: options.variant,
    attribution: { ...readSellerAttribution(), landing_revision: "offer_form_v2" },
  });
  void fetch("/api/meta-seller-funnel-events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => undefined);
  return visitId;
}
