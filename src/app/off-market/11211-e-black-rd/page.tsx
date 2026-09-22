import type { Metadata } from "next";
import { BlackRoadPresentation } from "@/components/off-market/black-road/BlackRoadPresentation";
import { SITE } from "@/lib/constants";

const title = "11211 E Black Rd | An interactive property tour";
const description =
  "Explore a distinctive Chattaroy home on 12.8 acres. Follow the rooms and split-level layout through an interactive photo walkthrough.";
export const metadata: Metadata = {
  title,
  description,
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
  alternates: { canonical: `${SITE.url}/off-market/11211-e-black-rd` },
  openGraph: {
    title,
    description,
    url: `${SITE.url}/off-market/11211-e-black-rd`,
    images: [
      { url: "/images/black-road/8021.webp", width: 1500, height: 1125 },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/images/black-road/8021.webp"],
  },
};
export default function BlackRoadPage() {
  return <BlackRoadPresentation />;
}
