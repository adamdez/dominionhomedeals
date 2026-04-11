"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type QueueAction = "close_presentation" | "reject_presentation" | "delete_presentation";

interface BoardroomQueueActionsProps {
  jobId: number;
  boardroomPath: string;
}

const ACTION_META: Record<
  QueueAction,
  {
    label: string;
    confirmText: string;
    pendingText: string;
    className: string;
  }
> = {
  close_presentation: {
    label: "Close",
    confirmText: "Close this presentation and remove it from the active Board Room queue?",
    pendingText: "Closing...",
    className:
      "rounded-xl border border-slate-600/40 bg-slate-500/10 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-500/15 disabled:cursor-not-allowed disabled:opacity-60",
  },
  reject_presentation: {
    label: "Reject",
    confirmText: "Reject this package and remove it from the active Board Room queue?",
    pendingText: "Rejecting...",
    className:
      "rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-100 transition hover:bg-amber-500/15 disabled:cursor-not-allowed disabled:opacity-60",
  },
  delete_presentation: {
    label: "Delete",
    confirmText: "Delete this package from the active Board Room queue? The job record will be kept for audit.",
    pendingText: "Deleting...",
    className:
      "rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-100 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60",
  },
};

export function BoardroomQueueActions({
  jobId,
  boardroomPath,
}: BoardroomQueueActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<QueueAction | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  async function runAction(action: QueueAction) {
    const meta = ACTION_META[action];
    if (!window.confirm(meta.confirmText)) {
      return;
    }

    setPendingAction(action);
    setStatusMessage(null);

    try {
      const response = await fetch(`/api/al/reviews/${jobId}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            ok?: boolean;
            error?: string;
          }
        | null;

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || `Board Room update failed (${response.status}).`);
      }

      setStatusMessage(
        action === "delete_presentation"
          ? "Deleted from active Board Room."
          : action === "reject_presentation"
            ? "Rejected and removed from active Board Room."
            : "Closed and removed from active Board Room.",
      );
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Board Room update failed.",
      );
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-2">
        <Link
          href={boardroomPath}
          className="rounded-xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-[#05110b] transition hover:bg-emerald-400"
        >
          Open
        </Link>
        {(["close_presentation", "reject_presentation", "delete_presentation"] as QueueAction[]).map(
          (action) => {
            const meta = ACTION_META[action];
            const disabled = Boolean(pendingAction) || isPending;
            return (
              <button
                key={action}
                type="button"
                onClick={() => runAction(action)}
                disabled={disabled}
                className={meta.className}
              >
                {pendingAction === action ? meta.pendingText : meta.label}
              </button>
            );
          },
        )}
      </div>
      {statusMessage ? (
        <p className="mt-2 text-xs text-emerald-100/70">{statusMessage}</p>
      ) : null}
    </div>
  );
}
