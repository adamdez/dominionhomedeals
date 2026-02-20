// src/lib/constants.ts

export const SITE = {
  name: "Dominion Homes",
  legalName: "Dominion Homes, LLC",
  tagline: "Your Local Cash Home Buyers — Spokane & CDA",
  description:
    "Local Spokane and Coeur d'Alene team that buys houses for cash in any condition. No commissions, no repairs, close on your timeline. We meet you in person.",
  url: "https://dominionhomedeals.com",
  phone: "208-625-8078", 
  email: "offers@dominionhomedeals.com", 
  address: {
    city: "Post Falls",
    state: "ID",
    zip: "83854",
  },
} as const;

/** Team — real people, real bios, honest */
export const TEAM = [
  {
    name: "Adam DesJardin",
    role: "Operations",
    bio: "Grew up on the Palouse, served in the military, then built and led sales and operations teams for a local startup. Adam handles the details so every deal runs smooth and every seller is taken care of from first call to closing day.",
    image: "/images/team/adam.jpg",
    location: "Post Falls, ID",
  },
  {
    name: "Nathan Walsh",
    role: "Sales & Acquisitions",
    bio: "Nathan meets sellers face-to-face across Spokane and North Idaho. He listens first, then builds an offer that works for your situation. No scripts, no pressure — just a straight conversation about what your home is worth and how fast you want to move.",
    image: "/images/team/nathan.jpg",
    location: "Post Falls, ID",
  },
  {
    name: "Logan Anyan",
    role: "Sales & Dispositions",
    bio: "Logan connects sellers to solutions and keeps our buyer network strong. His relationships across the Inland Northwest mean your property gets matched with the right buyer fast — so you get cash in hand without the wait.",
    image: "/images/team/logan.jpg",
    location: "Post Falls, ID",
  },
] as const;

export const PROCESS_STEPS = [
  {
    number: "1",
    title: "Tell Us About Your Home",
    description:
      "Fill out our quick form or give us a call. Takes about 60 seconds. No inspections needed upfront — we buy houses in any condition across Spokane County and Kootenai County.",
    duration: "60 seconds",
  },
  {
    number: "2",
    title: "Get a Fair Cash Offer",
    description:
      "We'll review your property and come back with a straightforward cash offer — usually within 24 hours. No obligations, no games. If it works for you, great. If not, no hard feelings.",
    duration: "24 hours",
  },
  {
    number: "3",
    title: "Close on Your Schedule",
    description:
      "You pick the closing date — as fast as two weeks or whenever you're ready. We handle the paperwork through WFG Title. No commissions, no fees, no surprises.",
    duration: "You choose",
  },
] as const;

/** Honest trust stats — based on real numbers */
export const TRUST_STATS = [
  { value: "2", label: "Weeks to Close" },
  { value: "$0", label: "Commissions or Fees" },
  { value: "3", label: "Local Team Members" },
  { value: "Any", label: "Condition Accepted" },
] as const;

/** Neighborhoods — Spokane County + Kootenai County */
export const NEIGHBORHOODS: Array<{
  slug: string;
  name: string;
  city: string;
  county: "Spokane" | "Kootenai";
  state: "WA" | "ID";
  zip: string;
}> = [
  // Spokane County
  { slug: "spokane-valley", name: "Spokane Valley", city: "Spokane Valley", county: "Spokane", state: "WA", zip: "99206" },
  { slug: "north-spokane", name: "North Spokane", city: "Spokane", county: "Spokane", state: "WA", zip: "99208" },
  { slug: "south-hill", name: "South Hill", city: "Spokane", county: "Spokane", state: "WA", zip: "99203" },
  { slug: "downtown-spokane", name: "Downtown Spokane", city: "Spokane", county: "Spokane", state: "WA", zip: "99201" },
  { slug: "cheney", name: "Cheney", city: "Cheney", county: "Spokane", state: "WA", zip: "99004" },
  { slug: "airway-heights", name: "Airway Heights", city: "Airway Heights", county: "Spokane", state: "WA", zip: "99001" },
  { slug: "liberty-lake", name: "Liberty Lake", city: "Liberty Lake", county: "Spokane", state: "WA", zip: "99019" },
  { slug: "mead", name: "Mead", city: "Mead", county: "Spokane", state: "WA", zip: "99021" },
  { slug: "deer-park", name: "Deer Park", city: "Deer Park", county: "Spokane", state: "WA", zip: "99006" },
  { slug: "medical-lake", name: "Medical Lake", city: "Medical Lake", county: "Spokane", state: "WA", zip: "99022" },
  { slug: "millwood", name: "Millwood", city: "Millwood", county: "Spokane", state: "WA", zip: "99212" },
  { slug: "five-mile", name: "Five Mile", city: "Spokane", county: "Spokane", state: "WA", zip: "99208" },
  { slug: "hillyard", name: "Hillyard", city: "Spokane", county: "Spokane", state: "WA", zip: "99207" },
  { slug: "shadle", name: "Shadle-Garland", city: "Spokane", county: "Spokane", state: "WA", zip: "99205" },
  { slug: "brownes-addition", name: "Browne's Addition", city: "Spokane", county: "Spokane", state: "WA", zip: "99201" },
  { slug: "manito", name: "Manito-Comstock", city: "Spokane", county: "Spokane", state: "WA", zip: "99203" },
  { slug: "lincoln-heights", name: "Lincoln Heights", city: "Spokane", county: "Spokane", state: "WA", zip: "99203" },
  { slug: "indian-trail", name: "Indian Trail", city: "Spokane", county: "Spokane", state: "WA", zip: "99208" },
  { slug: "otis-orchards", name: "Otis Orchards", city: "Otis Orchards", county: "Spokane", state: "WA", zip: "99027" },
  { slug: "greenacres", name: "Greenacres", city: "Greenacres", county: "Spokane", state: "WA", zip: "99016" },
  // Kootenai County
  { slug: "coeur-dalene", name: "Coeur d'Alene", city: "Coeur d'Alene", county: "Kootenai", state: "ID", zip: "83814" },
  { slug: "post-falls", name: "Post Falls", city: "Post Falls", county: "Kootenai", state: "ID", zip: "83854" },
  { slug: "hayden", name: "Hayden", city: "Hayden", county: "Kootenai", state: "ID", zip: "83835" },
  { slug: "rathdrum", name: "Rathdrum", city: "Rathdrum", county: "Kootenai", state: "ID", zip: "83858" },
  { slug: "spirit-lake", name: "Spirit Lake", city: "Spirit Lake", county: "Kootenai", state: "ID", zip: "83869" },
  { slug: "dalton-gardens", name: "Dalton Gardens", city: "Dalton Gardens", county: "Kootenai", state: "ID", zip: "83815" },
  { slug: "hauser", name: "Hauser", city: "Hauser", county: "Kootenai", state: "ID", zip: "83854" },
  { slug: "athol", name: "Athol", city: "Athol", county: "Kootenai", state: "ID", zip: "83801" },
];

export const TCPA_CONSENT_TEXT =
  "By submitting this form, you consent to receive calls, texts, and emails from Dominion Homes, LLC at the number and email provided, including by autodialer and prerecorded messages, for the purpose of discussing the sale of your property. Consent is not a condition of purchase. Message and data rates may apply. Reply STOP to opt out." as const;

/** Situations we help with — for the "We Buy Houses In Any Situation" section */
export const SITUATIONS = [
  { title: "Inherited Property", desc: "Dealing with probate or an inherited home you don't want to manage? We handle the complexity." },
  { title: "Behind on Payments", desc: "Facing foreclosure or missed payments? We can close fast and help you move forward." },
  { title: "Divorce", desc: "Need to sell the house as part of a divorce? We make it simple for both parties." },
  { title: "Relocating", desc: "Got a job offer or need to move quickly? We close on your timeline, not the market's." },
  { title: "Tired Landlord", desc: "Done dealing with tenants and repairs? We buy rental properties as-is, even with tenants." },
  { title: "Needs Major Repairs", desc: "Can't afford the repairs to list it? We buy in any condition — roof, foundation, whatever." },
] as const;
