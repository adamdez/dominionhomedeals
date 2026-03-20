'use client'

import { useEffect } from 'react'
import Script from 'next/script'
import { trackCallIntent } from '@/lib/tracking'

const GA_MEASUREMENT_ID = 'G-5GJ6T8KXLE'
/** Primary tag on site (remarketing / audience) */
const GOOGLE_ADS_ID_PRIMARY = 'AW-17989282213'
/** Conversion action "Submit lead form" lives under this Ads ID — must also be gtag('config')'d */
const GOOGLE_ADS_ID_CONVERSION = 'AW-18000301728'

/** Derive a CTA location label from the DOM context of a clicked element. */
function getCTALocation(el: Element): string {
    if (el.closest('header')) return 'header'
    if (el.closest('footer')) return 'footer'
    const section = el.closest('section[id], div[id]')
    if (section?.id) return section.id
    return 'page'
}

export function GoogleAnalytics() {
  // Global contact-intent tracking — catches every tel: and sms: link across the site
  useEffect(() => {
    function handleContactClick(e: MouseEvent) {
      const target = (e.target as HTMLElement).closest('a[href^="tel:"], a[href^="sms:"]')
      if (target) {
        trackCallIntent(
          target.textContent?.trim() || 'phone',
          getCTALocation(target),
        )
      }
    }
    document.addEventListener('click', handleContactClick)
    return () => document.removeEventListener('click', handleContactClick)
  }, [])

  // gtag loads with afterInteractive (not deferred to first interaction) so
  // lead-form conversions always have window.gtag available after successful submit.
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
          gtag('config', '${GOOGLE_ADS_ID_PRIMARY}');
          gtag('config', '${GOOGLE_ADS_ID_CONVERSION}');
        `}
      </Script>
    </>
  )
}
