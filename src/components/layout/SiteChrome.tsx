"use client";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { MetaSellerChrome } from "@/components/layout/MetaSellerChrome";
import { usePathname } from "next/navigation";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/review" || pathname === "/off-market/11211-e-black-rd") {
    return <main id="main-content">{children}</main>;
  }

  if (pathname === "/sell/offer-check" || pathname?.startsWith("/sell/offer-check/")) {
    return <MetaSellerChrome>{children}</MetaSellerChrome>;
  }

  const variant = pathname === "/sell/options" ? "options" : "default";

  return (
    <>
      <Header variant={variant} />
      <main id="main-content">{children}</main>
      <Footer variant={variant} />
    </>
  );
}
