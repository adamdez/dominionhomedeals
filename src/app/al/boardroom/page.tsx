import Link from "next/link";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { BoardroomQueueActions } from "@/components/al/BoardroomQueueActions";
import { BoardroomWaitingQueue } from "@/components/al/BoardroomWaitingQueue";
import {
  buildHostedBoardroomHomePath,
  fetchBoardroomQueueSnapshot,
  isAuthenticatedAlSession,
} from "@/lib/al-review";

export const dynamic = "force-dynamic";

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
  if (value === "Dez") return "al-gemstone-amber";
  if (value === "System") return "al-gemstone-red";
  return "al-gemstone-cyan";
}

function queueMaintenancePriority(input: {
  waitingOn: string;
  bucket: "review_now" | "needs_attention" | "local_only";
  isStale: boolean;
  updatedAt: string | null;
}) {
  const waitingOn = input.waitingOn.toLowerCase();
  const updatedAt = input.updatedAt ? new Date(input.updatedAt).getTime() : Number.POSITIVE_INFINITY;
  const waitingRank =
    waitingOn === "dez review"
      ? 0
      : waitingOn === "dez"
        ? 1
        : waitingOn === "system repair"
          ? 2
          : waitingOn === "dez's machine"
            ? 3
            : 4;
  const bucketRank =
    input.bucket === "needs_attention" ? 0 : input.bucket === "local_only" ? 1 : 2;

  return [
    input.isStale ? 0 : 1,
    waitingRank,
    bucketRank,
    updatedAt,
  ] as const;
}

export default async function AlBoardroomIndexPage() {
  const cookieStore = await cookies();
  if (!isAuthenticatedAlSession(cookieStore.get("al_session")?.value)) {
    redirect("/");
  }

  const host = (await headers()).get("host");
  const queueSnapshot = await fetchBoardroomQueueSnapshot(host, 12);
  const presentations = queueSnapshot.visible;
  const queueMaintenanceItems = presentations
    .filter(
      (presentation) =>
        presentation.waitingOn === "Dez review" ||
        presentation.waitingOn === "Dez" ||
        presentation.bucket === "needs_attention" ||
        presentation.bucket === "local_only",
    )
    .sort((left, right) => {
      const leftPriority = queueMaintenancePriority(left);
      const rightPriority = queueMaintenancePriority(right);
      for (let index = 0; index < leftPriority.length; index += 1) {
        if (leftPriority[index] !== rightPriority[index]) {
          return leftPriority[index] - rightPriority[index];
        }
      }
      return right.id - left.id;
    });
  const queueMaintenanceIds = new Set(queueMaintenanceItems.map((presentation) => presentation.id));
  const reviewNow = presentations.filter((presentation) => presentation.bucket === "review_now");
  const reviewNowRemaining = reviewNow.filter(
    (presentation) => !queueMaintenanceIds.has(presentation.id),
  );
  const needsAttention = presentations.filter(
    (presentation) =>
      presentation.bucket === "needs_attention" && !queueMaintenanceIds.has(presentation.id),
  );
  const localOnly = presentations.filter(
    (presentation) =>
      presentation.bucket === "local_only" && !queueMaintenanceIds.has(presentation.id),
  );
  const homePath = buildHostedBoardroomHomePath(host);

  function renderPresentationCards(items: typeof presentations) {
    return (
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {items.map((presentation) => (
          <article
            key={presentation.id}
            className="al-glass-subtle al-inner-light al-specular rounded-2xl p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="al-text-mono-label text-[var(--al-cyan-muted)]">
                  {presentation.jobType.replace(/_/g, " ")}
                </p>
                <h3 className="mt-2 text-xl font-semibold text-[var(--al-text-primary)]">
                  {presentation.title}
                </h3>
              </div>
              <span className="al-gemstone-cyan rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em]">
                {presentation.state}
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-[var(--al-text-secondary)]">
              {presentation.summary}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] ${ownerTone(presentation.followUpOwner)}`}>
                Waiting on {presentation.waitingOn}
              </span>
              {presentation.followUpOwner ? (
                <span className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] ${ownerTone(presentation.followUpOwner)}`}>
                  Owner {presentation.followUpOwner}
                </span>
              ) : null}
              {presentation.followUpStatus ? (
                <span className="al-gemstone-green rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em]">
                  Follow-up {presentation.followUpStatus}
                </span>
              ) : null}
              {presentation.isStale ? (
                <span className="al-gemstone-red rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em]">
                  Stale
                </span>
              ) : null}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="al-glass-recessed rounded-xl px-4 py-3">
                <p className="al-text-mono-label">
                  Last movement
                </p>
                <p className="mt-2 text-sm text-[var(--al-text-secondary)]">
                  {relativeTimeLabel(presentation.updatedAt)}
                </p>
              </div>
              <div className="al-glass-recessed rounded-xl px-4 py-3">
                <p className="al-text-mono-label">
                  Last operator response
                </p>
                <p className="mt-2 text-sm text-[var(--al-text-secondary)]">
                  {presentation.lastOperatorResponseAt
                    ? relativeTimeLabel(presentation.lastOperatorResponseAt)
                    : "No operator response yet"}
                </p>
              </div>
            </div>
            {presentation.staleReason ? (
              <p className="mt-4 text-sm leading-6 text-[var(--al-red)]">
                {presentation.staleReason}.
              </p>
            ) : null}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <p className="al-text-mono-label text-[var(--al-text-ghost)]">
                Updated {relativeTimeLabel(presentation.updatedAt)}
              </p>
            </div>
            <BoardroomQueueActions
              jobId={presentation.id}
              boardroomPath={presentation.boardroomPath}
            />
          </article>
        ))}
      </div>
    );
  }

  return (
    <main className="h-full w-full overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="al-text-mono-label text-[var(--al-cyan-muted)]">
              Board Room
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-[var(--al-text-primary)] sm:text-4xl">
              Presentations and approvals
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--al-text-secondary)] sm:text-base">
              Review the live queue only. Older stale, no-proof, or dead-end packages are buried
              from the default view so this page stays useful again.
            </p>
          </div>
          <Link
            href="/al"
            className="rounded-2xl al-glass-subtle px-4 py-3 text-sm font-semibold text-[var(--al-text-primary)] transition hover:border-[var(--al-border-hover)]"
          >
            Back to Command Center
          </Link>
        </div>

        <section className="al-glass-card al-specular rounded-3xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="al-text-mono-label text-[var(--al-cyan-muted)]">
                Active packages
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-[var(--al-text-primary)]">
                Latest Board Room presentations
              </h2>
            </div>
            <span className="al-gemstone-cyan rounded-full px-4 py-2 text-sm font-semibold">
              {queueSnapshot.counts.visible} active
            </span>
          </div>

          {presentations.length === 0 ? (
            <div className="mt-6 al-glass-recessed rounded-2xl p-5 text-sm leading-6 text-[var(--al-text-secondary)]">
              Nothing is active enough to deserve Board Room space right now. New review-ready
              work will appear here, and older stale packages stay buried until they are revived
              or cleaned up.
            </div>
          ) : (
            <div className="mt-6 space-y-8">
              {queueSnapshot.counts.buried > 0 ? (
                <div className="al-glass-recessed rounded-2xl p-5 text-sm leading-6 text-[var(--al-text-secondary)]">
                  {queueSnapshot.counts.buried} older stale or no-proof package
                  {queueSnapshot.counts.buried === 1 ? "" : "s"} are buried from the live queue by
                  default. The audit trail still exists, but the active Board Room is now focused
                  on what can actually move.
                </div>
              ) : null}

              {queueMaintenanceItems.length > 0 ? (
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="al-text-mono-label text-[var(--al-amber)]">
                        Queue maintenance
                      </p>
                      <h3 className="mt-2 text-xl font-semibold text-[var(--al-text-primary)]">
                        Fast bulk controls
                      </h3>
                    </div>
                    <span className="al-gemstone-amber rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em]">
                      {queueMaintenanceItems.length}
                    </span>
                  </div>
                  <div className="mt-4 al-glass-recessed rounded-2xl p-5 text-sm leading-6 text-[var(--al-text-secondary)]">
                    Close, reject, or delete the packages most likely to need cleanup without opening each presentation first. Delete removes the package from the live queue but keeps the audit trail intact.
                  </div>
                  <div className="mt-4">
                    <BoardroomWaitingQueue items={queueMaintenanceItems} />
                  </div>
                </div>
              ) : null}

              <div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="al-text-mono-label text-[var(--al-cyan-muted)]">
                      Review now
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-[var(--al-text-primary)]">
                      Ready for a fast decision
                    </h3>
                  </div>
                  <span className="al-gemstone-green rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em]">
                    {reviewNowRemaining.length}
                  </span>
                </div>
                {reviewNowRemaining.length > 0 ? renderPresentationCards(reviewNowRemaining) : (
                  <div className="mt-4 al-glass-recessed rounded-2xl p-5 text-sm leading-6 text-[var(--al-text-secondary)]">
                    Nothing is fully review-ready right now.
                  </div>
                )}
              </div>

              {needsAttention.length > 0 ? (
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="al-text-mono-label text-[var(--al-amber)]">
                        Needs attention
                      </p>
                      <h3 className="mt-2 text-xl font-semibold text-[var(--al-text-primary)]">
                        Execution items that still need repair
                      </h3>
                    </div>
                    <span className="al-gemstone-amber rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em]">
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
                      <p className="al-text-mono-label text-[var(--al-indigo)]">
                        Local-only
                      </p>
                      <h3 className="mt-2 text-xl font-semibold text-[var(--al-text-primary)]">
                        Review packages that still depend on Dez&apos;s machine
                      </h3>
                    </div>
                    <span className="al-gemstone-indigo rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em]">
                      {localOnly.length}
                    </span>
                  </div>
                  <div className="mt-4 al-glass-recessed rounded-2xl p-5 text-sm leading-6 text-[var(--al-text-secondary)]">
                    These packages are real, but their primary review links still point to local bridge output instead of a fully hosted review surface.
                  </div>
                  {renderPresentationCards(localOnly)}
                </div>
              ) : null}
            </div>
          )}
        </section>

        <section className="al-glass-card al-inner-light rounded-3xl p-6">
          <p className="al-text-mono-label text-[var(--al-cyan-muted)]">
            How to use it
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="al-glass-subtle al-inner-light rounded-2xl p-5">
              <h3 className="text-lg font-semibold text-[var(--al-text-primary)]">1. Open the package</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--al-text-secondary)]">
                Start with the presentation, not the underlying runtime details.
              </p>
            </div>
            <div className="al-glass-subtle al-inner-light rounded-2xl p-5">
              <h3 className="text-lg font-semibold text-[var(--al-text-primary)]">2. Review the evidence</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--al-text-secondary)]">
                Use proof links, previews, and alternatives to confirm the recommendation quickly.
              </p>
            </div>
            <div className="al-glass-subtle al-inner-light rounded-2xl p-5">
              <h3 className="text-lg font-semibold text-[var(--al-text-primary)]">3. Record the decision</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--al-text-secondary)]">
                Approve, request changes, or flag a blocked execution path without losing the audit trail.
              </p>
            </div>
          </div>
          {homePath !== "/al/boardroom" ? (
            <p className="mt-4 al-text-mono-label text-[var(--al-text-ghost)]">
              Hosted path active at {homePath}
            </p>
          ) : null}
        </section>
      </div>
    </main>
  );
}
