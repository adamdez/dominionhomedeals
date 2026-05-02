import { SellerSeoLandingPage } from "@/components/seo/SellerSeoLandingPage";
import { getSellerSeoMetadata } from "@/lib/seller-seo-metadata";
import { getSellerSeoPage } from "@/lib/seller-seo-pages";

const page = getSellerSeoPage("we-buy-houses-spokane")!;

export const metadata = getSellerSeoMetadata(page);

export default function WeBuyHousesSpokanePage() {
  return <SellerSeoLandingPage page={page} />;
}
