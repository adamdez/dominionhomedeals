'use client'

import { useEffect } from 'react'
import Script from 'next/script'
import { trackCallIntent } from '@/lib/tracking'

const GA_MEASUREMENT_ID = 'G-5GJ6T8KXLE'
const GOOGLE_ADS_ID = 'AW-18000167888'

/** Derive a CTA location label from the DOM context of a clicked element. */
function getCTALocation(el: Element): string {
  if (el.closest('header')) return 'header'
  if (el.closest('footer')) return 'footer'
  // Check for nearest ancestor with an id (e.g., #get-offer, hero sections)
  const section = el.closest('section[id], div[id]')
  if (section?.id) return section.id
  return 'page'
}

export function GoogleAnalytics() {
  // Global click-to-call tracking — catches every tel: link across the site
  // Uses event delegation so it works with dynamically rendered links too
  useEffect(() => {
    function handleTelClick(e: MouseEvent) {
      const target = (e.target as HTMLElement).closest('a[href^="tel:"]')
      if (target) {
        trackCallIntent(
          target.textContent?.trim() || 'phone',
          getCTALocation(target),
        )
      }
    }
    document.addEventListener('click', handleTelClick)
    return () => document.removeEventListener('click', handleTelClick)
  }, [])

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
          gtag('config', '${GOOGLE_ADS_ID}');
        `}
      </Script>
    </>
  )
}
