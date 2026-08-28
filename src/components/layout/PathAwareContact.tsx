"use client";

import { usePathname } from "next/navigation";
import { SITE } from "@/lib/constants";

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
  const phone = SITE.phone;
  const offerHref = LOCAL_OFFER_FORM_PATHS.has(pathname) ? "#get-offer" : "/#get-offer";

  return { phone, phoneHref: cleanPhone(phone), offerHref };
}

type HeaderContactProps = {
  actionHref?: string;
  actionLabel?: string;
};

export function HeaderContactActions({ actionHref, actionLabel = "Get My Cash Offer" }: HeaderContactProps = {}) {
  const { phone, phoneHref, offerHref } = usePathAwareContact();

  return (
    <>
      <a href={`tel:${phoneHref}`} className="whitespace-nowrap text-sm font-semibold text-ink-500">
        {phone}
      </a>
      <a href={actionHref ?? offerHref} className="btn-primary text-sm !px-5 !py-2.5">
        {actionLabel}
      </a>
    </>
  );
}

export function HeaderMobileContactActions({ actionHref, actionLabel = "Get My Cash Offer" }: HeaderContactProps = {}) {
  const { phone, phoneHref, offerHref } = usePathAwareContact();

  return (
    <>
      <a href={`tel:${phoneHref}`} className="rounded-lg px-4 py-2.5 text-[15px] font-semibold text-ink-500">
        {phone}
      </a>
      <a href={actionHref ?? offerHref} className="btn-primary mt-2 text-center">
        {actionLabel}
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
