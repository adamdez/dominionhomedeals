"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { Building2, Phone, Mail, TriangleAlert } from "lucide-react";
import { withAlAppPrefix } from "@/lib/al-app-path";
import type {
  DominionLeadDashboard,
  DominionLeadHealth,
  DominionLeadOwner,
  DominionLeadRecord,
  DominionLeadStatus,
} from "@/lib/dominion-leads";

type LeadDraft = {
  owner: DominionLeadRecord["owner"];
  status: DominionLeadRecord["status"];
  nextActionDueDate: string;
  notes: string;
};

function formatTimestamp(value: string | null) {
  return value ? new Date(value).toLocaleString() : "Not logged";
}

function statusTone(status: DominionLeadStatus, isStale: boolean) {
  if (status === "won") {
    return "border-emerald-500/25 bg-emerald-500/10 text-emerald-100";
  }
  if (status === "lost") {
    return "border-zinc-500/25 bg-zinc-500/10 text-zinc-100";
  }
  if (isStale) {
    return "border-red-500/25 bg-red-500/10 text-red-100";
  }
  if (status === "under_contract") {
    return "border-sky-500/25 bg-sky-500/10 text-sky-100";
  }
  return "border-amber-500/25 bg-amber-500/10 text-amber-100";
}

function statusLabel(status: DominionLeadStatus) {
  return status.replace(/_/g, " ");
}

function ownerLabel(owner: DominionLeadOwner) {
  switch (owner) {
    case "al":
      return "AL";
    case "dez":
      return "Dez";
    case "logan":
      return "Logan";
    default:
      return "Unassigned";
  }
}

function buildDraft(record: DominionLeadRecord): LeadDraft {
  return {
    owner: record.owner,
    status: record.status,
    nextActionDueDate: record.nextActionDueDate || "",
    notes: record.notes || "",
  };
}

export function DominionLeadsPage({
  initialDashboard,
}: {
  initialDashboard: DominionLeadDashboard;
}) {
  const pathname = usePathname();
  const [dashboard, setDashboard] = useState(initialDashboard);
  const [drafts, setDrafts] = useState<Record<number, LeadDraft>>(() =>
    Object.fromEntries(
      initialDashboard.leads.map((entry) => [entry.record.id, buildDraft(entry.record)]),
    ),
  );
  const [savingId, setSavingId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Record<number, string>>({});

  const counts = useMemo(
    () => ({
      open: dashboard.openLeads,
      stale: dashboard.staleLeads,
      working: dashboard.workingLeads,
      untouched: dashboard.untouchedLeads,
    }),
    [dashboard],
  );

  function applyDashboard(nextDashboard: DominionLeadDashboard) {
    setDashboard(nextDashboard);
    setDrafts((current) => ({
      ...current,
      ...Object.fromEntries(
        nextDashboard.leads.map((entry) => [entry.record.id, buildDraft(entry.record)]),
      ),
    }));
  }

  async function refreshDashboard() {
    const response = await fetch("/api/al/dominion/leads?limit=24", {
      credentials: "same-origin",
    });
    const payload = (await response.json()) as {
      ok?: boolean;
      dashboard?: DominionLeadDashboard;
      error?: string;
    };

    if (!response.ok || !payload.ok || !payload.dashboard) {
      throw new Error(payload.error || "Could not refresh Dominion lead dashboard.");
    }

    applyDashboard(payload.dashboard);
  }

  function setDraftValue(id: number, key: keyof LeadDraft, value: string) {
    setDrafts((current) => ({
      ...current,
      [id]: {
        ...(current[id] || { owner: "unassigned", status: "new", nextActionDueDate: "", notes: "" }),
        [key]: value,
      },
    }));
  }

  async function saveLead(id: number, markTouchedNow = false) {
    const draft = drafts[id];
    if (!draft) return;

    setSavingId(id);
    setMessages((current) => ({ ...current, [id]: "" }));

    try {
      const response = await fetch(`/api/al/dominion/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          owner: draft.owner,
          status: draft.status,
          nextActionDueDate: draft.nextActionDueDate || null,
          notes: draft.notes,
          markTouchedNow,
        }),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
        lead?: DominionLeadRecord;
        health?: DominionLeadHealth;
      };

      if (!response.ok || !payload.ok || !payload.lead || !payload.health) {
        throw new Error(payload.error || "Could not save lead update.");
      }

      try {
        await refreshDashboard();
      } catch {
        setDashboard((current) => ({
          ...current,
          generatedAt: new Date().toISOString(),
          leads: current.leads.map((entry) =>
            entry.record.id === id
              ? {
                  record: payload.lead as DominionLeadRecord,
                  health: payload.health as DominionLeadHealth,
                }
              : entry,
          ),
        }));
        setDrafts((current) => ({
          ...current,
          [id]: buildDraft(payload.lead as DominionLeadRecord),
        }));
      }
      setMessages((current) => ({
        ...current,
        [id]: markTouchedNow
          ? "First touch logged and follow-up trail refreshed."
          : "Lead control updated.",
      }));
    } catch (error) {
      setMessages((current) => ({
        ...current,
        [id]: error instanceof Error ? error.message : "Could not save lead update.",
      }));
    } finally {
      setSavingId(null);
    }
  }

  return (
    <main className="h-full w-full overflow-y-auto bg-[#07100b] px-4 py-5 pb-28 text-[#eaf4ef] sm:px-6 lg:px-8 lg:pb-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300/45">
              Dominion Control
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-[#f3faf6] sm:text-4xl">
              Keep lead follow-up real
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-emerald-100/70 sm:text-base">
              Website leads should not die in inboxes, text threads, or someone&apos;s memory. This view keeps first touch, next action, and ownership visible inside the same AL truth system.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href={withAlAppPrefix(pathname, "/attention")}
              className="rounded-2xl border border-emerald-900/25 bg-[#101714] px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:border-emerald-500/40"
            >
              Open Attention
            </Link>
            <Link
              href={withAlAppPrefix(pathname, "/planner")}
              className="rounded-2xl border border-emerald-900/25 bg-[#101714] px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:border-emerald-500/40"
            >
              Open Planner
            </Link>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-emerald-900/20 bg-[#101714] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300/45">Open leads</p>
            <p className="mt-3 text-3xl font-semibold text-[#f3faf6]">{counts.open}</p>
            <p className="mt-2 text-sm text-emerald-100/65">Leads still needing active follow-through.</p>
          </div>
          <div className="rounded-3xl border border-red-500/15 bg-[#101714] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-200/70">Stale leads</p>
            <p className="mt-3 text-3xl font-semibold text-red-100">{counts.stale}</p>
            <p className="mt-2 text-sm text-red-100/70">These need a human move, not another notification.</p>
          </div>
          <div className="rounded-3xl border border-amber-500/15 bg-[#101714] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200/70">Untouched</p>
            <p className="mt-3 text-3xl font-semibold text-amber-100">{counts.untouched}</p>
            <p className="mt-2 text-sm text-amber-100/70">New leads with no first touch logged yet.</p>
          </div>
          <div className="rounded-3xl border border-sky-500/15 bg-[#101714] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-200/70">Working</p>
            <p className="mt-3 text-3xl font-semibold text-sky-100">{counts.working}</p>
            <p className="mt-2 text-sm text-sky-100/70">Leads still in motion after first contact.</p>
          </div>
        </section>

        <section className="rounded-3xl border border-emerald-900/20 bg-[#101714] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.22)] sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300/45">
                Lead queue
              </p>
              <p className="mt-2 text-sm leading-6 text-emerald-100/65">
                Most recent leads first, with stale and untouched items pushed to the surface.
              </p>
            </div>
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-100">
              Built {formatTimestamp(dashboard.generatedAt)}
            </span>
          </div>

          <div className="mt-5 space-y-4">
            {dashboard.leads.length > 0 ? (
              dashboard.leads.map((entry) => {
                const { record, health } = entry;
                const draft = drafts[record.id] || buildDraft(record);
                const tone = statusTone(record.status, health.isStale);
                const isSaving = savingId === record.id;

                return (
                  <article
                    key={record.id}
                    id={`lead-${record.id}`}
                    className="rounded-3xl border border-emerald-900/20 bg-[#0b110e] p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] ${tone}`}>
                            {statusLabel(record.status)}
                          </span>
                          <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-emerald-100">
                            {ownerLabel(record.owner)}
                          </span>
                          {health.isStale ? (
                            <span className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-red-100">
                              Stale
                            </span>
                          ) : null}
                        </div>
                        <h2 className="mt-3 text-2xl font-semibold text-[#f3faf6]">
                          {record.fullName}
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-emerald-100/70">
                          {record.address}
                          {record.city ? ` - ${record.city}, ${record.state} ${record.zip}` : ""}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-3 text-sm text-emerald-100/70">
                          {record.phone ? (
                            <a href={`tel:${record.phone}`} className="inline-flex items-center gap-2 hover:text-emerald-50">
                              <Phone className="h-4 w-4" />
                              {record.phone}
                            </a>
                          ) : null}
                          {record.email ? (
                            <a href={`mailto:${record.email}`} className="inline-flex items-center gap-2 hover:text-emerald-50">
                              <Mail className="h-4 w-4" />
                              {record.email}
                            </a>
                          ) : null}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-emerald-900/20 bg-[#101714] px-4 py-3 text-sm text-emerald-100/70">
                        <p><strong className="text-emerald-100">Submitted:</strong> {formatTimestamp(record.submittedAt)}</p>
                        <p className="mt-2"><strong className="text-emerald-100">Timeline:</strong> {record.timeline || "Not captured"}</p>
                        <p className="mt-2"><strong className="text-emerald-100">Condition:</strong> {record.condition || "Not captured"}</p>
                      </div>
                    </div>

                    {health.staleReason ? (
                      <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm leading-6 text-red-100/85">
                        <div className="flex items-start gap-2">
                          <TriangleAlert className="mt-1 h-4 w-4 shrink-0" />
                          <p>{health.staleReason}</p>
                        </div>
                      </div>
                    ) : null}

                    <div className="mt-4 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-2xl border border-emerald-900/20 bg-[#101714] p-4">
                          <label className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/45">
                            Owner
                          </label>
                          <select
                            value={draft.owner}
                            onChange={(event) => setDraftValue(record.id, "owner", event.target.value)}
                            className="mt-3 w-full rounded-2xl border border-emerald-900/25 bg-[#0b110e] px-4 py-3 text-sm text-[#f3faf6] outline-none"
                          >
                            <option value="unassigned">Unassigned</option>
                            <option value="dez">Dez</option>
                            <option value="al">AL</option>
                            <option value="logan">Logan</option>
                          </select>
                        </div>

                        <div className="rounded-2xl border border-emerald-900/20 bg-[#101714] p-4">
                          <label className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/45">
                            Status
                          </label>
                          <select
                            value={draft.status}
                            onChange={(event) => setDraftValue(record.id, "status", event.target.value)}
                            className="mt-3 w-full rounded-2xl border border-emerald-900/25 bg-[#0b110e] px-4 py-3 text-sm text-[#f3faf6] outline-none"
                          >
                            <option value="new">New</option>
                            <option value="working">Working</option>
                            <option value="under_contract">Under contract</option>
                            <option value="won">Won</option>
                            <option value="lost">Lost</option>
                          </select>
                        </div>

                        <div className="rounded-2xl border border-emerald-900/20 bg-[#101714] p-4">
                          <label className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/45">
                            Next action due
                          </label>
                          <input
                            type="date"
                            value={draft.nextActionDueDate}
                            onChange={(event) => setDraftValue(record.id, "nextActionDueDate", event.target.value)}
                            className="mt-3 w-full rounded-2xl border border-emerald-900/25 bg-[#0b110e] px-4 py-3 text-sm text-[#f3faf6] outline-none"
                          />
                        </div>

                        <div className="rounded-2xl border border-emerald-900/20 bg-[#101714] p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/45">
                            Logged movement
                          </p>
                          <div className="mt-3 space-y-2 text-sm text-emerald-100/70">
                            <p><strong className="text-emerald-100">First touch:</strong> {formatTimestamp(record.firstTouchAt)}</p>
                            <p><strong className="text-emerald-100">Last action:</strong> {formatTimestamp(record.lastActionAt)}</p>
                            <p><strong className="text-emerald-100">Planner trail:</strong> {record.plannerTaskId ? `Task #${record.plannerTaskId}` : "Will be created automatically while lead stays open."}</p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-emerald-900/20 bg-[#101714] p-4">
                        <label className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/45">
                          Notes
                        </label>
                        <textarea
                          value={draft.notes}
                          onChange={(event) => setDraftValue(record.id, "notes", event.target.value)}
                          rows={8}
                          placeholder="What happened, what is next, and what should the team know?"
                          className="mt-3 w-full rounded-2xl border border-emerald-900/25 bg-[#0b110e] px-4 py-3 text-sm leading-6 text-[#f3faf6] outline-none"
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      {!record.firstTouchAt && record.status !== "won" && record.status !== "lost" ? (
                        <button
                          type="button"
                          onClick={() => saveLead(record.id, true)}
                          disabled={isSaving}
                          className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-[#05110b] transition hover:bg-emerald-400 disabled:opacity-60"
                        >
                          {isSaving ? "Saving..." : "Mark first touch now"}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => saveLead(record.id)}
                        disabled={isSaving}
                        className="rounded-2xl border border-emerald-900/25 bg-[#101714] px-5 py-3 text-sm font-semibold text-emerald-100 transition hover:border-emerald-500/40 disabled:opacity-60"
                      >
                        {isSaving ? "Saving..." : "Save lead control"}
                      </button>
                      <a
                        href={withAlAppPrefix(pathname, "/planner")}
                        className="rounded-2xl border border-emerald-900/25 bg-[#101714] px-5 py-3 text-sm font-semibold text-emerald-100 transition hover:border-emerald-500/40"
                      >
                        Open Planner
                      </a>
                      {messages[record.id] ? (
                        <p className="text-sm text-emerald-100/75">{messages[record.id]}</p>
                      ) : null}
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="rounded-3xl border border-emerald-900/20 bg-[#0b110e] p-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-100">
                  <Building2 className="h-6 w-6" />
                </div>
                <h2 className="mt-4 text-2xl font-semibold text-[#f3faf6]">No Dominion leads recorded yet</h2>
                <p className="mt-3 text-sm leading-6 text-emerald-100/65">
                  New website submissions will land here automatically once the lead route records them into AL memory.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
