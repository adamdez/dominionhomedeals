import Image from "next/image";
import { SITE } from "@/lib/constants";
import { SELLER_PROOF, type SellAngle } from "@/lib/sell-proof";

function Avatar({ label }: { label: string }) {
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-forest-50 text-sm font-semibold text-forest-700 ring-2 ring-forest-100">
      {label}
    </div>
  );
}

export function SellerProofSection({ angle }: { angle: SellAngle }) {
  const phoneClean = SITE.phone.replace(/\D/g, "");
  const founder = SELLER_PROOF.founder;

  return (
    <section className="border-y border-stone-200 bg-white">
      <div className="section-wrap">
        <div className="grid gap-8 xl:grid-cols-[1.02fr_0.98fr]">
          <div className="rounded-[28px] border border-stone-200 bg-stone-50 p-6 shadow-sm sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-forest-500">
              Meet The Buyer
            </p>
            <div className="mt-5 flex items-center gap-4">
              <div className="relative h-20 w-20 overflow-hidden rounded-full ring-4 ring-white">
                <Image
                  src={founder.image}
                  alt={`${founder.name} headshot`}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>
              <div>
                <h2 className="font-display text-3xl leading-tight text-ink-600">
                  {founder.name}
                </h2>
                <p className="mt-1 text-sm font-medium uppercase tracking-[0.18em] text-ink-300">
                  {founder.title}
                </p>
              </div>
            </div>

            <p className="mt-6 text-base leading-relaxed text-ink-400">
              {founder.introByAngle[angle]}
            </p>

            {founder.introVideoEmbedUrl ? (
              <div className="mt-6 overflow-hidden rounded-[24px] border border-stone-200 bg-black shadow-sm">
                <div className="aspect-video">
                  <iframe
                    className="h-full w-full"
                    src={founder.introVideoEmbedUrl}
                    title={`${founder.firstName} intro video`}
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              </div>
            ) : founder.introVideoSrc ? (
              <div className="mt-6 rounded-[24px] border border-stone-200 bg-black p-3 shadow-sm">
                <div className="mx-auto max-w-[320px] overflow-hidden rounded-[18px] bg-black">
                  <video
                    className="aspect-[9/16] w-full"
                    controls
                    playsInline
                    preload="metadata"
                    poster={founder.introVideoPoster || undefined}
                  >
                    <source src={founder.introVideoSrc} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-3">
              <a href={`tel:${phoneClean}`} className="btn-secondary !px-5 !py-3">
                Call {SITE.phone}
              </a>
              <a href="#get-offer" className="btn-primary !px-5 !py-3">
                Start With The Address
              </a>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-forest-500">
                Verified Seller Feedback
              </p>
              <div className="mt-5 space-y-4">
                {SELLER_PROOF.verifiedTestimonials.map((testimonial) => (
                  <article
                    key={`${testimonial.name}-${testimonial.neighborhood}`}
                    className="rounded-[24px] border border-stone-200 bg-stone-50 p-5"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar label={testimonial.avatarLabel} />
                      <div>
                        <p className="text-sm font-semibold text-ink-600">{testimonial.name}</p>
                        <p className="text-xs uppercase tracking-[0.16em] text-ink-300">
                          {testimonial.neighborhood}
                        </p>
                      </div>
                    </div>
                    <blockquote className="mt-4 text-sm leading-relaxed text-ink-400">
                      "{testimonial.quote}"
                    </blockquote>
                  </article>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-forest-500">
                Privacy-Safe Local Deal Snapshots
              </p>
              <p className="mt-3 text-sm leading-relaxed text-ink-400">
                These are local seller scenarios we use for context when a seller has not
                approved a public testimonial yet.
              </p>
              <div className="mt-5 space-y-4">
                {SELLER_PROOF.localDealSnapshots.map((snapshot) => (
                  <article
                    key={snapshot.id}
                    className="rounded-[24px] border border-stone-200 bg-stone-50 p-5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-ink-600">{snapshot.title}</p>
                        <p className="text-xs uppercase tracking-[0.16em] text-ink-300">
                          {snapshot.location}
                        </p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-forest-600">
                        {snapshot.situation}
                      </span>
                    </div>
                    <p className="mt-4 text-sm leading-relaxed text-ink-400">
                      {snapshot.summary}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
