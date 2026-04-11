"use client";

import { useMemo, useState } from "react";

type FollowUpTaskSummary = {
  id: number;
  title: string;
  assigned_to: "dez" | "al";
  status: "open" | "done" | "cancelled";
  source_action: string;
  created_at: string | null;
  details: string;
};

interface ReviewDecisionPanelProps {
  jobId: number;
  initialState: string;
  initialNextAction: string;
  alternatives: string[];
  mode?: "generic" | "browser_commerce" | "generic_blocked";
  initialFollowUp?: FollowUpTaskSummary | null;
}

function humanizeState(value: string): string {
  switch (value) {
    case "approved_for_checkout":
      return "approved";
    case "changes_requested":
      return "changes requested";
    case "resume_local_session_required":
      return "resume required";
    case "blocked_vendor_session":
      return "blocked";
    case "cart_ready_for_review":
      return "ready for review";
    case "presentation_closed":
      return "closed";
    case "presentation_rejected":
      return "rejected";
    case "presentation_deleted":
      return "removed";
    default:
      return value.replace(/_/g, " ");
  }
}

function isTerminalState(value: string): boolean {
  return (
    value === "presentation_closed" ||
    value === "presentation_rejected" ||
    value === "presentation_deleted"
  );
}

export function ReviewDecisionPanel({
  jobId,
  initialState,
  initialNextAction,
  alternatives,
  mode = "generic",
  initialFollowUp = null,
}: ReviewDecisionPanelProps) {
  const [reviewState, setReviewState] = useState(initialState);
  const [nextAction, setNextAction] = useState(initialNextAction);
  const [followUp, setFollowUp] = useState<FollowUpTaskSummary | null>(initialFollowUp);
  const [note, setNote] = useState("");
  const [selectedAlternative, setSelectedAlternative] = useState(alternatives[0] || "");
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const actionLabels = useMemo(
    () =>
      mode === "browser_commerce"
        ? {
            approve: "Approve and continue",
            changes: "Request changes",
            resume: "Resume local cart",
            blocked: "Mark cart blocked",
            close: "Close presentation",
            reject: "Reject package",
            remove: "Delete from Board Room",
            alternate: "Pick this alternate",
            note: "Optional operator note",
            notePlaceholder: "Add a quick instruction only if the team needs one.",
          }
        : mode === "generic_blocked"
          ? {
              approve: "Approve recommendation",
              changes: "Request changes",
              resume: "Mark fixed / resume",
              blocked: "Keep blocked",
              close: "Close presentation",
              reject: "Reject package",
              remove: "Delete from Board Room",
              alternate: "Choose this alternate",
              note: "Blocked-item note",
              notePlaceholder: "Add the exact fix needed or who owns it.",
            }
        : {
            approve: "Approve recommendation",
            changes: "Request changes",
            resume: "Resume execution",
            blocked: "Mark blocked",
            close: "Close presentation",
            reject: "Reject package",
            remove: "Delete from Board Room",
            alternate: "Choose this alternate",
            note: "Optional note for AL",
            notePlaceholder: "Add a short change request, approval note, or blocker.",
          },
    [mode],
  );

  const showApprove = mode !== "generic_blocked";
  const showChanges = mode !== "generic_blocked";
  const showBlocked = true;
  const showResume = true;
  const showClose = true;
  const showReject = true;
  const showRemove = true;
  const showAlternatives = alternatives.length > 0 && mode !== "generic_blocked";
  const terminalState = isTerminalState(reviewState);

  async function submitDecision(action: string) {
    setSaving(true);
    setStatusMessage(null);

    try {
      const response = await fetch(`/api/al/reviews/${jobId}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          note,
          selectedAlternative:
            action === "select_alternative_option" ? selectedAlternative : undefined,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            ok?: boolean;
            error?: string;
            reviewState?: string;
            nextAction?: string;
            followUp?: FollowUpTaskSummary | null;
          }
        | null;

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || `Review update failed (${response.status}).`);
      }

      const nextReviewState = payload.reviewState || reviewState;
      const nextActionText = payload.nextAction || nextAction;
      setReviewState(nextReviewState);
      setNextAction(nextActionText);
      setFollowUp(payload?.followUp ?? null);
      setStatusMessage(
        payload?.followUp
          ? `Saved: ${humanizeState(nextReviewState)}. Follow-up assigned to ${payload.followUp.assigned_to === "al" ? "AL" : "Dez"}.`
          : `Saved: ${humanizeState(nextReviewState)}.`,
      );
      setNote("");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Review update failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-3xl border border-emerald-900/20 bg-[#101714] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300/45">
            Decision
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[#eaf4ef]">
            Quick call
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-emerald-100/70">{nextAction}</p>
        </div>
        <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200">
          {humanizeState(reviewState)}
        </div>
      </div>

      {terminalState ? (
        <div className="mt-5 rounded-2xl border border-slate-500/20 bg-slate-500/10 p-4">
          <p className="text-sm font-semibold text-slate-100">
            This presentation is no longer active in the Board Room queue.
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-200/75">
            Approvals and change requests are locked once an item has been closed, rejected, or removed.
          </p>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
          {showApprove ? (
            <button
              type="button"
              onClick={() => submitDecision("approved_for_checkout")}
              disabled={saving}
              className="rounded-2xl bg-emerald-500 px-4 py-3.5 text-sm font-semibold text-[#05110b] transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {actionLabels.approve}
            </button>
          ) : null}
          {showChanges ? (
            <button
              type="button"
              onClick={() => submitDecision("changes_requested")}
              disabled={saving}
              className="rounded-2xl border border-emerald-800/40 bg-[#0b110e] px-4 py-3.5 text-sm font-semibold text-emerald-100 transition hover:border-emerald-500/45 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {actionLabels.changes}
            </button>
          ) : null}
          {showBlocked ? (
            <button
              type="button"
              onClick={() => submitDecision("blocked_vendor_session")}
              disabled={saving}
              className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3.5 text-sm font-semibold text-red-200 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {actionLabels.blocked}
            </button>
          ) : null}
          {showResume ? (
            <button
              type="button"
              onClick={() => submitDecision("resume_local_session_required")}
              disabled={saving}
              className="rounded-2xl border border-emerald-800/40 bg-[#0b110e] px-4 py-3.5 text-sm font-semibold text-emerald-100 transition hover:border-emerald-500/45 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {actionLabels.resume}
            </button>
          ) : null}
          {showClose ? (
            <button
              type="button"
              onClick={() => submitDecision("close_presentation")}
              disabled={saving}
              className="col-span-2 rounded-2xl border border-slate-600/40 bg-slate-500/10 px-4 py-3.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-500/15 disabled:cursor-not-allowed disabled:opacity-60 sm:col-auto"
            >
              {actionLabels.close}
            </button>
          ) : null}
          {showReject ? (
            <button
              type="button"
              onClick={() => submitDecision("reject_presentation")}
              disabled={saving}
              className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3.5 text-sm font-semibold text-amber-100 transition hover:bg-amber-500/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {actionLabels.reject}
            </button>
          ) : null}
          {showRemove ? (
            <button
              type="button"
              onClick={() => submitDecision("delete_presentation")}
              disabled={saving}
              className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3.5 text-sm font-semibold text-red-100 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {actionLabels.remove}
            </button>
          ) : null}
        </div>
      )}

      {showAlternatives && !terminalState ? (
        <div className="mt-6 rounded-2xl border border-emerald-900/20 bg-[#0b110e] p-4">
          <p className="text-sm font-semibold text-emerald-100">Alternate option</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <select
              value={selectedAlternative}
              onChange={(event) => setSelectedAlternative(event.target.value)}
              className="min-w-[240px] rounded-xl border border-emerald-900/25 bg-[#111916] px-3 py-2 text-sm text-[#eaf4ef] outline-none"
            >
              {alternatives.map((alternative) => (
                <option key={alternative} value={alternative}>
                  {alternative}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => submitDecision("select_alternative_option")}
              disabled={saving || !selectedAlternative}
              className="rounded-xl border border-emerald-800/40 bg-[#111916] px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:border-emerald-500/45 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {actionLabels.alternate}
            </button>
          </div>
        </div>
      ) : null}

      {!terminalState ? (
        <label className="mt-6 block text-sm font-medium text-emerald-100/85">
          {actionLabels.note}
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={2}
            placeholder={actionLabels.notePlaceholder}
            className="mt-2 w-full rounded-2xl border border-emerald-900/25 bg-[#0b110e] px-4 py-3 text-sm text-[#eaf4ef] outline-none transition focus:border-emerald-500/50"
          />
        </label>
      ) : null}

      {followUp ? (
        <div className="mt-6 rounded-2xl border border-sky-500/25 bg-sky-500/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-200/70">
            Follow-up created
          </p>
          <p className="mt-2 text-sm font-semibold text-sky-50">{followUp.title}</p>
          <p className="mt-2 text-sm leading-6 text-sky-100/80">{followUp.details}</p>
          <p className="mt-3 text-xs uppercase tracking-[0.16em] text-sky-200/65">
            Assigned to {followUp.assigned_to === "al" ? "AL" : "Dez"}{followUp.created_at ? ` • ${new Date(followUp.created_at).toLocaleString()}` : ""}
          </p>
        </div>
      ) : null}

      {statusMessage ? (
        <p className="mt-4 text-sm text-emerald-200/80">{statusMessage}</p>
      ) : null}
    </section>
  );
}
