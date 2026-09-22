"use client";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { usePathname } from "next/navigation";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/review" || pathname === "/off-market/11211-e-black-rd") {
    return <main id="main-content">{children}</main>;
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
