"use client";

import { useState } from "react";

interface ReviewDecisionPanelProps {
  jobId: number;
  initialState: string;
  initialNextAction: string;
  alternatives: string[];
}

export function ReviewDecisionPanel({
  jobId,
  initialState,
  initialNextAction,
  alternatives,
}: ReviewDecisionPanelProps) {
  const [reviewState, setReviewState] = useState(initialState);
  const [nextAction, setNextAction] = useState(initialNextAction);
  const [note, setNote] = useState("");
  const [selectedAlternative, setSelectedAlternative] = useState(alternatives[0] || "");
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

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
          }
        | null;

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || `Review update failed (${response.status}).`);
      }

      setReviewState(payload.reviewState || reviewState);
      setNextAction(payload.nextAction || nextAction);
      setStatusMessage("Review decision saved.");
      setNote("");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Review update failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-3xl border border-emerald-900/20 bg-[#101714] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300/45">
            Review Decision
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[#eaf4ef]">
            Approve, request changes, or flag the local session
          </h2>
        </div>
        <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200">
          State: {reviewState}
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-emerald-100/70">{nextAction}</p>

      <label className="mt-5 block text-sm font-medium text-emerald-100/85">
        Operator note
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={4}
          placeholder="Optional note for approval, requested changes, or what broke."
          className="mt-2 w-full rounded-2xl border border-emerald-900/25 bg-[#0b110e] px-4 py-3 text-sm text-[#eaf4ef] outline-none transition focus:border-emerald-500/50"
        />
      </label>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => submitDecision("approved_for_checkout")}
          disabled={saving}
          className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-[#05110b] transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Approve for checkout readiness
        </button>
        <button
          type="button"
          onClick={() => submitDecision("changes_requested")}
          disabled={saving}
          className="rounded-2xl border border-emerald-800/40 bg-[#0b110e] px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:border-emerald-500/45 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Request changes
        </button>
        <button
          type="button"
          onClick={() => submitDecision("resume_local_session_required")}
          disabled={saving}
          className="rounded-2xl border border-emerald-800/40 bg-[#0b110e] px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:border-emerald-500/45 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Resume local session required
        </button>
        <button
          type="button"
          onClick={() => submitDecision("blocked_vendor_session")}
          disabled={saving}
          className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Mark vendor session blocked
        </button>
      </div>

      {alternatives.length > 0 ? (
        <div className="mt-6 rounded-2xl border border-emerald-900/20 bg-[#0b110e] p-4">
          <p className="text-sm font-semibold text-emerald-100">Choose alternate option</p>
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
              Record alternate choice
            </button>
          </div>
        </div>
      ) : null}

      {statusMessage ? (
        <p className="mt-4 text-sm text-emerald-200/80">{statusMessage}</p>
      ) : null}
    </section>
  );
}
