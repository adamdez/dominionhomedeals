// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Playfair_Display, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { SITE } from "@/lib/constants";
import { GoogleAnalytics } from './analytics'

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: "400",
  style: "normal",
  display: "optional",
  variable: "--font-display",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  style: "normal",
  display: "optional",
  preload: false,
  variable: "--font-body",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Sell Your House Fast for Cash — Spokane & CDA | Dominion Homes",
    template: "%s | Dominion Homes",
  },
  description:
    "Local Spokane and Coeur d'Alene team that buys houses for cash in any condition. No commissions, no repairs, close on your timeline. Based in Post Falls, ID.",
  keywords: [
    "sell my house fast Spokane",
    "cash home buyers Spokane",
    "we buy houses Spokane",
    "sell house fast CDA",
    "cash for houses Coeur d'Alene",
    "sell house as-is Spokane",
    "home buyers Post Falls",
  ],
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE.url,
    siteName: SITE.name,
    title: "Sell Your House Fast for Cash — Spokane & CDA",
    description:
      "Get a fair cash offer from your local team. No repairs, no fees, close on your schedule.",
    images: [{ url: "/images/og-image.jpg", width: 1200, height: 630 }],
  },
  alternates: { canonical: SITE.url },
};

export const viewport: Viewport = {
  themeColor: "#FAFAF8",
  width: "device-width",
  initialScale: 1,
};

function JsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LocalBusiness",
        "@id": `${SITE.url}/#business`,
        name: SITE.legalName,
        alternateName: SITE.name,
        description: SITE.description,
        url: SITE.url,
        telephone: SITE.phone,
        address: {
          "@type": "PostalAddress",
          addressLocality: SITE.address.city,
          addressRegion: SITE.address.state,
          postalCode: SITE.address.zip,
          addressCountry: "US",
        },
        geo: { "@type": "GeoCoordinates", latitude: 47.7182, longitude: -116.9516 },
        areaServed: [
          { "@type": "AdministrativeArea", name: "Spokane County, WA" },
          { "@type": "AdministrativeArea", name: "Kootenai County, ID" },
        ],
        openingHoursSpecification: {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
          opens: "08:00",
          closes: "18:00",
        },
        ...(SITE.sameAs.length > 0 && { sameAs: SITE.sameAs }),
      },
      {
        "@type": "WebSite",
        "@id": `${SITE.url}/#website`,
        url: SITE.url,
        name: SITE.name,
        publisher: { "@id": `${SITE.url}/#business` },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${sourceSans.variable}`} suppressHydrationWarning>
      <head>
        <JsonLd />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
      </head>
      <body className="min-h-screen bg-stone-50 font-body text-ink-600 antialiased">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-lg focus:bg-forest-600 focus:px-4 focus:py-2 focus:text-white focus:shadow-lg">
          Skip to main content
        </a>
        <GoogleAnalytics />
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
