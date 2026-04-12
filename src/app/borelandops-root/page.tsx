import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAlCanonicalHost, normalizeHost } from "@/lib/al-platform";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Boreland Ops",
  description: "Private operating root for AL Boreland.",
  robots: { index: false, follow: false },
};

const ROOT_HOSTS = new Set(["borelandops.com", "www.borelandops.com"]);

export default async function BorelandOpsRootPage() {
  const headerStore = await headers();
  const host = normalizeHost(headerStore.get("host"));
  if (!ROOT_HOSTS.has(host)) {
    notFound();
  }

  const appHost = getAlCanonicalHost();

  return (
    <main className="min-h-screen bg-[#0b110f] text-[#e7efe9]">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
        <div className="inline-flex w-fit items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300/80">
          Private Operating Root
        </div>
        <h1 className="mt-6 text-balance font-display text-5xl leading-tight text-white">
          Boreland Ops
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-[#aebfb5]">
          This domain is the private root home for AL Boreland and the operating stack behind the businesses. It is not a public marketing surface.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <a
            href={`https://${appHost}`}
            className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-black transition-colors hover:bg-emerald-400"
          >
            Open AL App
          </a>
          <Link
            href="/app"
            className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-[#dce8e0] transition-colors hover:border-emerald-400/40 hover:text-white"
          >
            App Shortcut
          </Link>
        </div>
      </div>
    </main>
  );
}
