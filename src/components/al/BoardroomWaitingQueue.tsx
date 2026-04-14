"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { BoardroomQueueActions } from "@/components/al/BoardroomQueueActions";
import type { BoardroomPresentationRecord, ReviewDecisionAction } from "@/lib/al-review";

interface BoardroomWaitingQueueProps {
  items: BoardroomPresentationRecord[];
}

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

const BULK_ACTIONS: Array<{
  action: ReviewDecisionAction;
  label: string;
  pendingLabel: string;
  confirmText: string;
  className: string;
}> = [
  {
    action: "close_presentation",
    label: "Close selected",
    pendingLabel: "Closing...",
    confirmText:
      "Close the selected presentations and remove them from the active Board Room queue?",
    className:
      "al-gemstone-neutral rounded-xl px-4 py-2.5 text-sm font-semibold transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60",
  },
  {
    action: "reject_presentation",
    label: "Reject selected",
    pendingLabel: "Rejecting...",
    confirmText:
      "Reject the selected presentations and remove them from the active Board Room queue?",
    className:
      "al-gemstone-amber rounded-xl px-4 py-2.5 text-sm font-semibold transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60",
  },
  {
    action: "delete_presentation",
    label: "Delete selected",
    pendingLabel: "Deleting...",
    confirmText:
      "Delete the selected presentations from the active Board Room queue? The job records will remain for audit.",
    className:
      "al-gemstone-red rounded-xl px-4 py-2.5 text-sm font-semibold transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60",
  },
];

export function BoardroomWaitingQueue({ items }: BoardroomWaitingQueueProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [pendingAction, setPendingAction] = useState<ReviewDecisionAction | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isRefreshing, startTransition] = useTransition();

  const selectedSet = new Set(selectedIds);
  const selectedCount = items.reduce(
    (count, item) => count + (selectedSet.has(item.id) ? 1 : 0),
    0,
  );
  const allSelected = items.length > 0 && selectedCount === items.length;
  const staleItems = items.filter((item) => item.isStale);
  const dezOwnedItems = items.filter(
    (item) =>
      item.waitingOn === "Dez review" ||
      item.waitingOn === "Dez" ||
      item.waitingOn === "Dez's machine",
  );
  const localOnlyItems = items.filter((item) => item.bucket === "local_only");
  const blockedItems = items.filter(
    (item) => item.bucket === "needs_attention" || item.waitingOn === "System repair",
  );

  useEffect(() => {
    const currentItemIds = new Set(items.map((item) => item.id));
    setSelectedIds((current) => current.filter((id) => currentItemIds.has(id)));
  }, [items]);

  function toggleItem(jobId: number) {
    setSelectedIds((current) =>
      current.includes(jobId)
        ? current.filter((value) => value !== jobId)
        : [...current, jobId],
    );
  }

  function toggleAll() {
    setSelectedIds(allSelected ? [] : items.map((item) => item.id));
  }

  function selectOnly(jobIds: number[]) {
    setSelectedIds(jobIds);
  }

  async function runBulkAction(action: ReviewDecisionAction) {
    const targets = items.filter((item) => selectedSet.has(item.id));
    if (targets.length === 0) return;

    const meta = BULK_ACTIONS.find((entry) => entry.action === action);
    if (!meta || !window.confirm(meta.confirmText)) {
      return;
    }

    setPendingAction(action);
    setStatusMessage(null);

    try {
      const response = await fetch("/api/al/reviews/bulk-decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          jobIds: targets.map((target) => target.id),
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            ok?: boolean;
            error?: string;
            successIds?: number[];
            failureCount?: number;
            processedCount?: number;
            results?: Array<
              | {
                  jobId: number;
                  ok: true;
                  reviewState: string;
                  nextAction: string;
                }
              | {
                  jobId: number;
                  ok: false;
                  error: string;
                  status: number;
                }
            >;
          }
        | null;

      if (!response.ok || !payload) {
        throw new Error(payload?.error || `Board Room bulk update failed (${response.status}).`);
      }

      const successIds = Array.isArray(payload.successIds)
        ? payload.successIds.filter((value) => Number.isInteger(value))
        : [];
      const failures = Array.isArray(payload.results)
        ? payload.results.filter(
            (
              result,
            ): result is {
              jobId: number;
              ok: false;
              error: string;
              status: number;
            } => !result.ok,
          )
        : [];

      if (successIds.length > 0) {
        setSelectedIds((current) => current.filter((id) => !successIds.includes(id)));
        startTransition(() => {
          router.refresh();
        });
      }

      if (failures.length === 0) {
        setStatusMessage(
          action === "delete_presentation"
            ? `Deleted ${successIds.length} package${successIds.length === 1 ? "" : "s"} from the active queue.`
            : action === "reject_presentation"
              ? `Rejected ${successIds.length} package${successIds.length === 1 ? "" : "s"} and removed them from the active queue.`
              : `Closed ${successIds.length} package${successIds.length === 1 ? "" : "s"} and removed them from the active queue.`,
        );
      } else if (successIds.length === 0) {
        setStatusMessage(
          failures[0]?.error || "Board Room bulk update failed.",
        );
      } else {
        const failureIds = failures.map((failure) => `#${failure.jobId}`).join(", ");
        setStatusMessage(
          `Processed ${successIds.length} package${successIds.length === 1 ? "" : "s"}, but ${failures.length} item${failures.length === 1 ? "" : "s"} still need attention: ${failureIds}.`,
        );
      }
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Board Room bulk update failed.",
      );
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="al-glass-subtle al-inner-light rounded-2xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[var(--al-text-primary)]">Bulk actions</p>
            <p className="mt-1 text-sm leading-6 text-[var(--al-text-secondary)]">
              Select multiple packages and clear the queue in one pass.
            </p>
            <p className="mt-2 al-text-mono-label">
              {staleItems.length} stale | {dezOwnedItems.length} Dez-dependent | {localOnlyItems.length} local-only | {blockedItems.length} blocked/system
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex items-center gap-2 al-glass-recessed rounded-xl px-3 py-2 text-sm text-[var(--al-text-secondary)] cursor-pointer">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="h-4 w-4 rounded border-[var(--al-border)] bg-[var(--al-void)] text-[var(--al-cyan)] accent-[var(--al-cyan)]"
              />
              Select all
            </label>
            <button
              type="button"
              onClick={() => selectOnly(staleItems.map((item) => item.id))}
              disabled={staleItems.length === 0 || Boolean(pendingAction) || isRefreshing}
              className="al-gemstone-red rounded-xl px-3 py-2 text-sm font-semibold transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Select stale
            </button>
            <button
              type="button"
              onClick={() => selectOnly(dezOwnedItems.map((item) => item.id))}
              disabled={dezOwnedItems.length === 0 || Boolean(pendingAction) || isRefreshing}
              className="al-gemstone-amber rounded-xl px-3 py-2 text-sm font-semibold transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Select Dez
            </button>
            <button
              type="button"
              onClick={() => selectOnly(localOnlyItems.map((item) => item.id))}
              disabled={localOnlyItems.length === 0 || Boolean(pendingAction) || isRefreshing}
              className="al-gemstone-indigo rounded-xl px-3 py-2 text-sm font-semibold transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Select local
            </button>
            <button
              type="button"
              onClick={() => selectOnly(blockedItems.map((item) => item.id))}
              disabled={blockedItems.length === 0 || Boolean(pendingAction) || isRefreshing}
              className="al-gemstone-cyan rounded-xl px-3 py-2 text-sm font-semibold transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Select blocked
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              disabled={selectedCount === 0 || Boolean(pendingAction) || isRefreshing}
              className="al-glass-subtle rounded-xl px-3 py-2 text-sm font-semibold text-[var(--al-text-primary)] transition hover:border-[var(--al-border-hover)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {BULK_ACTIONS.map((entry) => (
            <button
              key={entry.action}
              type="button"
              onClick={() => runBulkAction(entry.action)}
              disabled={selectedCount === 0 || Boolean(pendingAction) || isRefreshing}
              className={entry.className}
            >
              {pendingAction === entry.action ? entry.pendingLabel : entry.label}
            </button>
          ))}
        </div>

        {statusMessage ? (
          <p className="mt-3 text-sm text-[var(--al-text-secondary)]">{statusMessage}</p>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {items.map((presentation) => (
          <article
            key={presentation.id}
            className="al-glass-subtle al-inner-light rounded-2xl p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <label className="inline-flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedSet.has(presentation.id)}
                  onChange={() => toggleItem(presentation.id)}
                  className="mt-1 h-4 w-4 rounded border-[var(--al-border)] bg-[var(--al-void)] text-[var(--al-cyan)] accent-[var(--al-cyan)]"
                />
                <div>
                  <p className="al-text-mono-label text-[var(--al-cyan-muted)]">
                    {presentation.jobType.replace(/_/g, " ")}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-[var(--al-text-primary)]">
                    {presentation.title}
                  </h3>
                </div>
              </label>
              <span className="al-gemstone-cyan rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em]">
                {presentation.state}
              </span>
            </div>

            <p className="mt-4 text-sm leading-6 text-[var(--al-text-secondary)]">
              {presentation.summary}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span
                className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] ${ownerTone(
                  presentation.followUpOwner,
                )}`}
              >
                Waiting on {presentation.waitingOn}
              </span>
              {presentation.followUpOwner ? (
                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] ${ownerTone(
                    presentation.followUpOwner,
                  )}`}
                >
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
    </div>
  );
}
