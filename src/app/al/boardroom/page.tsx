import Link from "next/link";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  buildHostedBoardroomHomePath,
  fetchBoardroomPresentations,
  isAuthenticatedAlSession,
} from "@/lib/al-review";

function relativeTimeLabel(value: string | null): string {
  if (!value) return "Time unavailable";
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "Time unavailable";
  const deltaMs = Date.now() - timestamp;
  const minutes = Math.max(1, Math.round(deltaMs / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function ownerTone(value: "AL" | "Dez" | "System" | null) {
  if (value === "Dez") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-100";
  }
  if (value === "System") {
    return "border-red-500/20 bg-red-500/10 text-red-100";
  }
  return "border-sky-500/20 bg-sky-500/10 text-sky-100";
}

export default async function AlBoardroomIndexPage() {
  const cookieStore = await cookies();
  if (!isAuthenticatedAlSession(cookieStore.get("al_session")?.value)) {
    redirect("/");
  }

  const host = (await headers()).get("host");
  const presentations = await fetchBoardroomPresentations(host, 12);
  const reviewNow = presentations.filter((presentation) => presentation.bucket === "review_now");
  const needsAttention = presentations.filter((presentation) => presentation.bucket === "needs_attention");
  const localOnly = presentations.filter((presentation) => presentation.bucket === "local_only");
  const homePath = buildHostedBoardroomHomePath(host);

  function renderPresentationCards(items: typeof presentations) {
    return (
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {items.map((presentation) => (
          <article
            key={presentation.id}
            className="rounded-2xl border border-emerald-900/20 bg-[#0b110e] p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/45">
                  {presentation.jobType.replace(/_/g, " ")}
                </p>
                <h3 className="mt-2 text-xl font-semibold text-[#f3faf6]">
                  {presentation.title}
                </h3>
              </div>
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-emerald-200">
                {presentation.state}
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-emerald-100/70">
              {presentation.summary}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] ${ownerTone(presentation.followUpOwner)}`}>
                Waiting on {presentation.waitingOn}
              </span>
              {presentation.followUpOwner ? (
                <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] ${ownerTone(presentation.followUpOwner)}`}>
                  Owner {presentation.followUpOwner}
                </span>
              ) : null}
              {presentation.followUpStatus ? (
                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-emerald-200">
                  Follow-up {presentation.followUpStatus}
                </span>
              ) : null}
              {presentation.isStale ? (
                <span className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-red-100">
                  Stale
                </span>
              ) : null}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-emerald-900/20 bg-[#101714] px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300/40">
                  Last movement
                </p>
                <p className="mt-2 text-sm text-emerald-100/80">
                  {relativeTimeLabel(presentation.updatedAt)}
                </p>
              </div>
              <div className="rounded-xl border border-emerald-900/20 bg-[#101714] px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300/40">
                  Last operator response
                </p>
                <p className="mt-2 text-sm text-emerald-100/80">
                  {presentation.lastOperatorResponseAt
                    ? relativeTimeLabel(presentation.lastOperatorResponseAt)
                    : "No operator response yet"}
                </p>
              </div>
            </div>
            {presentation.staleReason ? (
              <p className="mt-4 text-sm leading-6 text-red-100/80">
                {presentation.staleReason}.
              </p>
            ) : null}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.18em] text-emerald-300/35">
                Updated {relativeTimeLabel(presentation.updatedAt)}
              </p>
              <Link
                href={presentation.boardroomPath}
                className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-[#05110b] transition hover:bg-emerald-400"
              >
                Open presentation
              </Link>
            </div>
          </article>
        ))}
      </div>
    );
  }

  return (
    <main className="h-full w-full overflow-y-auto bg-[#07100b] px-4 py-6 text-[#eaf4ef] sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300/45">
              Board Room
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-[#f3faf6] sm:text-4xl">
              Presentations and approvals
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-emerald-100/70 sm:text-base">
              Review the latest operator-facing packages from AL’s team, compare options quickly,
              and record the next decision without digging through raw runtime output.
            </p>
          </div>
          <Link
            href="/al"
            className="rounded-2xl border border-emerald-900/25 bg-[#101714] px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:border-emerald-500/40"
          >
            Back to Command Center
          </Link>
        </div>

        <section className="rounded-3xl border border-emerald-900/20 bg-[#101714] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300/45">
                Active packages
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[#f3faf6]">
                Latest Board Room presentations
              </h2>
            </div>
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200">
              {presentations.length} visible
            </span>
          </div>

          {presentations.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-emerald-900/20 bg-[#0b110e] p-5 text-sm leading-6 text-emerald-100/70">
              No presentation packages are available yet. Once AL syncs a review-ready job, it
              will appear here.
            </div>
          ) : (
            <div className="mt-6 space-y-8">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/45">
                      Review now
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-[#f3faf6]">
                      Ready for a fast decision
                    </h3>
                  </div>
                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-emerald-200">
                    {reviewNow.length}
                  </span>
                </div>
                {reviewNow.length > 0 ? renderPresentationCards(reviewNow) : (
                  <div className="mt-4 rounded-2xl border border-emerald-900/20 bg-[#0b110e] p-5 text-sm leading-6 text-emerald-100/70">
                    Nothing is fully review-ready right now.
                  </div>
                )}
              </div>

              {needsAttention.length > 0 ? (
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300/55">
                        Needs attention
                      </p>
                      <h3 className="mt-2 text-xl font-semibold text-[#f3faf6]">
                        Execution items that still need repair
                      </h3>
                    </div>
                    <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-amber-100">
                      {needsAttention.length}
                    </span>
                  </div>
                  {renderPresentationCards(needsAttention)}
                </div>
              ) : null}

              {localOnly.length > 0 ? (
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300/55">
                        Local-only
                      </p>
                      <h3 className="mt-2 text-xl font-semibold text-[#f3faf6]">
                        Review packages that still depend on Dez&apos;s machine
                      </h3>
                    </div>
                    <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-sky-100">
                      {localOnly.length}
                    </span>
                  </div>
                  <div className="mt-4 rounded-2xl border border-sky-900/20 bg-[#0b110e] p-5 text-sm leading-6 text-emerald-100/70">
                    These packages are real, but their primary review links still point to local bridge output instead of a fully hosted review surface.
                  </div>
                  {renderPresentationCards(localOnly)}
                </div>
              ) : null}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-emerald-900/20 bg-[#101714] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300/45">
            How to use it
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-emerald-900/20 bg-[#0b110e] p-5">
              <h3 className="text-lg font-semibold text-[#f3faf6]">1. Open the package</h3>
              <p className="mt-2 text-sm leading-6 text-emerald-100/70">
                Start with the presentation, not the underlying runtime details.
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-900/20 bg-[#0b110e] p-5">
              <h3 className="text-lg font-semibold text-[#f3faf6]">2. Review the evidence</h3>
              <p className="mt-2 text-sm leading-6 text-emerald-100/70">
                Use proof links, previews, and alternatives to confirm the recommendation quickly.
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-900/20 bg-[#0b110e] p-5">
              <h3 className="text-lg font-semibold text-[#f3faf6]">3. Record the decision</h3>
              <p className="mt-2 text-sm leading-6 text-emerald-100/70">
                Approve, request changes, or flag a blocked execution path without losing the audit trail.
              </p>
            </div>
          </div>
          {homePath !== "/al/boardroom" ? (
            <p className="mt-4 text-xs uppercase tracking-[0.18em] text-emerald-300/35">
              Hosted path active at {homePath}
            </p>
          ) : null}
        </section>
      </div>
    </main>
  );
}
