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
    <section className="al-glass-card al-specular rounded-3xl p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="al-text-mono-label text-[var(--al-cyan-muted)]">
            Decision
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-[var(--al-text-primary)]">
            Quick call
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--al-text-secondary)]">{nextAction}</p>
        </div>
        <div className="al-gemstone-cyan rounded-full px-4 py-2 text-sm font-semibold">
          {humanizeState(reviewState)}
        </div>
      </div>

      {terminalState ? (
        <div className="mt-5 al-gemstone-neutral rounded-2xl p-4">
          <p className="text-sm font-semibold text-[var(--al-text-primary)]">
            This presentation is no longer active in the Board Room queue.
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--al-text-secondary)]">
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
              className="al-specular-button rounded-2xl bg-[var(--al-cyan)] px-4 py-3.5 text-sm font-semibold text-[var(--al-void)] transition hover:shadow-[var(--al-cyan-glow-strong)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {actionLabels.approve}
            </button>
          ) : null}
          {showChanges ? (
            <button
              type="button"
              onClick={() => submitDecision("changes_requested")}
              disabled={saving}
              className="al-glass-subtle rounded-2xl px-4 py-3.5 text-sm font-semibold text-[var(--al-text-primary)] transition hover:border-[var(--al-border-hover)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {actionLabels.changes}
            </button>
          ) : null}
          {showBlocked ? (
            <button
              type="button"
              onClick={() => submitDecision("blocked_vendor_session")}
              disabled={saving}
              className="al-gemstone-red rounded-2xl px-4 py-3.5 text-sm font-semibold transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {actionLabels.blocked}
            </button>
          ) : null}
          {showResume ? (
            <button
              type="button"
              onClick={() => submitDecision("resume_local_session_required")}
              disabled={saving}
              className="al-glass-subtle rounded-2xl px-4 py-3.5 text-sm font-semibold text-[var(--al-text-primary)] transition hover:border-[var(--al-border-hover)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {actionLabels.resume}
            </button>
          ) : null}
          {showClose ? (
            <button
              type="button"
              onClick={() => submitDecision("close_presentation")}
              disabled={saving}
              className="al-gemstone-neutral col-span-2 rounded-2xl px-4 py-3.5 text-sm font-semibold transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 sm:col-auto"
            >
              {actionLabels.close}
            </button>
          ) : null}
          {showReject ? (
            <button
              type="button"
              onClick={() => submitDecision("reject_presentation")}
              disabled={saving}
              className="al-gemstone-amber rounded-2xl px-4 py-3.5 text-sm font-semibold transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {actionLabels.reject}
            </button>
          ) : null}
          {showRemove ? (
            <button
              type="button"
              onClick={() => submitDecision("delete_presentation")}
              disabled={saving}
              className="al-gemstone-red rounded-2xl px-4 py-3.5 text-sm font-semibold transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {actionLabels.remove}
            </button>
          ) : null}
        </div>
      )}

      {showAlternatives && !terminalState ? (
        <div className="mt-6 al-glass-subtle al-inner-light rounded-2xl p-4">
          <p className="text-sm font-semibold text-[var(--al-text-primary)]">Alternate option</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <select
              value={selectedAlternative}
              onChange={(event) => setSelectedAlternative(event.target.value)}
              className="al-glass-recessed min-w-[240px] rounded-xl px-3 py-2 text-sm text-[var(--al-text-primary)] outline-none"
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
              className="al-glass-subtle rounded-xl px-4 py-2 text-sm font-semibold text-[var(--al-text-primary)] transition hover:border-[var(--al-border-hover)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {actionLabels.alternate}
            </button>
          </div>
        </div>
      ) : null}

      {!terminalState ? (
        <label className="mt-6 block text-sm font-medium text-[var(--al-text-secondary)]">
          {actionLabels.note}
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={2}
            placeholder={actionLabels.notePlaceholder}
            className="al-glass-recessed mt-2 w-full rounded-2xl px-4 py-3 text-sm text-[var(--al-text-primary)] outline-none transition focus:border-[var(--al-border-active)]"
          />
        </label>
      ) : null}

      {followUp ? (
        <div className="mt-6 al-gemstone-indigo rounded-2xl p-4">
          <p className="al-text-mono-label text-[var(--al-indigo)]">
            Follow-up created
          </p>
          <p className="mt-2 text-sm font-semibold text-[var(--al-text-primary)]">{followUp.title}</p>
          <p className="mt-2 text-sm leading-6 text-[var(--al-text-secondary)]">{followUp.details}</p>
          <p className="mt-3 al-text-mono-label text-[var(--al-text-tertiary)]">
            Assigned to {followUp.assigned_to === "al" ? "AL" : "Dez"}{followUp.created_at ? ` • ${new Date(followUp.created_at).toLocaleString()}` : ""}
          </p>
        </div>
      ) : null}

      {statusMessage ? (
        <p className="mt-4 text-sm text-[var(--al-text-secondary)]">{statusMessage}</p>
      ) : null}
    </section>
  );
}
