import type { Metadata } from "next";
import { ReviewHandoff } from "./review-handoff";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Leave Us a Google Review",
  description: "Share your experience with Dominion Homes on Google.",
  alternates: { canonical: `${SITE.url}/review` },
  robots: { index: false, follow: false },
  openGraph: {
    type: "website",
    title: "Share your experience with Dominion Homes",
    description: "Your honest feedback helps local homeowners know what to expect.",
    url: `${SITE.url}/review`,
  },
  twitter: {
    card: "summary_large_image",
    title: "Share your experience with Dominion Homes",
    description: "Your honest feedback helps local homeowners know what to expect.",
  },
};

export default function ReviewPage() {
  return <ReviewHandoff reviewUrl={SITE.profiles.googleReview} />;
}
