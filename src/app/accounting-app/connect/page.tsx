import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Connect Dominion Accounting",
  robots: { index: false, follow: false },
};

export default function AccountingConnectPage() {
  return (
    <main id="main-content" className="mx-auto max-w-3xl px-5 py-16 sm:py-20">
      <h1 className="font-display text-3xl font-bold">Connect Dominion Accounting</h1>
      <p className="mt-5 text-stone-700">
        This integration is available only to authorized Dominion personnel. A QuickBooks
        company administrator must approve Accounting access through Intuit for each
        company file. Contact the Dominion accounting administrator for the controlled
        connection process. Do not send authorization codes or tokens through this page.
      </p>
      <p className="mt-4 text-stone-700">
        Reconnection follows the same process when an existing authorization expires or
        is revoked.
      </p>
      <Link className="mt-8 inline-block text-forest-700 underline" href="/accounting-app">
        Dominion Accounting overview
      </Link>
    </main>
  );
}
