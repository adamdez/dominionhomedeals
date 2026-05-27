// src/lib/off-market-listings.ts
import { SITE } from '@/lib/constants'
import riversideTrailer29Photos from '@/data/riverside-trailer-29-photos.json'
import cleveland3314Photos from '@/data/3314-e-cleveland-photos.json'
import virgilWay6714Photos from '@/data/6714-virgil-way-photos.json'
import wiscomb2443Photos from '@/data/2443-n-wiscomb-st-photos.json'

export type OffMarketPhoto = { src: string; alt: string }

export type OffMarketListing = {
  slug: string
  status: 'active' | 'sold' | 'draft'
  title: string
  locationLine: string
  priceDisplay: string
  priceNumeric: number
  buyNowDisplay?: string
  eyebrow: string
  tags: string[]
  beds: string
  baths: string
  sqft: string
  lot: string
  year: string
  county: string
  streetAddress: string
  city: string
  state: string
  zip: string
  conditionSummary: string
  summary: string
  paragraphs: string[]
  highlights: { text: string }[]
  buyerOptions?: { title: string; body: string }[]
  facts: [string, string][]
  photos: OffMarketPhoto[]
  neighborhoodTitle: string
  neighborhoodBody: string
  distanceChips: { label: string; value: string }[]
  compLinks?: { label: string; href: string }[]
  mapQuery: string
  leadSource: string
  lat: number
  lng: number
  cardImageSrc: string
  countySearchUrl?: string
  countySearchLabel?: string
  contactName?: string
  contactPhone?: string
  contactPhoneDisplay?: string
  contactEmail?: string
  primaryCtaLabel?: string
  secondaryCtaLabel?: string
  smsBody?: string
  actionTitle?: string
  actionIntro?: string
  actionSteps?: [string, string][]
  submitLabel?: string
  sourceNote?: string
  dueDiligenceNote?: string
}

const listings: Record<string, OffMarketListing> = {
  '2443-n-wiscomb-st': {
    slug: '2443-n-wiscomb-st',
    status: 'active',
    title: '2443 N Wiscomb St',
    locationLine: 'Spokane, WA 99207',
    priceDisplay: '$154,000',
    priceNumeric: 154000,
    eyebrow: 'Private offering · North Spokane investor opportunity',
    tags: ['$154K asking', '$255K-$275K ARV target', '3 bed / 1 bath', '1,043 sq ft', 'Large corner lot', 'Quick flip lane'],
    beds: '3',
    baths: '1',
    sqft: '1,043',
    lot: '6,000 sq ft',
    year: '1912',
    county: 'Spokane County',
    streetAddress: '2443 N Wiscomb St',
    city: 'Spokane',
    state: 'WA',
    zip: '99207',
    conditionSummary:
      'Asking $154,000 for a simple North Spokane 3/1 on a corner lot. We think the finished value is roughly $255K-$275K depending on repairs and how clean the finished product looks. This looks like a pretty basic, quick flip: clean it up, make it bright, tighten the curb appeal, and resell a small affordable house in Spokane city.',
    summary:
      'Private off-market opportunity at 2443 N Wiscomb St in Spokane, WA. Asking price is $154,000. The property is a 3 bed, 1 bath, 1,043 sq ft bungalow on a corner lot with an estimated $255K-$275K ARV target. Straightforward quick-flip lane with possible lot and R1 upside to verify.',
    paragraphs: [
      '2443 N Wiscomb St is the kind of house a lot of buyers can understand fast: small 3/1, corner lot, older but not mysterious from the photos. It needs cleanup, cosmetic work, and a clean finish, not a big story.',
      'The main play is a quick flip. Buy at $154K, keep the remodel tight, make the first photo look good, and aim at the $255K-$275K ARV lane after repairs.',
      'The lot is the extra hook. It is a larger corner setup in Spokane city, so a buyer can also check R1, ADU, or future lot-use upside. That is not required for the basic flip to make sense, but it may give the right buyer another angle.',
    ],
    highlights: [
      { text: '$154,000 asking price' },
      { text: 'Working ARV target: $255K-$275K after a clean remodel' },
      { text: '3 bed / 1 bath / 1,043 sq ft Spokane city bungalow' },
      { text: 'Large corner lot with better street presence than a tight interior lot' },
      { text: 'Simple buyer story: clean it out, freshen the house, sharpen the curb appeal, and resell' },
      { text: 'Photos show the main rooms, bedrooms, bath, kitchen, panel, water heater, yard, and exterior' },
      { text: 'R1 / ADU / lot-use upside may be worth a look, but the quick flip is the main lane' },
      { text: 'Good fit for a cash or hard-money buyer who can walk it, price it, and move' },
    ],
    buyerOptions: [
      {
        title: 'Quick 3/1 flip',
        body: 'This is the cleanest play. Keep it simple, make it bright, fix what needs fixing, and get it back on market as an affordable Spokane house.',
      },
      {
        title: '$255K-$275K ARV target',
        body: 'We think a clean finished product can land in this range if the rehab is tight and the first impression is strong. Buyers should run their own comps, but the spread is there to look at.',
      },
      {
        title: 'Corner lot helps',
        body: 'The corner lot gives the house more breathing room and a better curb-appeal shot than a cramped mid-block setup. That matters when the finished buyer is shopping by first photo.',
      },
      {
        title: 'Basic rental backup',
        body: 'If resale is not the only plan, a small Spokane 3/1 can also be checked as a rental. The right buyer can decide whether to flip it or hold it after seeing the repair number.',
      },
      {
        title: 'Lot upside to check',
        body: 'R1 zoning and the lot layout may give an ADU or future-use angle. Treat that as upside to verify, not something you need for the basic flip math.',
      },
    ],
    facts: [
      ['Address', '2443 N Wiscomb St'],
      ['City', 'Spokane'],
      ['State', 'Washington'],
      ['ZIP Code', '99207'],
      ['County', 'Spokane County'],
      ['Parcel', '35082.2701'],
      ['Status', 'Available for buyer review'],
      ['Asking price', '$154,000'],
      ['Sale type', 'Private as-is opportunity'],
      ['ARV target', '$255,000-$275,000 after a clean remodel - buyer to verify'],
      ['Spread before repairs/costs', 'Roughly $101K-$121K between ask and ARV target'],
      ['Bedrooms', '3 - buyer to verify'],
      ['Bathrooms', '1 - buyer to verify'],
      ['House square footage', '1,043 sq ft reported in prior county review - buyer to verify'],
      ['Lot', 'Corner lot; 6,000 sq ft / roughly 50 x 120 - buyer to verify'],
      ['Year built', '1912 reported publicly - buyer to verify'],
      ['Zoning / lot angle', 'R1 / ADU / lot-use upside may be worth checking - buyer to verify'],
      ['Best-fit buyer', 'Cash or hard-money investor ready for a quick 3/1 flip'],
    ],
    photos: wiscomb2443Photos as OffMarketPhoto[],
    neighborhoodTitle: 'North Spokane / 99207',
    neighborhoodBody:
      '2443 N Wiscomb St sits in Spokane city north of the river, near the Logan / North Spokane buyer pool. The deal should be reviewed as a small 3/1 no-garage rehab first, with the lot and R1 zoning treated as upside only after a buyer verifies layout, access, utilities, permits, and build cost.',
    distanceChips: [
      { label: 'Asking', value: '$154K' },
      { label: 'ARV target', value: '$255K-$275K' },
      { label: 'Spread', value: '$101K-$121K' },
      { label: 'Beds/Baths', value: '3 / 1' },
      { label: 'Sq Ft', value: '1,043' },
      { label: 'Lot', value: 'Large corner' },
      { label: 'Play', value: 'Quick flip' },
    ],
    compLinks: [
      {
        label: '1428 E North Ave',
        href: 'https://www.redfin.com/WA/Spokane/1428-E-North-Ave-99207/home/116920769',
      },
      {
        label: '2002 E Dalton Ave',
        href: 'https://www.realtor.com/realestateandhomes-detail/2002-E-Dalton-Ave_Spokane_WA_99207_M13714-36288',
      },
      {
        label: '3423 N Stone St',
        href: 'https://www.redfin.com/WA/Spokane/3423-N-Stone-St-99207/home/117031106',
      },
      {
        label: '2928 N Cook St',
        href: 'https://www.redfin.com/WA/Spokane/2928-N-Cook-St-99207/home/116443374',
      },
      {
        label: '2424 N Addison St',
        href: 'https://www.zillow.com/homedetails/2424-N-Addison-St-Spokane-WA-99207/97811331_zpid/',
      },
      {
        label: '1010 E Montgomery Ave',
        href: 'https://www.redfin.com/WA/Spokane/1010-E-Montgomery-Ave-99207/home/170580847',
      },
    ],
    mapQuery: '2443 N Wiscomb St Spokane WA 99207',
    leadSource: 'off-market-2443-n-wiscomb-st',
    lat: 47.68,
    lng: -117.4023,
    cardImageSrc: wiscomb2443Photos[0]?.src ?? '/images/2443-n-wiscomb-st/038.webp',
    countySearchUrl: 'https://cp.spokanecounty.org/scout/propertyinformation/?PID=35082.2701',
    countySearchLabel: 'Spokane County SCOUT record',
    contactName: 'Adam',
    contactPhone: '5095907091',
    contactPhoneDisplay: '509-590-7091',
    contactEmail: 'adam@dominionhomedeals.com',
    primaryCtaLabel: 'Request access',
    secondaryCtaLabel: 'Text Adam',
    smsBody:
      'I want to review 2443 N Wiscomb St at the $154,000 asking price. Can I get access/details?',
    actionTitle: 'How to move on this',
    actionIntro:
      'Send your contact info, close path, and when you can see it. Adam will get you the next step.',
    actionSteps: [
      ['1', 'Review the photos, $154K asking price, and $255K-$275K ARV target.'],
      ['2', 'Run it as a basic 3/1 quick flip first. Treat lot upside as extra.'],
      ['3', 'Text or submit the form with your proof-of-funds path and timing.'],
      ['4', 'Walk it, price your scope, and make your call.'],
    ],
    submitLabel: 'Request access',
    sourceNote:
      'Asking price and ARV target are current working numbers as of 2026-05-26. Buyer should verify condition, repairs, square footage, lot size, zoning, resale value, and all investment assumptions independently.',
    dueDiligenceNote:
      'This is a private as-is opportunity. Photos, comps, map, and zoning notes are for buyer review only. Buyer should verify the property, repairs, access, title, resale value, and any lot-use upside before closing.',
  },
  '6714-virgil-way': {
    slug: '6714-virgil-way',
    status: 'active',
    title: '6714 Virgil Way',
    locationLine: 'Nine Mile Falls, WA 99026',
    priceDisplay: '$99,000',
    priceNumeric: 99000,
    buyNowDisplay: '$85,000',
    eyebrow: 'Private offering · Two-parcel land play',
    tags: ['$85K Buy Now', '$99,000 asking', '7.5 acres', 'Two parcels', 'Power and water ready', 'Mobile home swap path'],
    beds: 'Land',
    baths: 'N/A',
    sqft: 'Build site',
    lot: '7.5 acres / 2 parcels',
    year: 'Ready',
    county: 'Stevens County',
    streetAddress: '6714 Virgil Way',
    city: 'Nine Mile Falls',
    state: 'WA',
    zip: '99026',
    conditionSummary:
      '7.5-acre, two-parcel Nine Mile Falls land opportunity with an $85,000 Buy Now option and a $99,000 asking price. Power and water are already part of the story. The simple play may be removing the old manufactured home and setting a cleaner one, or using the parcels for a new-build plan. Buyer to verify the exact county path.',
    summary:
      'Private sale opportunity at 6714 Virgil Way in Nine Mile Falls, WA. Buy Now at $85,000, or review the $99,000 asking price for 7.5 acres across two parcels with power and water ready, an existing manufactured home on site, and a few practical ways a buyer could make it work.',
    paragraphs: [
      '6714 Virgil Way is not just raw land. It is 7.5 acres across a two-parcel setup with power and water ready, plus an older manufactured home already sitting there. That gives a buyer something to work from instead of starting at zero.',
      'The cleanest buyer angle may be a mobile home swap: remove the rough existing home, bring in a cleaner manufactured home, and reuse whatever site pieces can be reused. That only works if the county, utility, and septic path checks out, but it is the first thing a practical buyer should look at.',
      'A second path is a new build or small builder land play. Two parcels may give more flexibility than a single lot, especially if one parcel can carry the main plan and the other adds room, resale value, or a future option. Buyer needs to verify parcel lines, setbacks, access, and whether each parcel can stand on its own.',
      'This is best for someone who knows how to make calls, check permits, and price cleanup quickly. If the manufactured home replacement path is simple, there may be a fast equity story. If it is not, the value is still in the land, utilities, and two-parcel setup.',
    ],
    highlights: [
      { text: '$99,000 asking price for 7.5 acres across two parcels' },
      { text: '$85,000 Buy Now option for a buyer ready to move quickly' },
      { text: 'The land is the hook: enough acreage to make this more than a tiny-lot mobile home deal' },
      { text: 'Power and water are already part of the setup - buyer to verify service details' },
      { text: 'Two parcels give the deal more angles than a single-lot dirt purchase' },
      { text: 'Existing manufactured home may create a simple remove-and-replace path if the county/septic side checks out' },
      { text: 'New manufactured home, modular, stick-built, hold, or resale paths are all worth checking' },
      { text: 'Not a retail-ready property. The buyer is buying the setup and solving the next step.' },
      { text: 'Nine Mile Falls location with a rural/residential feel' },
      { text: 'Property photos available for quick visual review' },
      { text: 'Direct private sale path through Dominion' },
      { text: 'Good fit for a builder, mobile-home buyer, owner-user, land buyer, or investor who can do quick due diligence' },
      { text: 'Buyer to verify utility service, septic, access, boundaries, and buildability independently' },
    ],
    buyerOptions: [
      {
        title: 'Bring in a better mobile home',
        body: 'The simplest win may be replacing what is there with a cleaner manufactured home. The land already has the kind of setup buyers usually spend time hunting for: room, access, power, and water. If the county and septic path check out, this could be a much faster project than starting with raw dirt.',
      },
      {
        title: 'Set a new manufactured or modular home',
        body: 'A newer manufactured or modular home could fit the buyer who wants acreage without taking on a full custom build. At $85,000 Buy Now, the appeal is buying the land first, then putting the right home on it instead of paying retail for someone else\'s finished version.',
      },
      {
        title: 'Build something new',
        body: 'For a builder or owner-user, 7.5 acres in Nine Mile Falls gives you a real canvas. The old home is not the prize. The land is. A buyer can look at whether the existing driveway, power, and water help shorten the path to a new home.',
      },
      {
        title: 'Keep options open with two parcels',
        body: 'Two parcels gives the deal more flexibility than a single chunk of land. Maybe one parcel carries the main home and the other adds elbow room. Maybe there is a future resale angle. The right buyer will want to check exactly what the county allows.',
      },
      {
        title: 'Clean it up and make it easier to buy',
        body: 'There may be value in doing the work most buyers do not want to do: clean up the property, confirm the utility story, gather the records, and make the next step obvious. A clearer, cleaner 7.5-acre site is easier for the next buyer to say yes to.',
      },
      {
        title: 'Buy the land and take your time',
        body: 'Not every buyer needs to swing a hammer on day one. Someone who wants acreage near Nine Mile Falls may simply want to control the land now, clean it up, and decide later whether to build, replace the home, or hold it for the next move.',
      },
    ],
    facts: [
      ['Address', '6714 Virgil Way'],
      ['City', 'Nine Mile Falls'],
      ['State', 'Washington'],
      ['ZIP Code', '99026'],
      ['County', 'Stevens County'],
      ['Buy Now option', '$85,000'],
      ['Asking price', '$99,000'],
      ['Sale type', 'Private as-is disposition'],
      ['Property type', 'Land / manufactured-home replacement / build-site opportunity'],
      ['Acreage', '7.5 acres - buyer to verify lot size and parcel boundaries'],
      ['Parcel count', 'Two parcels - buyer to verify parcel IDs and boundaries'],
      ['Existing home', 'Older manufactured home currently on site; likely remove/replace candidate - buyer to verify title, age, permits, and rules'],
      ['Possible plays', 'Mobile home swap, new manufactured/modular, stick-built home, cleanup/resale, hold, or parcel-specific plan - buyer to verify'],
      ['Power', 'Ready / available - buyer to verify provider, meter status, and connection details'],
      ['Water', 'Ready / available - buyer to verify source, service, and connection details'],
      ['Septic', 'Buyer to verify feasibility, permits, and requirements'],
      ['Access', 'Buyer to verify legal and physical access'],
      ['Best-fit buyer', 'Builder, manufactured-home buyer, owner-user, land buyer, or investor ready for land due diligence'],
    ],
    photos: virgilWay6714Photos as OffMarketPhoto[],
    neighborhoodTitle: 'Nine Mile Falls / Stevens County',
    neighborhoodBody:
      'Nine Mile Falls offers a quieter northwest-of-Spokane setting with access to outdoor recreation, residential acreage, and the broader Spokane buyer pool. This opportunity is framed around a two-parcel build path with power and water ready, subject to buyer verification of all land-use and utility assumptions.',
    distanceChips: [
      { label: 'Buy Now', value: '$85K' },
      { label: 'Asking', value: '$99K' },
      { label: 'Land', value: '7.5 acres' },
      { label: 'Parcels', value: 'Two' },
      { label: 'Utilities', value: 'Power + water' },
      { label: 'Use', value: 'Build / replace' },
    ],
    mapQuery: '6714 Virgil Way Nine Mile Falls WA 99026',
    leadSource: 'off-market-6714-virgil-way',
    lat: 47.83,
    lng: -117.62,
    cardImageSrc: virgilWay6714Photos[0]?.src ?? '/images/6714-virgil-way/001.webp',
    countySearchUrl:
      'https://propertysearch.trueautomation.com/PropertyAccess/Property.aspx?cid=0&year=2025&prop_id=59368',
    countySearchLabel: 'Stevens County property record',
    contactName: 'Adam',
    contactPhone: '5095907091',
    contactPhoneDisplay: '509-590-7091',
    contactEmail: 'adam@dominionhomedeals.com',
    primaryCtaLabel: 'Request terms',
    secondaryCtaLabel: 'Text Adam',
    smsBody:
      'I want to review 6714 Virgil Way. I saw the $85,000 Buy Now option and the $99,000 asking price for 7.5 acres across two parcels with power/water ready.',
    actionTitle: 'How to move on this',
    actionIntro:
      'Send your contact info, intended use, proof-of-funds path, and timing. Adam will respond with the next step.',
    actionSteps: [
      ['1', 'Review the photos, 7.5 acres, two-parcel setup, $85,000 Buy Now option, and $99,000 asking price.'],
      ['2', 'Pick your likely play: mobile home swap, new manufactured/modular, stick-built home, cleanup/resale, or hold.'],
      ['3', 'Text or submit the form with your intended use, proof-of-funds path, timing, and what you still need to verify.'],
      ['4', 'Call the county/utility/septic contacts before relying on any build or replacement plan.'],
    ],
    submitLabel: 'Request terms',
    sourceNote:
      'Source note as of 2026-05-19: Property details are based on the current Dominion disposition notes and linked Stevens County property record. Buy Now option is $85,000 and asking price is $99,000. Buyer should verify parcel IDs, acreage, existing manufactured home status, utilities, access, septic feasibility, zoning, replacement rules, new-construction rules, and buildability independently.',
    dueDiligenceNote:
      'Photos, map, and property-record links are for review only. Buyer must verify parcel boundaries, acreage, legal access, easements, road maintenance, power, water, septic feasibility, manufactured home replacement rules, utility reuse, utility costs, zoning, setbacks, permits, title, closing costs, and all building assumptions independently. This is a private as-is disposition opportunity and not a retail MLS listing.',
  },
  '3314-e-cleveland': {
    slug: '3314-e-cleveland',
    status: 'active',
    title: '3314 E Cleveland Ave',
    locationLine: 'Spokane, WA 99217',
    priceDisplay: '$160,000',
    priceNumeric: 160000,
    eyebrow: 'Private offering · Investor opportunity',
    tags: ['$160K sale price', '4 bed / 2 bath', '1,872 sq ft', '$340K ARV', '$11K roof quote', 'R1 multifamily / ADU upside'],
    beds: '4',
    baths: '2',
    sqft: '1,872',
    lot: '7,100 sq ft',
    year: '1971',
    county: 'Spokane County',
    streetAddress: '3314 E Cleveland Ave',
    city: 'Spokane',
    state: 'WA',
    zip: '99217',
    conditionSummary:
      'Private as-is opportunity with clear investor plays: flip it as a 4/2, keep it as a rental, or explore a basement ADU. Roof quote is $11K including re-sheeting.',
    summary:
      'Private as-is Dominion disposition opportunity at 3314 E Cleveland Ave in Spokane, WA. Sale price is $160,000. The 4 bed, 2 bath home is being presented as approximately 1,872 sq ft with a full upstairs/downstairs layout, $340K ARV, city-confirmed R1 multifamily / ADU upside, and an $11K roof quote including re-sheeting.',
    paragraphs: [
      '3314 E Cleveland Ave has more than one way to win at a $160,000 sale price. It already lays out as a 4 bed / 2 bath home and is being presented as approximately 1,872 sq ft with a full upstairs/downstairs layout.',
      'The simple play is to renovate it back into a clean 4 bed / 2 bath resale around the $340K ARV target. The extra upside is the basement ADU path. A buyer may be able to keep the 4/2 layout and still add income potential. City confirmed R1 zoning with multifamily / ADU potential.',
      'Utilities come from Cleveland, not the alley. That matters if you are looking at a basement ADU or future utility split. Roof quote is $11K including re-sheeting. Review the photos, look at the comps, then contact Adam with your close path.',
    ],
    highlights: [
      { text: 'Multiple exit paths: flip it, rent it, add a basement ADU, BRRRR/refi, or explore broader R1 upside' },
      { text: '$340K ARV target supported by nearby retail comp links below' },
      { text: 'Keep the 4/2 layout and still explore basement ADU upside' },
      { text: '1,872 sq ft upstairs/downstairs layout gives the buyer more to work with' },
      { text: 'City-confirmed R1 zoning with multifamily / ADU potential' },
      { text: 'Utilities come from Cleveland, not the alley. That matters for a basement ADU or future utility split.' },
      { text: '$11K roof quote in hand, including re-sheeting' },
      { text: 'Cleaned-out photos are included so buyers can see the project clearly' },
      { text: 'Private/direct sale path through Dominion for cash or hard-money buyers who can move quickly' },
    ],
    buyerOptions: [
      {
        title: 'Clean 4/2 flip',
        body: 'Fix it up as a 4 bed / 2 bath house and aim at the $340K ARV target. The cleaned-out photos, 1,872 sq ft layout, and comp links make the finished-value story easy to check.',
      },
      {
        title: 'Keep the 4/2 and add basement ADU',
        body: 'This is the big upside angle. A buyer may be able to keep the 4 bed / 2 bath house and still explore a clean basement ADU. You are not forced to choose between a strong resale layout and extra income potential.',
      },
      {
        title: 'Keep it as a rental',
        body: 'A larger 4/2 can also work as a hold. Rehab it to be durable, rent it, and keep the R1 / ADU upside for later instead of needing every dollar to come from resale.',
      },
      {
        title: 'BRRRR or refi play',
        body: 'A buyer could buy, rehab, rent, and try to refinance after the work is done. The $340K ARV target, 1,872 sq ft layout, and R1 upside are the pieces to run your numbers against.',
      },
      {
        title: 'R1 / utility upside',
        body: 'The City confirmed R1 zoning with multifamily / ADU potential. Utilities come from Cleveland, not the alley. That is useful if you are looking at a basement ADU, future utility split, or another permitted setup.',
      },
      {
        title: 'Roof quote in hand',
        body: 'Roof quote is $11K including re-sheeting. Buyer to verify final scope, but this gives you a real number to plug into your repair budget.',
      },
    ],
    facts: [
      ['Address', '3314 E Cleveland Ave'],
      ['City', 'Spokane'],
      ['State', 'Washington'],
      ['ZIP Code', '99217'],
      ['County', 'Spokane County'],
      ['Status', 'Available'],
      ['Sale price', '$160,000'],
      ['Sale type', 'Private as-is disposition'],
      ['ARV', '$340,000 target - buyer to verify'],
      ['Zoning', 'R1 - City confirmed multifamily / ADU potential; buyer to verify permit path'],
      ['ADU upside', 'Potential to keep 4/2 layout and explore clean basement ADU path - buyer to verify'],
      ['Utilities', 'Utilities come from Cleveland, not the alley - buyer to verify'],
      ['Roof quote', '$11,000 quote in hand including re-sheeting - buyer to verify scope'],
      ['Bedrooms', '4 - buyer to verify'],
      ['Bathrooms', '2 - buyer to verify'],
      ['House square footage', 'Approximately 1,872 sq ft - buyer to verify'],
      ['Approx. total upper/lower footprint', 'About 1,872 sq ft with full upstairs/downstairs layout - buyer to verify'],
      ['Basement', 'Full basement; partially finished / additional finishable upside - buyer to verify'],
      ['Lot size', '7,100 sq ft reported publicly - buyer to verify'],
      ['Year built', '1971 reported publicly - buyer to verify'],
      ['Property type', 'Single-family residential reported publicly - buyer to verify'],
      ['Best-fit buyer', 'Cash or hard-money buyer ready for direct due diligence'],
    ],
    photos: cleveland3314Photos as OffMarketPhoto[],
    neighborhoodTitle: 'Northeast Spokane / 99217',
    neighborhoodBody:
      'The property sits in the 99217 area of northeast Spokane, with practical access to nearby arterials, neighborhood services, and the broader Spokane buyer and rental pool. This is a 1,872 sq ft 4/2 with a $340K ARV target, city-confirmed R1 zoning, and a possible basement ADU path that may let a buyer keep the 4/2 layout while adding income upside. Utilities come from Cleveland, not the alley, and the $11K roof quote is already in hand. Buyers should verify the permit path, finished area, and repair scope, but the main plays are easy to see.',
    distanceChips: [
      { label: 'ARV', value: '$340K' },
      { label: 'Price', value: '$160K' },
      { label: 'Beds/Baths', value: '4 / 2' },
      { label: 'Sq Ft', value: '1,872' },
    ],
    compLinks: [
      {
        label: '4230 E Marietta Ave',
        href: 'https://www.zillow.com/homedetails/4230-E-Marietta-Ave-Spokane-WA-99217/23518139_zpid/',
      },
      {
        label: '3832 E Grace Ave',
        href: 'https://www.zillow.com/homedetails/3832-E-Grace-Ave-Spokane-WA-99217/23517746_zpid/',
      },
      {
        label: '2516 N Rebecca St',
        href: 'https://www.zillow.com/homedetails/2516-N-Rebecca-St-Spokane-WA-99217/23517965_zpid/',
      },
      {
        label: '4109 E Marietta Ave',
        href: 'https://www.zillow.com/homedetails/4109-E-Marietta-Ave-Spokane-WA-99217/23517870_zpid/',
      },
    ],
    mapQuery: '3314 E Cleveland Ave Spokane WA 99217',
    leadSource: 'off-market-3314-e-cleveland',
    lat: 47.692,
    lng: -117.354,
    cardImageSrc: cleveland3314Photos[0]?.src ?? '/images/3314-e-cleveland/001.webp',
    countySearchUrl: 'https://cp.spokanecounty.org/scout/propertyinformation/',
    countySearchLabel: 'Spokane County property search',
    contactName: 'Adam',
    contactPhone: '5095907091',
    contactPhoneDisplay: '509-590-7091',
    contactEmail: 'adam@dominionhomedeals.com',
    primaryCtaLabel: 'Request terms',
    secondaryCtaLabel: 'Text Adam',
    smsBody: 'I want to review 3314 E Cleveland Ave at the $160,000 sale price.',
    actionTitle: 'How to move on this',
    actionIntro: 'Send your contact info, proof-of-funds path, and timing. Adam will get you the next step.',
    actionSteps: [
      ['1', 'Review the cleaned-out photos, $340K ARV target, comp links, and $11K roof quote.'],
      ['2', 'Decide which play fits you best: flip it, rent it, add a basement ADU, or BRRRR/refi after repairs.'],
      ['3', 'Text or submit the form with your name, proof-of-funds path, and timing.'],
      ['4', 'Verify square footage, R1/ADU permit path, utilities, roof scope, repairs, and resale numbers.'],
    ],
    submitLabel: 'Request terms',
    sourceNote:
      'Source note as of 2026-05-18: Sale price is $160,000. The 4 bed / 2 bath layout is based on the current walkthrough understanding. The house is being presented as approximately 1,872 sq ft with a full upstairs/downstairs layout. Seller reports the City confirmed R1 zoning with multifamily / ADU potential and utilities from Cleveland rather than the alley. Seller also reports an $11,000 roof quote including re-sheeting. Buyer should verify ARV, comparable sales, square footage, room count, lower-level condition, permits, utility service, roof scope, and measurements independently.',
    dueDiligenceNote:
      'Photos and public links are for review only. Buyer must verify condition, access, title, utilities, permits, room count, square footage, lot size, repair scope, occupancy, closing costs, and all investment assumptions independently. This is a private as-is disposition opportunity and not a retail MLS listing.',
  },
  '34124-n-newport-highway-trailer-29': {
    slug: '34124-n-newport-highway-trailer-29',
    status: 'active',
    title: '34124 N Newport Highway, Trailer 29',
    locationLine: 'Chattaroy / Riverside area, WA 99003',
    priceDisplay: '$25,000',
    priceNumeric: 25000,
    eyebrow: 'Private offering · Investor opportunity',
    tags: ['Buy now: $25K', 'Photos available', 'Backup walkthrough May 9', '3 bed / 1 bath'],
    beds: '3',
    baths: '1',
    sqft: '924',
    lot: 'Rented space',
    year: '1978',
    county: 'Spokane County',
    streetAddress: '34124 N Newport Highway, Trailer 29',
    city: 'Chattaroy',
    state: 'WA',
    zip: '99003',
    conditionSummary: 'Buy now at $25,000 from the photos. Saturday walkthrough is tentative and only happens if the home is not claimed first.',
    summary:
      'Private investor opportunity at 34124 N Newport Highway, Trailer 29 in the Chattaroy/Riverside corridor. 3 bed, 1 bath, 1978 mobile home measuring 66 ft x 14 ft. Buy-now price is $25,000 from the photos. If it is not claimed at the buy-now price, the fallback walkthrough is tentatively Saturday, May 9 from 9-11 AM.',
    paragraphs: [
      'This is a private investor offering for Trailer 29 at 34124 N Newport Highway in the north Spokane County corridor near Riverside and Chattaroy. The cleanest path is a buyer claiming it now at the $25,000 buy-now price from the photos.',
      'The home is a 1978 mobile home measuring 66 ft x 14 ft, with 3 bedrooms, 1 bathroom, kitchen, laundry area, living space, exterior space, and a small shed. The buy-now price is $25,000.',
      'If a buyer takes it at $25,000, the Saturday walkthrough will be cancelled and the contract will be assigned. If nobody claims the buy-now price first, the fallback walkthrough is tentatively scheduled for Saturday, May 9 from 9-11 AM, and buyers can submit offers after seeing it.',
      'This should be evaluated as an investor/mobile-home opportunity. Buyer should verify park approval, lot rent, title status, transfer requirements, utilities, measurements, and all condition items before closing.',
    ],
    highlights: [
      { text: '$25,000 buy-now price - photos are available for review now' },
      { text: 'Buy-now buyer gets priority and the Saturday walkthrough gets cancelled' },
      { text: 'Fallback walkthrough only if unsold: Saturday, May 9 from 9-11 AM' },
      { text: '1978 mobile home measuring 66 ft x 14 ft' },
      { text: '3 bedrooms and 1 bathroom' },
      { text: 'Kitchen, laundry area, living space, exterior, shed, and mechanical photos included' },
      { text: 'Value-add condition with room for cleanup, refresh, rental, resale, or owner-user exit depending on park rules' },
    ],
    facts: [
      ['Address', '34124 N Newport Highway, Trailer 29'],
      ['Area', 'Chattaroy / Riverside corridor'],
      ['State', 'Washington'],
      ['ZIP Code', '99003'],
      ['County', 'Spokane County'],
      ['Bedrooms', '3'],
      ['Bathrooms', '1'],
      ['Size', "66' x 14'"],
      ['Approx. square footage', '924 sq ft'],
      ['Lot type', 'Mobile home space - buyer to verify lot rent and park terms'],
      ['Year built', '1978'],
      ['Condition', 'Value-add / dated interior; photos available'],
      ['Buy-now price', '$25,000'],
      ['Buy-now process', 'Review photos and contact Adam to claim at $25,000'],
      ['Fallback walkthrough', 'Tentative: Saturday, May 9, 9-11 AM, only if not sold at buy-now price first'],
      ['Best-fit buyer', 'Cash/mobile-home buyer ready to verify park approval and transfer requirements quickly'],
      ['Property type', 'Mobile home / manufactured home opportunity'],
    ],
    photos: riversideTrailer29Photos as OffMarketPhoto[],
    neighborhoodTitle: 'North Spokane County Corridor',
    neighborhoodBody:
      'The property sits along the Newport Highway corridor north of Spokane, with regional access toward Mead, Chattaroy, Riverside, and Deer Park. Mobile-home buyers should verify park rules and transfer requirements directly before relying on any resale or rental plan.',
    distanceChips: [
      { label: 'Buy now', value: '$25K' },
      { label: 'Corridor', value: 'Newport Hwy' },
      { label: 'Beds/Baths', value: '3 / 1' },
      { label: 'Fallback', value: 'May 9' },
    ],
    mapQuery: '34124 N Newport Highway Trailer 29 Chattaroy WA 99003',
    leadSource: 'off-market-34124-n-newport-highway-trailer-29',
    lat: 47.9975,
    lng: -117.346,
    cardImageSrc: riversideTrailer29Photos[0]?.src ?? '/images/riverside-trailer-29/039.webp',
    countySearchUrl: 'https://cp.spokanecounty.org/scout/propertyinformation/',
    countySearchLabel: 'Spokane County property search',
    contactName: 'Adam',
    contactPhone: '5095907091',
    contactPhoneDisplay: '509-590-7091',
    contactEmail: 'adam@dominionhomedeals.com',
  },
}

export function getOffMarketSlugs(): string[] {
  return Object.values(listings)
    .filter((listing) => listing.status === 'active')
    .map((listing) => listing.slug)
}

export function getOffMarketListing(slug: string): OffMarketListing | undefined {
  const listing = listings[slug]
  return listing?.status === 'active' ? listing : undefined
}

export function getAllOffMarketListings(): OffMarketListing[] {
  return Object.values(listings).filter((listing) => listing.status === 'active')
}

export function getSiteUrl(): string {
  return SITE.url
}
