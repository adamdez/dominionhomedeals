"use client";

import Script from "next/script";
import {
  ADS_TRACKING_EXCLUDED_PATHS,
  GOOGLE_ADS_CALL_LABEL,
  GOOGLE_ADS_CONVERSION_ID,
} from "@/lib/tracking";

const GA_MEASUREMENT_ID = "G-5GJ6T8KXLE";
const OPENAI_ADS_PIXEL_ID = process.env.NEXT_PUBLIC_OPENAI_ADS_PIXEL_ID || "";

export function GoogleAnalytics() {
  return (
    <>
      <Script id="google-analytics-queue" strategy="beforeInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          window.gtag = window.gtag || function(){window.dataLayer.push(arguments);};
          window.__dominionAnalyticsLoaded = false;
          window.__dominionInternalQa = function() {
            try {
              var params = new URLSearchParams(window.location.search);
              if (params.get('internal_qa') === '1') sessionStorage.setItem('dominion_internal_qa', '1');
              if (params.get('internal_qa') === '0') sessionStorage.removeItem('dominion_internal_qa');
              return sessionStorage.getItem('dominion_internal_qa') === '1' ||
                window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            } catch (error) {
              return false;
            }
          };
          window.__dominionAnalyticsBlocked = function() {
            return window.__dominionInternalQa();
          };
          window.__loadDominionAnalytics = window.__loadDominionAnalytics || function() {
            if (window.__dominionAnalyticsLoaded || window.__dominionAnalyticsBlocked()) return;
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
              return window.__dominionInternalQa() || window.__dominionAdsExcludedPaths.indexOf(path) !== -1;
            } catch (error) {
              return false;
            }
          };
          if (!window.__dominionAnalyticsBlocked()) {
            window.gtag('js', new Date());
            window.gtag('config', '${GA_MEASUREMENT_ID}');
            if (!window.__dominionAdsTrackingBlocked()) {
              window.gtag('config', '${GOOGLE_ADS_CONVERSION_ID}');
            }
          }
        `}
      </Script>
      {OPENAI_ADS_PIXEL_ID ? (
        <Script id="openai-ads-measurement-pixel" strategy="beforeInteractive">
          {`
            (function (w, d, s, u) {
              if (w.__dominionInternalQa && w.__dominionInternalQa()) return;
              if (!w.oaiq) {
                var q = function () { q.q.push(arguments); };
                q.q = [];
                w.oaiq = q;
                var js = d.createElement(s);
                js.async = true;
                js.src = u;
                var f = d.getElementsByTagName(s)[0];
                f.parentNode.insertBefore(js, f);
              }
              w.oaiq('init', { pixelId: ${JSON.stringify(OPENAI_ADS_PIXEL_ID)} });
              var path = (w.location.pathname || '/').replace(/\\/+$/, '') || '/';
              if (path === '/sell/options') {
                w.oaiq('measure', 'page_viewed', {
                  type: 'contents',
                  contents: [{ id: 'seller_options', name: 'Seller options', content_type: 'page' }]
                }, { opt_out: true });
              }
            })(window, document, 'script', 'https://bzrcdn.openai.com/sdk/oaiq.min.js');
          `}
        </Script>
      ) : null}
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
      <Script id="ad-referral-capture" strategy="afterInteractive">
        {`
          (function() {
            function getParam(name) {
              var url = new URL(window.location.href);
              return url.searchParams.get(name);
            }

            var gclid = getParam('gclid');
            var oppref = getParam('oppref');

            if (gclid) {
              try {
                localStorage.setItem('gclid', gclid);
                localStorage.setItem('gclid_ts', Date.now().toString());
              } catch (error) {}
            }

            if (oppref) {
              try {
                localStorage.setItem('oppref', oppref);
                localStorage.setItem('oppref_ts', Date.now().toString());
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
