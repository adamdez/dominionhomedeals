import { getSellTrustStripItems } from "@/lib/sell-proof";

export function SellTrustStrip() {
  const items = getSellTrustStripItems();

  return (
    <div className="mt-5 flex flex-wrap gap-2.5">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-full border border-stone-200 bg-white/80 px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink-500 shadow-sm backdrop-blur"
        >
          {item}
        </span>
      ))}
    </div>
  );
}
