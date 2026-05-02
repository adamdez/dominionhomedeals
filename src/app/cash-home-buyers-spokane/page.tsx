import { SellerSeoLandingPage } from "@/components/seo/SellerSeoLandingPage";
import { getSellerSeoMetadata } from "@/lib/seller-seo-metadata";
import { getSellerSeoPage } from "@/lib/seller-seo-pages";

const page = getSellerSeoPage("cash-home-buyers-spokane")!;

export const metadata = getSellerSeoMetadata(page);

export default function CashHomeBuyersSpokanePage() {
  return <SellerSeoLandingPage page={page} />;
}
