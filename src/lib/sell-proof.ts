import { SITE } from "@/lib/constants";
import { SELLER_STORIES } from "@/lib/seller-stories";

export type SellAngle = "default" | "inherited" | "as-is" | "landlord" | "foreclosure";

function parseOptionalNumber(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

const familiesHelped = parseOptionalNumber(process.env.NEXT_PUBLIC_SELLER_PROOF_FAMILIES_HELPED);
const familiesHelpedSinceYear = parseOptionalNumber(
  process.env.NEXT_PUBLIC_SELLER_PROOF_SINCE_YEAR,
);

export const SELLER_PROOF = {
  founder: {
    firstName: "Logan",
    name: "Logan Anyan",
    title: "Owner, Dominion Home Deals",
    image: "/images/team/logan.jpg",
    phone: SITE.phone,
    introVideoEmbedUrl: process.env.NEXT_PUBLIC_OWNER_INTRO_VIDEO_EMBED_URL || null,
    introVideoSrc: "/videos/logan-intro.mp4",
    introVideoPoster: "/images/video-posters/logan-intro.jpg",
    introByAngle: {
      default:
        "Hi, I'm Logan. I buy houses in Spokane County. If you're dealing with a property you need to move on from, fill out the form and I'll personally call you back within an hour with a no-obligation cash offer. No fees, no repairs, no surprises.",
      inherited:
        "Hi, I'm Logan. I buy houses in Spokane County. If you're dealing with an inherited house, fill out the form and I'll personally call you back within an hour with a no-obligation cash offer. No fees, no repairs, no surprises.",
      "as-is":
        "Hi, I'm Logan. I buy houses in Spokane County. If you're dealing with a house that needs work, fill out the form and I'll personally call you back within an hour with a no-obligation cash offer. No fees, no repairs, no surprises.",
      landlord:
        "Hi, I'm Logan. I buy houses in Spokane County. If you're dealing with a rental or tenant situation, fill out the form and I'll personally call you back within an hour with a no-obligation cash offer. No fees, no repairs, no surprises.",
      foreclosure:
        "Hi, I'm Logan. I buy houses in Spokane County. If you're behind on payments or facing foreclosure, fill out the form and I'll personally call you back within an hour with a no-obligation cash offer. No fees, no repairs, no surprises.",
    } satisfies Record<SellAngle, string>,
  },
  trustStats: {
    familiesHelped,
    familiesHelpedSinceYear,
  },
  verifiedTestimonials: [
    {
      name: "Sarah M.",
      neighborhood: "Spokane",
      quote:
        "Adam and his team made selling my house so much easier than I expected. They came out, looked at the place, gave me a fair offer, and we closed in two weeks. No hassle, no pressure. Just good people doing what they said they'd do.",
      avatarLabel: "SM",
    },
  ],
  localDealSnapshots: SELLER_STORIES.slice(0, 2).map((story) => ({
    id: story.slug,
    title: story.title,
    location: story.location,
    situation: story.situation,
    summary: story.summary,
  })),
} as const;

export function getSellTrustStripItems(): string[] {
  const items = ["Locally Owned in Spokane"];

  if (familiesHelped && familiesHelpedSinceYear) {
    items.push(`${familiesHelped} Families Helped Since ${familiesHelpedSinceYear}`);
  } else {
    items.push("Local team you can reach directly");
  }

  items.push("No Fees, No Repairs, No Obligation");
  items.push("Cash Offer in 24 Hours");

  return items;
}
