// src/components/sections/Situations.tsx
import { FadeIn } from "@/components/animations/FadeIn";
import { SITUATIONS } from "@/lib/constants";

export function Situations() {
  return (
    <section className="bg-forest-500">
      <div className="section-wrap">
        <FadeIn>
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-forest-200">
              Situations We Buy
            </p>
            <h2 className="mt-2 font-display text-display text-white text-balance">
              You do not need a perfect house to call us.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base text-forest-200">
              Repairs, tenants, probate, back taxes, or a fast move are all
              normal. Tell us what is going on and we will give you a straight
              answer.
            </p>
          </div>
        </FadeIn>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SITUATIONS.map((s, i) => (
            <FadeIn key={s.title} delay={i * 80}>
              <div className="rounded-xl border border-forest-400/20 bg-forest-600/40 p-5 backdrop-blur-sm transition-colors hover:bg-forest-600/60">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-300 text-sm font-bold text-ink-700"
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <h3 className="mt-3 font-display text-lg text-white">
                  {s.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-forest-200">
                  {s.desc}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={500}>
          <div className="mt-10 text-center">
            <a href="#get-offer" className="btn-primary">
              Get Your No-Obligation Offer
            </a>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
