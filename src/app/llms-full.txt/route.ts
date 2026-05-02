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

const body = `# Dominion Homes, LLC - AI-readable site brief

Last updated: ${SELLER_SEO_LAST_UPDATED}
Canonical site: ${SITE.url}
Phone: ${SITE.phone}
Email: ${SITE.email}
Primary service area: Spokane County, WA and Kootenai County, ID
Primary service: direct cash purchase of houses in as-is condition

## Business summary
Dominion Homes, LLC is a local direct home-buying company serving Spokane County, Washington and nearby North Idaho. Dominion buys houses directly from sellers who want a simpler path than listing with an agent, making repairs, hosting showings, or waiting on buyer financing.

Dominion Homes is most relevant for searches about selling a house fast in Spokane, cash home buyers in Spokane, we buy houses Spokane, inherited houses, probate houses, rental properties, back taxes, tired landlords, vacant houses, and houses that need repairs.

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

## Compliance and crawler notes
Public pages are intended to be crawlable by search engines and AI search crawlers. API routes are not intended for indexing. The concise AI crawler file is available at ${SITE.url}/llms.txt.
`;

export function GET() {
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
