/**
 * Conversion & event tracking utilities.
 *
 * Fires events to GA4 and Google Ads via the global gtag function
 * loaded in analytics.tsx.
 *
 * Events:
 * generate_lead — form submission success (GA4 + Google Ads conversion)
 * form_step — form step progression (GA4 only — funnel insight)
 * click_to_call — tel: link click (GA4 site-wide, Google Ads on /sell only)
 *
 * Google Ads:
 * NEXT_PUBLIC_GADS_FORM_SEND_TO — full send_to for lead form (default matches
 *   Google Ads → Submit lead form). Optional override if the action changes.
 * NEXT_PUBLIC_GADS_CALL_LABEL — call conversion label (paired with primary Ads ID)
 *
 * These are set in Vercel env vars (or .env.local) after creating
 * conversion actions in Google Ads UI. GA4 events fire regardless.
 */

// ── Configuration ──────────────────────────────────────────────

/** Call-intent conversions still use the primary Ads account tag on the site */
const GOOGLE_ADS_PRIMARY_ID = 'AW-17989282213';

/** "Submit lead form" (WEBPAGE) — ID + label must match Google Ads conversion setup */
const GADS_FORM_SEND_TO =
  process.env.NEXT_PUBLIC_GADS_FORM_SEND_TO ||
  'AW-18000301728/LJHYCOnlx4QcEKCdm4dD';

const GADS_FORM_SEND_TO_PRIMARY =
  process.env.NEXT_PUBLIC_GADS_FORM_SEND_TO_PRIMARY ||
  'AW-17989282213/KWB_CIaVnYgcEKXT-oFD';

const GADS_CALL_LABEL = process.env.NEXT_PUBLIC_GADS_CALL_LABEL || '10-DCJvTz4UcEKCdm4dD';

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

  if (GADS_FORM_SEND_TO) {
    gtag('event', 'conversion', {
      send_to: GADS_FORM_SEND_TO,
      value: 1.0,
      currency: 'USD',
    });
  }

  if (GADS_FORM_SEND_TO_PRIMARY) {
    gtag('event', 'conversion', {
      send_to: GADS_FORM_SEND_TO_PRIMARY,
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
// GA4 event + Google Ads conversion both fire site-wide on every
// tel: click. Captured via global click handler in analytics.tsx.

export function trackCallIntent(linkText: string, ctaLocation: string): void {
    const pagePath = typeof window !== 'undefined' ? window.location.pathname : '';

  // GA4 event — fires on every tel: click, any page
  gtag('event', 'click_to_call', {
        event_category: 'engagement',
        link_text: linkText,
        page_path: pagePath,
        cta_location: ctaLocation,
  });

  // Google Ads conversion — fires on any page with a tel: click
  if (GADS_CALL_LABEL) {
    gtag('event', 'conversion', {
      send_to: `${GOOGLE_ADS_PRIMARY_ID}/${GADS_CALL_LABEL}`,
      value: 1.0,
      currency: 'USD',
    });
  }
}
