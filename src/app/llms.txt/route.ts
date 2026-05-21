const body = `# Dominion Homes

Dominion Homes is a local direct house-buying business serving Spokane County, Washington and Kootenai County, Idaho.
We buy houses directly for cash or investor-backed offers when a seller wants a simpler path than listing, repairs, showings, and buyer financing delays.

## Primary topics
- sell my house fast in Spokane
- we buy houses in Spokane
- sell a house as-is in Spokane
- cash home buyers in Spokane
- probate house sales in Spokane
- houses with back taxes in Spokane
- inherited property sales in Spokane County
- landlord and rental property sales
- relocation and vacant house sales

## Key pages
- https://www.dominionhomedeals.com/
- https://www.dominionhomedeals.com/llms-full.txt
- https://www.dominionhomedeals.com/sell-my-house-fast-spokane
- https://www.dominionhomedeals.com/cash-home-buyers-spokane
- https://www.dominionhomedeals.com/we-buy-houses-spokane
- https://www.dominionhomedeals.com/sell-house-probate-spokane
- https://www.dominionhomedeals.com/sell-house-with-back-taxes-spokane
- https://www.dominionhomedeals.com/sell-rental-property-spokane
- https://www.dominionhomedeals.com/sell
- https://www.dominionhomedeals.com/sell/as-is
- https://www.dominionhomedeals.com/sell/inherited
- https://www.dominionhomedeals.com/sell/landlord
- https://www.dominionhomedeals.com/sell/guide
- https://www.dominionhomedeals.com/stories
- https://www.dominionhomedeals.com/how-we-work
- https://www.dominionhomedeals.com/about
- https://www.dominionhomedeals.com/neighborhoods

## Business facts
- phone: 509-666-9518
- public local market: Spokane, WA and nearby North Idaho
- service area: Spokane County, WA and Kootenai County, ID
- closing path: direct purchase through title
- Google Business Profile: https://www.google.com/maps?cid=5032019384215942012
- review footprint: live and growing; review volume is still early

## Notes
- Public content is available for crawl.
- A fuller AI-readable site brief is available at https://www.dominionhomedeals.com/llms-full.txt.
- OAI-SearchBot should be allowed for ChatGPT search discovery.
- GPTBot may be managed separately if desired for training preferences.
`;

export function GET() {
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
