import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Dominion Accounting Privacy Policy",
  description: "How Dominion Accounting handles QuickBooks Online information.",
  robots: { index: false, follow: false },
};

export default function AccountingPrivacyPage() {
  return (
    <main id="main-content" className="mx-auto max-w-3xl px-5 py-16 sm:py-20">
      <h1 className="font-display text-3xl font-bold">Dominion Accounting Privacy Policy</h1>
      <p className="mt-3 text-sm text-stone-500">Effective September 29, 2026</p>
      <div className="mt-8 space-y-6 text-stone-700">
        <p>
          {SITE.legalName} operates Dominion Accounting for its own authorized company
          files. This policy covers information accessed through the QuickBooks Online
          integration. The <Link className="underline" href="/privacy">website privacy policy</Link> covers
          visits to these public information pages, including website analytics.
        </p>
        <section>
          <h2 className="font-display text-xl font-semibold text-ink-600">Information and use</h2>
          <p className="mt-2">
            With administrator authorization, the integration accesses QuickBooks
            company, account, customer, vendor, invoice, bill, payment, transaction,
            and reporting data through the Accounting scope. Authorized personnel use
            it for bookkeeping, reconciliation, billing review, cash planning, and
            management reporting. Supported bookkeeping changes are written back to
            the authorized company file.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl font-semibold text-ink-600">Sharing and storage</h2>
          <p className="mt-2">
            Accounting information is used by Dominion personnel and service providers
            engaged to process or host accounting work, including Intuit and AI tools
            used by Dominion. It may be provided to Dominion&apos;s accountants or
            advisers as needed for their work. Dominion does not sell QuickBooks data.
            Access credentials and working records are kept in restricted, owner-controlled
            systems. We retain records for accounting, tax, legal, and business needs.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl font-semibold text-ink-600">Control and contact</h2>
          <p className="mt-2">
            A QuickBooks company administrator can revoke access in QuickBooks Online.
            For questions or requests about Dominion Accounting data, contact{" "}
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
