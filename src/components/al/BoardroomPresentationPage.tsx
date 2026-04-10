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

const asRecord = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
const asDisplayString = (v: unknown, fallback: string) =>
  typeof v === "string" && v.trim() ? v.trim() : fallback;
const asStringArray = (v: unknown) =>
  Array.isArray(v)
    ? v.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
    : [];

function humanizeHighlight(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed === "media_partial_ready_for_review") {
    return "AI render hit a blocker, but the fallback media package is ready.";
  }
  if (trimmed.startsWith("bridge:media_production")) {
    return "Media work ran through the local bridge execution lane.";
  }
  if (trimmed === "adamdez/wrenchreadymobile-com") {
    return "Prepared for the WrenchReady website repo.";
  }
  return trimmed;
}

function buildPresentationTitle(context: Record<string, unknown>, task: string) {
  if (typeof context.presentation_title === "string" && context.presentation_title.trim()) {
    return context.presentation_title.trim();
  }
  if (typeof context.business_name === "string" && context.business_name.trim()) {
    return `${context.business_name.trim()} Presentation`;
  }
  return task.trim() || "Board Room Presentation";
}

function renderLinkedText(text: string) {
  return text.split(/(https?:\/\/[^\s)]+)/g).map((part, index) =>
    /^https?:\/\//i.test(part) ? (
      <a
        key={`link-${index}`}
        href={part}
        target="_blank"
        rel="noreferrer"
        className="underline decoration-emerald-400/40 underline-offset-4 transition-colors hover:text-emerald-300"
      >
        {part}
      </a>
    ) : (
      <span key={`text-${index}`}>{part}</span>
    ),
  );
}

function normalizeOperatorLinks(context: Record<string, unknown>) {
  const links = Array.isArray(context.operator_links) ? context.operator_links : [];
  return links
    .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object" && !Array.isArray(entry))
    .map((entry) => ({
      label: asDisplayString(entry.label, "Open link"),
      url: typeof entry.url === "string" ? entry.url : "",
      priority: entry.priority === "secondary" ? "secondary" : "primary",
    }))
    .filter((entry) => entry.url);
}

function normalizeAlternatives(context: Record<string, unknown>) {
  const raw = Array.isArray(context.presentation_alternatives)
    ? context.presentation_alternatives
    : Array.isArray(context.alternatives)
      ? context.alternatives
      : [];
  return raw
    .map((entry) => {
      if (typeof entry === "string" && entry.trim()) {
        return { title: entry.trim(), note: "Alternative available for review." };
      }
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
      const record = entry as Record<string, unknown>;
      return {
        title: asDisplayString(record.title ?? record.label ?? record.name, "Alternative option"),
        note: asDisplayString(record.note ?? record.summary ?? record.reason, "Alternative available for review."),
      };
    })
    .filter((entry): entry is { title: string; note: string } => Boolean(entry));
}

function isLocalOnlyUrl(value: string | undefined) {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost";
  } catch {
    return false;
  }
}

function paragraphize(text: string) {
  return text
    .split(/\n\s*\n/)
    .map((entry) => entry.replace(/\n+/g, " ").trim())
    .filter(Boolean);
}

function extractEmbeddedJsonObject(text: string) {
  const trimmed = text.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    const parsed = JSON.parse(trimmed.slice(start, end + 1));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function firstSubstantiveParagraph(paragraphs: string[]) {
  return (
    paragraphs.find((entry) => {
      const trimmed = entry.trim();
      return Boolean(trimmed) && !/^\[[^\]]+\]$/.test(trimmed) && trimmed !== "Chairman";
    }) || ""
  );
}

function GenericPresentation({
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
  const title = buildPresentationTitle(context, task);
  const body = asDisplayString(context.presentation_body, asDisplayString(context.result_snapshot, "No presentation body was captured."));
  const bodyParagraphs = paragraphize(body);
  const embeddedBodyObject = extractEmbeddedJsonObject(body);
  const derivedCoworkError =
    typeof embeddedBodyObject?.error === "string" && embeddedBodyObject.error.trim()
      ? embeddedBodyObject.error.trim()
      : "";
  const substantiveParagraph = firstSubstantiveParagraph(bodyParagraphs);
  const rawSummary = asDisplayString(context.summary, "");
  const rawRecommendation = asDisplayString(context.presentation_recommendation, "");
  const summary =
    rawSummary && rawSummary !== "✓ Done" && !/^\[[^\]]+\]$/.test(rawSummary)
      ? rawSummary
      : derivedCoworkError || substantiveParagraph || "Here is the latest recommendation from AL's team, laid out cleanly so you can decide what should happen next.";
  const recommendation =
    rawRecommendation && rawRecommendation !== "✓ Done" && !/^\[[^\]]+\]$/.test(rawRecommendation)
      ? rawRecommendation
      : derivedCoworkError || substantiveParagraph || "Review the brief, check the supporting links, and make the next call.";
  const highlights = asStringArray(context.presentation_highlights).map(humanizeHighlight).filter(Boolean).slice(0, 6);
  const whySelected = asDisplayString(
    context.presentation_why_selected ?? context.why_selected ?? context.rationale,
    highlights[0] || "AL believes this is the strongest current path based on the latest evidence, with the rough edges sanded off.",
  );
  const nextAction = asDisplayString(context.next_action, "Decide whether to approve it, ask for changes, or hold until the package is ready.");
  const links = normalizeOperatorLinks(context);
  const primaryLinks = links.filter((link) => link.priority === "primary" && !isLocalOnlyUrl(link.url));
  const localOnlyPrimaryLinks = links.filter((link) => link.priority === "primary" && isLocalOnlyUrl(link.url));
  const secondaryLinks = links.filter((link) => link.priority === "secondary");
  const alternatives = normalizeAlternatives(context).slice(0, 4);
  const rawState = asDisplayString(context.review_state, "ready for review");
  const blockedSignals = [
    recommendation,
    summary,
    nextAction,
    bodyParagraphs[0] || "",
    task,
  ]
    .join(" ")
    .toLowerCase();
  const isBlockedPresentation =
    rawState === "blocked_vendor_session" ||
    (primaryLinks.length === 0 &&
      localOnlyPrimaryLinks.length === 0 &&
      alternatives.length === 0 &&
      (blockedSignals.includes("error:") ||
        blockedSignals.includes("blocked") ||
        blockedSignals.includes("repair") ||
        blockedSignals.includes("don't know a repo") ||
        blockedSignals.includes("do not know a repo")));

  return (
    <main className="h-full w-full overflow-y-auto bg-[#07100b] px-4 py-5 pb-28 text-[#eaf4ef] sm:px-6 lg:px-8 lg:pb-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300/45">Board Room</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#f3faf6] sm:text-4xl">{title}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-emerald-100/70 sm:text-base">{summary}</p>
          </div>
          <Link href={boardroomHomePath} className="hidden rounded-2xl border border-emerald-900/25 bg-[#101714] px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:border-emerald-500/40 sm:inline-flex">Back to Board Room</Link>
        </div>

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-3xl border border-emerald-900/20 bg-[#101714] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300/45">Recommendation</p>
                <h2 className="mt-2 text-2xl font-semibold text-[#f3faf6]">
                  {isBlockedPresentation ? "Blocked execution item" : recommendation}
                </h2>
              </div>
              <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200">
                {(isBlockedPresentation ? "blocked" : rawState).replace(/_/g, " ")}
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-emerald-900/20 bg-[#0b110e] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/45">
                {isBlockedPresentation ? "What broke" : "Why this won"}
              </p>
              <p className="mt-2 text-sm leading-6 text-emerald-100/75">
                {isBlockedPresentation ? recommendation : whySelected}
              </p>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-2xl border border-emerald-900/20 bg-[#0b110e] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/45">Owner</p>
                <p className="mt-2 text-lg font-semibold text-[#f3faf6]">{asDisplayString(context.owner, "AL team")}</p>
              </div>
              <div className="rounded-2xl border border-emerald-900/20 bg-[#0b110e] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/45">Business</p>
                <p className="mt-2 text-lg font-semibold text-[#f3faf6]">{asDisplayString(context.business_name, "Business context pending")}</p>
              </div>
              <div className="rounded-2xl border border-emerald-900/20 bg-[#0b110e] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/45">Next action</p>
                <p className="mt-2 text-sm leading-6 text-emerald-100/70">{nextAction}</p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-emerald-900/20 bg-[#0b110e] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/45">
                {isBlockedPresentation ? "Review status" : "Review now"}
              </p>
              {primaryLinks.length > 0 && !isBlockedPresentation ? (
                <div className="mt-4 grid gap-3 sm:flex sm:flex-wrap">
                  {primaryLinks.map((link) => (
                    <a key={`${link.label}-${link.url}`} href={link.url} target="_blank" rel="noreferrer" className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-[#05110b] transition hover:bg-emerald-400">{link.label}</a>
                  ))}
                </div>
              ) : localOnlyPrimaryLinks.length > 0 && !isBlockedPresentation ? (
                <div className="mt-3 space-y-3">
                  <p className="text-sm leading-6 text-emerald-100/65">
                    This package is real, but its review link still depends on Dez&apos;s local bridge machine.
                  </p>
                  <div className="grid gap-3 sm:flex sm:flex-wrap">
                    {localOnlyPrimaryLinks.map((link) => (
                      <a key={`${link.label}-${link.url}`} href={link.url} target="_blank" rel="noreferrer" className="rounded-2xl border border-sky-500/25 bg-sky-500/10 px-4 py-3 text-sm font-semibold text-sky-100 transition hover:bg-sky-500/15">{link.label}</a>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-sm leading-6 text-emerald-100/65">
                  {isBlockedPresentation
                    ? "No review artifact is attached because this item is blocked upstream and needs repair before review."
                    : "No direct review links were attached to this presentation yet."}
                </p>
              )}
            </div>

            <div className="mt-6">
              <ReviewDecisionPanel
                jobId={jobId}
                initialState={String(isBlockedPresentation ? "blocked_vendor_session" : context.review_state || "ready_for_review")}
                initialNextAction={nextAction}
                alternatives={alternatives.map((entry) => entry.title)}
                mode={isBlockedPresentation ? "generic_blocked" : "generic"}
              />
            </div>
          </div>

          <div className="rounded-3xl border border-emerald-900/20 bg-[#101714] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300/45">Fast brief</p>
            <h2 className="mt-2 text-2xl font-semibold text-[#f3faf6]">What matters most</h2>
            <div className="mt-5 space-y-3">
              {(highlights.length > 0 ? highlights : bodyParagraphs.slice(0, 2)).map((entry, index) => (
                <div key={`${index}-${entry}`} className="rounded-2xl border border-emerald-900/20 bg-[#0b110e] p-4 text-sm leading-6 text-emerald-100/75">
                  {renderLinkedText(entry)}
                </div>
              ))}
              {alternatives.length > 0 ? (
                <div className="rounded-2xl border border-emerald-900/20 bg-[#0b110e] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/45">Alternatives</p>
                  <div className="mt-3 space-y-3">
                    {alternatives.map((alternative) => (
                      <div key={alternative.title} className="rounded-2xl bg-[#101714] p-3">
                        <p className="text-sm font-semibold text-[#f3faf6]">{alternative.title}</p>
                        <p className="mt-1 text-sm leading-6 text-emerald-100/65">{alternative.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              {secondaryLinks.length > 0 ? (
                <div className="rounded-2xl border border-emerald-900/20 bg-[#0b110e] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/45">Supporting links</p>
                  <div className="mt-3 grid gap-3 sm:flex sm:flex-wrap">
                    {secondaryLinks.map((link) => (
                      <a key={`${link.label}-${link.url}`} href={link.url} target="_blank" rel="noreferrer" className="rounded-2xl border border-emerald-900/25 bg-[#101714] px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:border-emerald-500/40">{link.label}</a>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <details className="rounded-3xl border border-emerald-900/20 bg-[#101714] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
          <summary className="cursor-pointer list-none text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300/55">Full brief and evidence</summary>
          <div className="mt-4 space-y-4">
            {bodyParagraphs.map((paragraph, index) => (
              <p key={`paragraph-${index}`} className="text-sm leading-7 text-emerald-100/75">{renderLinkedText(paragraph)}</p>
            ))}
          </div>
        </details>
      </div>
    </main>
  );
}

function BrowserCommercePresentation({ context, task, jobId, boardroomHomePath }: { context: Record<string, unknown>; task: string; jobId: number; boardroomHomePath: string; }) {
  const reviewSurface = asRecord(context.review_surface);
  const artifactPaths = asRecord(reviewSurface.artifact_paths);
  const chosenOption = asRecord(context.chosen_option);
  const chosenDesign = asRecord(context.chosen_design);
  const vendorOptions = Array.isArray(context.vendor_options)
    ? context.vendor_options.filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object" && !Array.isArray(entry))
    : [];
  const reviewDecisions = Array.isArray(context.review_decisions)
    ? context.review_decisions.filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object" && !Array.isArray(entry))
    : [];
  const currentState = normalizeReviewState(context.review_state);
  const presentationTitle = buildPresentationTitle(context, task);
  const presentationSummary = typeof context.summary === "string" && context.summary.trim()
    ? context.summary.trim()
    : "Review the recommendation, inspect the supporting artifacts, and choose the next action before any final execution step.";

  return Promise.all([
    createSignedReviewAssetUrl(typeof artifactPaths.chosen_design_preview === "string" ? artifactPaths.chosen_design_preview : null),
    createSignedReviewAssetUrl(typeof artifactPaths.design_review_image === "string" ? artifactPaths.design_review_image : null),
    createSignedReviewAssetUrl(typeof artifactPaths.cart_review_image === "string" ? artifactPaths.cart_review_image : null),
  ]).then(([chosenDesignPreviewUrl, proofImageUrl, cartImageUrl]) => {
    const alternativeLabels = vendorOptions
      .map((option) => {
        const vendor = typeof option.vendor === "string" ? option.vendor : "";
        const size = asStringArray(option.size_signals).slice(0, 2).join(", ");
        return [vendor, size].filter(Boolean).join(" - ");
      })
      .filter(Boolean);

    return (
      <main className="h-full w-full overflow-y-auto bg-[#07100b] px-4 py-5 pb-28 text-[#eaf4ef] sm:px-6 lg:px-8 lg:pb-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300/45">Board Room</p>
              <h1 className="mt-2 text-3xl font-semibold text-[#f3faf6] sm:text-4xl">{presentationTitle}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-emerald-100/70 sm:text-base">{presentationSummary}</p>
            </div>
            <Link href={boardroomHomePath} className="hidden rounded-2xl border border-emerald-900/25 bg-[#101714] px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:border-emerald-500/40 sm:inline-flex">Back to Board Room</Link>
          </div>

          <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-3xl border border-emerald-900/20 bg-[#101714] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300/45">Recommendation</p>
                  <h2 className="mt-2 text-2xl font-semibold text-[#f3faf6]">{asDisplayString(chosenOption.vendor, "Recommended option")}</h2>
                  <p className="mt-2 text-sm leading-6 text-emerald-100/65">{asDisplayString(chosenDesign.title, "Ready for operator review")}</p>
                </div>
                <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200">{currentState}</div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-2xl border border-emerald-900/20 bg-[#0b110e] p-4"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/45">Estimated total</p><p className="mt-2 text-xl font-semibold text-[#f3faf6]">{asDisplayString(chosenOption.estimated_total, "Pending")}</p></div>
                <div className="rounded-2xl border border-emerald-900/20 bg-[#0b110e] p-4"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/45">Specs</p><p className="mt-2 text-lg font-semibold text-[#f3faf6]">{asDisplayString(chosenOption.dimensions, "Specs pending")}</p><p className="mt-1 text-sm text-emerald-100/60">{asDisplayString(chosenOption.quantity, "Quantity pending")}</p></div>
                <div className="rounded-2xl border border-emerald-900/20 bg-[#0b110e] p-4"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/45">Material</p><p className="mt-2 text-lg font-semibold text-[#f3faf6]">{asDisplayString(chosenOption.material, "Material pending")}</p></div>
              </div>

              <div className="mt-6 rounded-2xl border border-emerald-900/20 bg-[#0b110e] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/45">Why this won</p>
                <p className="mt-2 text-sm leading-6 text-emerald-100/75">{asDisplayString(chosenOption.why_best, "This is the strongest current path based on the review package that made it to a real operator checkpoint.")}</p>
              </div>

              <div className="mt-6 grid gap-3 sm:flex sm:flex-wrap">
                {typeof context.review_page_url === "string" ? <a href={String(context.review_page_url)} className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-[#05110b] transition hover:bg-emerald-400">Open presentation</a> : null}
                {typeof context.proof_url === "string" ? <a href={String(context.proof_url)} target="_blank" rel="noreferrer" className="rounded-2xl border border-emerald-900/25 bg-[#101714] px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:border-emerald-500/40">Open proof</a> : null}
                {typeof reviewSurface.hosted_debugger_fullscreen_url === "string" ? <a href={String(reviewSurface.hosted_debugger_fullscreen_url)} target="_blank" rel="noreferrer" className="rounded-2xl border border-emerald-900/25 bg-[#101714] px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:border-emerald-500/40">Open hosted replay</a> : typeof reviewSurface.hosted_session_url === "string" ? <a href={String(reviewSurface.hosted_session_url)} target="_blank" rel="noreferrer" className="rounded-2xl border border-emerald-900/25 bg-[#101714] px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:border-emerald-500/40">Open hosted session</a> : null}
                {typeof context.resume_cart_url === "string" ? <a href={String(context.resume_cart_url)} target="_blank" rel="noreferrer" className="rounded-2xl border border-emerald-900/25 bg-[#101714] px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:border-emerald-500/40">Resume locally</a> : null}
              </div>

              <p className="mt-4 text-sm leading-6 text-emerald-100/60">
                {typeof context.link_support === "object" && context.link_support && !Array.isArray(context.link_support) && (context.link_support as Record<string, unknown>).cart_url_usable_cross_session === false
                  ? typeof (context.link_support as Record<string, unknown>).cart_url_note === "string"
                    ? String((context.link_support as Record<string, unknown>).cart_url_note)
                    : "The live vendor cart is session-bound. Use Resume locally if you need the active browser cart."
                  : "Opening this presentation never submits checkout or final execution."}
              </p>
            </div>

            <div className="rounded-3xl border border-emerald-900/20 bg-[#101714] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300/45">Supporting artifacts</p>
              <h2 className="mt-2 text-2xl font-semibold text-[#f3faf6]">Preview, proof, and execution state</h2>
              <div className="mt-5 grid gap-4">
                {chosenDesignPreviewUrl ? <figure className="overflow-hidden rounded-2xl border border-emerald-900/20 bg-[#0b110e]"><img src={chosenDesignPreviewUrl} alt="Chosen design preview" className="block w-full" /><figcaption className="px-4 py-3 text-sm text-emerald-100/70">{asDisplayString(chosenDesign.title, "Chosen design preview")}</figcaption></figure> : null}
                {proofImageUrl ? <figure className="overflow-hidden rounded-2xl border border-emerald-900/20 bg-[#0b110e]"><img src={proofImageUrl} alt="Vendor proof screenshot" className="block w-full" /><figcaption className="px-4 py-3 text-sm text-emerald-100/70">Vendor proof screenshot</figcaption></figure> : null}
                {cartImageUrl ? <figure className="overflow-hidden rounded-2xl border border-emerald-900/20 bg-[#0b110e]"><img src={cartImageUrl} alt="Cart screenshot" className="block w-full" /><figcaption className="px-4 py-3 text-sm text-emerald-100/70">Cart screenshot</figcaption></figure> : null}
              </div>
            </div>
          </section>

          <ReviewDecisionPanel jobId={jobId} initialState={currentState} initialNextAction={typeof context.next_action === "string" ? context.next_action : "Review the presentation, then approve the recommendation or request changes."} alternatives={alternativeLabels} mode="browser_commerce" />

          <section className="rounded-3xl border border-emerald-900/20 bg-[#101714] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300/45">Alternatives</p>
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              {vendorOptions.map((option) => {
                const priceSignals = asStringArray(option.price_signals).slice(0, 3);
                const sizeSignals = asStringArray(option.size_signals).slice(0, 4);
                const materialSignals = asStringArray(option.material_signals).slice(0, 3);
                return (
                  <article key={`${String(option.vendor || "vendor")}-${String(option.url || "")}`} className="rounded-2xl border border-emerald-900/20 bg-[#0b110e] p-5">
                    <h3 className="text-lg font-semibold text-[#f3faf6]">{asDisplayString(option.vendor, "Vendor")}</h3>
                    <p className="mt-3 text-sm leading-6 text-emerald-100/70"><strong className="text-emerald-100">Price:</strong> {priceSignals.length > 0 ? priceSignals.join(", ") : "Pricing still inside vendor flow"}</p>
                    <p className="mt-2 text-sm leading-6 text-emerald-100/70"><strong className="text-emerald-100">Specs:</strong> {sizeSignals.length > 0 ? sizeSignals.join(", ") : "Details incomplete"}</p>
                    <p className="mt-2 text-sm leading-6 text-emerald-100/70"><strong className="text-emerald-100">Material:</strong> {materialSignals.length > 0 ? materialSignals.join(", ") : "Details incomplete"}</p>
                  </article>
                );
              })}
            </div>
          </section>

          {reviewDecisions.length > 0 ? (
            <section className="rounded-3xl border border-emerald-900/20 bg-[#101714] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300/45">Decision log</p>
              <div className="mt-4 space-y-3">
                {reviewDecisions.slice().reverse().map((entry, index) => (
                  <div key={`${String(entry.at || "decision")}-${index}`} className="rounded-2xl border border-emerald-900/20 bg-[#0b110e] p-4">
                    <p className="text-sm font-semibold text-[#f3faf6]">{asDisplayString(entry.action, "review_update")}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-emerald-300/45">{asDisplayString(entry.at, "timestamp unavailable")}</p>
                    {typeof entry.note === "string" && entry.note ? <p className="mt-3 text-sm leading-6 text-emerald-100/70">{entry.note}</p> : null}
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

export async function BoardroomPresentationPage({ jobId }: { jobId: number }) {
  if (!Number.isInteger(jobId) || jobId <= 0) notFound();
  const cookieStore = await cookies();
  if (!isAuthenticatedAlSession(cookieStore.get("al_session")?.value)) redirect("/");

  const job = await fetchAlJob(jobId);
  if (!job) notFound();

  const context = parseJobContext(job.context);
  const host = (await headers()).get("host");
  const boardroomHomePath = buildHostedBoardroomHomePath(host);
  const isBrowserCommercePresentation =
    job.job_type === "browser_commerce_design" &&
    Boolean(context.review_surface && typeof context.review_surface === "object");

  if (isBrowserCommercePresentation) {
    return <BrowserCommercePresentation context={context} task={job.task} jobId={jobId} boardroomHomePath={boardroomHomePath} />;
  }

  const hasGenericPresentation =
    (typeof context.presentation_title === "string" && context.presentation_title.trim()) ||
    (typeof context.presentation_body === "string" && context.presentation_body.trim()) ||
    (typeof job.result === "string" && job.result.trim());
  if (!hasGenericPresentation) notFound();

  return <GenericPresentation context={context} task={job.task} jobId={jobId} boardroomHomePath={boardroomHomePath} />;
}
