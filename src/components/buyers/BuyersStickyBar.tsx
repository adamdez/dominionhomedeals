import { SITE } from "@/lib/constants";

export function BuyersStickyBar() {
  const phoneClean = SITE.phone.replace(/\D/g, "");

  return (
    <>
      <div aria-hidden="true" className="h-24 md:hidden" />
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3">
          <a
            href={`tel:${phoneClean}`}
            className="min-w-[42%] rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-center text-sm font-semibold text-ink-600 shadow-sm transition-colors hover:border-forest-300 hover:text-forest-700"
          >
            Call {SITE.phone}
          </a>
          <a href="#join-list" className="btn-primary flex-1 !px-4 !py-3 text-sm">
            Join List
          </a>
        </div>
      </div>
    </>
  );
}
