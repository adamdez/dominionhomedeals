'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'
import { trackCallIntent } from '@/lib/tracking'

const GA_MEASUREMENT_ID = 'G-5GJ6T8KXLE'
const GOOGLE_ADS_ID = 'AW-17989282213'

/** Derive a CTA location label from the DOM context of a clicked element. */
function getCTALocation(el: Element): string {
    if (el.closest('header')) return 'header'
    if (el.closest('footer')) return 'footer'
    const section = el.closest('section[id], div[id]')
    if (section?.id) return section.id
    return 'page'
}

export function GoogleAnalytics() {
  const [gtmReady, setGtmReady] = useState(false)

  useEffect(() => {
    // Load GTM only after first user interaction to avoid blocking TBT.
    // 5s fallback ensures passive viewers are still tracked.
    const load = () => setGtmReady(true)
    const events = ['scroll', 'click', 'mousemove', 'keydown', 'touchstart'] as const
    events.forEach(e => window.addEventListener(e, load, { once: true, passive: true }))
    const timer = setTimeout(load, 5000)
    return () => {
      events.forEach(e => window.removeEventListener(e, load))
      clearTimeout(timer)
    }
  }, [])

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

  if (!gtmReady) return null

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
