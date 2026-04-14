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
  if (status === "won") return "al-gemstone-green";
  if (status === "lost") return "al-gemstone-neutral";
  if (isStale) return "al-gemstone-red";
  if (status === "under_contract") return "al-gemstone-cyan";
  return "al-gemstone-amber";
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
    <main className="h-full w-full overflow-y-auto px-4 py-5 pb-28 sm:px-6 lg:px-8 lg:pb-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="al-text-mono-label text-[var(--al-cyan-muted)]">
              Dominion Control
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-[var(--al-text-primary)] sm:text-4xl">
              Keep lead follow-up real
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--al-text-secondary)] sm:text-base">
              Website leads should not die in inboxes, text threads, or someone&apos;s memory. This view keeps first touch, next action, and ownership visible inside the same AL truth system.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href={withAlAppPrefix(pathname, "/attention")}
              className="rounded-2xl al-glass-subtle px-4 py-3 text-sm font-semibold text-[var(--al-text-primary)] transition hover:border-[var(--al-border-hover)]"
            >
              Open Attention
            </Link>
            <Link
              href={withAlAppPrefix(pathname, "/planner")}
              className="rounded-2xl al-glass-subtle px-4 py-3 text-sm font-semibold text-[var(--al-text-primary)] transition hover:border-[var(--al-border-hover)]"
            >
              Open Planner
            </Link>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="al-glass-card al-specular rounded-3xl p-5">
            <p className="al-text-mono-label text-[var(--al-cyan-muted)]">Open leads</p>
            <p className="mt-3 text-3xl font-semibold text-[var(--al-text-primary)] al-glow-metric">{counts.open}</p>
            <p className="mt-2 text-sm text-[var(--al-text-secondary)]">Leads still needing active follow-through.</p>
          </div>
          <div className="al-glass-card al-inner-light rounded-3xl p-5">
            <p className="al-text-mono-label text-[var(--al-red)]">Stale leads</p>
            <p className="mt-3 text-3xl font-semibold text-[var(--al-text-primary)]">{counts.stale}</p>
            <p className="mt-2 text-sm text-[var(--al-text-secondary)]">These need a human move, not another notification.</p>
          </div>
          <div className="al-glass-card al-inner-light rounded-3xl p-5">
            <p className="al-text-mono-label text-[var(--al-amber)]">Untouched</p>
            <p className="mt-3 text-3xl font-semibold text-[var(--al-text-primary)]">{counts.untouched}</p>
            <p className="mt-2 text-sm text-[var(--al-text-secondary)]">New leads with no first touch logged yet.</p>
          </div>
          <div className="al-glass-card al-inner-light rounded-3xl p-5">
            <p className="al-text-mono-label text-[var(--al-indigo)]">Working</p>
            <p className="mt-3 text-3xl font-semibold text-[var(--al-text-primary)]">{counts.working}</p>
            <p className="mt-2 text-sm text-[var(--al-text-secondary)]">Leads still in motion after first contact.</p>
          </div>
        </section>

        <section className="al-glass-card al-specular rounded-3xl p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="al-text-mono-label text-[var(--al-cyan-muted)]">
                Lead queue
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--al-text-secondary)]">
                Most recent leads first, with stale and untouched items pushed to the surface.
              </p>
            </div>
            <span className="al-gemstone-cyan rounded-full px-4 py-2 text-sm font-semibold">
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
                    className="al-glass-subtle al-inner-light rounded-3xl p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] ${tone}`}>
                            {statusLabel(record.status)}
                          </span>
                          <span className="al-gemstone-cyan rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em]">
                            {ownerLabel(record.owner)}
                          </span>
                          {health.isStale ? (
                            <span className="al-gemstone-red rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em]">
                              Stale
                            </span>
                          ) : null}
                        </div>
                        <h2 className="mt-3 text-2xl font-semibold text-[var(--al-text-primary)]">
                          {record.fullName}
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-[var(--al-text-secondary)]">
                          {record.address}
                          {record.city ? ` - ${record.city}, ${record.state} ${record.zip}` : ""}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-3 text-sm text-[var(--al-text-secondary)]">
                          {record.phone ? (
                            <a href={`tel:${record.phone}`} className="inline-flex items-center gap-2 hover:text-[var(--al-text-primary)]">
                              <Phone className="h-4 w-4" />
                              {record.phone}
                            </a>
                          ) : null}
                          {record.email ? (
                            <a href={`mailto:${record.email}`} className="inline-flex items-center gap-2 hover:text-[var(--al-text-primary)]">
                              <Mail className="h-4 w-4" />
                              {record.email}
                            </a>
                          ) : null}
                        </div>
                      </div>

                      <div className="al-glass-recessed rounded-2xl px-4 py-3 text-sm text-[var(--al-text-secondary)]">
                        <p><strong className="text-[var(--al-text-primary)]">Submitted:</strong> {formatTimestamp(record.submittedAt)}</p>
                        <p className="mt-2"><strong className="text-[var(--al-text-primary)]">Timeline:</strong> {record.timeline || "Not captured"}</p>
                        <p className="mt-2"><strong className="text-[var(--al-text-primary)]">Condition:</strong> {record.condition || "Not captured"}</p>
                      </div>
                    </div>

                    {health.staleReason ? (
                      <div className="mt-4 al-gemstone-red rounded-2xl p-4 text-sm leading-6">
                        <div className="flex items-start gap-2">
                          <TriangleAlert className="mt-1 h-4 w-4 shrink-0" />
                          <p>{health.staleReason}</p>
                        </div>
                      </div>
                    ) : null}

                    <div className="mt-4 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="al-glass-recessed rounded-2xl p-4">
                          <label className="al-text-mono-label text-[var(--al-cyan-muted)]">
                            Owner
                          </label>
                          <select
                            value={draft.owner}
                            onChange={(event) => setDraftValue(record.id, "owner", event.target.value)}
                            className="mt-3 w-full rounded-2xl al-glass-recessed px-4 py-3 text-sm text-[var(--al-text-primary)] outline-none focus:border-[var(--al-border-active)]"
                          >
                            <option value="unassigned">Unassigned</option>
                            <option value="dez">Dez</option>
                            <option value="al">AL</option>
                            <option value="logan">Logan</option>
                          </select>
                        </div>

                        <div className="al-glass-recessed rounded-2xl p-4">
                          <label className="al-text-mono-label text-[var(--al-cyan-muted)]">
                            Status
                          </label>
                          <select
                            value={draft.status}
                            onChange={(event) => setDraftValue(record.id, "status", event.target.value)}
                            className="mt-3 w-full rounded-2xl al-glass-recessed px-4 py-3 text-sm text-[var(--al-text-primary)] outline-none focus:border-[var(--al-border-active)]"
                          >
                            <option value="new">New</option>
                            <option value="working">Working</option>
                            <option value="under_contract">Under contract</option>
                            <option value="won">Won</option>
                            <option value="lost">Lost</option>
                          </select>
                        </div>

                        <div className="al-glass-recessed rounded-2xl p-4">
                          <label className="al-text-mono-label text-[var(--al-cyan-muted)]">
                            Next action due
                          </label>
                          <input
                            type="date"
                            value={draft.nextActionDueDate}
                            onChange={(event) => setDraftValue(record.id, "nextActionDueDate", event.target.value)}
                            className="mt-3 w-full rounded-2xl al-glass-recessed px-4 py-3 text-sm text-[var(--al-text-primary)] outline-none focus:border-[var(--al-border-active)]"
                          />
                        </div>

                        <div className="al-glass-recessed rounded-2xl p-4">
                          <p className="al-text-mono-label text-[var(--al-cyan-muted)]">
                            Logged movement
                          </p>
                          <div className="mt-3 space-y-2 text-sm text-[var(--al-text-secondary)]">
                            <p><strong className="text-[var(--al-text-primary)]">First touch:</strong> {formatTimestamp(record.firstTouchAt)}</p>
                            <p><strong className="text-[var(--al-text-primary)]">Last action:</strong> {formatTimestamp(record.lastActionAt)}</p>
                            <p><strong className="text-[var(--al-text-primary)]">Planner trail:</strong> {record.plannerTaskId ? `Task #${record.plannerTaskId}` : "Will be created automatically while lead stays open."}</p>
                          </div>
                        </div>
                      </div>

                      <div className="al-glass-recessed rounded-2xl p-4">
                        <label className="al-text-mono-label text-[var(--al-cyan-muted)]">
                          Notes
                        </label>
                        <textarea
                          value={draft.notes}
                          onChange={(event) => setDraftValue(record.id, "notes", event.target.value)}
                          rows={8}
                          placeholder="What happened, what is next, and what should the team know?"
                          className="mt-3 w-full rounded-2xl al-glass-recessed px-4 py-3 text-sm leading-6 text-[var(--al-text-primary)] placeholder-[var(--al-text-ghost)] outline-none focus:border-[var(--al-border-active)]"
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      {!record.firstTouchAt && record.status !== "won" && record.status !== "lost" ? (
                        <button
                          type="button"
                          onClick={() => saveLead(record.id, true)}
                          disabled={isSaving}
                          className="al-specular-button rounded-2xl bg-[var(--al-cyan)] px-5 py-3 text-sm font-semibold text-[var(--al-void)] transition hover:shadow-[var(--al-cyan-glow-strong)] disabled:opacity-60"
                        >
                          {isSaving ? "Saving..." : "Mark first touch now"}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => saveLead(record.id)}
                        disabled={isSaving}
                        className="rounded-2xl al-glass-subtle px-5 py-3 text-sm font-semibold text-[var(--al-text-primary)] transition hover:border-[var(--al-border-hover)] disabled:opacity-60"
                      >
                        {isSaving ? "Saving..." : "Save lead control"}
                      </button>
                      <a
                        href={withAlAppPrefix(pathname, "/planner")}
                        className="rounded-2xl al-glass-subtle px-5 py-3 text-sm font-semibold text-[var(--al-text-primary)] transition hover:border-[var(--al-border-hover)]"
                      >
                        Open Planner
                      </a>
                      {messages[record.id] ? (
                        <p className="text-sm text-[var(--al-text-secondary)]">{messages[record.id]}</p>
                      ) : null}
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="al-glass-subtle rounded-3xl p-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--al-surface-0)] text-[var(--al-cyan-muted)]">
                  <Building2 className="h-6 w-6" />
                </div>
                <h2 className="mt-4 text-2xl font-semibold text-[var(--al-text-primary)]">No Dominion leads recorded yet</h2>
                <p className="mt-3 text-sm leading-6 text-[var(--al-text-secondary)]">
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
