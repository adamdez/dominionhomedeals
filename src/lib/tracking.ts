/**
 * Conversion & event tracking utilities.
 *
 * Fires events to GA4 and Google Ads via the global gtag function
 * loaded in analytics.tsx.
 *
 * Events:
 *   generate_lead  — form submission success (GA4 + Google Ads conversion)
 *   form_step      — form step progression (GA4 only — funnel insight)
 *   click_to_call  — tel: link click (GA4 site-wide, Google Ads on /sell only)
 *
 * Google Ads conversion labels are read from public env vars:
 *   NEXT_PUBLIC_GADS_FORM_LABEL  — "Lead Form" conversion label
 *   NEXT_PUBLIC_GADS_CALL_LABEL  — "Call Intent" conversion label
 *
 * These are set in Vercel env vars (or .env.local) after creating
 * conversion actions in Google Ads UI. GA4 events fire regardless.
 */

// ── Configuration ──────────────────────────────────────────────

const GOOGLE_ADS_CONVERSION_ID = 'AW-18000301728';

// Read conversion labels from public env vars — empty string = not configured yet
const GADS_FORM_LABEL = process.env.NEXT_PUBLIC_GADS_FORM_LABEL || '';
const GADS_CALL_LABEL = process.env.NEXT_PUBLIC_GADS_CALL_LABEL || '';

// ── gtag helper ────────────────────────────────────────────────
// Safe wrapper — silently no-ops if gtag hasn't loaded (ad blocker, slow load)

declare global {
  interface Window {
    gtag: (command: string, ...args: unknown[]) => void;
  }
}

function gtag(command: string, ...args: unknown[]) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag(command, ...args);
  }
}

// ── Lead form submission (primary conversion) ──────────────────

export interface LeadTrackingData {
  landingPage: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  propertyCity: string;
  propertyState: string;
  sellerTimeline: string;
  propertyCondition: string;
}

export function trackLeadFormSubmission(data: LeadTrackingData): void {
  // GA4 event — always fires
  gtag('event', 'generate_lead', {
    event_category: 'lead_form',
    landing_page: data.landingPage,
    utm_source: data.utmSource,
    utm_medium: data.utmMedium,
    utm_campaign: data.utmCampaign,
    property_city: data.propertyCity,
    property_state: data.propertyState,
    seller_timeline: data.sellerTimeline,
    property_condition: data.propertyCondition,
    currency: 'USD',
    value: 1,
  });

  // Google Ads direct conversion — fires only if label is configured
  if (GADS_FORM_LABEL) {
    gtag('event', 'conversion', {
      send_to: `${GOOGLE_ADS_CONVERSION_ID}/${GADS_FORM_LABEL}`,
      value: 1.0,
      currency: 'USD',
    });
  }
}

// ── Form step progression (GA4 funnel insight only) ────────────
// Not a Google Ads conversion signal — used for funnel analysis in GA4.

export function trackFormStep(stepNumber: number, stepName: string): void {
  gtag('event', 'form_step', {
    event_category: 'lead_form',
    step_number: stepNumber,
    step_name: stepName,
    page_path: typeof window !== 'undefined' ? window.location.pathname : '',
  });
}

// ── Click-to-call intent ───────────────────────────────────────
// GA4 event fires site-wide (all tel: clicks) for analytics.
// Google Ads conversion fires only on /sell page to avoid noisy
// signals from header/footer clicks on informational pages.

export function trackCallIntent(linkText: string, ctaLocation: string): void {
  const pagePath = typeof window !== 'undefined' ? window.location.pathname : '';

  // GA4 event — fires on every tel: click, any page
  gtag('event', 'click_to_call', {
    event_category: 'engagement',
    link_text: linkText,
    page_path: pagePath,
    cta_location: ctaLocation,
  });

  // Google Ads conversion — only on /sell (PPC landing page)
  if (GADS_CALL_LABEL && pagePath === '/sell') {
    gtag('event', 'conversion', {
      send_to: `${GOOGLE_ADS_CONVERSION_ID}/${GADS_CALL_LABEL}`,
      value: 1.0,
      currency: 'USD',
    });
  }
}
