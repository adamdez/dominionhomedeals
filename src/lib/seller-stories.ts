export type SellerStory = {
  slug: string;
  title: string;
  location: string;
  situation: string;
  summary: string;
  hook: string;
  intro: string;
  propertySnapshot: string[];
  sellerPriority: string[];
  whyDirectSaleFit: string[];
  closingShape: string[];
  note: string;
};

export const SELLER_STORIES: SellerStory[] = [
  {
    slug: "spokane-valley-inherited-rambler",
    title: "Spokane Valley Inherited Rambler",
    location: "Spokane Valley, WA",
    situation: "Inherited house",
    summary:
      "An older rambler with original finishes, remaining belongings in the garage, and family members trying to decide whether to fix it, keep it, or sell it.",
    hook:
      "The family did not need a polished sales pitch. They needed somebody to explain what a direct sale would actually look like while they got aligned.",
    intro:
      "This is the kind of inherited-property call that comes up constantly around Spokane Valley: a parent passes, the house needs work, two or three people are involved in the decision, and nobody wants to turn the place into a full renovation project before they even know what their options are.",
    propertySnapshot: [
      "Single-story house with dated kitchen and bath finishes.",
      "Some deferred maintenance, plus a garage and spare room still holding years of belongings.",
      "The bigger issue was not one repair item. It was the total amount of work standing between the family and a clean decision.",
    ],
    sellerPriority: [
      "Get a straight answer before spending money on cleanup or repairs.",
      "Keep the timeline flexible while family members got on the same page.",
      "Avoid turning an emotional situation into a months-long listing project.",
    ],
    whyDirectSaleFit: [
      "A cash buyer can factor condition and remaining contents into the offer instead of requiring the house to be retail-ready first.",
      "There is less pressure to rush into contractors, dumpsters, paint, flooring, and showings before the family has decided anything.",
      "The process tends to work best when everybody wants clarity, simplicity, and a clean closing path more than top-of-market upside.",
    ],
    closingShape: [
      "Initial walk-through and conversation about condition, contents, and timing.",
      "Offer presented once the family had enough information to compare options.",
      "Closing handled through title after the paperwork and decision-making side were settled.",
    ],
    note:
      "Privacy note: details are intentionally blended and simplified to reflect a common local closing pattern without identifying a seller or a property. This is not presented as a public testimonial.",
  },
  {
    slug: "north-spokane-former-rental",
    title: "North Spokane Former Rental",
    location: "North Spokane, WA",
    situation: "Former rental / tired landlord",
    summary:
      "A rental that had reached the point where the owner was done putting money into repairs, turnover prep, and another round of uncertainty.",
    hook:
      "The decision was less about squeezing every dollar out of the house and more about getting out cleanly without another repair cycle.",
    intro:
      "This is a very normal North Spokane seller profile: the house has been a rental, the owner knows there is still value there, but the idea of flooring bids, paint bids, cleanup, and listing prep feels like one more job they do not want.",
    propertySnapshot: [
      "Average neighborhood rental with visible wear from use over time.",
      "Likely needs at least a paint-flooring-cleanup pass before a retail listing feels comfortable.",
      "The seller is usually realistic about condition and mostly wants to avoid sinking in more cash before selling.",
    ],
    sellerPriority: [
      "Get a number that reflects the property as it sits today.",
      "Skip the make-ready list and the uncertainty of buyer inspections later.",
      "Close on a timeline that feels practical instead of dragging through a full listing cycle.",
    ],
    whyDirectSaleFit: [
      "This route makes sense when the owner is tired of repairs and does not want to keep feeding the property more money.",
      "It also reduces the risk of fixing the obvious items only to have another inspection list show up later.",
      "For a seller who values certainty, a clean as-is process can matter more than chasing the highest possible retail number.",
    ],
    closingShape: [
      "Basic review of current condition, rental history, and anything still needed before turnover.",
      "Offer built around the as-is condition instead of a hypothetical fixed-up value.",
      "Title and closing scheduled around the seller's move-out or handoff timing.",
    ],
    note:
      "Privacy note: details are intentionally blended and simplified to reflect a common local closing pattern without identifying a seller or a property. This is not presented as a public testimonial.",
  },
  {
    slug: "post-falls-vacant-relocation",
    title: "Post Falls Vacant Relocation House",
    location: "Post Falls, ID",
    situation: "Relocation / vacant house",
    summary:
      "A seller who had already moved and wanted the empty house handled without listing prep, repeated showings, or months of waiting.",
    hook:
      "Once a house is vacant, most people stop asking how to optimize it and start asking how to get it off their plate.",
    intro:
      "This is a common Post Falls scenario: the move is already done, the house is sitting empty, and the seller wants to know whether the buyer is real, whether title is straightforward, and whether the closing date can actually be counted on.",
    propertySnapshot: [
      "Vacant property with the usual small punch-list items that become annoying once nobody is living there.",
      "The seller is managing the house from somewhere else and does not want to keep checking on it, paying utilities, or coordinating access.",
      "Even when the house is decent overall, vacancy changes the conversation from optimization to simplicity.",
    ],
    sellerPriority: [
      "Know exactly who is buying and where closing happens.",
      "Reduce the chance of delays, buyer fallout, or long stretches on market.",
      "Wrap the sale around the seller's already-in-progress move.",
    ],
    whyDirectSaleFit: [
      "A direct buyer removes showings, listing prep, and the extra friction that comes with selling from out of town.",
      "It can also help when the seller values certainty and a defined closing path over marketing the property for weeks.",
      "For vacant houses, the emotional relief often comes from getting the property handled cleanly and moving on.",
    ],
    closingShape: [
      "Quick review of condition, access, and any remaining items at the house.",
      "Offer and title coordination handled around the seller's distance and schedule.",
      "Closing completed once timing, paperwork, and title work all lined up cleanly.",
    ],
    note:
      "Privacy note: details are intentionally blended and simplified to reflect a common local closing pattern without identifying a seller or a property. This is not presented as a public testimonial.",
  },
];

export function getSellerStory(slug: string) {
  return SELLER_STORIES.find((story) => story.slug === slug) ?? null;
}
