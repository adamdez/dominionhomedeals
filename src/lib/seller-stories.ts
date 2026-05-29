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
      "The family needed a clear answer while they got on the same page.",
    intro:
      "This kind of call comes up often around Spokane Valley: a parent passes, the house needs work, more than one person is involved, and nobody wants a full renovation project before they know their options.",
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
      "A cash buyer can include condition and leftover belongings in the offer.",
      "There is less pressure to rush into contractors, dumpsters, paint, flooring, and showings before the family has decided anything.",
      "The process works best when everyone wants a clear sale more than the highest possible price.",
    ],
    closingShape: [
      "Initial walk-through and conversation about condition, contents, and timing.",
      "Offer presented once the family had enough information to compare options.",
      "Closing handled through title after the paperwork and decision-making side were settled.",
    ],
    note:
      "Note: details are blended and simplified to show a common local situation without identifying a seller or property. This is not a public testimonial.",
  },
  {
    slug: "north-spokane-former-rental",
    title: "North Spokane Former Rental",
    location: "North Spokane, WA",
    situation: "Former rental / tired landlord",
    summary:
      "A rental where the owner was done putting money into repairs, turnover prep, and more waiting.",
    hook:
      "The decision was less about squeezing every dollar out of the house and more about getting out cleanly without another repair cycle.",
    intro:
      "This is a common North Spokane seller situation: the house has been a rental, there is still value there, but the owner is done with bids, cleanup, and listing prep.",
    propertySnapshot: [
      "Average neighborhood rental with visible wear from use over time.",
      "Likely needs at least a paint-flooring-cleanup pass before a retail listing feels comfortable.",
      "The seller is realistic about condition and does not want to put more money into the house before selling.",
    ],
    sellerPriority: [
      "Get a number that reflects the property as it sits today.",
      "Skip the repair list and buyer inspection back-and-forth later.",
      "Close on a timeline that feels practical instead of dragging through a full listing cycle.",
    ],
    whyDirectSaleFit: [
      "This route makes sense when the owner is tired of repairs and does not want to keep feeding the property more money.",
      "It also reduces the risk of fixing the obvious items only to have another inspection list show up later.",
      "For some sellers, a clean as-is process matters more than chasing the highest price.",
    ],
    closingShape: [
      "Basic review of current condition, rental history, and anything still needed before turnover.",
      "Offer built around the as-is condition instead of a hypothetical fixed-up value.",
      "Title and closing scheduled around the seller's move-out or handoff timing.",
    ],
    note:
      "Note: details are blended and simplified to show a common local situation without identifying a seller or property. This is not a public testimonial.",
  },
  {
    slug: "post-falls-vacant-relocation",
    title: "Post Falls Vacant Relocation House",
    location: "Post Falls, ID",
    situation: "Relocation / vacant house",
    summary:
      "A seller who had already moved and wanted the empty house handled without listing prep, repeated showings, or months of waiting.",
    hook:
      "Once a house is vacant, most people just want it handled.",
    intro:
      "This is a common Post Falls situation: the move is done, the house is empty, and the seller wants to know if the buyer is real and the closing date can be counted on.",
    propertySnapshot: [
      "Vacant property with the usual small punch-list items that become annoying once nobody is living there.",
      "The seller is managing the house from somewhere else and does not want to keep checking on it, paying utilities, or coordinating access.",
      "Even when the house is decent, vacancy usually makes people want a simpler sale.",
    ],
    sellerPriority: [
      "Know exactly who is buying and where closing happens.",
      "Reduce the chance of delays, buyer fallout, or long stretches on market.",
      "Wrap the sale around the seller's already-in-progress move.",
    ],
    whyDirectSaleFit: [
      "A direct buyer removes showings, listing prep, and the extra friction that comes with selling from out of town.",
      "It can also help when the seller wants a clear closing date instead of weeks of showings.",
      "For vacant houses, the emotional relief often comes from getting the property handled cleanly and moving on.",
    ],
    closingShape: [
      "Quick review of condition, access, and any remaining items at the house.",
      "Offer and title coordination handled around the seller's distance and schedule.",
      "Closing completed once timing, paperwork, and title work all lined up cleanly.",
    ],
    note:
      "Note: details are blended and simplified to show a common local situation without identifying a seller or property. This is not a public testimonial.",
  },
];

export function getSellerStory(slug: string) {
  return SELLER_STORIES.find((story) => story.slug === slug) ?? null;
}
