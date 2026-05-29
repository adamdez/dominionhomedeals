import { SITE } from "@/lib/constants";

export interface SellerSeoPage {
  slug: string;
  title: string;
  metaTitle: string;
  description: string;
  eyebrow: string;
  h1: string;
  intro: string;
  directAnswer: string;
  ctaLabel: string;
  proofAngle: string;
  bullets: string[];
  sections: Array<{
    title: string;
    body: string;
  }>;
  stepsTitle: string;
  steps: Array<{
    title: string;
    body: string;
  }>;
  faqs: Array<{
    q: string;
    a: string;
  }>;
  related: Array<{
    label: string;
    href: string;
  }>;
}

export const SELLER_SEO_LAST_UPDATED = "2026-05-27" as const;

const commonRelated = [
  { label: "Sell as-is in Spokane", href: "/sell/as-is" },
  { label: "Inherited property help", href: "/sell/inherited" },
  { label: "How our process works", href: "/how-we-work" },
  { label: "Spokane neighborhoods we serve", href: "/neighborhoods" },
] as const;

export const SELLER_SEO_PAGES: SellerSeoPage[] = [
  {
    slug: "sell-my-house-fast-spokane",
    title: "Sell My House Fast Spokane",
    metaTitle: "Sell My House Fast in Spokane, WA | Local Cash Buyer",
    description:
      "Need to sell a house fast in Spokane? Dominion Homes buys houses directly, as-is, with no commissions, no repairs, and closing through local title.",
    eyebrow: "Fast house sale in Spokane",
    h1: "Sell My House Fast Spokane",
    intro:
      "If the house is clean, updated, and you have time, listing with an agent may be the right move. But if you are dealing with repairs, probate, tenants, back taxes, or a deadline that will not wait, Dominion Homes can make a direct cash offer and close through local title.",
    directAnswer:
      "Dominion Homes, LLC buys houses for cash in Spokane County and nearby North Idaho. We buy as-is, do not charge commissions, and can often close in about two weeks once title is clear.",
    ctaLabel: "Get My Spokane Cash Offer",
    proofAngle:
      "We are not a national call center routing your information around. You talk with a local Spokane buyer who can look at the real situation and tell you what is possible.",
    bullets: [
      "No repairs, cleaning, or showings required",
      "Useful for inherited homes, rentals, and houses with deferred maintenance",
      "Closing handled through WFG Title or another local title company",
      "You can choose a fast closing or ask for more time",
    ],
    sections: [
      {
        title: "When a fast sale may make sense",
        body:
          "A fast sale can make sense when listing would add more stress. That can mean repairs, probate, tenants, back taxes, cleanup, or a move date that will not wait.",
      },
      {
        title: "How a cash offer is different",
        body:
          "A cash offer may be lower than listing after repairs, but it can save time, repairs, showings, and waiting.",
      },
      {
        title: "How we keep it simple",
        body:
          "We look at the house, the condition, the title situation, and your timeline. If the numbers work for both sides, we sign a purchase agreement and let title do the closing work the normal way.",
      },
      {
        title: "Most fast-sale searches start with a real problem",
        body:
          "The issue is often bigger than price. We look at repairs, title, taxes, tenants, cleanup, and the move date first.",
      },
    ],
    stepsTitle: "How a fast sale works",
    steps: [
      {
        title: "Tell us what is going on",
        body: "Use the form or call us. A few honest details about the house and timeline are enough to start.",
      },
      {
        title: "Get a clear offer",
        body: "We review the property and give you a straightforward cash offer with no obligation.",
      },
      {
        title: "Close when title is ready",
        body: "If you accept, closing runs through title. If you need extra time to move or sort belongings, say so.",
      },
    ],
    faqs: [
      {
        q: "How fast can I sell a house in Spokane for cash?",
        a: "Many direct cash sales can close in about two weeks once title is clear. Probate, liens, missing heirs, or payoff issues can make it take longer.",
      },
      {
        q: "Do I have to clean the house first?",
        a: "No. In a direct sale, many sellers take what they want and leave the rest. We price the cleanout into the offer instead of asking you to handle it first.",
      },
      {
        q: "Is a cash sale always better than listing?",
        a: "No. If your house is market-ready and you have time, listing may bring a higher price. A direct sale is usually about speed, certainty, and avoiding repairs or showings.",
      },
      {
        q: "Who pays closing costs?",
        a: "Dominion Homes typically covers standard seller-side closing costs in our direct purchase agreements, so there are no agent commissions or surprise fees from us.",
      },
    ],
    related: [
      { label: "Cash home buyers in Spokane", href: "/cash-home-buyers-spokane" },
      { label: "We buy houses in Spokane", href: "/we-buy-houses-spokane" },
      ...commonRelated,
    ],
  },
  {
    slug: "cash-home-buyers-spokane",
    title: "Cash Home Buyers Spokane",
    metaTitle: "Cash Home Buyers in Spokane, WA",
    description:
      "Compare cash home buyers in Spokane and learn how Dominion Homes makes direct as-is offers with local title closing and no commissions.",
    eyebrow: "Spokane cash home buyers",
    h1: "Cash Home Buyers Spokane",
    intro:
      "A good cash buyer should explain the number, close through title, and give you room to think. You should not have to deal with pressure, vague funding claims, or a buyer who disappears once inspections get inconvenient.",
    directAnswer:
      "Dominion Homes is a Spokane-based direct buyer. We buy houses with cash, close through local title, and work with sellers who want a simpler path than repairs, showings, and agent commissions.",
    ctaLabel: "Ask For a Cash Offer",
    proofAngle:
      "The point is not to make every seller take a cash offer. The point is to give you a real option and enough information to compare it against listing.",
    bullets: [
      "Local Spokane buyer, not an out-of-state lead desk",
      "No agent commission and no required repairs",
      "Useful for problem properties and tight timelines",
      "Straight purchase agreement and title-company closing",
    ],
    sections: [
      {
        title: "What to ask any cash buyer",
        body:
          "Ask who is actually buying the house, where closing will happen, whether they plan to assign the contract, how they handle repairs, and whether their offer changes after inspection. Clear answers matter.",
      },
      {
        title: "When a cash buyer is useful",
        body:
          "Cash buyers are most useful when the house is not an easy retail listing. That might mean repairs, tenants, an inherited property, back taxes, a fast move, or an owner who does not want months of uncertainty.",
      },
      {
        title: "What to compare",
        body:
          "A cash offer may be lower than listing after repairs. Compare that with commissions, prep costs, showings, repairs, and waiting.",
      },
      {
        title: "Get the terms in writing",
        body:
          "The buyer should put the price, closing date, earnest money, and title-company process in writing.",
      },
      {
        title: "Not every cash buyer works the same way",
        body:
          "Some companies buy houses. Some assign contracts. Some collect leads. Ask who signs the agreement and where closing funds come from.",
      },
    ],
    stepsTitle: "How our cash-offer process works",
    steps: [
      {
        title: "Quick property review",
        body: "We look at the house, area, condition, and likely repair scope.",
      },
      {
        title: "Clear offer",
        body: "You get a cash number and can ask how we got there.",
      },
      {
        title: "Local title closing",
        body: "If you accept, title handles payoffs, taxes, documents, and closing funds.",
      },
    ],
    faqs: [
      {
        q: "Are cash home buyers legitimate?",
        a: "Some are, and some are just lead collectors. A legitimate buyer should be willing to identify the company, use a real title company, and put terms in writing.",
      },
      {
        q: "Will a cash buyer pay market value?",
        a: "A direct buyer usually prices in repairs, risk, holding costs, and resale costs. If the house is already market-ready, listing may produce a higher gross price.",
      },
      {
        q: "Do cash buyers inspect the house?",
        a: "Usually yes, but the inspection should be about confirming condition, not creating a bait-and-switch. We try to discuss obvious issues up front.",
      },
      {
        q: "Can I compare your offer to a realtor's opinion?",
        a: "Yes. You should compare options. A good decision is usually clearer when you understand the cash offer, the listing path, and the true repair and time costs.",
      },
    ],
    related: [
      { label: "Sell my house fast in Spokane", href: "/sell-my-house-fast-spokane" },
      { label: "Back taxes and liens", href: "/sell-house-with-back-taxes-spokane" },
      ...commonRelated,
    ],
  },
  {
    slug: "we-buy-houses-spokane",
    title: "We Buy Houses Spokane",
    metaTitle: "We Buy Houses in Spokane, WA",
    description:
      "Dominion Homes buys houses in Spokane as-is. No repairs, no showings, no commissions, and a local title-company closing.",
    eyebrow: "We buy Spokane houses",
    h1: "We Buy Houses Spokane",
    intro:
      "Some houses are easy to put on the MLS. Others come with old roofs, tired tenants, family paperwork, cleanup, liens, or years of deferred maintenance. Those are the houses Dominion Homes is built to look at.",
    directAnswer:
      "Dominion Homes buys houses directly in Spokane and nearby areas. We buy as-is and can help sellers avoid repairs, open houses, agent commissions, and long inspection negotiations.",
    ctaLabel: "Tell Us About the House",
    proofAngle:
      "We are comfortable with imperfect houses and imperfect situations. If title is complicated, we work with the title company to figure out what has to be solved before closing.",
    bullets: [
      "Inherited homes and probate situations",
      "Vacant houses, rentals, and tenant issues",
      "Back taxes, deferred maintenance, and cleanout problems",
      "Older homes that need roof, plumbing, electrical, or cosmetic work",
    ],
    sections: [
      {
        title: "The house does not have to be pretty",
        body:
          "Most buyers want a house that is ready to move into. We can look at houses that need repairs, cleanup, or updates.",
      },
      {
        title: "You do not have to manage showings",
        body:
          "If you do not want buyers, inspectors, and agents walking through the house for weeks, a direct sale may be easier.",
      },
      {
        title: "We still close the normal way",
        body:
          "A direct sale should still be documented and closed properly. We use title so taxes, payoffs, liens, and documents are handled in the open.",
      },
      {
        title: "We can move fast when title is clear",
        body:
          "If title is clear and you are ready, a direct sale can move quickly. If probate, liens, or payoffs need work, we explain what has to happen first.",
      },
      {
        title: "A direct sale is not for every house",
        body:
          "It usually fits best when repairs, cleanup, tenants, or timing make listing harder than you want it to be.",
      },
    ],
    stepsTitle: "What happens next",
    steps: [
      {
        title: "We listen first",
        body: "The story matters. Timeline, family issues, repairs, and title problems all change the right solution.",
      },
      {
        title: "We make a practical offer",
        body: "The offer accounts for condition and closing timeline, not just an online estimate.",
      },
      {
        title: "You choose yes or no",
        body: "There is no obligation. If listing makes more sense, we will say that too.",
      },
    ],
    faqs: [
      {
        q: "What kinds of houses does Dominion Homes buy?",
        a: "We look at single-family houses, rentals, inherited homes, vacant houses, and properties that need repairs across Spokane County and nearby North Idaho.",
      },
      {
        q: "Will you buy a house with tenants?",
        a: "Yes, we can look at tenant-occupied rentals. The lease, rent status, and tenant situation all matter, but you do not always need to evict before selling.",
      },
      {
        q: "Will you buy a house with a lot of stuff inside?",
        a: "Yes. Many sellers take the items they want and leave the rest for us to handle after closing.",
      },
      {
        q: "Do you buy houses outside Spokane city limits?",
        a: "Yes. We buy in Spokane County and nearby areas, including Spokane Valley, Cheney, Mead, Deer Park, Liberty Lake, and parts of North Idaho.",
      },
    ],
    related: [
      { label: "Cash home buyers in Spokane", href: "/cash-home-buyers-spokane" },
      { label: "Sell rental property in Spokane", href: "/sell-rental-property-spokane" },
      ...commonRelated,
    ],
  },
  {
    slug: "sell-my-house-fast-coeur-d-alene",
    title: "Sell My House Fast Coeur d'Alene",
    metaTitle: "Sell My House Fast in Coeur d'Alene, ID",
    description:
      "Need to sell a house fast in Coeur d'Alene or Kootenai County? Dominion Homes buys houses directly across the Spokane-CDA corridor, as-is, with local title closing.",
    eyebrow: "Fast house sale in Coeur d'Alene",
    h1: "Sell My House Fast Coeur d'Alene",
    intro:
      "A Coeur d'Alene house can look great on paper and still be hard to list if you are dealing with repairs, tenants, inherited paperwork, a fast move, or a property that needs cleanup. Dominion Homes works the Spokane-CDA corridor and can give you a direct as-is option to compare against listing.",
    directAnswer:
      "Dominion Homes buys houses for cash in Coeur d'Alene, Post Falls, Hayden, Rathdrum, and nearby Kootenai County communities. We buy as-is, close through title, and let sellers choose a practical timeline once title is clear.",
    ctaLabel: "Get My CDA Cash Offer",
    proofAngle:
      "North Idaho sellers should be able to verify who they are talking to, where closing happens, and how the number was calculated. We keep those details clear before anyone signs.",
    bullets: [
      "Useful for CDA, Post Falls, Hayden, and Kootenai County homes",
      "No repairs, showings, or cleanout required before asking for an offer",
      "Closing handled through title or escrow with written terms",
      "A simple option when listing would take too long",
    ],
    sections: [
      {
        title: "CDA sellers often need a clear plan",
        body:
          "A fast sale may make sense when the house needs work, family paperwork is involved, tenants are in place, or the move date is close.",
      },
      {
        title: "North Idaho details matter",
        body:
          "Kootenai County properties can involve different title, tax, and closing details than Spokane properties. We look at the local market, the condition, and closing details before making an offer.",
      },
      {
        title: "Compare the direct sale to listing",
        body:
          "If the property is clean, updated, and you have time, listing may be better. A cash offer is strongest when speed and avoiding repairs matter more.",
      },
      {
        title: "North Idaho is not exactly the same as Spokane",
        body:
          "Post Falls, Hayden, Rathdrum, local title expectations, and Kootenai County details can all affect the sale.",
      },
    ],
    stepsTitle: "How a CDA sale works",
    steps: [
      {
        title: "Tell us about the property",
        body: "Send the address and a little context about condition, occupancy, and timeline.",
      },
      {
        title: "Review the local numbers",
        body: "We look at nearby sales, repair scope, and the Kootenai County closing path before making an offer.",
      },
      {
        title: "Close through title",
        body: "If you accept, title or escrow handles payoffs, documents, and funds. You pick the timeline that fits.",
      },
    ],
    faqs: [
      {
        q: "Do you buy houses in Coeur d'Alene for cash?",
        a: "Yes. We buy houses directly in Coeur d'Alene and nearby Kootenai County communities, including Post Falls, Hayden, and Rathdrum.",
      },
      {
        q: "Can I sell a CDA house as-is?",
        a: "Yes. You do not need to repair, clean, or stage the property before asking for an offer. We price the as-is condition into the number.",
      },
      {
        q: "How fast can a Coeur d'Alene cash sale close?",
        a: "Many direct sales can close in about two weeks once title is clear, but title issues, liens, probate, or payoff delays can take longer.",
      },
      {
        q: "Should I compare your offer to listing with an agent?",
        a: "Yes. If the house is market-ready and you have time, listing may produce a higher gross price. A direct sale is about speed, certainty, and less prep work.",
      },
    ],
    related: [
      { label: "Cash home buyers in Spokane", href: "/cash-home-buyers-spokane" },
      { label: "Coeur d'Alene area page", href: "/neighborhoods/coeur-d-alene" },
      { label: "Post Falls area page", href: "/neighborhoods/post-falls" },
      { label: "How we calculate offers", href: "/how-we-calculate-cash-offers-spokane-cda" },
      ...commonRelated,
    ],
  },
  {
    slug: "sell-house-probate-spokane",
    title: "Sell House Probate Spokane",
    metaTitle: "Sell a Probate House in Spokane, WA",
    description:
      "Selling a Spokane house after an owner passes away? Learn how probate, title, heirs, and a direct cash sale usually fit together.",
    eyebrow: "Spokane probate house sale",
    h1: "Selling a probate house in Spokane",
    intro:
      "An heir or family member may be handling the house, but title still has to confirm who has legal authority to sell.",
    directAnswer:
      "If the deceased owner is still on title, a Spokane house usually cannot be sold with insurable title until a personal representative or other legally authorized person can sign the deed. Dominion Homes can make an offer, but title controls what must be cleared before closing.",
    ctaLabel: "Talk Through a Probate House",
    proofAngle:
      "We are used to deals where the first contract is only part of the work. If title needs probate documents, heir consents, or a corrected seller signature, we work through that instead of pretending it does not matter.",
    bullets: [
      "Useful when the owner passed and the house is still in their name",
      "We can wait while title or probate issues are cleared",
      "Back taxes, cleanout, and repairs can often be handled through the sale",
      "Closing still runs through a title company",
    ],
    sections: [
      {
        title: "The taxpayer may not be the legal owner",
        body:
          "County tax records may list a family member as the taxpayer or mailing contact. That does not automatically give them authority to sell. The recorded deed and the probate/title documents matter more.",
      },
      {
        title: "What the title company may need",
        body:
          "Title may ask for a death certificate, will, letters testamentary or letters of administration, heir information, court orders, or other documents before it will insure the buyer's ownership.",
      },
      {
        title: "Why a cash buyer can still help",
        body:
          "A direct buyer can give the family a number while the paperwork is being sorted out. That can help everyone decide whether opening probate, clearing taxes, and cleaning out the house is worth it.",
      },
    ],
    stepsTitle: "A common probate sale path",
    steps: [
      {
        title: "Confirm who owns the house",
        body: "Check the last recorded deed to see who legally owns the property.",
      },
      {
        title: "Ask title for requirements",
        body: "The title company tells the family what authority is needed before a deed can be insured.",
      },
      {
        title: "Close after authority is clear",
        body: "Once the proper person can sign, closing can handle taxes, liens, and proceeds through escrow.",
      },
    ],
    faqs: [
      {
        q: "Can an heir sell a Spokane house before probate is open?",
        a: "Sometimes there are non-probate transfers, but if the deceased owner is still on title, title will usually need a legally authorized signer before closing.",
      },
      {
        q: "Does being listed as taxpayer mean someone owns the house?",
        a: "No. It usually means the county sends tax bills or notices to that person. Ownership and signing authority come from deed records and probate or other transfer documents.",
      },
      {
        q: "Can back taxes be paid at closing?",
        a: "Often yes. Delinquent property taxes are commonly paid from sale proceeds through closing, but the right seller still has to be authorized first.",
      },
      {
        q: "Can Dominion Homes buy a probate house as-is?",
        a: "Yes, if title can be cleared. We can make an as-is offer and give the family time to work through title or probate requirements.",
      },
    ],
    related: [
      { label: "Inherited house in Spokane", href: "/sell/inherited" },
      { label: "Back taxes in Spokane", href: "/sell-house-with-back-taxes-spokane" },
      { label: "Sell my house fast in Spokane", href: "/sell-my-house-fast-spokane" },
      ...commonRelated,
    ],
  },
  {
    slug: "sell-house-with-back-taxes-spokane",
    title: "Sell House With Back Taxes Spokane",
    metaTitle: "Sell a House With Back Taxes in Spokane, WA",
    description:
      "Behind on Spokane County property taxes? Learn how back taxes are usually handled in a direct sale and when title can pay them at closing.",
    eyebrow: "Back taxes and Spokane house sales",
    h1: "You can often sell a Spokane house even if back taxes are owed.",
    intro:
      "Back property taxes are scary because they feel like a clock is running. In many sales, the tax balance does not have to be paid before you talk with a buyer. It can be confirmed by title and paid from closing proceeds if there is enough equity.",
    directAnswer:
      "Dominion Homes buys Spokane-area houses with delinquent property taxes when title can close the sale. Back taxes are typically treated as a lien and paid through escrow from the sale proceeds.",
    ctaLabel: "Get an Offer With Taxes Owed",
    proofAngle:
      "We care about the real payoff number, not just the online value estimate. Taxes, liens, repairs, and timing all need to be put on the same page before the deal makes sense.",
    bullets: [
      "Back taxes may be paid out of sale proceeds",
      "We can review the house before taxes are caught up",
      "Useful when repairs or cleanup make listing hard",
      "Title confirms payoff amounts before closing",
    ],
    sections: [
      {
        title: "Back taxes usually attach to the property",
        body:
          "Property taxes are not just a personal bill. They are tied to the property. That means title will usually collect and pay them at closing before the seller receives proceeds.",
      },
      {
        title: "Equity still matters",
        body:
          "If the house has enough value after mortgages, taxes, liens, and closing costs, a sale may solve the tax problem. If there is not enough equity, the path may be more complicated.",
      },
      {
        title: "Do not wait until the last minute",
        body:
          "Tax timelines, foreclosure notices, and title issues can make a simple sale harder if everyone waits too long. The earlier you know the numbers, the more options you have.",
      },
    ],
    stepsTitle: "How a sale with back taxes works",
    steps: [
      {
        title: "Estimate the tax balance",
        body: "We look at public tax records and then let title confirm the actual payoff.",
      },
      {
        title: "Price the house as-is",
        body: "The offer accounts for repairs, cleanup, and the tax payoff that must be handled.",
      },
      {
        title: "Title pays taxes at closing",
        body: "If the sale closes, delinquent taxes are typically paid before proceeds are released.",
      },
    ],
    faqs: [
      {
        q: "Can I sell my house if I owe Spokane County property taxes?",
        a: "Often yes. The back taxes usually need to be paid at closing, but they do not always have to be paid before you get an offer.",
      },
      {
        q: "Will back taxes stop closing?",
        a: "They can if there is not enough equity or if there are other title problems. A title company can confirm the payoff and requirements.",
      },
      {
        q: "Can Dominion Homes pay the taxes directly?",
        a: "In many cases the cleanest path is for title to pay delinquent taxes from the purchase proceeds at closing, so the payoff is documented correctly.",
      },
      {
        q: "What if the house also needs repairs?",
        a: "That is common. We buy houses as-is, so the repair condition and tax payoff are both considered in the offer.",
      },
    ],
    related: [
      { label: "Sell a probate house", href: "/sell-house-probate-spokane" },
      { label: "Cash buyers in Spokane", href: "/cash-home-buyers-spokane" },
      ...commonRelated,
    ],
  },
  {
    slug: "sell-rental-property-spokane",
    title: "Sell Rental Property Spokane",
    metaTitle: "Sell a Rental Property in Spokane, WA",
    description:
      "Tired of managing a Spokane rental? Dominion Homes buys rental properties as-is, including homes with tenants, deferred maintenance, or landlord fatigue.",
    eyebrow: "Spokane rental property sale",
    h1: "Done being a landlord in Spokane?",
    intro:
      "A rental can look good on paper and still wear you down in real life. Late rent, turnovers, repairs, insurance, taxes, and tenant communication can turn one house into a second job.",
    directAnswer:
      "Dominion Homes buys rental properties in Spokane as-is, including houses with tenants, repairs, old leases, or a landlord who simply wants out.",
    ctaLabel: "Get a Rental Property Offer",
    proofAngle:
      "We understand that a rental is not just a house. The tenant status, lease, repairs, rent amount, and timeline all shape the right offer.",
    bullets: [
      "Tenant-occupied properties considered",
      "No repairs or listing prep required",
      "Useful for tired landlords and inherited rentals",
      "Flexible closing when you need time to coordinate",
    ],
    sections: [
      {
        title: "You may not need to evict first",
        body:
          "Depending on the lease and tenant situation, a direct buyer may be able to buy with tenants in place. That can be easier than trying to create a vacant, polished listing.",
      },
      {
        title: "Deferred maintenance changes the math",
        body:
          "Rentals often collect small problems until they become expensive. A direct sale can be useful when the next roof, furnace, sewer line, or turnover is not worth tackling.",
      },
      {
        title: "The sale should respect the paperwork",
        body:
          "Leases, deposits, notices, and tenant information need to be handled cleanly. Title handles the closing, and the contract should be clear about what transfers.",
      },
    ],
    stepsTitle: "How we look at rentals",
    steps: [
      {
        title: "Review rent and occupancy",
        body: "We ask whether the house is occupied, what rent is being paid, and what lease terms exist.",
      },
      {
        title: "Review condition",
        body: "We look at the likely repair and turnover costs instead of asking you to fix everything first.",
      },
      {
        title: "Make a direct offer",
        body: "If the numbers work, we close through title and coordinate the handoff.",
      },
    ],
    faqs: [
      {
        q: "Can I sell a Spokane rental with tenants still living there?",
        a: "Yes, it may be possible. The lease, rent status, deposits, and tenant situation all matter, but vacant possession is not always required for a direct sale.",
      },
      {
        q: "Do I need to repair the rental before selling?",
        a: "No. We can make an as-is offer that accounts for repair and turnover costs.",
      },
      {
        q: "What if the tenant is behind on rent?",
        a: "We can still look at it. A non-paying tenant changes the risk and the offer, but it does not automatically kill the conversation.",
      },
      {
        q: "Is this different from listing with an agent?",
        a: "Yes. Listing may produce a higher price if the rental is clean, performing, and easy to show. A direct sale is usually about reducing hassle and uncertainty.",
      },
    ],
    related: [
      { label: "Tired landlord page", href: "/sell/landlord" },
      { label: "We buy houses in Spokane", href: "/we-buy-houses-spokane" },
      ...commonRelated,
    ],
  },
];

export function getSellerSeoPage(slug: string) {
  return SELLER_SEO_PAGES.find((page) => page.slug === slug) ?? null;
}

export function getSellerSeoUrl(slug: string) {
  return `${SITE.url}/${slug}`;
}
