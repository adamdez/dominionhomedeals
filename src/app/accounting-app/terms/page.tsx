import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Dominion Accounting End-User License Agreement",
  robots: { index: false, follow: false },
};

export default function AccountingTermsPage() {
  return (
    <main id="main-content" className="mx-auto max-w-3xl px-5 py-16 sm:py-20">
      <h1 className="font-display text-3xl font-bold">Dominion Accounting End-User License Agreement</h1>
      <p className="mt-3 text-sm text-stone-500">Effective September 29, 2026</p>
      <div className="mt-8 space-y-6 text-stone-700">
        <p>
          This agreement governs use of Dominion Accounting, an internal QuickBooks
          Online integration operated by {SITE.legalName}. It is available only to
          people authorized by Dominion and the administrator of the QuickBooks
          company file they connect. It is not licensed or offered to the public.
        </p>
        <section>
          <h2 className="font-display text-xl font-semibold text-ink-600">Permitted use</h2>
          <p className="mt-2">
            Authorized users may access accounting data and make bookkeeping changes
            within the company files for which they have permission. They must protect
            credentials, follow Dominion&apos;s accounting controls, and comply with
            applicable Intuit terms. Access ends when Dominion or the QuickBooks
            company administrator revokes it.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl font-semibold text-ink-600">Records and responsibility</h2>
          <p className="mt-2">
            Changes made through the integration become part of the QuickBooks company
            file. Authorized users are responsible for reviewing source documents,
            company identity, and the resulting accounting records. The integration
            does not replace professional tax, legal, or audit judgment.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl font-semibold text-ink-600">Contact</h2>
          <p className="mt-2">
            Questions about access or this agreement may be sent to{" "}
            <a className="underline" href={`mailto:${SITE.adminEmail}`}>{SITE.adminEmail}</a>.
          </p>
        </section>
      </div>
      <Link className="mt-8 inline-block text-forest-700 underline" href="/accounting-app">
        Dominion Accounting overview
      </Link>
    </main>
  );
}
