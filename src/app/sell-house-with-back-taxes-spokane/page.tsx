import { SellerSeoLandingPage } from "@/components/seo/SellerSeoLandingPage";
import { getSellerSeoMetadata } from "@/lib/seller-seo-metadata";
import { getSellerSeoPage } from "@/lib/seller-seo-pages";

const page = getSellerSeoPage("sell-house-with-back-taxes-spokane")!;

export const metadata = getSellerSeoMetadata(page);

export default function SellHouseWithBackTaxesSpokanePage() {
  return <SellerSeoLandingPage page={page} />;
}
