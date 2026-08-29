import type { Metadata, Viewport } from "next";
import { Playfair_Display, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { SITE } from "@/lib/constants";
import { GoogleAnalytics } from "./analytics";

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
  variable: "--font-body",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Sell Your House Fast in Spokane & CDA | Dominion Homes",
    template: "%s | Dominion Homes",
  },
  description:
    "Local Spokane and Coeur d'Alene area team that buys houses for cash in any condition. No commissions, no repairs, close on your timeline.",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE.url,
    siteName: SITE.name,
    title: "Sell Your House Fast in Spokane & CDA",
    description: "Get a fair cash offer from your local team. No repairs, no fees, close on your schedule.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
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
        logo: {
          "@type": "ImageObject",
          url: `${SITE.url}/images/logo1.png`,
        },
        hasMap: SITE.profiles.googleBusiness,
        award: "BBB Accredited Business since August 19, 2026",
        telephone: SITE.phone,
        address: {
          "@type": "PostalAddress",
          streetAddress: SITE.address.street,
          addressLocality: SITE.address.city,
          addressRegion: SITE.address.state,
          postalCode: SITE.address.zip,
          addressCountry: "US",
        },
        areaServed: [
          { "@type": "AdministrativeArea", name: "Spokane County, WA" },
          { "@type": "AdministrativeArea", name: "Kootenai County, ID" },
        ],
        founder: {
          "@type": "Person",
          name: "Logan Anyan",
          jobTitle: "Founder & Owner",
        },
        openingHoursSpecification: {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
          opens: "08:00",
          closes: "18:00",
        },
        contactPoint: {
          "@type": "ContactPoint",
          telephone: SITE.phone,
          contactType: "sales",
          areaServed: ["US-WA", "US-ID"],
          availableLanguage: "English",
        },
        knowsAbout: [
          "Selling a house as-is in Spokane County",
          "Direct house sales in Spokane, Washington",
          "Direct house sales in Kootenai County, Idaho",
          "Inherited and probate property sales",
          "Rental property and tenant-occupied house sales",
          "Houses with deferred maintenance or back taxes",
        ],
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Direct home-sale options",
          itemListElement: [
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: "Direct as-is house purchase",
                url: `${SITE.url}/sell/as-is`,
              },
            },
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: "Spokane County direct house sale",
                url: SITE.url,
              },
            },
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: "Coeur d'Alene and Kootenai County direct house sale",
                url: `${SITE.url}/sell-my-house-fast-coeur-d-alene`,
              },
            },
          ],
        },
        ...(SITE.sameAs.length > 0 && { sameAs: SITE.sameAs }),
      },
      {
        "@type": "WebSite",
        "@id": `${SITE.url}/#website`,
        url: SITE.url,
        name: SITE.name,
        inLanguage: "en-US",
        publisher: { "@id": `${SITE.url}/#business` },
      },
    ],
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
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
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-forest-600 focus:px-4 focus:py-2 focus:text-white focus:shadow-lg"
        >
          Skip to main content
        </a>
        <GoogleAnalytics />
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
