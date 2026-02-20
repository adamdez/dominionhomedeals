import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

/* ------------------------------------------------------------------ */
/*  Neighborhood Data — All 25 areas with unique content              */
/* ------------------------------------------------------------------ */

interface NeighborhoodData {
  name: string
  state: string
  county: string
  tagline: string
  description: string
  highlights: string[]
  situations: string[]
  zipCodes: string[]
  nearbyAreas: string[]
}

const neighborhoods: Record<string, NeighborhoodData> = {
  'spokane-valley': {
    name: 'Spokane Valley',
    state: 'WA',
    county: 'Spokane County',
    tagline: 'Cash for Houses in Spokane Valley — Close in as Fast as 2 Weeks',
    description:
      'Spokane Valley is one of the most active real estate markets in Eastern Washington. From the Sprague corridor to the quiet streets near Pines and Sullivan, homes here range from 1960s ramblers to newer construction. Whether your property needs work or you just need to sell fast, we buy houses for cash across all of Spokane Valley — no agents, no commissions, no repairs.',
    highlights: [
      'Largest city in the Spokane metro by area',
      'Mix of older ramblers, split-levels, and newer builds',
      'Strong demand from buyers and investors',
      'Quick access to I-90 and downtown Spokane',
    ],
    situations: ['Inherited properties near Dishman', 'Fixer-uppers along Sprague', 'Rental properties with problem tenants', 'Homes damaged by Spokane Valley winters'],
    zipCodes: ['99016', '99037', '99206', '99212', '99216'],
    nearbyAreas: ['liberty-lake', 'millwood', 'otis-orchards', 'downtown-spokane'],
  },
  'north-spokane': {
    name: 'North Spokane',
    state: 'WA',
    county: 'Spokane County',
    tagline: 'We Buy Houses in North Spokane — Fair Cash Offers, No Hassle',
    description:
      'North Spokane covers a huge range — from the established neighborhoods near Five Mile Prairie to the growing communities around Wandermere and Whitworth. We buy houses in every condition across North Spokane, whether it\'s a 1970s daylight basement home or a newer property you need to offload quickly.',
    highlights: [
      'Five Mile to Wandermere corridor',
      'Family neighborhoods near Whitworth University',
      'Mix of older and newer construction',
      'Strong school districts attract buyers',
    ],
    situations: ['Downsizing from a large family home', 'Properties with deferred maintenance', 'Inherited homes near Five Mile', 'Relocating out of state quickly'],
    zipCodes: ['99205', '99207', '99208', '99218'],
    nearbyAreas: ['mead', 'downtown-spokane', 'airway-heights', 'nine-mile-falls'],
  },
  'south-hill': {
    name: 'South Hill',
    state: 'WA',
    county: 'Spokane County',
    tagline: 'Sell Your South Hill Home Fast for Cash — No Repairs Needed',
    description:
      'The South Hill is one of Spokane\'s most desirable neighborhoods — from Manito Park to Moran Prairie, homes here have character, history, and strong values. But when life throws a curveball, we\'re here. We buy South Hill homes for cash in any condition, from century-old Craftsmans to mid-century ranches.',
    highlights: [
      'Manito, Comstock, and Lincoln Heights neighborhoods',
      'Historic Craftsman and Tudor architecture',
      'High property values with strong demand',
      'Close to hospitals, parks, and schools',
    ],
    situations: ['Older homes needing expensive updates', 'Estate sales and probate properties', 'Divorce situations requiring fast resolution', 'Owners behind on property taxes'],
    zipCodes: ['99201', '99203', '99223'],
    nearbyAreas: ['downtown-spokane', 'cheney', 'spokane-valley', 'medical-lake'],
  },
  'downtown-spokane': {
    name: 'Downtown Spokane',
    state: 'WA',
    county: 'Spokane County',
    tagline: 'Cash Home Buyers in Downtown Spokane — Close on Your Timeline',
    description:
      'Downtown Spokane and the surrounding core neighborhoods — Browne\'s Addition, East Central, West Central, and the Perry District — are full of character homes with unique challenges. Older construction, zoning complexity, and properties that traditional buyers won\'t touch are exactly what we specialize in.',
    highlights: [
      'Browne\'s Addition, Perry District, East Central',
      'Historic homes with strong rental demand',
      'Urban infill and mixed-use potential',
      'Walking distance to downtown amenities',
    ],
    situations: ['Properties with code violations', 'Vacant or abandoned homes', 'Fire-damaged properties', 'Homes with title issues'],
    zipCodes: ['99201', '99202', '99204'],
    nearbyAreas: ['south-hill', 'north-spokane', 'spokane-valley', 'airway-heights'],
  },
  'coeur-d-alene': {
    name: "Coeur d'Alene",
    state: 'ID',
    county: 'Kootenai County',
    tagline: "Sell Your CDA Home for Cash — Local Buyers Based in Post Falls",
    description:
      "Coeur d'Alene is one of North Idaho's hottest markets, but that doesn't mean selling is always easy. Whether you own a lakeside property, a midtown ranch, or a home in the neighborhoods around CDA, we buy houses for cash — no agents, no staging, no open houses. We're based right next door in Post Falls.",
    highlights: [
      'Idaho\'s #1 tourism and lifestyle destination',
      'Strong property values but high market competition',
      'Diverse housing stock from lakefront to suburban',
      'We\'re based 10 minutes away in Post Falls',
    ],
    situations: ['Vacation homes you want to unload', 'Properties needing major repairs', 'Behind on mortgage payments', 'Inherited a CDA property from out of state'],
    zipCodes: ['83814', '83815'],
    nearbyAreas: ['post-falls', 'hayden', 'dalton-gardens', 'rathdrum'],
  },
  'post-falls': {
    name: 'Post Falls',
    state: 'ID',
    county: 'Kootenai County',
    tagline: 'Cash Home Buyers in Post Falls — We Live Here',
    description:
      'Post Falls is our home base. The Dominion Homes office is right here, and we know every street, subdivision, and development in town. From older homes near the falls to newer builds in Prairie, we buy houses in any condition across all of Post Falls. No one knows this market like we do.',
    highlights: [
      'Our office is here — this is our home turf',
      'One of the fastest-growing cities in Idaho',
      'Mix of established and new-construction neighborhoods',
      'Strong rental market and investor demand',
    ],
    situations: ['Tired landlords with problem rentals', 'Homes damaged by Post Falls winters', 'Relocating and need to sell fast', 'Inherited property from family'],
    zipCodes: ['83854', '83877'],
    nearbyAreas: ['coeur-d-alene', 'hayden', 'rathdrum', 'hauser'],
  },
  'hayden': {
    name: 'Hayden',
    state: 'ID',
    county: 'Kootenai County',
    tagline: 'We Buy Houses for Cash in Hayden, ID — Fast & Fair',
    description:
      'Hayden is growing fast, with a mix of family neighborhoods, rural lots, and commercial development along Highway 95. Whether your property is on Hayden Lake or tucked into a subdivision, we make fair cash offers on homes in any condition across Hayden and Hayden Lake.',
    highlights: [
      'Growing community north of CDA',
      'Hayden Lake waterfront and surrounding area',
      'Highway 95 corridor development',
      'Family-friendly with strong schools',
    ],
    situations: ['Lake properties needing updates', 'Homes in pre-foreclosure', 'Divorce requiring quick sale', 'Downsizing from a larger property'],
    zipCodes: ['83835'],
    nearbyAreas: ['coeur-d-alene', 'rathdrum', 'dalton-gardens', 'spirit-lake'],
  },
  'rathdrum': {
    name: 'Rathdrum',
    state: 'ID',
    county: 'Kootenai County',
    tagline: 'Sell Your Rathdrum Home Fast for Cash — No Commissions',
    description:
      'Rathdrum sits on the prairie between Post Falls and Hayden, offering a quieter lifestyle with easy access to both. We buy houses across Rathdrum — from older homes in town to properties with acreage on the outskirts. If you need to sell quickly and without hassle, give us a call.',
    highlights: [
      'Prairie living with small-town feel',
      'Growing population and housing demand',
      'Affordable price points attracting families',
      'Quick access to CDA and Post Falls',
    ],
    situations: ['Rural properties hard to list traditionally', 'Homes needing foundation or roof work', 'Estate sales and probate', 'Landlords wanting out of rental business'],
    zipCodes: ['83858'],
    nearbyAreas: ['hayden', 'post-falls', 'spirit-lake', 'athol'],
  },
  'cheney': {
    name: 'Cheney',
    state: 'WA',
    county: 'Spokane County',
    tagline: 'Cash for Houses in Cheney, WA — Close in as Fast as 14 Days',
    description:
      'Cheney is home to Eastern Washington University and a strong community of families and long-time residents. Whether you have a rental property near campus, an older home in town, or acreage on the outskirts, we buy houses for cash in Cheney — no agents and no commissions.',
    highlights: [
      'Home to Eastern Washington University',
      'Mix of student rentals and family homes',
      'Affordable market with steady demand',
      'Strong community identity',
    ],
    situations: ['Student rental properties', 'Older homes needing major updates', 'Inherited property from family', 'Moving and need to sell quickly'],
    zipCodes: ['99004'],
    nearbyAreas: ['airway-heights', 'medical-lake', 'south-hill', 'spangle'],
  },
  'airway-heights': {
    name: 'Airway Heights',
    state: 'WA',
    county: 'Spokane County',
    tagline: 'We Buy Houses in Airway Heights — Cash Offers in 24 Hours',
    description:
      'Airway Heights is one of the fastest-growing communities in Spokane County, with Fairchild Air Force Base driving much of the local economy. We buy houses in any condition across Airway Heights — whether you\'re PCSing and need a fast sale, or own a property that needs work.',
    highlights: [
      'Fairchild Air Force Base community',
      'Rapid growth and new construction',
      'Affordable entry prices',
      'West Plains development corridor',
    ],
    situations: ['Military PCS requiring fast sale', 'Properties near the base', 'New construction gone wrong', 'Tired landlords with base housing tenants'],
    zipCodes: ['99001'],
    nearbyAreas: ['north-spokane', 'cheney', 'medical-lake', 'nine-mile-falls'],
  },
  'mead': {
    name: 'Mead',
    state: 'WA',
    county: 'Spokane County',
    tagline: 'Sell Your Mead Home for Cash — No Repairs, No Hassle',
    description:
      'Mead is a family-friendly community north of Spokane known for its excellent school district. Homes range from rural properties with acreage to suburban neighborhoods. We buy houses across the Mead area in any condition — you don\'t need to fix a thing.',
    highlights: [
      'Top-rated Mead School District',
      'Mix of suburban and rural properties',
      'Growing north corridor',
      'Strong family home demand',
    ],
    situations: ['Large homes families have outgrown', 'Rural properties hard to list', 'Inherited homes', 'Deferred maintenance situations'],
    zipCodes: ['99021'],
    nearbyAreas: ['north-spokane', 'deer-park', 'nine-mile-falls', 'elk'],
  },
  'deer-park': {
    name: 'Deer Park',
    state: 'WA',
    county: 'Spokane County',
    tagline: 'Cash Home Buyers in Deer Park — Fair Offers, Fast Closings',
    description:
      'Deer Park is a small town with big character, sitting along the Highway 395 corridor north of Spokane. Properties here often include acreage, older farmhouses, and homes that don\'t fit the traditional listing mold — exactly what we specialize in.',
    highlights: [
      'Small-town community on Highway 395',
      'Rural properties and acreage',
      'Affordable market',
      'Growing north county',
    ],
    situations: ['Farm and rural properties', 'Homes needing well or septic work', 'Inherited acreage', 'Properties with access issues'],
    zipCodes: ['99006'],
    nearbyAreas: ['mead', 'elk', 'north-spokane', 'nine-mile-falls'],
  },
  'medical-lake': {
    name: 'Medical Lake',
    state: 'WA',
    county: 'Spokane County',
    tagline: 'We Buy Houses in Medical Lake — Cash, No Commissions',
    description:
      'Medical Lake is a quiet lakeside community west of Spokane with a mix of older homes, cabins, and family properties. Whether your home is on the lake or across town, we buy Medical Lake properties for cash in any condition.',
    highlights: [
      'Lakeside community',
      'Close to Fairchild AFB',
      'Quiet, small-town atmosphere',
      'Mix of older and mid-century homes',
    ],
    situations: ['Lake cabins needing renovation', 'Older homes with structural issues', 'Relocating from the area', 'Behind on property taxes'],
    zipCodes: ['99022'],
    nearbyAreas: ['cheney', 'airway-heights', 'south-hill', 'spangle'],
  },
  'liberty-lake': {
    name: 'Liberty Lake',
    state: 'WA',
    county: 'Spokane County',
    tagline: 'Sell Your Liberty Lake Home Fast for Cash',
    description:
      'Liberty Lake sits on Spokane\'s east side, right on the Idaho border. It\'s a newer, well-planned community with strong home values. Even in a desirable area like this, situations arise where a fast cash sale makes sense — and we\'re here for it.',
    highlights: [
      'East side of Spokane near Idaho border',
      'Newer construction and planned communities',
      'High property values',
      'Strong family-oriented community',
    ],
    situations: ['Divorce requiring quick split', 'Job relocation out of state', 'Properties with HOA issues', 'Downsizing situations'],
    zipCodes: ['99019'],
    nearbyAreas: ['spokane-valley', 'post-falls', 'otis-orchards', 'millwood'],
  },
  'millwood': {
    name: 'Millwood',
    state: 'WA',
    county: 'Spokane County',
    tagline: 'Cash for Houses in Millwood — Local Buyers, Fair Offers',
    description:
      'Millwood is a small, tight-knit community tucked between Spokane and Spokane Valley. Its mix of older craftsman-style homes and mid-century properties makes it a neighborhood we know well. We buy Millwood homes in any condition.',
    highlights: [
      'Small-town character',
      'Older homes with charm and history',
      'Convenient location between Spokane and the Valley',
      'Strong community identity',
    ],
    situations: ['Craftsman homes needing restoration', 'Properties with outdated systems', 'Estate settlements', 'Small lots challenging to list'],
    zipCodes: ['99212'],
    nearbyAreas: ['spokane-valley', 'liberty-lake', 'downtown-spokane', 'otis-orchards'],
  },
  'otis-orchards': {
    name: 'Otis Orchards',
    state: 'WA',
    county: 'Spokane County',
    tagline: 'We Buy Homes in Otis Orchards — Cash, Any Condition',
    description:
      'Otis Orchards offers rural living on Spokane\'s east side, with larger lots, horse properties, and homes set back from the road. These types of properties can be tough to sell traditionally — but not to us. We buy Otis Orchards homes for cash.',
    highlights: [
      'Rural east Spokane community',
      'Larger lots and acreage',
      'Horse properties and hobby farms',
      'Quiet lifestyle near Spokane Valley',
    ],
    situations: ['Acreage hard to sell traditionally', 'Properties with outbuildings', 'Homes with well/septic needs', 'Inherited rural property'],
    zipCodes: ['99027'],
    nearbyAreas: ['spokane-valley', 'liberty-lake', 'millwood', 'post-falls'],
  },
  'nine-mile-falls': {
    name: 'Nine Mile Falls',
    state: 'WA',
    county: 'Spokane County',
    tagline: 'Cash Home Buyers in Nine Mile Falls — Fast Closings',
    description:
      'Nine Mile Falls is a beautiful riverside community northwest of Spokane along the Little Spokane River. Properties here often feature acreage, river access, and unique characteristics that make traditional listing complicated. We simplify it with a fair cash offer.',
    highlights: [
      'Riverside community northwest of Spokane',
      'Rural properties with acreage',
      'Little Spokane River corridor',
      'Strong outdoor lifestyle community',
    ],
    situations: ['River properties with flood zone concerns', 'Acreage with access road issues', 'Homes needing septic replacement', 'Estate properties with multiple heirs'],
    zipCodes: ['99026'],
    nearbyAreas: ['airway-heights', 'mead', 'north-spokane', 'deer-park'],
  },
  'dalton-gardens': {
    name: 'Dalton Gardens',
    state: 'ID',
    county: 'Kootenai County',
    tagline: 'Sell Your Dalton Gardens Home for Cash — No Agents Needed',
    description:
      'Dalton Gardens is a quiet residential community just north of Coeur d\'Alene. With its relaxed zoning and larger lots, properties here have unique value — and unique challenges when it comes to selling. We make it simple with a fair cash offer.',
    highlights: [
      'Unincorporated community north of CDA',
      'Larger lots and relaxed zoning',
      'Quiet residential character',
      'Close to CDA amenities',
    ],
    situations: ['Properties with unique zoning', 'Homes on larger parcels', 'Older homes needing updates', 'Sellers wanting privacy and speed'],
    zipCodes: ['83815'],
    nearbyAreas: ['coeur-d-alene', 'hayden', 'rathdrum', 'post-falls'],
  },
  'spirit-lake': {
    name: 'Spirit Lake',
    state: 'ID',
    county: 'Kootenai County',
    tagline: 'We Buy Houses in Spirit Lake, ID — Cash Offers Available',
    description:
      'Spirit Lake is a small north Idaho town with lakefront character and a quiet pace of life. Selling a home here traditionally can take time — but not with us. We buy Spirit Lake properties for cash in any condition and close on your schedule.',
    highlights: [
      'Small lakeside community',
      'Affordable north Idaho living',
      'Recreational properties',
      'Growing area with development potential',
    ],
    situations: ['Lakefront cabins needing work', 'Seasonal properties to unload', 'Homes in remote locations', 'Properties with deferred maintenance'],
    zipCodes: ['83869'],
    nearbyAreas: ['rathdrum', 'athol', 'hayden', 'post-falls'],
  },
  'athol': {
    name: 'Athol',
    state: 'ID',
    county: 'Kootenai County',
    tagline: 'Cash for Houses in Athol — Fast & Fair',
    description:
      'Athol is a small community on Highway 95 north of Hayden, known for its proximity to Silverwood Theme Park and the surrounding recreational area. We buy homes in Athol and the surrounding north Kootenai County area for cash.',
    highlights: [
      'Highway 95 corridor',
      'Near Silverwood Theme Park',
      'Rural properties and acreage',
      'Affordable north Idaho',
    ],
    situations: ['Rural properties difficult to list', 'Inherited land with structures', 'Homes needing major repairs', 'Motivated sellers needing speed'],
    zipCodes: ['83801'],
    nearbyAreas: ['spirit-lake', 'hayden', 'rathdrum', 'post-falls'],
  },
  'hauser': {
    name: 'Hauser',
    state: 'ID',
    county: 'Kootenai County',
    tagline: 'Sell Your Hauser Home for Cash — No Repairs Required',
    description:
      'Hauser is a small community along I-90 between Post Falls and the Montana border, centered around beautiful Hauser Lake. Properties range from lakefront homes to rural lots. We buy Hauser area homes for cash in any condition.',
    highlights: [
      'Hauser Lake waterfront community',
      'I-90 corridor location',
      'Mix of lake and rural properties',
      'Close to Post Falls and CDA',
    ],
    situations: ['Lake property maintenance burden', 'Seasonal cabins to unload', 'Properties with access challenges', 'Out-of-state owners ready to sell'],
    zipCodes: ['83854'],
    nearbyAreas: ['post-falls', 'coeur-d-alene', 'liberty-lake', 'rathdrum'],
  },
  'elk': {
    name: 'Elk',
    state: 'WA',
    county: 'Spokane County',
    tagline: 'We Buy Rural Homes in Elk, WA — Cash Offers Available',
    description:
      'Elk is a rural community in north Spokane County with larger properties, hobby farms, and homes that don\'t fit neatly into the traditional listing process. That\'s exactly what we specialize in — fair cash offers on rural properties.',
    highlights: [
      'Rural north Spokane County',
      'Larger parcels and acreage',
      'Agricultural properties',
      'Quiet lifestyle community',
    ],
    situations: ['Farm properties with outbuildings', 'Homes on well and septic', 'Inherited rural acreage', 'Properties needing road or access work'],
    zipCodes: ['99009'],
    nearbyAreas: ['deer-park', 'mead', 'north-spokane', 'nine-mile-falls'],
  },
  'spangle': {
    name: 'Spangle',
    state: 'WA',
    county: 'Spokane County',
    tagline: 'Cash Home Buyers in Spangle — Serving South Spokane County',
    description:
      'Spangle is a small community in southern Spokane County along the Highway 195 corridor. Properties here tend to be rural, affordable, and sometimes challenging to sell through traditional channels. We buy Spangle area homes for cash.',
    highlights: [
      'South Spokane County community',
      'Highway 195 corridor',
      'Rural and agricultural properties',
      'Affordable south county',
    ],
    situations: ['Older rural homes', 'Properties with land management needs', 'Inherited homes in remote areas', 'Sellers wanting fast resolution'],
    zipCodes: ['99031'],
    nearbyAreas: ['cheney', 'medical-lake', 'south-hill', 'airway-heights'],
  },
  'harrison': {
    name: 'Harrison',
    state: 'ID',
    county: 'Kootenai County',
    tagline: 'Sell Your Harrison Home for Cash — No Commissions',
    description:
      'Harrison sits on the southern shore of Lake Coeur d\'Alene and is a gateway to the Trail of the Coeur d\'Alenes. Properties here include lakefront homes, cabins, and rural residences. We buy Harrison area properties for cash.',
    highlights: [
      'Southern Lake CDA community',
      'Trail of the Coeur d\'Alenes gateway',
      'Lakefront and cabin properties',
      'Recreational real estate market',
    ],
    situations: ['Lakefront properties needing work', 'Seasonal cabins to sell', 'Remote properties hard to show', 'Out-of-area owners'],
    zipCodes: ['83833'],
    nearbyAreas: ['coeur-d-alene', 'worley', 'post-falls', 'hayden'],
  },
  'worley': {
    name: 'Worley',
    state: 'ID',
    county: 'Kootenai County',
    tagline: 'We Buy Houses in Worley — Cash, Any Condition',
    description:
      'Worley is in southern Kootenai County near the Coeur d\'Alene Casino Resort. The area features a mix of residential properties and rural land. We buy homes in and around Worley for cash — no agents, no repairs, no hassle.',
    highlights: [
      'Southern Kootenai County',
      'Near Coeur d\'Alene Casino Resort',
      'Mix of residential and rural',
      'Affordable property market',
    ],
    situations: ['Properties with unique title situations', 'Homes needing significant repairs', 'Inherited property from family', 'Sellers wanting privacy and speed'],
    zipCodes: ['83876'],
    nearbyAreas: ['harrison', 'coeur-d-alene', 'post-falls', 'hayden'],
  },
}

/* ------------------------------------------------------------------ */
/*  Static Params + Metadata                                          */
/* ------------------------------------------------------------------ */

export function generateStaticParams() {
  return Object.keys(neighborhoods).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const data = neighborhoods[slug]
  if (!data) return {}
  const location = `${data.name}, ${data.state}`
  return {
    title: `Cash for Houses ${location} — Sell Fast | Dominion Homes`,
    description: `Get a fair cash offer on your ${location} home in 24 hours. No agents, no commissions, no repairs. Local team based in Post Falls, ID. Call 208-625-8078.`,
    alternates: { canonical: `https://dominionhomedeals.com/neighborhoods/${slug}` },
    openGraph: {
      title: `Sell Your ${data.name} Home for Cash | Dominion Homes`,
      description: `We buy houses in ${data.name} in any condition. Fair cash offer in 24 hours, close in as fast as 2 weeks. ${data.county}.`,
      url: `https://dominionhomedeals.com/neighborhoods/${slug}`,
      type: 'website',
    },
  }
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                    */
/* ------------------------------------------------------------------ */

export default async function NeighborhoodPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const data = neighborhoods[slug]
  if (!data) notFound()

  const location = `${data.name}, ${data.state}`

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            name: 'Dominion Homes, LLC',
            description: `Cash home buyers in ${data.name}, ${data.county}, ${data.state}. We buy houses in any condition.`,
            telephone: '+1-208-625-8078',
            url: `https://dominionhomedeals.com/neighborhoods/${slug}`,
            address: {
              '@type': 'PostalAddress',
              addressLocality: 'Post Falls',
              addressRegion: 'ID',
              addressCountry: 'US',
            },
            areaServed: {
              '@type': 'City',
              name: data.name,
              containedInPlace: {
                '@type': 'State',
                name: data.state === 'WA' ? 'Washington' : 'Idaho',
              },
            },
            makesOffer: {
              '@type': 'Offer',
              name: `Cash offer for houses in ${data.name}`,
              description: `Fair cash offer for your ${data.name} home in 24 hours. No agents, no commissions, no repairs.`,
            },
          }),
        }}
      />

      {/* Hero */}
      <section className="relative bg-cream-50 pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="mx-auto max-w-4xl px-5 text-center">
          <Link
            href="/neighborhoods"
            className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-forest-600 transition hover:text-forest-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            All Areas We Serve
          </Link>
          <h1 className="font-display text-display text-ink-700 text-balance">
            We Buy Houses for Cash in{' '}
            <span className="text-forest-600">{data.name}</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-ink-400">
            {data.tagline}. Fair cash offer in 24 hours. Close in as fast as two
            weeks. No agents, no commissions, no&nbsp;repairs.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/#get-offer"
              className="inline-flex items-center rounded-xl bg-forest-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-forest-700 hover:shadow-xl"
            >
              Get Your Cash Offer
            </Link>
            <a
              href="tel:2086258078"
              className="inline-flex items-center gap-2 text-lg font-medium text-ink-500 transition hover:text-forest-700"
            >
              Or call 208-625-8078
            </a>
          </div>
        </div>
      </section>

      {/* About the Area */}
      <section className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-5xl px-5">
          <div className="grid gap-12 md:grid-cols-5 md:gap-16">
            <div className="md:col-span-3">
              <p className="text-sm font-semibold uppercase tracking-wider text-forest-600">
                {data.county}, {data.state}
              </p>
              <h2 className="mt-2 font-display text-2xl text-ink-700 md:text-3xl">
                Selling Your {data.name} Home Doesn&rsquo;t Have to Be&nbsp;Hard
              </h2>
              <p className="mt-5 text-ink-400 leading-relaxed">
                {data.description}
              </p>

              <h3 className="mt-8 font-display text-lg text-ink-600">
                What Makes {data.name} Unique
              </h3>
              <ul className="mt-4 space-y-3">
                {data.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-3 text-ink-500">
                    <svg
                      className="mt-0.5 h-5 w-5 shrink-0 text-forest-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {h}
                  </li>
                ))}
              </ul>
            </div>

            {/* Quick Stats Sidebar */}
            <div className="md:col-span-2">
              <div className="rounded-2xl border border-sage-100 bg-cream-50 p-6">
                <h3 className="font-display text-lg text-ink-700">
                  {data.name} at a Glance
                </h3>
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-ink-300">County</p>
                    <p className="mt-1 font-medium text-ink-600">{data.county}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-ink-300">State</p>
                    <p className="mt-1 font-medium text-ink-600">{data.state === 'WA' ? 'Washington' : 'Idaho'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-ink-300">ZIP Codes</p>
                    <p className="mt-1 font-medium text-ink-600">{data.zipCodes.join(', ')}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-ink-300">Our Offer</p>
                    <p className="mt-1 font-medium text-forest-600">Cash • 24-hour response • Close in 14 days</p>
                  </div>
                </div>

                <Link
                  href="/#get-offer"
                  className="mt-6 flex w-full items-center justify-center rounded-xl bg-forest-600 px-6 py-3.5 font-semibold text-white transition hover:bg-forest-700"
                >
                  Get My Cash Offer for {data.name}
                </Link>
                <p className="mt-2 text-center text-xs text-ink-300">
                  No obligation &middot; 60 seconds
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Situations We Help With */}
      <section className="bg-forest-700 py-20 md:py-28">
        <div className="mx-auto max-w-4xl px-5">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-forest-300">
              Common Situations in {data.name}
            </p>
            <h2 className="mt-2 font-display text-display text-white text-balance">
              No Matter What You&rsquo;re Going Through, We&nbsp;Can&nbsp;Help
            </h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {data.situations.map((s) => (
              <div key={s} className="rounded-xl border border-forest-600 bg-forest-600/50 p-5">
                <p className="text-white">{s}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/#get-offer"
              className="inline-flex items-center rounded-xl bg-white px-8 py-4 text-lg font-semibold text-forest-700 shadow-lg transition hover:bg-cream-50 hover:shadow-xl"
            >
              Get Your No-Obligation Offer
            </Link>
          </div>
        </div>
      </section>

      {/* Nearby Areas */}
      <section className="bg-cream-50 py-20 md:py-28">
        <div className="mx-auto max-w-4xl px-5">
          <h2 className="font-display text-2xl text-ink-700 text-center">
            We Also Buy Houses Nearby
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {data.nearbyAreas.map((slug) => {
              const nearby = neighborhoods[slug]
              if (!nearby) return null
              return (
                <Link
                  key={slug}
                  href={`/neighborhoods/${slug}`}
                  className="rounded-full border border-sage-200 bg-white px-5 py-2.5 text-sm font-medium text-ink-600 transition hover:border-forest-300 hover:bg-forest-50 hover:text-forest-700"
                >
                  {nearby.name}, {nearby.state}
                </Link>
              )
            })}
          </div>
          <div className="mt-6 text-center">
            <Link
              href="/neighborhoods"
              className="text-sm font-medium text-forest-600 transition hover:text-forest-700"
            >
              View all areas we serve →
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <h2 className="font-display text-display text-ink-700 text-balance">
            Ready to Get a Cash Offer on Your {data.name}&nbsp;Home?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-ink-400">
            No pressure. No obligation. Fill out the form or call us — Adam, Nathan,
            or Logan will get back to you within 24&nbsp;hours.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/#get-offer"
              className="inline-flex items-center rounded-xl bg-forest-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-forest-700 hover:shadow-xl"
            >
              Get My Cash Offer
            </Link>
            <a
              href="tel:2086258078"
              className="inline-flex items-center gap-2 text-lg font-medium text-ink-500 transition hover:text-forest-700"
            >
              Or call 208-625-8078
            </a>
          </div>
        </div>
      </section>
    </>
  )
}

