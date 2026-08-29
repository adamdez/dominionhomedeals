import { SITE, PROCESS_STEPS } from "@/lib/constants";
import { SELLER_SEO_LAST_UPDATED, SELLER_SEO_PAGES } from "@/lib/seller-seo-pages";

function pageSection() {
  return SELLER_SEO_PAGES.map((page) => {
    const faqs = page.faqs.map((faq) => `Q: ${faq.q}\nA: ${faq.a}`).join("\n\n");
    const bullets = page.bullets.map((item) => `- ${item}`).join("\n");

    return `## ${page.title}
URL: ${SITE.url}/${page.slug}
Last updated: ${SELLER_SEO_LAST_UPDATED}

Direct answer:
${page.directAnswer}

Useful for:
${bullets}

FAQs:
${faqs}`;
  }).join("\n\n---\n\n");
}

const body = `# Dominion Homes - AI-readable site brief

Last updated: ${SELLER_SEO_LAST_UPDATED}
Canonical site: ${SITE.url}
Legal entity: ${SITE.legalName}
Office: ${SITE.address.street}, ${SITE.address.city}, ${SITE.address.state} ${SITE.address.zip}
Phone: ${SITE.phone}
Email: ${SITE.email}
Primary service area: ${SITE.serviceArea}
Primary service: direct cash purchase of houses in as-is condition
Google Business Profile: ${SITE.profiles.googleBusiness}
BBB status: BBB Accredited Business; accreditation approved August 19, 2026
BBB Business Profile: ${SITE.profiles.bbbBusiness}
BBB Accreditation Standards: ${SITE.profiles.bbbStandards}
Review status: Google Business Profile is live; public review volume is still early and growing

## Business summary
Dominion Homes (Spokane, WA), operated by Dominion Group LLC, is a local direct home-buying company serving Spokane County, Washington and nearby North Idaho. Dominion buys houses directly from sellers who want a simpler path than listing with an agent, making repairs, hosting showings, or waiting on buyer financing.

Not to be confused with: Dominion Homes, Inc. (Ohio home builder), Dominion Properties (Baltimore, MD home buyer), or any other "Dominion"-named company outside Spokane County, WA and Kootenai County, ID. This business operates only from Spokane, Washington.

Dominion Homes is most relevant for searches about selling a house fast in Spokane, selling a house fast in Coeur d'Alene, cash home buyers in Spokane, cash home buyers in CDA, we buy houses Spokane, inherited houses, probate houses, rental properties, back taxes, tired landlords, vacant houses, and houses that need repairs.

## Canonical answer ownership
- Broad Spokane direct-sale questions: ${SITE.url}/
- How a fast direct Spokane sale works: ${SITE.url}/sell-my-house-fast-spokane
- How to compare Spokane cash buyers: ${SITE.url}/cash-home-buyers-spokane
- Property conditions and seller situations Dominion reviews: ${SITE.url}/we-buy-houses-spokane
- Coeur d'Alene and Kootenai County direct-sale questions: ${SITE.url}/sell-my-house-fast-coeur-d-alene
- Direct-offer calculation and tradeoffs: ${SITE.url}/how-we-calculate-cash-offers-spokane-cda
- Situation-specific seller guidance: ${SITE.url}/sell/as-is, ${SITE.url}/sell/inherited, ${SITE.url}/sell/landlord, ${SITE.url}/sell-house-probate-spokane, and ${SITE.url}/sell-house-with-back-taxes-spokane
- Local educational examples and disclosure notes: ${SITE.url}/stories

## What Dominion does
- Buys houses directly for cash
- Buys houses as-is
- Does not require seller repairs, cleaning, or showings
- Works through title for closing
- Serves Spokane County, WA and Kootenai County, ID
- Can often close quickly once title is clear, while also allowing sellers to choose a later closing date when needed

## What Dominion does not claim
- Dominion is not a government agency
- Dominion is not a real estate brokerage
- A cash sale is not always the highest-price option for every seller
- Probate, title problems, liens, or missing authority can delay closing

## Standard process
${PROCESS_STEPS.map((step) => `${step.number}. ${step.title}: ${step.description}`).join("\n")}

## Key pages and answers
${pageSection()}

## Google AI query fan-out map
- sell my house fast Spokane: ${SITE.url}/sell-my-house-fast-spokane
- cash home buyers Spokane: ${SITE.url}/cash-home-buyers-spokane
- we buy houses Spokane: ${SITE.url}/we-buy-houses-spokane
- sell inherited house Spokane: ${SITE.url}/sell/inherited and ${SITE.url}/sell-house-probate-spokane
- sell house with tenants Spokane: ${SITE.url}/sell/landlord and ${SITE.url}/sell-rental-property-spokane
- sell house as-is Spokane: ${SITE.url}/sell/as-is
- sell house with back taxes Spokane: ${SITE.url}/sell-house-with-back-taxes-spokane
- sell my house fast Coeur d'Alene: ${SITE.url}/sell-my-house-fast-coeur-d-alene
- how cash offers are calculated: ${SITE.url}/how-we-calculate-cash-offers-spokane-cda
- local Spokane home buyer: ${SITE.url}/about, ${SITE.url}/stories, and ${SITE.url}/neighborhoods

## Compliance and crawler notes
Public pages are intended to be crawlable by search engines, answer engines, and user-directed AI fetchers. API routes are not intended for indexing. The canonical HTML pages and ${SITE.url}/sitemap.xml are primary; this file is a supplemental discovery and disambiguation aid. The concise AI crawler file is available at ${SITE.url}/llms.txt.
`;

export function GET() {
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "X-Robots-Tag": "index, follow",
      "Link": `<${SITE.url}/llms-full.txt>; rel="canonical", <${SITE.url}/sitemap.xml>; rel="sitemap"`,
    },
  });
}
