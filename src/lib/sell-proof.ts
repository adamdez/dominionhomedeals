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
    title: "Owner, Dominion Homes",
    image: "/images/team/logan.jpg",
    phone: SITE.phone,
    introVideoEmbedUrl: process.env.NEXT_PUBLIC_OWNER_INTRO_VIDEO_EMBED_URL || null,
    introVideoSrc: "/videos/logan-intro.mp4",
    introVideoPoster: "/images/video-posters/logan-intro.jpg",
    introByAngle: {
      default:
        "Hi, I'm Logan. I buy houses in Spokane County. If you have a property you need to sell, fill out the form and I will call you back. No fees, no repairs, no pressure.",
      inherited:
        "Hi, I'm Logan. I buy houses in Spokane County. If you inherited a house and are not sure what to do next, fill out the form and I will call you back. No fees, no repairs, no pressure.",
      "as-is":
        "Hi, I'm Logan. I buy houses in Spokane County. If the house needs work, fill out the form and I will call you back. No fees, no repairs, no pressure.",
      landlord:
        "Hi, I'm Logan. I buy houses in Spokane County. If you are done with a rental or tenant situation, fill out the form and I will call you back. No fees, no repairs, no pressure.",
      foreclosure:
        "Hi, I'm Logan. I buy houses in Spokane County. If you are behind on payments or worried about foreclosure, fill out the form and I will call you back. No fees, no repairs, no pressure.",
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
        "Logan and his team made selling my house so much easier than I expected. They came out, looked at the place, gave me a fair offer, and we closed in two weeks. No hassle, no pressure. Just good people doing what they said they'd do.",
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
  items.push("Fast Cash Offer");

  return items;
}
