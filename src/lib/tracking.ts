/**
 * Conversion and event tracking helpers.
 *
 * We keep the global GA tag lightweight on initial page load, then send
 * explicit Google Ads conversions only where they are required.
 */

export const GOOGLE_ADS_CONVERSION_ID =
  process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || 'AW-18000301728'
export const GOOGLE_ADS_LEAD_FORM_LABEL =
  process.env.NEXT_PUBLIC_GADS_LEAD_FORM_LABEL || 'LJHYCOnlx4QcEKCdm4dD'
export const GOOGLE_ADS_CALL_LABEL =
  process.env.NEXT_PUBLIC_GADS_CALL_LABEL || '10-DCJvTz4UcEKCdm4dD'

/**
 * Routes that must never fire Google Ads tracking.
 *
 * These are services we do not advertise. Sending Ads page loads, call
 * conversions, or lead conversions from them would pollute the seller
 * campaign data, so the Ads tag is suppressed here. Google Analytics still
 * records ordinary page and engagement events.
 */
export const ADS_TRACKING_EXCLUDED_PATHS: readonly string[] = ['/property-management']

export function isAdsTrackingExcludedPath(pathname: string): boolean {
  const normalized = pathname.replace(/\/+$/, '') || '/'
  return ADS_TRACKING_EXCLUDED_PATHS.includes(normalized)
}

declare global {
  interface Window {
    gtag?: (command: string, ...args: unknown[]) => void
    dataLayer?: unknown[]
    __loadDominionAnalytics?: () => void
    __dominionAdsTrackingBlocked?: () => boolean
  }
}

function adsTrackingBlocked(): boolean {
  if (typeof window === 'undefined') return false
  return isAdsTrackingExcludedPath(window.location.pathname)
}

function gtag(command: string, ...args: unknown[]) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.__loadDominionAnalytics?.()
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
  if (adsTrackingBlocked()) return

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

  if (GOOGLE_ADS_CALL_LABEL && !adsTrackingBlocked()) {
    gtag('event', 'conversion', {
      send_to: `${GOOGLE_ADS_CONVERSION_ID}/${GOOGLE_ADS_CALL_LABEL}`,
      value: 1.0,
      currency: 'USD',
    })
  }
}
