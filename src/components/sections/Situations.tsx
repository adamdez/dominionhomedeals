// src/components/sections/Situations.tsx
import { FadeIn } from "@/components/animations/FadeIn";
import { SITUATIONS } from "@/lib/constants";

const ICONS = ["🏠", "💰", "⚖️", "✈️", "🔑", "🔨"];

export function Situations() {
  return (
    <section className="bg-forest-500">
      <div className="section-wrap">
        <FadeIn>
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-forest-200">
              Any Situation
            </p>
            <h2 className="mt-2 font-display text-display text-white text-balance">
              We Buy Houses No Matter What You&apos;re Going Through
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base text-forest-200">
              Life happens. We&apos;re here to give you a fair cash option so
              you can move forward — on your terms.
            </p>
          </div>
        </FadeIn>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SITUATIONS.map((s, i) => (
            <FadeIn key={s.title} delay={i * 80}>
              <div className="rounded-xl border border-forest-400/20 bg-forest-600/40 p-5 backdrop-blur-sm transition-colors hover:bg-forest-600/60">
                <span className="text-2xl">{ICONS[i]}</span>
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
            <a href="#get-offer" className="btn-amber">
              Get Your No-Obligation Offer
            </a>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
