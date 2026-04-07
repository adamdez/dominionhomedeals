import Link from "next/link";
import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { ReviewDecisionPanel } from "@/components/al/ReviewDecisionPanel";
import {
  buildHostedReviewPath,
  createSignedReviewAssetUrl,
  fetchAlJob,
  isAuthenticatedAlSession,
  normalizeReviewState,
  parseJobContext,
} from "@/lib/al-review";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
    : [];
}

export default async function AlReviewPage(
  props: { params: Promise<{ jobId: string }> },
) {
  const { jobId: rawJobId } = await props.params;
  const jobId = Number(rawJobId);
  if (!Number.isInteger(jobId) || jobId <= 0) {
    notFound();
  }

  const cookieStore = await cookies();
  if (!isAuthenticatedAlSession(cookieStore.get("al_session")?.value)) {
    redirect("/");
  }

  const job = await fetchAlJob(jobId);
  if (!job || job.job_type !== "browser_commerce_design") {
    notFound();
  }

  const context = parseJobContext(job.context);
  const reviewSurface = asRecord(context.review_surface);
  const artifactPaths = asRecord(reviewSurface.artifact_paths);
  const chosenOption = asRecord(context.chosen_option);
  const chosenDesign = asRecord(context.chosen_design);
  const vendorOptions = Array.isArray(context.vendor_options)
    ? context.vendor_options.filter(
        (entry): entry is Record<string, unknown> =>
          Boolean(entry) && typeof entry === "object" && !Array.isArray(entry),
      )
    : [];
  const reviewDecisions = Array.isArray(context.review_decisions)
    ? context.review_decisions.filter(
        (entry): entry is Record<string, unknown> =>
          Boolean(entry) && typeof entry === "object" && !Array.isArray(entry),
      )
    : [];
  const currentState = normalizeReviewState(context.review_state);
  const host = (await headers()).get("host");
  const boardroomPath = buildHostedReviewPath(host, 0).startsWith("/reviews/") ? "/" : "/al";

  const [chosenDesignPreviewUrl, proofImageUrl, cartImageUrl] = await Promise.all([
    createSignedReviewAssetUrl(
      typeof artifactPaths.chosen_design_preview === "string"
        ? artifactPaths.chosen_design_preview
        : null,
    ),
    createSignedReviewAssetUrl(
      typeof artifactPaths.design_review_image === "string"
        ? artifactPaths.design_review_image
        : null,
    ),
    createSignedReviewAssetUrl(
      typeof artifactPaths.cart_review_image === "string"
        ? artifactPaths.cart_review_image
        : null,
    ),
  ]);

  const alternativeLabels = vendorOptions
    .map((option) => {
      const vendor = typeof option.vendor === "string" ? option.vendor : "";
      const size = asStringArray(option.size_signals).slice(0, 2).join(", ");
      return [vendor, size].filter(Boolean).join(" — ");
    })
    .filter(Boolean);

  return (
    <main className="h-full w-full overflow-y-auto bg-[#07100b] px-4 py-6 text-[#eaf4ef] sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300/45">
              Browser Commerce Review
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-[#f3faf6] sm:text-4xl">
              WrenchReady Astro Van Signage
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-emerald-100/70 sm:text-base">
              {typeof context.summary === "string"
                ? context.summary
                : "Review the recommended signage option, inspect the proof, and choose the next action before any manual checkout."}
            </p>
          </div>
          <Link
            href={boardroomPath}
            className="rounded-2xl border border-emerald-900/25 bg-[#101714] px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:border-emerald-500/40"
          >
            Back to boardroom
          </Link>
        </div>

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-3xl border border-emerald-900/20 bg-[#101714] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300/45">
                  Best Option
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[#f3faf6]">
                  {typeof chosenOption.vendor === "string" ? chosenOption.vendor : "BuildASign"}
                </h2>
              </div>
              <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200">
                {currentState}
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-2xl border border-emerald-900/20 bg-[#0b110e] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/45">Price</p>
                <p className="mt-2 text-xl font-semibold text-[#f3faf6]">
                  {typeof chosenOption.estimated_total === "string" ? chosenOption.estimated_total : "Pending"}
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-900/20 bg-[#0b110e] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/45">Specs</p>
                <p className="mt-2 text-lg font-semibold text-[#f3faf6]">
                  {typeof chosenOption.dimensions === "string" ? chosenOption.dimensions : '24" x 18"'}
                </p>
                <p className="mt-1 text-sm text-emerald-100/60">Quantity 2 magnetic signs</p>
              </div>
              <div className="rounded-2xl border border-emerald-900/20 bg-[#0b110e] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/45">Material</p>
                <p className="mt-2 text-lg font-semibold text-[#f3faf6]">
                  {typeof chosenOption.material === "string" ? chosenOption.material : "0.045 Magnet"}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-emerald-900/20 bg-[#0b110e] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/45">Why It Won</p>
              <p className="mt-2 text-sm leading-6 text-emerald-100/75">
                {typeof chosenOption.why_best === "string"
                  ? chosenOption.why_best
                  : "This was the strongest vendor path that reached a real cart review state."}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {typeof context.review_page_url === "string" ? (
                <a
                  href={String(context.review_page_url)}
                  className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-[#05110b] transition hover:bg-emerald-400"
                >
                  Refresh review page
                </a>
              ) : null}
              {typeof context.proof_url === "string" ? (
                <a
                  href={String(context.proof_url)}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl border border-emerald-900/25 bg-[#101714] px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:border-emerald-500/40"
                >
                  Open proof
                </a>
              ) : null}
              {typeof reviewSurface.hosted_debugger_fullscreen_url === "string" ? (
                <a
                  href={String(reviewSurface.hosted_debugger_fullscreen_url)}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl border border-emerald-900/25 bg-[#101714] px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:border-emerald-500/40"
                >
                  Open hosted session
                </a>
              ) : typeof reviewSurface.hosted_session_url === "string" ? (
                <a
                  href={String(reviewSurface.hosted_session_url)}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl border border-emerald-900/25 bg-[#101714] px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:border-emerald-500/40"
                >
                  Open Browserbase replay
                </a>
              ) : null}
              {typeof context.resume_cart_url === "string" ? (
                <a
                  href={String(context.resume_cart_url)}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl border border-emerald-900/25 bg-[#101714] px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:border-emerald-500/40"
                >
                  Resume locally
                </a>
              ) : null}
            </div>

            <p className="mt-4 text-sm leading-6 text-emerald-100/60">
              {typeof context.link_support === "object" &&
              context.link_support &&
              !Array.isArray(context.link_support) &&
              (context.link_support as Record<string, unknown>).cart_url_usable_cross_session === false
                ? typeof (context.link_support as Record<string, unknown>).cart_url_note === "string"
                  ? String((context.link_support as Record<string, unknown>).cart_url_note)
                  : "The vendor cart is session-bound. Use Resume locally if you need the live cart."
                : "Opening the review page does not submit checkout."}
            </p>
            {typeof reviewSurface.hosted_session_id === "string" ? (
              <p className="mt-2 text-xs uppercase tracking-[0.18em] text-emerald-300/40">
                Hosted browser session {String(reviewSurface.hosted_session_id)}
              </p>
            ) : null}
          </div>

          <div className="rounded-3xl border border-emerald-900/20 bg-[#101714] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300/45">
              Review Artifacts
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[#f3faf6]">
              Preview, proof, and cart state
            </h2>
            <div className="mt-5 grid gap-4">
              {chosenDesignPreviewUrl ? (
                <figure className="overflow-hidden rounded-2xl border border-emerald-900/20 bg-[#0b110e]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={chosenDesignPreviewUrl} alt="Chosen design preview" className="block w-full" />
                  <figcaption className="px-4 py-3 text-sm text-emerald-100/70">
                    {typeof chosenDesign.title === "string" ? chosenDesign.title : "Chosen design preview"}
                  </figcaption>
                </figure>
              ) : null}
              {proofImageUrl ? (
                <figure className="overflow-hidden rounded-2xl border border-emerald-900/20 bg-[#0b110e]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={proofImageUrl} alt="Vendor proof screenshot" className="block w-full" />
                  <figcaption className="px-4 py-3 text-sm text-emerald-100/70">Vendor proof screenshot</figcaption>
                </figure>
              ) : null}
              {cartImageUrl ? (
                <figure className="overflow-hidden rounded-2xl border border-emerald-900/20 bg-[#0b110e]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={cartImageUrl} alt="Cart screenshot" className="block w-full" />
                  <figcaption className="px-4 py-3 text-sm text-emerald-100/70">Cart screenshot</figcaption>
                </figure>
              ) : null}
            </div>
          </div>
        </section>

        <ReviewDecisionPanel
          jobId={jobId}
          initialState={currentState}
          initialNextAction={
            typeof context.next_action === "string"
              ? context.next_action
              : "Review the proof, then approve checkout readiness or request changes."
          }
          alternatives={alternativeLabels}
        />

        <section className="rounded-3xl border border-emerald-900/20 bg-[#101714] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300/45">
            Alternatives
          </p>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {vendorOptions.map((option) => {
              const priceSignals = asStringArray(option.price_signals).slice(0, 3);
              const sizeSignals = asStringArray(option.size_signals).slice(0, 4);
              const materialSignals = asStringArray(option.material_signals).slice(0, 3);
              return (
                <article
                  key={`${String(option.vendor || "vendor")}-${String(option.url || "")}`}
                  className="rounded-2xl border border-emerald-900/20 bg-[#0b110e] p-5"
                >
                  <h3 className="text-lg font-semibold text-[#f3faf6]">
                    {typeof option.vendor === "string" ? option.vendor : "Vendor"}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-emerald-100/70">
                    <strong className="text-emerald-100">Price:</strong>{" "}
                    {priceSignals.length > 0 ? priceSignals.join(", ") : "Pricing inside vendor flow"}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-emerald-100/70">
                    <strong className="text-emerald-100">Sizes:</strong>{" "}
                    {sizeSignals.length > 0 ? sizeSignals.join(", ") : "Size details pending"}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-emerald-100/70">
                    <strong className="text-emerald-100">Materials:</strong>{" "}
                    {materialSignals.length > 0 ? materialSignals.join(", ") : "Material details pending"}
                  </p>
                  {typeof option.url === "string" ? (
                    <a
                      href={String(option.url)}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex text-sm font-semibold text-emerald-300 transition hover:text-emerald-200"
                    >
                      Open vendor page
                    </a>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>

        {reviewDecisions.length > 0 ? (
          <section className="rounded-3xl border border-emerald-900/20 bg-[#101714] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300/45">
              Review History
            </p>
            <div className="mt-4 space-y-3">
              {reviewDecisions
                .slice()
                .reverse()
                .map((entry, index) => (
                  <div
                    key={`${String(entry.at || "decision")}-${index}`}
                    className="rounded-2xl border border-emerald-900/20 bg-[#0b110e] p-4"
                  >
                    <p className="text-sm font-semibold text-[#f3faf6]">
                      {typeof entry.action === "string" ? entry.action : "review_update"}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-emerald-300/45">
                      {typeof entry.at === "string" ? entry.at : "timestamp unavailable"}
                    </p>
                    {typeof entry.note === "string" && entry.note ? (
                      <p className="mt-3 text-sm leading-6 text-emerald-100/70">{entry.note}</p>
                    ) : null}
                    {typeof entry.selected_alternative === "string" && entry.selected_alternative ? (
                      <p className="mt-2 text-sm text-emerald-100/65">
                        Alternate selected: {entry.selected_alternative}
                      </p>
                    ) : null}
                  </div>
                ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
