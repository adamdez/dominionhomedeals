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
  if (value === "Dez") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-100";
  }
  if (value === "System") {
    return "border-red-500/20 bg-red-500/10 text-red-100";
  }
  return "border-sky-500/20 bg-sky-500/10 text-sky-100";
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
      "rounded-xl border border-slate-600/40 bg-slate-500/10 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-500/15 disabled:cursor-not-allowed disabled:opacity-60",
  },
  {
    action: "reject_presentation",
    label: "Reject selected",
    pendingLabel: "Rejecting...",
    confirmText:
      "Reject the selected presentations and remove them from the active Board Room queue?",
    className:
      "rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm font-semibold text-amber-100 transition hover:bg-amber-500/15 disabled:cursor-not-allowed disabled:opacity-60",
  },
  {
    action: "delete_presentation",
    label: "Delete selected",
    pendingLabel: "Deleting...",
    confirmText:
      "Delete the selected presentations from the active Board Room queue? The job records will remain for audit.",
    className:
      "rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-100 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60",
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
      <div className="rounded-2xl border border-amber-900/20 bg-[#0b110e] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#f3faf6]">Bulk actions</p>
            <p className="mt-1 text-sm leading-6 text-emerald-100/70">
              Select multiple packages and clear the queue in one pass.
            </p>
            <p className="mt-2 text-xs uppercase tracking-[0.16em] text-emerald-200/55">
              {staleItems.length} stale | {dezOwnedItems.length} Dez-dependent | {localOnlyItems.length} local-only | {blockedItems.length} blocked/system
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex items-center gap-2 rounded-xl border border-emerald-900/20 bg-[#101714] px-3 py-2 text-sm text-emerald-100/80">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="h-4 w-4 rounded border-emerald-800/50 bg-[#101714] text-emerald-500"
              />
              Select all
            </label>
            <button
              type="button"
              onClick={() => selectOnly(staleItems.map((item) => item.id))}
              disabled={staleItems.length === 0 || Boolean(pendingAction) || isRefreshing}
              className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Select stale
            </button>
            <button
              type="button"
              onClick={() => selectOnly(dezOwnedItems.map((item) => item.id))}
              disabled={dezOwnedItems.length === 0 || Boolean(pendingAction) || isRefreshing}
              className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-500/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Select Dez
            </button>
            <button
              type="button"
              onClick={() => selectOnly(localOnlyItems.map((item) => item.id))}
              disabled={localOnlyItems.length === 0 || Boolean(pendingAction) || isRefreshing}
              className="rounded-xl border border-violet-500/20 bg-violet-500/10 px-3 py-2 text-sm font-semibold text-violet-100 transition hover:bg-violet-500/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Select local
            </button>
            <button
              type="button"
              onClick={() => selectOnly(blockedItems.map((item) => item.id))}
              disabled={blockedItems.length === 0 || Boolean(pendingAction) || isRefreshing}
              className="rounded-xl border border-sky-500/20 bg-sky-500/10 px-3 py-2 text-sm font-semibold text-sky-100 transition hover:bg-sky-500/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Select blocked
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              disabled={selectedCount === 0 || Boolean(pendingAction) || isRefreshing}
              className="rounded-xl border border-emerald-900/20 bg-[#101714] px-3 py-2 text-sm font-semibold text-emerald-100 transition hover:border-emerald-500/35 disabled:cursor-not-allowed disabled:opacity-60"
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
          <p className="mt-3 text-sm text-emerald-100/75">{statusMessage}</p>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {items.map((presentation) => (
          <article
            key={presentation.id}
            className="rounded-2xl border border-emerald-900/20 bg-[#0b110e] p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <label className="inline-flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedSet.has(presentation.id)}
                  onChange={() => toggleItem(presentation.id)}
                  className="mt-1 h-4 w-4 rounded border-emerald-800/50 bg-[#101714] text-emerald-500"
                />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/45">
                    {presentation.jobType.replace(/_/g, " ")}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-[#f3faf6]">
                    {presentation.title}
                  </h3>
                </div>
              </label>
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-emerald-200">
                {presentation.state}
              </span>
            </div>

            <p className="mt-4 text-sm leading-6 text-emerald-100/70">
              {presentation.summary}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] ${ownerTone(
                  presentation.followUpOwner,
                )}`}
              >
                Waiting on {presentation.waitingOn}
              </span>
              {presentation.followUpOwner ? (
                <span
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] ${ownerTone(
                    presentation.followUpOwner,
                  )}`}
                >
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
