"use client";

import Script from "next/script";
import {
  ADS_TRACKING_EXCLUDED_PATHS,
  GOOGLE_ADS_CALL_LABEL,
  GOOGLE_ADS_CONVERSION_ID,
} from "@/lib/tracking";

const GA_MEASUREMENT_ID = "G-5GJ6T8KXLE";

export function GoogleAnalytics() {
  return (
    <>
      <Script id="google-analytics-queue" strategy="beforeInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          window.gtag = window.gtag || function(){window.dataLayer.push(arguments);};
          window.__dominionAnalyticsLoaded = false;
          window.__loadDominionAnalytics = window.__loadDominionAnalytics || function() {
            if (window.__dominionAnalyticsLoaded) return;
            window.__dominionAnalyticsLoaded = true;
            var script = document.createElement('script');
            script.async = true;
            script.src = 'https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}';
            document.head.appendChild(script);
          };
          window.__dominionAdsExcludedPaths = ${JSON.stringify(ADS_TRACKING_EXCLUDED_PATHS)};
          window.__dominionAdsTrackingBlocked = function() {
            try {
              var path = (window.location.pathname || '/').replace(/\\/+$/, '') || '/';
              return window.__dominionAdsExcludedPaths.indexOf(path) !== -1;
            } catch (error) {
              return false;
            }
          };
          window.gtag('js', new Date());
          window.gtag('config', '${GA_MEASUREMENT_ID}');
          if (!window.__dominionAdsTrackingBlocked()) {
            window.gtag('config', '${GOOGLE_ADS_CONVERSION_ID}');
          }
        `}
      </Script>
      <Script id="google-analytics-loader" strategy="lazyOnload">
        {`
          (function() {
            function loadAnalytics() {
              if (typeof window.__loadDominionAnalytics === 'function') {
                window.__loadDominionAnalytics();
              }
            }

            ['pointerdown', 'keydown', 'touchstart', 'scroll'].forEach(function(eventName) {
              window.addEventListener(eventName, loadAnalytics, { once: true, passive: true });
            });

            if ('requestIdleCallback' in window) {
              window.requestIdleCallback(function() {
                window.setTimeout(loadAnalytics, 7000);
              }, { timeout: 7000 });
            } else {
              window.setTimeout(loadAnalytics, 7000);
            }
          })();
        `}
      </Script>
      <Script id="gclid-capture" strategy="afterInteractive">
        {`
          (function() {
            function getParam(name) {
              var url = new URL(window.location.href);
              return url.searchParams.get(name);
            }

            var gclid = getParam('gclid');

            if (gclid) {
              try {
                localStorage.setItem('gclid', gclid);
                localStorage.setItem('gclid_ts', Date.now().toString());
              } catch (error) {}
            }
          })();
        `}
      </Script>
      <Script id="phone-click-tracking" strategy="afterInteractive">
        {`
          (function () {
            function getCTALocation(el) {
              if (!el) return 'page';
              if (el.closest('header')) return 'header';
              if (el.closest('footer')) return 'footer';
              var section = el.closest('section[id], div[id]');
              return section && section.id ? section.id : 'page';
            }

            document.addEventListener('click', function (event) {
              var target = event.target && event.target.closest
                ? event.target.closest('a[href^="tel:"], a[href^="sms:"]')
                : null;

              if (!target || typeof window.gtag !== 'function') return;

              if (typeof window.__loadDominionAnalytics === 'function') {
                window.__loadDominionAnalytics();
              }

              var linkText = (target.textContent || 'phone').trim() || 'phone';
              var pagePath = window.location ? window.location.pathname : '';
              var ctaLocation = getCTALocation(target);

              window.gtag('event', 'click_to_call', {
                event_category: 'engagement',
                link_text: linkText,
                page_path: pagePath,
                cta_location: ctaLocation,
              });

              if (typeof window.__dominionAdsTrackingBlocked === 'function' && window.__dominionAdsTrackingBlocked()) {
                return;
              }

              window.gtag('event', 'conversion', {
                send_to: '${GOOGLE_ADS_CONVERSION_ID}/${GOOGLE_ADS_CALL_LABEL}',
                value: 1.0,
                currency: 'USD',
              });
            });
          })();
        `}
      </Script>
    </>
  );
}
