import Link from "next/link";
import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { ReviewDecisionPanel } from "@/components/al/ReviewDecisionPanel";
import {
  buildHostedBoardroomHomePath,
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

function asDisplayString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function buildPresentationTitle(context: Record<string, unknown>, jobTask: string): string {
  if (typeof context.presentation_title === "string" && context.presentation_title.trim()) {
    return context.presentation_title.trim();
  }
  if (typeof context.business_name === "string" && context.business_name.trim()) {
    return `${context.business_name.trim()} Presentation`;
  }
  if (jobTask.trim()) {
    return jobTask.trim();
  }
  return "Board Room Presentation";
}

function paragraphize(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((entry) => entry.replace(/\n+/g, " ").trim())
    .filter(Boolean);
}

function renderLinkedText(text: string) {
  const parts = text.split(/(https?:\/\/[^\s)]+)/g);
  return parts.map((part, index) => {
    if (!/^https?:\/\//i.test(part)) {
      return <span key={`text-${index}`}>{part}</span>;
    }
    return (
      <a
        key={`link-${index}`}
        href={part}
        target="_blank"
        rel="noreferrer"
        className="underline decoration-emerald-400/40 underline-offset-4 transition-colors hover:text-emerald-300"
      >
        {part}
      </a>
    );
  });
}

function normalizeOperatorLinks(context: Record<string, unknown>) {
  const links = Array.isArray(context.operator_links)
    ? context.operator_links.filter(
        (entry): entry is Record<string, unknown> =>
          Boolean(entry) && typeof entry === "object" && !Array.isArray(entry),
      )
    : [];

  return links
    .map((entry) => ({
      label: asDisplayString(entry.label, "Open link"),
      url: typeof entry.url === "string" ? entry.url : "",
      priority:
        entry.priority === "secondary" ? "secondary" : "primary",
    }))
    .filter((entry) => entry.url);
}

function GenericPresentation({
  context,
  task,
  boardroomHomePath,
}: {
  context: Record<string, unknown>;
  task: string;
  boardroomHomePath: string;
}) {
  const title = buildPresentationTitle(context, task);
  const summary = asDisplayString(
    context.summary,
    "Review the latest recommendation from AL’s team and decide what should happen next.",
  );
  const statusLabel = asDisplayString(context.presentation_status_label, "ready for review");
  const recommendation = asDisplayString(
    context.presentation_recommendation,
    "Review the brief and supporting links before approving the next step.",
  );
  const nextAction = asDisplayString(
    context.next_action,
    "Decide whether to approve, request changes, or wait for a final review package.",
  );
  const owner = asDisplayString(context.owner, "AL team");
  const businessName = asDisplayString(context.business_name, "Business context pending");
  const body = asDisplayString(
    context.presentation_body,
    asDisplayString(context.result_snapshot, "No presentation body was captured."),
  );
  const bodyParagraphs = paragraphize(body);
  const highlights = asStringArray(context.presentation_highlights).slice(0, 6);
  const links = normalizeOperatorLinks(context);

  return (
    <main className="h-full w-full overflow-y-auto bg-[#07100b] px-4 py-6 text-[#eaf4ef] sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300/45">
              Board Room
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-[#f3faf6] sm:text-4xl">
              {title}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-emerald-100/70 sm:text-base">
              {summary}
            </p>
          </div>
          <Link
            href={boardroomHomePath}
            className="rounded-2xl border border-emerald-900/25 bg-[#101714] px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:border-emerald-500/40"
          >
            Back to Board Room
          </Link>
        </div>

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-3xl border border-emerald-900/20 bg-[#101714] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300/45">
                  Recommendation
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[#f3faf6]">
                  {recommendation}
                </h2>
              </div>
              <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200">
                {statusLabel}
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-2xl border border-emerald-900/20 bg-[#0b110e] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/45">Owner</p>
                <p className="mt-2 text-lg font-semibold text-[#f3faf6]">{owner}</p>
              </div>
              <div className="rounded-2xl border border-emerald-900/20 bg-[#0b110e] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/45">Business</p>
                <p className="mt-2 text-lg font-semibold text-[#f3faf6]">{businessName}</p>
              </div>
              <div className="rounded-2xl border border-emerald-900/20 bg-[#0b110e] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/45">Next Action</p>
                <p className="mt-2 text-sm leading-6 text-emerald-100/70">{nextAction}</p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-emerald-900/20 bg-[#0b110e] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/45">Review Now</p>
              {links.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-3">
                  {links
                    .filter((link) => link.priority === "primary")
                    .map((link) => (
                      <a
                        key={`${link.label}-${link.url}`}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-[#05110b] transition hover:bg-emerald-400"
                      >
                        {link.label}
                      </a>
                    ))}
                  {links
                    .filter((link) => link.priority === "secondary")
                    .map((link) => (
                      <a
                        key={`${link.label}-${link.url}`}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-2xl border border-emerald-900/25 bg-[#101714] px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:border-emerald-500/40"
                      >
                        {link.label}
                      </a>
                    ))}
                </div>
              ) : (
                <p className="mt-3 text-sm leading-6 text-emerald-100/65">
                  No direct review links were attached to this presentation yet.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-emerald-900/20 bg-[#101714] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300/45">
              Highlights
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[#f3faf6]">
              What matters most
            </h2>
            {highlights.length > 0 ? (
              <div className="mt-5 space-y-3">
                {highlights.map((highlight, index) => (
                  <div
                    key={`${highlight}-${index}`}
                    className="rounded-2xl border border-emerald-900/20 bg-[#0b110e] p-4 text-sm leading-6 text-emerald-100/75"
                  >
                    {highlight}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-emerald-900/20 bg-[#0b110e] p-4 text-sm leading-6 text-emerald-100/70">
                AL did not attach structured highlights to this presentation yet. Use the brief below.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-emerald-900/20 bg-[#101714] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300/45">
            Full Brief
          </p>
          <div className="mt-4 space-y-4">
            {bodyParagraphs.map((paragraph, index) => (
              <p key={`paragraph-${index}`} className="text-sm leading-7 text-emerald-100/75">
                {renderLinkedText(paragraph)}
              </p>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function BrowserCommercePresentation({
  context,
  task,
  jobId,
  boardroomHomePath,
}: {
  context: Record<string, unknown>;
  task: string;
  jobId: number;
  boardroomHomePath: string;
}) {
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
  const presentationTitle = buildPresentationTitle(context, task);
  const presentationSummary =
    typeof context.summary === "string" && context.summary.trim()
      ? context.summary.trim()
      : "Review the recommendation, inspect the supporting artifacts, and choose the next action before any final execution step.";

  return Promise.all([
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
  ]).then(([chosenDesignPreviewUrl, proofImageUrl, cartImageUrl]) => {
    const alternativeLabels = vendorOptions
      .map((option) => {
        const vendor = typeof option.vendor === "string" ? option.vendor : "";
        const size = asStringArray(option.size_signals).slice(0, 2).join(", ");
        return [vendor, size].filter(Boolean).join(" - ");
      })
      .filter(Boolean);

    return (
      <main className="h-full w-full overflow-y-auto bg-[#07100b] px-4 py-6 text-[#eaf4ef] sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300/45">
                Board Room
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-[#f3faf6] sm:text-4xl">
                {presentationTitle}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-emerald-100/70 sm:text-base">
                {presentationSummary}
              </p>
            </div>
            <Link
              href={boardroomHomePath}
              className="rounded-2xl border border-emerald-900/25 bg-[#101714] px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:border-emerald-500/40"
            >
              Back to Board Room
            </Link>
          </div>

          <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-3xl border border-emerald-900/20 bg-[#101714] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300/45">
                    Recommendation
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-[#f3faf6]">
                    {asDisplayString(chosenOption.vendor, "Recommended option")}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-emerald-100/65">
                    {asDisplayString(chosenDesign.title, "Ready for operator review")}
                  </p>
                </div>
                <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200">
                  {currentState}
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-2xl border border-emerald-900/20 bg-[#0b110e] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/45">Estimated Total</p>
                  <p className="mt-2 text-xl font-semibold text-[#f3faf6]">
                    {asDisplayString(chosenOption.estimated_total, "Pending")}
                  </p>
                </div>
                <div className="rounded-2xl border border-emerald-900/20 bg-[#0b110e] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/45">Specs</p>
                  <p className="mt-2 text-lg font-semibold text-[#f3faf6]">
                    {asDisplayString(chosenOption.dimensions, "Specs pending")}
                  </p>
                  <p className="mt-1 text-sm text-emerald-100/60">
                    {asDisplayString(chosenOption.quantity, "Quantity pending")}
                  </p>
                </div>
                <div className="rounded-2xl border border-emerald-900/20 bg-[#0b110e] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/45">Material</p>
                  <p className="mt-2 text-lg font-semibold text-[#f3faf6]">
                    {asDisplayString(chosenOption.material, "Material pending")}
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-emerald-900/20 bg-[#0b110e] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/45">Why This Won</p>
                <p className="mt-2 text-sm leading-6 text-emerald-100/75">
                  {asDisplayString(
                    chosenOption.why_best,
                    "This is the strongest current path based on the review package that made it to a real operator checkpoint.",
                  )}
                </p>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {typeof context.review_page_url === "string" ? (
                  <a
                    href={String(context.review_page_url)}
                    className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-[#05110b] transition hover:bg-emerald-400"
                  >
                    Open presentation
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
                    Open hosted replay
                  </a>
                ) : typeof reviewSurface.hosted_session_url === "string" ? (
                  <a
                    href={String(reviewSurface.hosted_session_url)}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-2xl border border-emerald-900/25 bg-[#101714] px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:border-emerald-500/40"
                  >
                    Open hosted session
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
                    : "The live vendor cart is session-bound. Use Resume locally if you need the active browser cart."
                  : "Opening this presentation never submits checkout or final execution."}
              </p>
              {typeof reviewSurface.hosted_session_id === "string" ? (
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-emerald-300/40">
                  Hosted browser session {String(reviewSurface.hosted_session_id)}
                </p>
              ) : null}
            </div>

            <div className="rounded-3xl border border-emerald-900/20 bg-[#101714] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300/45">
                Supporting Artifacts
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[#f3faf6]">
                Preview, proof, and execution state
              </h2>
              <div className="mt-5 grid gap-4">
                {chosenDesignPreviewUrl ? (
                  <figure className="overflow-hidden rounded-2xl border border-emerald-900/20 bg-[#0b110e]">
                    <img src={chosenDesignPreviewUrl} alt="Chosen design preview" className="block w-full" />
                    <figcaption className="px-4 py-3 text-sm text-emerald-100/70">
                      {asDisplayString(chosenDesign.title, "Chosen design preview")}
                    </figcaption>
                  </figure>
                ) : null}
                {proofImageUrl ? (
                  <figure className="overflow-hidden rounded-2xl border border-emerald-900/20 bg-[#0b110e]">
                    <img src={proofImageUrl} alt="Vendor proof screenshot" className="block w-full" />
                    <figcaption className="px-4 py-3 text-sm text-emerald-100/70">Vendor proof screenshot</figcaption>
                  </figure>
                ) : null}
                {cartImageUrl ? (
                  <figure className="overflow-hidden rounded-2xl border border-emerald-900/20 bg-[#0b110e]">
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
                : "Review the presentation, then approve the recommendation or request changes."
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
                      {asDisplayString(option.vendor, "Vendor")}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-emerald-100/70">
                      <strong className="text-emerald-100">Price:</strong>{" "}
                      {priceSignals.length > 0 ? priceSignals.join(", ") : "Pricing still inside vendor flow"}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-emerald-100/70">
                      <strong className="text-emerald-100">Specs:</strong>{" "}
                      {sizeSignals.length > 0 ? sizeSignals.join(", ") : "Details incomplete"}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-emerald-100/70">
                      <strong className="text-emerald-100">Material:</strong>{" "}
                      {materialSignals.length > 0 ? materialSignals.join(", ") : "Details incomplete"}
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
                Decision Log
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
                        {asDisplayString(entry.action, "review_update")}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-emerald-300/45">
                        {asDisplayString(entry.at, "timestamp unavailable")}
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
  });
}

export async function BoardroomPresentationPage({
  jobId,
}: {
  jobId: number;
}) {
  if (!Number.isInteger(jobId) || jobId <= 0) {
    notFound();
  }

  const cookieStore = await cookies();
  if (!isAuthenticatedAlSession(cookieStore.get("al_session")?.value)) {
    redirect("/");
  }

  const job = await fetchAlJob(jobId);
  if (!job) {
    notFound();
  }

  const context = parseJobContext(job.context);
  const host = (await headers()).get("host");
  const boardroomHomePath = buildHostedBoardroomHomePath(host);
  const isBrowserCommercePresentation =
    job.job_type === "browser_commerce_design" &&
    Boolean(context.review_surface && typeof context.review_surface === "object");

  if (isBrowserCommercePresentation) {
    return (
      <BrowserCommercePresentation
        context={context}
        task={job.task}
        jobId={jobId}
        boardroomHomePath={boardroomHomePath}
      />
    );
  }

  const hasGenericPresentation =
    (typeof context.presentation_title === "string" && context.presentation_title.trim()) ||
    (typeof context.presentation_body === "string" && context.presentation_body.trim()) ||
    (typeof job.result === "string" && job.result.trim());

  if (!hasGenericPresentation) {
    notFound();
  }

  return <GenericPresentation context={context} task={job.task} boardroomHomePath={boardroomHomePath} />;
}
