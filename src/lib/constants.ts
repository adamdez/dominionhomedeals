// src/lib/constants.ts

export const SITE = {
  name: "Dominion Homes",
  legalName: "Dominion Homes, LLC",
  tagline: "Local Spokane Team - Direct Home Buyers",
  description:
    "Spokane-area team that buys houses directly. No commissions, no repairs, close on your timeline. We meet you in person.",
  url: "https://www.dominionhomedeals.com",
  phone: "509-666-9518",
  email: "leads@dominionhomedeals.com",
  adminEmail: "admin@dominionhomedeals.com",
  address: {
    street: "PO Box 337",
    city: "Mead",
    state: "WA",
    zip: "99021",
  },
  serviceArea: "Spokane County, WA and Kootenai County, ID",
  profiles: {
    googleBusiness: "https://www.google.com/maps?cid=5032019384215942012",
  },
  // Add profile URLs here once live (GBP, Facebook, etc.)
  // Schema sameAs in layout.tsx reads from this array.
  sameAs: ["https://www.google.com/maps?cid=5032019384215942012"] as readonly string[],
} as const;

/** Team - real people, real bios, honest */
export const TEAM = [
  {
    name: "Logan Anyan",
    role: "Founder & Owner",
    bio: "Logan is the founder and owner of Dominion Homes. He works directly with sellers across Spokane County and North Idaho from the first call to closing.",
    image: "/images/team/logan.jpg",
    location: "Spokane, WA",
  },
] as const;

export const PROCESS_STEPS = [
  {
    number: "1",
    title: "Tell Us About Your Home",
    description:
      "Fill out the quick form or call us. It takes about 60 seconds. No repairs, cleanup, or listing prep needed.",
    duration: "60 seconds",
  },
  {
    number: "2",
    title: "Get a Fair Cash Offer",
    description:
      "We review the house and give you a clear cash offer, usually within a day or two. No pressure either way.",
    duration: "1-2 days",
  },
  {
    number: "3",
    title: "Close on Your Schedule",
    description:
      "You pick the closing date. We handle the paperwork through title. No commissions, no fees, no surprises.",
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

export const SMS_PROGRAM_MAX_FREQUENCY = "up to 10 messages per month" as const;

export const SMS_CTA_DISCLOSURE =
  "Optional SMS updates are available only if you check the SMS consent box in this form. By opting in, you agree to receive recurring marketing and informational texts from Dominion Homes, LLC about your property inquiry, including cash-offer follow-ups, appointment scheduling, and transaction status updates. Message frequency varies, up to 10 msgs/month. Message and data rates may apply. Reply STOP to opt out or HELP for help. Consent is not required to receive an offer." as const;

export const SMS_CONSENT_TEXT =
  "I agree to receive recurring marketing and informational text messages from Dominion Homes, LLC about my property inquiry, including cash offer follow-ups, appointment scheduling, and transaction status updates, at the phone number provided. Messages may be sent using automated technology. Consent is not required to receive an offer. Message frequency varies, up to 10 msgs/month. Message and data rates may apply. Reply STOP to opt out or HELP for help. We do not sell, rent, or share mobile information or SMS opt-in consent with third parties or affiliates for marketing or promotional purposes." as const;

export const SMS_PRIVACY_NON_SHARING_TEXT =
  "No mobile information, including phone numbers, SMS opt-in data, and SMS consent records, will be shared with third parties or affiliates for marketing or promotional purposes. Text messaging originator opt-in data and consent are not sold, rented, transferred, or shared with any third parties." as const;

export const TCPA_CONSENT_TEXT =
  "By submitting this form, you consent to receive calls, text messages (SMS/MMS), and emails from Dominion Homes, LLC at the phone number and email provided, including messages sent using autodialer or automated technology, for the purpose of discussing the sale of your property. Consent is not a condition of purchase. Message frequency varies, up to 10 msgs/month. Message and data rates may apply. Reply STOP to opt out, HELP for help." as const;

/** Situations we help with - for the "We Buy Houses In Any Situation" section */
export const SITUATIONS = [
  { title: "Inherited Property", desc: "Inherited a house you do not want to manage? We can buy it as-is." },
  { title: "Behind on Payments", desc: "Missed payments or foreclosure pressure? We can talk through your options." },
  { title: "Divorce", desc: "Need to sell as part of a divorce? We keep the process simple and clear." },
  { title: "Relocating", desc: "Need to move quickly? You choose the closing date." },
  { title: "Tired Landlord", desc: "Done with tenants and repairs? We buy rentals as-is." },
  { title: "Needs Major Repairs", desc: "Roof, foundation, cleanup, or old systems? You do not need to fix it first." },
] as const;

/** FAQs for the /sell landing page - seller-focused, honest, actionable */
export const SELL_PAGE_FAQS = [
  {
    q: "How fast can you close?",
    a: "That depends on your situation. Some sellers need to close in two weeks - we can do that. Others need a few months to figure out their next move. You pick the timeline, and we work around it.",
  },
  {
    q: "Do I need to make any repairs first?",
    a: "No. We review houses in any condition - roof issues, foundation problems, outdated everything, or just a house you don't want to deal with anymore. You don't need to fix, clean, or stage anything before asking for an offer.",
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
    a: "Logan leads Dominion Homes, a local Spokane team that buys houses directly across Spokane County and North Idaho. No call center, no scripts, no middlemen. Call or text us at 509-666-9518 and you'll hear from Logan or someone on his team. Every conversation is direct, and there's never any obligation.",
  },
] as const;

