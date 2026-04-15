/**
 * Conversion and event tracking helpers.
 *
 * We keep the global GA tag lightweight on initial page load, then send
 * Google Ads conversions explicitly with `send_to` only when the user
 * actually submits a form or taps a phone link.
 */

const GOOGLE_ADS_PRIMARY_ID = 'AW-17989282213'
const GADS_FORM_SEND_TO =
  process.env.NEXT_PUBLIC_GADS_FORM_SEND_TO || 'AW-18000301728/LJHYCOnlx4QcEKCdm4dD'
const GADS_CALL_LABEL = process.env.NEXT_PUBLIC_GADS_CALL_LABEL || '10-DCJvTz4UcEKCdm4dD'

declare global {
  interface Window {
    gtag?: (command: string, ...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

function gtag(command: string, ...args: unknown[]) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag(command, ...args)
  }
}

export interface LeadTrackingData {
  landingPage: string
  utmSource: string
  utmMedium: string
  utmCampaign: string
  propertyCity: string
  propertyState: string
  sellerTimeline: string
  propertyCondition: string
}

export function trackLeadFormSubmission(data: LeadTrackingData): void {
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
  })

  if (GADS_FORM_SEND_TO) {
    gtag('event', 'conversion', {
      send_to: GADS_FORM_SEND_TO,
      value: 1.0,
      currency: 'USD',
    })
  }
}

export function trackFormStep(stepNumber: number, stepName: string): void {
  gtag('event', 'form_step', {
    event_category: 'lead_form',
    step_number: stepNumber,
    step_name: stepName,
    page_path: typeof window !== 'undefined' ? window.location.pathname : '',
  })
}

export function trackCallIntent(linkText: string, ctaLocation: string): void {
  const pagePath = typeof window !== 'undefined' ? window.location.pathname : ''

  gtag('event', 'click_to_call', {
    event_category: 'engagement',
    link_text: linkText,
    page_path: pagePath,
    cta_location: ctaLocation,
  })

  if (GADS_CALL_LABEL) {
    gtag('event', 'conversion', {
      send_to: `${GOOGLE_ADS_PRIMARY_ID}/${GADS_CALL_LABEL}`,
      value: 1.0,
      currency: 'USD',
    })
  }
}
