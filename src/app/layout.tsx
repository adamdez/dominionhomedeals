// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Playfair_Display, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SITE } from "@/lib/constants";
import type { MetadataRoute } from 'next'
import { LocalBusinessSchema, FAQSchema } from './structured-data'
import { GoogleAnalytics } from './analytics'

const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Sell Your House Fast for Cash — Spokane & CDA | Dominion Homes",
    template: "%s | Dominion Homes — Cash Home Buyers",
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
        "@type": ["LocalBusiness", "RealEstateAgent"],
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
        geo: { "@type": "GeoCoordinates", latitude: 47.7177, longitude: -116.9516 },
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
        <link rel="icon" href="/icons/favicon.ico" sizes="any" />
      </head>
      <body className="min-h-screen bg-stone-50 font-body text-ink-600 antialiased">
        <GoogleAnalytics />
        <Header />
        <main id="main-content">{children}</main>
        <LocalBusinessSchema />
        <FAQSchema />
        <Footer />
      </body>
    </html>
  );
}
