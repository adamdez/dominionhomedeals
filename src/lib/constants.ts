// src/lib/constants.ts

export const SITE = {
  name: "Dominion Homes",
  legalName: "Dominion Homes, LLC",
  tagline: "Local Spokane Team · Direct Home Buyers",
  description:
    "Spokane-area team that buys houses directly. No commissions, no repairs, close on your timeline. We meet you in person.",
  url: "https://www.dominionhomedeals.com",
  phone: "509-822-5460",
  email: "leads@dominionhomedeals.com",
  adminEmail: "admin@dominionhomedeals.com",
  address: {
    city: "Spokane",
    state: "WA",
    zip: "99201",
  },
  // Add your profile URLs here once live (GBP, Facebook, etc.)
  // Schema sameAs in layout.tsx reads from this array.
  sameAs: [] as readonly string[],
} as const;

/** Team - real people, real bios, honest */
export const TEAM = [
  {
    name: "Logan Anyan",
    role: "Founder & Owner",
    bio: "Logan is the founder and owner of Dominion Homes. He works directly with sellers across Spokane County and the Spokane-CDA corridor to keep every deal straightforward, local, and easy to follow from first conversation to closing.",
    image: "/images/team/logan.jpg",
    location: "Spokane, WA",
  },
] as const;

export const PROCESS_STEPS = [
  {
    number: "1",
    title: "Tell Us About Your Home",
    description:
      "Fill out our quick form or give us a call. Takes about 60 seconds. No inspections needed upfront - we buy houses in any condition across Spokane County and Kootenai County.",
    duration: "60 seconds",
  },
  {
    number: "2",
    title: "Get a Fair Cash Offer",
    description:
      "We'll review your property and come back with a straightforward cash offer - most within a day or two. No obligations, no games. If it works for you, great. If not, no hard feelings.",
    duration: "1-2 days",
  },
  {
    number: "3",
    title: "Close on Your Schedule",
    description:
      "You pick the closing date - as fast as two weeks or whenever you're ready. We handle the paperwork through WFG Title. No commissions, no fees, no surprises.",
    duration: "You choose",
  },
] as const;

/** Honest trust stats - based on real numbers */
export const TRUST_STATS = [
  { value: "2", label: "Weeks to Close" },
  { value: "$0", label: "Commissions or Fees" },
  { value: "Local", label: "Founder-Led Team" },
  { value: "Any", label: "Condition Accepted" },
] as const;

export const TCPA_CONSENT_TEXT =
  "By submitting this form, you consent to receive calls, text messages (SMS/MMS), and emails from Dominion Homes, LLC at the phone number and email provided, including messages sent using autodialer or automated technology, for the purpose of discussing the sale of your property. Consent is not a condition of purchase. Message frequency varies, up to 10 msgs/month. Message and data rates may apply. Reply STOP to opt out, HELP for help." as const;

/** Situations we help with - for the "We Buy Houses In Any Situation" section */
export const SITUATIONS = [
  { title: "Inherited Property", desc: "Dealing with probate or an inherited home you don't want to manage? We handle the complexity." },
  { title: "Behind on Payments", desc: "Facing foreclosure or missed payments? We can close fast and help you move forward." },
  { title: "Divorce", desc: "Need to sell the house as part of a divorce? We make it simple for both parties." },
  { title: "Relocating", desc: "Got a job offer or need to move quickly? We close on your timeline, not the market's." },
  { title: "Tired Landlord", desc: "Done dealing with tenants and repairs? We buy rental properties as-is, even with tenants." },
  { title: "Needs Major Repairs", desc: "Can't afford the repairs to list it? We buy in any condition - roof, foundation, whatever." },
] as const;

/** FAQs for the /sell landing page - seller-focused, honest, actionable */
export const SELL_PAGE_FAQS = [
  {
    q: "How fast can you close?",
    a: "That depends on your situation. Some sellers need to close in two weeks - we can do that. Others need a few months to figure out their next move. You pick the timeline, and we work around it.",
  },
  {
    q: "Do I need to make any repairs first?",
    a: "No. We buy houses in any condition - roof issues, foundation problems, outdated everything, or just a house you don't want to deal with anymore. You don't need to fix, clean, or stage anything.",
  },
  {
    q: "How does the cash offer work?",
    a: "You tell us about your property (form or phone call), we review it, and we come back with a straightforward cash offer. If it works for you, we move forward. If not, no hard feelings. There's zero obligation.",
  },
  {
    q: "Are there any fees or commissions?",
    a: "None. No agent commissions, no closing costs on your side, no hidden fees. The offer we make is the amount you walk away with.",
  },
  {
    q: "What if my house has tenants in it?",
    a: "We buy houses with tenants in place. You don't need to evict anyone or wait for a lease to end. We handle the transition.",
  },
  {
    q: "Who are you, exactly?",
    a: "Logan leads Dominion Homes, a local Spokane team that buys houses directly across Spokane County and North Idaho. No call center, no scripts, no middlemen. Call or text us at 509-822-5460 and you'll hear from Logan or someone on his team. Every conversation is direct, and there's never any obligation.",
  },
] as const;

