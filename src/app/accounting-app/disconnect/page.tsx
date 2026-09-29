import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Disconnect Dominion Accounting",
  robots: { index: false, follow: false },
};

export default function AccountingDisconnectPage() {
  return (
    <main id="main-content" className="mx-auto max-w-3xl px-5 py-16 sm:py-20">
      <h1 className="font-display text-3xl font-bold">Disconnect Dominion Accounting</h1>
      <p className="mt-5 text-stone-700">
        A QuickBooks company administrator can revoke Dominion Accounting access in
        QuickBooks Online under connected apps. The Dominion accounting administrator
        should also remove the local authorization for that company file. Revocation
        stops future API access but does not erase accounting records already in
        QuickBooks.
      </p>
      <Link className="mt-8 inline-block text-forest-700 underline" href="/accounting-app">
        Dominion Accounting overview
      </Link>
    </main>
  );
}
