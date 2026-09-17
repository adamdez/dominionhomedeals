export type SellerFunnelClientEventType =
  | "landing_arrived"
  | "page_engaged"
  | "engaged_7s"
  | "form_viewed"
  | "form_focused"
  | "input_started"
  | "validation_failed"
  | "step_completed"
  | "submit_attempted"
  | "submit_failed"
  | "call_clicked"
  | "page_exited"
  | "page_hidden"
  | "page_visible"
  | "page_restored";

export type SellerFunnelClientStage = "address" | "name" | "phone" | "details";

interface SellerFunnelEventOptions {
  stage?: SellerFunnelClientStage;
  detail?: string;
  elapsedMs?: number;
  activeVisibleMs?: number;
  scrollDepth?: number;
  onceKey?: string;
  beacon?: boolean;
}

const JOURNEY_KEY = "dominion_seller_options_journey_v2";
const JOURNEY_IDLE_MS = 30 * 60 * 1000;
const INTERNAL_QA_KEY = "dominion_internal_qa";
const ATTRIBUTION_KEYS = [
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
  "landing_revision",
] as const;

const sentOnce = new Set<string>();
interface SellerJourney {
  id: string;
  updatedAt: number;
  attribution: Record<string, string>;
  ignoredOppref?: string;
}
let fallbackJourney: SellerJourney | null = null;
const ATTRIBUTION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

declare global {
  interface Window {
    __dominionAnalyticsBlocked?: () => boolean;
  }
}

function uuid(): string {
  return crypto.randomUUID();
}

export function isInternalQaSession(): boolean {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  const queryValue = params.get("internal_qa");

  try {
    if (queryValue === "1") sessionStorage.setItem(INTERNAL_QA_KEY, "1");
    if (queryValue === "0") sessionStorage.removeItem(INTERNAL_QA_KEY);
    if (sessionStorage.getItem(INTERNAL_QA_KEY) === "1") return true;
  } catch {}

  return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
}

function readCurrentSellerAttribution(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const attribution: Record<string, string> = {};
  for (const key of ATTRIBUTION_KEYS) {
    const value = params.get(key);
    if (value) attribution[key] = value;
  }
  if (!attribution.oppref) {
    attribution.oppref = readRawCookie("__oppref") || readStoredOppref();
    if (!attribution.oppref) delete attribution.oppref;
  }
  // Only the server-rendered fixed revision is trusted. Never take it from a URL.
  const revision = typeof document.getElementById === "function"
    ? document.getElementById("get-options")?.dataset.sellerRevision : undefined;
  delete attribution.landing_revision;
  if (revision === "options_handoff_v1" || revision === "original") attribution.landing_revision = revision;
  return attribution;
}

function readRawCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const prefix = `${name}=`;
  const part = document.cookie.split(";").map((entry) => entry.trim())
    .find((entry) => entry.startsWith(prefix));
  return part ? part.slice(prefix.length) : "";
}

function readStoredOppref(): string {
  try {
    const value = localStorage.getItem("oppref") || "";
    const storedAt = Number(localStorage.getItem("oppref_ts") || "0");
    return value && Number.isFinite(storedAt) && Date.now() - storedAt <= ATTRIBUTION_MAX_AGE_MS
      ? value
      : "";
  } catch {
    return "";
  }
}

/** Raw Pixel browser reference for server-side attribution matching; never persist or log it. */
export function readOpenAIBrowserReference(): string {
  return readRawCookie("__obref");
}

function sellerJourney(): SellerJourney {
  const now = Date.now();
  const current = readCurrentSellerAttribution();
  const params = new URLSearchParams(window.location.search);
  let previous = fallbackJourney;
  try {
    const stored = JSON.parse(sessionStorage.getItem(JOURNEY_KEY) || "null");
    if (stored && typeof stored.id === "string" && Number.isFinite(stored.updatedAt) &&
      stored.attribution && typeof stored.attribution === "object" && !Array.isArray(stored.attribution)) {
      previous = { ...stored, attribution: Object.fromEntries(Object.entries(stored.attribution)
        .filter(([key, value]) => ATTRIBUTION_KEYS.includes(key as typeof ATTRIBUTION_KEYS[number]) && typeof value === "string")) };
    }
  } catch {}
  // URL cleanup and late Pixel cookie creation do not start a second visit.
  // A new explicit click/campaign or 30 minutes without an event does.
  const acquisitionKeys = ATTRIBUTION_KEYS.filter((key) => key !== "landing_revision");
  const newAcquisition = previous && acquisitionKeys.some((key) => {
    const incoming = params.get(key);
    return incoming && incoming !== previous.attribution[key];
  });
  const fresh = !previous || now < previous.updatedAt || now - previous.updatedAt >= JOURNEY_IDLE_MS || newAcquisition;
  const explicitSource = (params.get("utm_source") || "").toLowerCase();
  const otherSource = (explicitSource && !["chatgpt", "openai"].includes(explicitSource)) ||
    params.has("gclid") || params.has("gbraid") || params.has("wbraid");
  const ignoredOppref = params.get("oppref") ? undefined
    : (newAcquisition || otherSource) && current.oppref ? current.oppref : previous?.ignoredOppref;
  // A previous campaign's cookie must not label a different explicit campaign.
  if (!params.get("oppref") && current.oppref === ignoredOppref) delete current.oppref;
  if (!fresh && previous?.attribution.oppref && !params.get("oppref")) {
    current.oppref = previous.attribution.oppref;
  }
  const journey: SellerJourney = {
    id: fresh ? uuid() : previous!.id,
    updatedAt: now,
    attribution: fresh ? current : { ...previous!.attribution, ...current },
    ignoredOppref,
  };
  fallbackJourney = journey;
  try { sessionStorage.setItem(JOURNEY_KEY, JSON.stringify(journey)); } catch {}
  return journey;
}

export function readSellerAttribution(): Record<string, string> {
  return typeof window === "undefined" ? {} : sellerJourney().attribution;
}

export function getSellerFunnelVisitId(): string {
  return typeof window === "undefined" ? "" : sellerJourney().id;
}

function clientContext() {
  const userAgent = navigator.userAgent || "";
  const width = window.innerWidth || 0;
  const platform = /iPad|iPhone|iPod/i.test(userAgent)
    ? "ios"
    : /Android/i.test(userAgent) ? "android" : "desktop";
  const deviceClass = width > 0 && width <= 767
    ? "mobile"
    : width <= 1024 && (/iPad|Android|Tablet/i.test(userAgent) || navigator.maxTouchPoints > 1)
      ? "tablet"
      : width > 0 ? "desktop" : "unknown";
  const viewportBucket = width <= 0
    ? "unknown"
    : width <= 480 ? "small" : width <= 768 ? "medium" : width <= 1280 ? "large" : "xlarge";
  let referrerClass = "direct";
  if (document.referrer) {
    try {
      const host = new URL(document.referrer).hostname.toLowerCase();
      referrerClass = host.includes("chatgpt.com") || host.includes("openai.com")
        ? "chatgpt"
        : /google\.|bing\.|duckduckgo\.|yahoo\./.test(host) ? "search" : "other";
    } catch {
      referrerClass = "unknown";
    }
  }
  return { platform, deviceClass, viewportBucket, referrerClass };
}

export function trackSellerFunnelEvent(
  eventType: SellerFunnelClientEventType,
  options: SellerFunnelEventOptions = {},
): string {
  if (typeof window === "undefined" || isInternalQaSession()) return "";
  const visitId = getSellerFunnelVisitId();
  const scopedOnceKey = options.onceKey ? `${visitId}:${options.onceKey}` : "";
  if (scopedOnceKey && sentOnce.has(scopedOnceKey)) return visitId;
  if (scopedOnceKey) sentOnce.add(scopedOnceKey);
  const payload = {
    eventId: uuid(),
    visitId,
    eventType,
    occurredAt: new Date().toISOString(),
    pagePath: "/sell/options",
    stage: options.stage,
    detail: options.detail,
    elapsedMs: Number.isFinite(options.elapsedMs) ? Math.max(0, Math.round(options.elapsedMs!)) : undefined,
    activeVisibleMs: Number.isFinite(options.activeVisibleMs)
      ? Math.min(1_800_000, Math.max(0, Math.round(options.activeVisibleMs!))) : undefined,
    scrollDepth: Number.isFinite(options.scrollDepth)
      ? Math.min(100, Math.max(0, Math.round(options.scrollDepth!)))
      : undefined,
    attribution: readSellerAttribution(),
    ...clientContext(),
  };
  const body = JSON.stringify(payload);

  let queued = false;
  if (options.beacon && typeof navigator.sendBeacon === "function") {
    try { queued = navigator.sendBeacon("/api/funnel-events", new Blob([body], { type: "application/json" })); } catch {}
  }
  if (!queued) {
    void fetch("/api/funnel-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => undefined);
  }

  if (!window.__dominionAnalyticsBlocked?.() && typeof window.gtag === "function") {
    window.__loadDominionAnalytics?.();
    window.gtag("event", eventType, {
      event_category: "seller_options_funnel",
      funnel_stage: options.stage || "page",
      event_detail: options.detail || "",
      elapsed_ms: payload.elapsedMs,
      scroll_depth: payload.scrollDepth,
      utm_campaign: payload.attribution.utm_campaign || "",
      utm_content: payload.attribution.utm_content || "",
    });
  }

  return visitId;
}
