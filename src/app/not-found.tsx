import Link from "next/link";
import { SITE } from "@/lib/constants";

export default function NotFound() {
  return (
    <section className="flex min-h-[60vh] items-center justify-center px-5">
      <div className="text-center">
        <p className="text-sm font-bold uppercase tracking-widest text-forest-500">
          404
        </p>
        <h1 className="mt-2 font-display text-display text-ink-600">
          Page Not Found
        </h1>
        <p className="mx-auto mt-3 max-w-md text-base text-ink-400">
          Sorry, we couldn&apos;t find that page. Let&apos;s get you back on
          track — or get your free cash offer right now.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link href="/#get-offer" className="btn-primary">
            Get My Cash Offer
          </Link>
          <Link
            href="/"
            className="text-sm font-semibold text-forest-600 transition-colors hover:text-forest-700"
          >
            Back to Home
          </Link>
        </div>
        <p className="mt-6 text-sm text-ink-300">
          Or call us directly:{" "}
          <a
            href={`tel:${SITE.phone.replace(/\D/g, "")}`}
            className="font-semibold text-forest-600 hover:text-forest-700"
          >
            {SITE.phone}
          </a>
        </p>
      </div>
    </section>
  );
}
