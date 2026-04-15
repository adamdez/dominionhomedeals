import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Playfair_Display, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { SITE } from "@/lib/constants";
import { GoogleAnalytics } from "./analytics";
import {
  getAlCanonicalOrigin,
  isBorelandRootHost,
  isCanonicalAlHost,
  normalizeHost,
} from "@/lib/al-platform";

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

export const dynamic = "force-dynamic";

function publicMetadata(): Metadata {
  return {
    metadataBase: new URL(SITE.url),
    title: {
      default: "Sell Your Spokane Home Fast — No Repairs, No Fees | Dominion Homes",
      template: "%s | Dominion Homes",
    },
    description:
      "Local Spokane team that buys houses directly. Inherited property, landlord fatigue, repairs you can't afford — we handle it. No agents, no commissions, close on your schedule.",
    keywords: [
      "sell my house fast Spokane",
      "cash home buyers Spokane",
      "we buy houses Spokane",
      "sell house fast CDA",
      "cash for houses Coeur d'Alene",
      "sell house as-is Spokane",
      "home buyers Spokane",
    ],
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: SITE.url,
      siteName: SITE.name,
      title: "Sell Your Spokane Home Fast — No Repairs, No Fees | Dominion Homes",
      description: "Local Spokane team that buys houses directly. No agents, no commissions, close on your schedule.",
      images: [{ url: "/images/og-image.jpg", width: 1200, height: 630 }],
    },
    alternates: { canonical: SITE.url },
  };
}

function privateAppMetadata(): Metadata {
  const origin = getAlCanonicalOrigin();
  return {
    metadataBase: new URL(origin),
    title: {
      default: "AL Boreland",
      template: "%s | AL Boreland",
    },
    description: "Private operating system for AL Boreland.",
    robots: { index: false, follow: false },
    alternates: { canonical: origin },
  };
}

function privateRootMetadata(): Metadata {
  return {
    metadataBase: new URL("https://borelandops.com"),
    title: "Boreland Ops",
    description: "Private operating root for AL Boreland.",
    robots: { index: false, follow: false },
    alternates: { canonical: "https://borelandops.com" },
  };
}

function isPrivateAppPath(pathname: string): boolean {
  return /^(\/al(\/|$)|\/boardroom(\/|$)|\/planner(\/|$)|\/reviews(\/|$)|\/borelandops-root(\/|$))/.test(pathname);
}

export async function generateMetadata(): Promise<Metadata> {
  const headerStore = await headers();
  const host = normalizeHost(headerStore.get("host"));

  if (isCanonicalAlHost(host)) return privateAppMetadata();
  if (isBorelandRootHost(host)) return privateRootMetadata();
  return publicMetadata();
}

export async function generateViewport(): Promise<Viewport> {
  const headerStore = await headers();
  const host = normalizeHost(headerStore.get("host"));

  return {
    themeColor: isCanonicalAlHost(host) || isBorelandRootHost(host) ? "#0a0f0d" : "#FAFAF8",
    width: "device-width",
    initialScale: 1,
  };
}

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
        geo: { "@type": "GeoCoordinates", latitude: 47.6588, longitude: -117.426 },
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

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headerStore = await headers();
  const host = normalizeHost(headerStore.get("host"));
  const pathname = headerStore.get("x-pathname") || "";
  const isPrivateHost = isCanonicalAlHost(host) || isBorelandRootHost(host);
  const usePublicChrome = !isPrivateHost && !isPrivateAppPath(pathname);

  return (
    <html lang="en" className={`${playfair.variable} ${sourceSans.variable}`} suppressHydrationWarning>
      <head>
        {!isPrivateHost ? <JsonLd /> : null}
        {isPrivateHost ? (
          <>
            <link rel="icon" type="image/png" sizes="32x32" href="/icons/al-favicon-32x32.png?v=2" />
            <link rel="icon" type="image/png" sizes="16x16" href="/icons/al-favicon-16x16.png?v=2" />
            <link rel="apple-touch-icon" sizes="180x180" href="/icons/al-apple-touch-icon.png?v=2" />
          </>
        ) : (
          <>
            <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
            <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
            <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
          </>
        )}
      </head>
      <body className="min-h-screen bg-stone-50 font-body text-ink-600 antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-forest-600 focus:px-4 focus:py-2 focus:text-white focus:shadow-lg"
        >
          Skip to main content
        </a>
        {!isPrivateHost ? <GoogleAnalytics /> : null}
        {usePublicChrome ? <SiteChrome>{children}</SiteChrome> : <main id="main-content">{children}</main>}
      </body>
    </html>
  );
}
