import type { Metadata } from "next";
import type { SellerSeoPage } from "@/lib/seller-seo-pages";
import { getSellerSeoUrl } from "@/lib/seller-seo-pages";

export function getSellerSeoMetadata(page: SellerSeoPage): Metadata {
  const url = getSellerSeoUrl(page.slug);

  return {
    title: page.metaTitle,
    description: page.description,
    alternates: { canonical: url },
    openGraph: {
      title: page.metaTitle,
      description: page.description,
      url,
      type: "website",
    },
  };
}
