import { SellerSeoLandingPage } from "@/components/seo/SellerSeoLandingPage";
import { getSellerSeoMetadata } from "@/lib/seller-seo-metadata";
import { getSellerSeoPage } from "@/lib/seller-seo-pages";

const page = getSellerSeoPage("sell-my-house-fast-spokane")!;

export const metadata = getSellerSeoMetadata(page);

export default function SellMyHouseFastSpokanePage() {
  return <SellerSeoLandingPage page={page} />;
}
