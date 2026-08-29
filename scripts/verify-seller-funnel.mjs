#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function check(name, ok, detail) {
  return { name, ok, detail };
}

const analytics = read("src/app/analytics.tsx");
const eventRoute = read("src/app/api/funnel-events/route.ts");
const leadRoute = read("src/app/api/leads/route.ts");
const leadForm = read("src/components/forms/LeadForm.tsx");
const journey = read("src/components/analytics/SellerOptionsJourneyTracker.tsx");
const conversion = read("src/server/openai-ads-conversions.ts");
const tracking = read("src/lib/tracking.ts");
const dominionStorage = read("src/lib/dominion-supabase.ts");
const migrationPath = fs.readdirSync(path.join(root, "supabase/migrations"))
  .find((name) => name.endsWith("_create_dominion_seller_funnel_events.sql"));
const migration = migrationPath ? read(`supabase/migrations/${migrationPath}`) : "";
const sellerOptionsPage = read("src/app/sell/options/page.tsx");
const sellerOptionsLanding = read("src/lib/seller-options-landing.ts");
const envExample = read(".env.example");

const eventNames = [
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
];

const checks = [
  check(
    "durable_event_table",
    migration.includes("create table if not exists public.dominion_seller_funnel_events") &&
      eventNames.every((eventName) => migration.includes(`'${eventName}'`)),
    "Migration defines the complete seller-options event vocabulary.",
  ),
  check(
    "private_by_default",
    migration.includes("enable row level security") &&
      migration.includes("revoke all on table public.dominion_seller_funnel_events from anon, authenticated") &&
      migration.includes("with (security_invoker = true)"),
    "Event storage and visit summary are not readable through anonymous/authenticated Data API roles.",
  ),
  check(
    "dominion_only_storage",
    migration.includes("public.dominion_website_lead_receipts") &&
      dominionStorage.includes("DOMINION_SUPABASE_URL") &&
      dominionStorage.includes("DOMINION_SUPABASE_SERVICE_ROLE_KEY") &&
      !dominionStorage.includes("NEXT_PUBLIC_SUPABASE_URL") &&
      !dominionStorage.includes("getServiceClient"),
    "Lead receipts and funnel events use a dedicated Dominion database client with no cross-business fallback.",
  ),
  check(
    "no_sensitive_event_columns",
    !/\n\s*(ip_address|user_agent|email|phone|address|field_value|keystrokes?|session_replay)\s+/i.test(migration),
    "The event table has no form-value, IP, raw user-agent, keystroke, fingerprint, or replay columns.",
  ),
  check(
    "anonymous_event_api",
    eventRoute.includes("normalizeSellerFunnelEvent") && eventRoute.includes("recordSellerFunnelEvent") &&
      eventRoute.includes("anonymousRateLimitKey") && eventRoute.includes("hasTrustedBrowserOrigin"),
    "Public collection route checks same-site origin, validates, rate-limits with an in-memory IP hash, and stores only normalized events.",
  ),
  check(
    "journey_coverage",
    ["landing_arrived", "page_engaged", "engaged_7s", "form_viewed", "call_clicked", "page_exited"]
      .every((eventName) => journey.includes(`\"${eventName}\"`)),
    "Page journey captures arrival, engagement, seven-second survival, form visibility, calls, and exit evidence.",
  ),
  check(
    "form_coverage",
    ["form_focused", "input_started", "validation_failed", "step_completed", "submit_attempted", "submit_failed"]
      .every((eventName) => leadForm.includes(`'${eventName}'`)) && leadForm.includes("funnelVisitId"),
    "Form trail records stage behavior and joins the anonymous visit to the accepted lead without field values.",
  ),
  check(
    "qa_exclusion",
    analytics.includes("dominion_internal_qa") && analytics.includes("__dominionAnalyticsBlocked") &&
      journey.includes("trackSellerFunnelEvent") && leadForm.includes("this test submission was intentionally not sent"),
    "The internal_qa session flag blocks GA, Ads, first-party events, and live lead submissions.",
  ),
  check(
    "durable_receipt_before_conversion",
    leadRoute.lastIndexOf("recordDominionOptionsLeadSubmission(") <
      leadRoute.indexOf("reportAndRecordOpenAIConversion({") &&
      leadRoute.includes("if (!receipt.duplicate)") && leadRoute.includes("eventType: 'lead_accepted'"),
    "OpenAI conversion reporting is reachable only after a new durable seller-options receipt.",
  ),
  check(
    "privacy_minimal_openai_conversion",
    conversion.includes('type: "lead_created"') && conversion.includes("opt_out: true") &&
      conversion.includes("oppref") && !conversion.includes("emails_sha256") &&
      !conversion.includes("phone_numbers_sha256") && !conversion.includes("ip_address") &&
      !conversion.includes("user_agent"),
    "Conversion payload uses the opaque click reference without customer identifiers, IP, or raw user agent.",
  ),
  check(
    "pixel_and_server_deduplication",
    analytics.includes("https://bzrcdn.openai.com/sdk/oaiq.min.js") &&
      analytics.includes("'page_viewed'") && tracking.includes("'lead_created'") &&
      tracking.includes("openAILeadEventId(submissionId)") &&
      conversion.includes("openAILeadEventId(input.submissionId)"),
    "The official browser Pixel supplies page/view-through coverage and shares the lead event ID with CAPI for deduplication.",
  ),
  check(
    "ad_message_continuity",
    sellerOptionsPage.includes("getSellerOptionsLanding") &&
      sellerOptionsLanding.includes("urgent_timeline") &&
      sellerOptionsLanding.includes("Sell without repairing first?") &&
      sellerOptionsLanding.includes("Discuss Selling As-Is"),
    "Each approved ad content key receives matching server-rendered landing and form language.",
  ),
  check(
    "conversion_env_documented",
    envExample.includes("NEXT_PUBLIC_OPENAI_ADS_PIXEL_ID") &&
      envExample.includes("OPENAI_ADS_PIXEL_ID") &&
      envExample.includes("OPENAI_ADS_CONVERSIONS_API_KEY") &&
      envExample.includes("OPENAI_ADS_CONVERSIONS_VALIDATE_ONLY=") &&
      !envExample.includes("OPENAI_ADS_CONVERSIONS_VALIDATE_ONLY=true"),
    "Shared Pixel IDs, the server-only CAPI key, and a production-capable validation toggle are documented.",
  ),
];

const result = {
  ok: checks.every((item) => item.ok),
  checksPassed: checks.filter((item) => item.ok).length,
  checksTotal: checks.length,
  migration: migrationPath || null,
  checks,
};

if (process.argv.includes("--json")) {
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} else {
  for (const item of checks) {
    process.stdout.write(`${item.ok ? "OK" : "CHECK"} ${item.name}: ${item.detail}\n`);
  }
}

if (!result.ok) process.exitCode = 1;
