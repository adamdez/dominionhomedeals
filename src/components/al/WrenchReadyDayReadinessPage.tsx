"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { withAlAppPrefix } from "@/lib/al-app-path";

type DayReadinessStatus = "ready" | "at_risk" | "blocked";
type DayReadinessRisk = "clear" | "watch" | "blocked";
type DayReadinessOwner = "none" | "al" | "dez" | "simon" | "system";

interface WrenchReadyDayReadinessRecord {
  id: number;
  date: string;
  jobsPlanned: number;
  routeReady: boolean;
  customersConfirmed: boolean;
  partsReady: boolean;
  fluidsReady: boolean;
  toolsReady: boolean;
  paymentRisk: DayReadinessRisk;
  blockerOwner: DayReadinessOwner;
  blockerNote: string;
  notes: string;
  status: DayReadinessStatus;
  plannerTaskId: number | null;
  createdAt: string | null;
  updatedAt: string | null;
}

interface PlannerTaskSummary {
  id: number;
  title: string;
  details: string;
  dueDate: string | null;
  status: "open" | "done" | "cancelled";
  assignedTo: "dez" | "al";
  updatedAt: string | null;
}

function formatDateLabel(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function statusCopy(status: DayReadinessStatus) {
  if (status === "ready") {
    return {
      chip: "Ready",
      tone: "border-emerald-500/25 bg-emerald-500/10 text-emerald-100",
      body: "Tomorrow is protected. Keep the plan tight and avoid late surprises.",
    };
  }
  if (status === "blocked") {
    return {
      chip: "Blocked",
      tone: "border-red-500/25 bg-red-500/10 text-red-100",
      body: "Tomorrow is in danger. A real blocker needs an owner before wrench time starts.",
    };
  }
  return {
    chip: "At Risk",
    tone: "border-amber-500/25 bg-amber-500/10 text-amber-100",
    body: "Tomorrow is not protected yet. Tighten the loose bolts before the day starts.",
  };
}

function deriveFallbackStatus(record: WrenchReadyDayReadinessRecord | null): DayReadinessStatus {
  if (!record) return "at_risk";
  return record.status;
}

function deriveForm(record: WrenchReadyDayReadinessRecord | null, date: string) {
  return {
    date,
    jobsPlanned: record?.jobsPlanned ?? 0,
    routeReady: record?.routeReady ?? false,
    customersConfirmed: record?.customersConfirmed ?? false,
    partsReady: record?.partsReady ?? false,
    fluidsReady: record?.fluidsReady ?? false,
    toolsReady: record?.toolsReady ?? false,
    paymentRisk: record?.paymentRisk ?? "clear",
    blockerOwner: record?.blockerOwner ?? "none",
    blockerNote: record?.blockerNote ?? "",
    notes: record?.notes ?? "",
  };
}

async function fetchPlannerTask(plannerTaskId: number | null) {
  if (!plannerTaskId) return null;
  const response = await fetch("/api/al/planner", { credentials: "same-origin" });
  const payload = (await response.json()) as {
    ok?: boolean;
    tasks?: PlannerTaskSummary[];
  };
  if (!response.ok || !payload.ok || !payload.tasks) {
    return null;
  }
  return payload.tasks.find((task) => task.id === plannerTaskId) || null;
}

export function WrenchReadyDayReadinessPage({
  initialDate,
  initialRecord,
  initialPlannerTask,
  initialSummaryText,
}: {
  initialDate: string;
  initialRecord: WrenchReadyDayReadinessRecord | null;
  initialPlannerTask: PlannerTaskSummary | null;
  initialSummaryText: string;
}) {
  const pathname = usePathname();
  const [record, setRecord] = useState(initialRecord);
  const [plannerTask, setPlannerTask] = useState(initialPlannerTask);
  const [summaryText, setSummaryText] = useState(initialSummaryText);
  const [form, setForm] = useState(() => deriveForm(initialRecord, initialDate));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const status = deriveFallbackStatus(record);
  const statusUi = statusCopy(status);
  const checklist = [
    {
      key: "routeReady" as const,
      label: "Route order is ready",
      hint: "Simon should not be sorting the day in the driveway.",
    },
    {
      key: "customersConfirmed" as const,
      label: "Customers are confirmed",
      hint: "No surprise no-shows or fuzzy arrival windows.",
    },
    {
      key: "partsReady" as const,
      label: "Parts are ready",
      hint: "No parts scramble after the day starts.",
    },
    {
      key: "fluidsReady" as const,
      label: "Fluids are ready",
      hint: "Consumables are stocked before wrench time.",
    },
    {
      key: "toolsReady" as const,
      label: "Tools are ready",
      hint: "No avoidable tool chase in the morning.",
    },
  ];

  async function saveReadiness() {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/al/wrenchready/day-readiness", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(form),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
        record?: WrenchReadyDayReadinessRecord;
      };
      if (!response.ok || !payload.ok || !payload.record) {
        throw new Error(payload.error || "Could not save day-readiness.");
      }

      const nextRecord = payload.record;
      setRecord(nextRecord);
      setSummaryText(
        nextRecord.status === "ready"
          ? `Tomorrow is ready for ${nextRecord.jobsPlanned} planned job${nextRecord.jobsPlanned === 1 ? "" : "s"}.`
          : nextRecord.status === "blocked"
            ? `Tomorrow is blocked: ${nextRecord.blockerNote || "readiness issues still need repair."}`
            : `Tomorrow is at risk: ${nextRecord.blockerNote || "one or more readiness checks are still incomplete."}`,
      );
      setPlannerTask(await fetchPlannerTask(nextRecord.plannerTaskId));
      setMessage(
        nextRecord.status === "ready"
          ? "Tomorrow is marked ready and the linked Planner follow-up was reconciled."
          : "Day-readiness saved and linked back into Planner.",
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save day-readiness.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="h-full w-full overflow-y-auto bg-[#07100b] px-4 py-5 pb-28 text-[#eaf4ef] sm:px-6 lg:px-8 lg:pb-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300/45">
              WrenchReady Ops
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-[#f3faf6] sm:text-4xl">
              Protect tomorrow&apos;s wrench time
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-emerald-100/70 sm:text-base">
              Keep the next service day honest before the first truck rolls. This should expose the blocker early, assign an owner, and push real follow-up into Planner when the day is not ready.
            </p>
          </div>
          <Link
            href={withAlAppPrefix(pathname, "/planner")}
            className="rounded-2xl border border-emerald-900/25 bg-[#101714] px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:border-emerald-500/40"
          >
            Open Planner
          </Link>
        </div>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-emerald-900/20 bg-[#101714] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.22)] sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300/45">
                  Service day
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[#f3faf6]">
                  {formatDateLabel(form.date)}
                </h2>
                <p className="mt-2 text-sm leading-6 text-emerald-100/70">{summaryText}</p>
              </div>
              <div className={`rounded-full border px-4 py-2 text-sm font-semibold ${statusUi.tone}`}>
                {statusUi.chip}
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-emerald-900/20 bg-[#0b110e] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/45">
                Operating read
              </p>
              <p className="mt-2 text-sm leading-6 text-emerald-100/75">{statusUi.body}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-2xl border border-emerald-900/20 bg-[#101714] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/45">
                    Jobs planned
                  </p>
                  <input
                    value={form.jobsPlanned}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        jobsPlanned: Math.max(0, Number(event.target.value || 0)),
                      }))
                    }
                    type="number"
                    min={0}
                    className="mt-2 w-full rounded-xl border border-emerald-900/25 bg-[#0b110e] px-3 py-3 text-lg font-semibold text-[#f3faf6] outline-none"
                  />
                </div>
                <div className="rounded-2xl border border-emerald-900/20 bg-[#101714] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/45">
                    Payment risk
                  </p>
                  <select
                    value={form.paymentRisk}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        paymentRisk: event.target.value as DayReadinessRisk,
                      }))
                    }
                    className="mt-2 w-full rounded-xl border border-emerald-900/25 bg-[#0b110e] px-3 py-3 text-sm text-[#f3faf6] outline-none"
                  >
                    <option value="clear">Clear</option>
                    <option value="watch">Watch</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
                <div className="rounded-2xl border border-emerald-900/20 bg-[#101714] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/45">
                    Blocker owner
                  </p>
                  <select
                    value={form.blockerOwner}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        blockerOwner: event.target.value as DayReadinessOwner,
                      }))
                    }
                    className="mt-2 w-full rounded-xl border border-emerald-900/25 bg-[#0b110e] px-3 py-3 text-sm text-[#f3faf6] outline-none"
                  >
                    <option value="none">No owner yet</option>
                    <option value="al">AL</option>
                    <option value="dez">Dez</option>
                    <option value="simon">Simon</option>
                    <option value="system">System</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {checklist.map((item) => (
                <label
                  key={item.key}
                  className="rounded-2xl border border-emerald-900/20 bg-[#0b110e] p-4"
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={form[item.key]}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          [item.key]: event.target.checked,
                        }))
                      }
                      className="mt-1 h-4 w-4 rounded border-emerald-700 bg-[#07100b] text-emerald-500"
                    />
                    <div>
                      <p className="text-sm font-semibold text-[#f3faf6]">{item.label}</p>
                      <p className="mt-1 text-sm leading-6 text-emerald-100/60">{item.hint}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-emerald-900/20 bg-[#0b110e] p-4">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/45">
                  Blocker note
                </label>
                <textarea
                  value={form.blockerNote}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, blockerNote: event.target.value }))
                  }
                  rows={5}
                  placeholder="What specifically is blocking the day?"
                  className="mt-3 w-full rounded-2xl border border-emerald-900/25 bg-[#101714] px-4 py-3 text-sm leading-6 text-[#f3faf6] outline-none"
                />
              </div>
              <div className="rounded-2xl border border-emerald-900/20 bg-[#0b110e] p-4">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/45">
                  Extra notes
                </label>
                <textarea
                  value={form.notes}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, notes: event.target.value }))
                  }
                  rows={5}
                  placeholder="Anything AL or the team should know before the day starts"
                  className="mt-3 w-full rounded-2xl border border-emerald-900/25 bg-[#101714] px-4 py-3 text-sm leading-6 text-[#f3faf6] outline-none"
                />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={saveReadiness}
                disabled={saving}
                className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-[#05110b] transition hover:bg-emerald-400 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save day-readiness"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setForm(deriveForm(record, form.date));
                  setMessage("Reset to the latest saved record.");
                }}
                disabled={saving}
                className="rounded-2xl border border-emerald-900/25 bg-[#101714] px-5 py-3 text-sm font-semibold text-emerald-100 transition hover:border-emerald-500/40 disabled:opacity-60"
              >
                Reset
              </button>
              {message ? <p className="text-sm text-emerald-100/75">{message}</p> : null}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <section className="rounded-3xl border border-emerald-900/20 bg-[#101714] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.22)] sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300/45">
                Why this matters
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[#f3faf6]">
                Simon should start the day turning wrenches
              </h2>
              <div className="mt-4 space-y-3 text-sm leading-6 text-emerald-100/70">
                <p>Bad mornings cost profit twice: once in lost wrench time, and again in customer confidence.</p>
                <p>Use this check to expose whether tomorrow is truly ready, not whether it feels roughly okay.</p>
                <p>If the day is at risk or blocked, AL should create a Planner trail instead of letting the problem stay invisible.</p>
              </div>
            </section>

            <section className="rounded-3xl border border-emerald-900/20 bg-[#101714] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.22)] sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300/45">
                Planner trail
              </p>
              {plannerTask ? (
                <div className="mt-3 rounded-2xl border border-sky-500/20 bg-sky-500/10 p-4">
                  <p className="text-lg font-semibold text-sky-50">{plannerTask.title}</p>
                  <p className="mt-2 text-sm leading-6 text-sky-100/80">
                    {plannerTask.details || "This follow-up tracks what still needs to be repaired before the day starts."}
                  </p>
                  <p className="mt-3 text-xs uppercase tracking-[0.18em] text-sky-200/70">
                    {plannerTask.status} - {plannerTask.assignedTo === "al" ? "AL" : "Dez"}
                    {plannerTask.dueDate ? ` - due ${plannerTask.dueDate}` : ""}
                  </p>
                </div>
              ) : (
                <div className="mt-3 rounded-2xl border border-emerald-900/20 bg-[#0b110e] p-4 text-sm leading-6 text-emerald-100/65">
                  No linked Planner follow-up is open right now. That is fine when the day is ready.
                </div>
              )}
              <div className="mt-4">
                <Link
                  href={withAlAppPrefix(pathname, "/planner")}
                  className="rounded-2xl border border-emerald-900/25 bg-[#0b110e] px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:border-emerald-500/40"
                >
                  Open Planner trail
                </Link>
              </div>
            </section>

            <section className="rounded-3xl border border-emerald-900/20 bg-[#101714] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.22)] sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300/45">
                Saved record
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-emerald-900/20 bg-[#0b110e] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-emerald-300/45">Last updated</p>
                  <p className="mt-2 text-sm text-emerald-100/75">
                    {record?.updatedAt ? new Date(record.updatedAt).toLocaleString() : "No saved record yet"}
                  </p>
                </div>
                <div className="rounded-2xl border border-emerald-900/20 bg-[#0b110e] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-emerald-300/45">Current owner</p>
                  <p className="mt-2 text-sm text-emerald-100/75">
                    {record?.blockerOwner && record.blockerOwner !== "none"
                      ? record.blockerOwner.toUpperCase()
                      : "No blocker owner set"}
                  </p>
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
