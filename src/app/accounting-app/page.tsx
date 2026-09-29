import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Dominion Accounting",
  description: "Information for Dominion's private QuickBooks Online accounting integration.",
  robots: { index: false, follow: false },
};

export default function AccountingAppPage() {
  return (
    <main id="main-content" className="mx-auto max-w-3xl px-5 py-16 sm:py-20">
      <h1 className="font-display text-3xl font-bold">Dominion Accounting</h1>
      <p className="mt-5 text-stone-700">
        Dominion Accounting is an internal tool used by authorized Dominion personnel to
        review and maintain the QuickBooks Online records of Dominion companies. It is
        not offered to the public.
      </p>
      <p className="mt-4 text-stone-700">
        Access to a company file requires that company&apos;s QuickBooks administrator
        to authorize the Accounting scope through Intuit. The integration can read
        accounting records and create or update supported bookkeeping records.
      </p>
      <nav aria-label="Dominion Accounting information" className="mt-8 flex flex-wrap gap-5 text-forest-700 underline">
        <Link href="/accounting-app/connect">Connect or reconnect</Link>
        <Link href="/accounting-app/disconnect">Disconnect</Link>
        <Link href="/accounting-app/privacy">Privacy policy</Link>
        <Link href="/accounting-app/terms">End-user license agreement</Link>
      </nav>
    </main>
  );
}
