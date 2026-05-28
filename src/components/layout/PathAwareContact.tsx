"use client";

import { usePathname } from "next/navigation";
import { SITE } from "@/lib/constants";

const RIVERSIDE_DISPO_PATH = "/off-market/34124-n-newport-highway-trailer-29";
const RIVERSIDE_DISPO_PHONE = "509-590-7091";

const LOCAL_OFFER_FORM_PATHS = new Set([
  "/",
  "/sell",
  "/sell/as-is",
  "/sell/inherited",
  "/sell/landlord",
  "/sell/foreclosure",
  "/sell-my-house-fast-spokane",
  "/cash-home-buyers-spokane",
  "/we-buy-houses-spokane",
  "/sell-house-probate-spokane",
  "/sell-house-with-back-taxes-spokane",
  "/sell-rental-property-spokane",
  "/sell-my-house-fast-coeur-d-alene",
]);

function cleanPhone(phone: string) {
  return phone.replace(/\D/g, "");
}

function usePathAwareContact() {
  const pathname = usePathname() ?? "";
  const phone = pathname === RIVERSIDE_DISPO_PATH ? RIVERSIDE_DISPO_PHONE : SITE.phone;
  const offerHref = LOCAL_OFFER_FORM_PATHS.has(pathname) ? "#get-offer" : "/#get-offer";

  return { phone, phoneHref: cleanPhone(phone), offerHref };
}

export function HeaderContactActions() {
  const { phone, phoneHref, offerHref } = usePathAwareContact();

  return (
    <>
      <a href={`tel:${phoneHref}`} className="whitespace-nowrap text-sm font-semibold text-ink-500">
        {phone}
      </a>
      <a href={offerHref} className="btn-primary text-sm !px-5 !py-2.5">
        Get My Cash Offer
      </a>
    </>
  );
}

export function HeaderMobileContactActions() {
  const { phone, phoneHref, offerHref } = usePathAwareContact();

  return (
    <>
      <a href={`tel:${phoneHref}`} className="rounded-lg px-4 py-2.5 text-[15px] font-semibold text-ink-500">
        {phone}
      </a>
      <a href={offerHref} className="btn-primary mt-2 text-center">
        Get My Cash Offer
      </a>
    </>
  );
}

export function FooterPhone() {
  const { phone, phoneHref } = usePathAwareContact();

  return (
    <a href={`tel:${phoneHref}`} className="mt-3 inline-block text-sm font-semibold text-amber-400">
      {phone}
    </a>
  );
}
