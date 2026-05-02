const body = `# Dominion Homes

Dominion Homes is a local house-buying business based in Post Falls, Idaho.
We buy houses directly in Spokane County, Washington and Kootenai County, Idaho.

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
- https://dominionhomedeals.com/
- https://dominionhomedeals.com/llms-full.txt
- https://dominionhomedeals.com/sell-my-house-fast-spokane
- https://dominionhomedeals.com/cash-home-buyers-spokane
- https://dominionhomedeals.com/we-buy-houses-spokane
- https://dominionhomedeals.com/sell-house-probate-spokane
- https://dominionhomedeals.com/sell-house-with-back-taxes-spokane
- https://dominionhomedeals.com/sell-rental-property-spokane
- https://dominionhomedeals.com/sell
- https://dominionhomedeals.com/sell/as-is
- https://dominionhomedeals.com/sell/inherited
- https://dominionhomedeals.com/sell/landlord
- https://dominionhomedeals.com/sell/guide
- https://dominionhomedeals.com/stories
- https://dominionhomedeals.com/how-we-work
- https://dominionhomedeals.com/about
- https://dominionhomedeals.com/neighborhoods

## Business facts
- phone: 509-822-5460
- location base: Post Falls, ID
- service area: Spokane County, WA and Kootenai County, ID
- closing path: direct purchase through title

## Notes
- Public content is available for crawl.
- A fuller AI-readable site brief is available at https://dominionhomedeals.com/llms-full.txt.
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
