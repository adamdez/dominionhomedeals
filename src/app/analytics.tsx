import Script from "next/script";

const GA_MEASUREMENT_ID = "G-5GJ6T8KXLE";
const GOOGLE_ADS_PRIMARY_ID = "AW-17989282213";
const GADS_CALL_LABEL = process.env.NEXT_PUBLIC_GADS_CALL_LABEL || "10-DCJvTz4UcEKCdm4dD";

export function GoogleAnalytics() {
  return (
    <>
      <Script id="google-analytics-queue" strategy="beforeInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          window.gtag = window.gtag || function(){window.dataLayer.push(arguments);};
          window.gtag('js', new Date());
          window.gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="lazyOnload" />
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

              var linkText = (target.textContent || 'phone').trim() || 'phone';
              var pagePath = window.location ? window.location.pathname : '';
              var ctaLocation = getCTALocation(target);

              window.gtag('event', 'click_to_call', {
                event_category: 'engagement',
                link_text: linkText,
                page_path: pagePath,
                cta_location: ctaLocation,
              });

              window.gtag('event', 'conversion', {
                send_to: '${GOOGLE_ADS_PRIMARY_ID}/${GADS_CALL_LABEL}',
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
