"use client";

import { useMemo, useState } from "react";

type PlannerTask = {
  id: number;
  title: string;
  details: string;
  dueDate: string | null;
  status: "open" | "done" | "cancelled";
  assignedTo: "dez" | "al";
  createdBy: string;
  source: string;
  createdAt: string | null;
  updatedAt: string | null;
};

function formatDueLabel(value: string | null) {
  if (!value) return "No due date";
  return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    weekday: "short",
  });
}

function dayKey(offset: number) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

export function PlannerPage({ initialTasks }: { initialTasks: PlannerTask[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [dueDate, setDueDate] = useState(dayKey(0));
  const [assignedTo, setAssignedTo] = useState<"dez" | "al">("dez");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const weekBuckets = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const key = dayKey(index);
        return {
          key,
          label: formatDueLabel(key),
          tasks: tasks.filter((task) => task.status === "open" && task.dueDate === key),
        };
      }),
    [tasks],
  );

  const dezTasks = tasks.filter((task) => task.status === "open" && task.assignedTo === "dez");
  const alTasks = tasks.filter((task) => task.status === "open" && task.assignedTo === "al");
  const closedTasks = tasks.filter((task) => task.status !== "open").slice(0, 12);

  async function createTask() {
    if (!title.trim()) {
      setMessage("Task title is required.");
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/al/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          details,
          dueDate: dueDate || null,
          assignedTo,
          createdBy: "Dez",
          source: "planner_ui",
        }),
      });
      const payload = (await response.json()) as { ok?: boolean; error?: string; task?: PlannerTask };
      if (!response.ok || !payload.ok || !payload.task) {
        throw new Error(payload.error || "Could not create planner task.");
      }
      setTasks((current) => [payload.task!, ...current]);
      setTitle("");
      setDetails("");
      setAssignedTo("dez");
      setDueDate(dayKey(0));
      setMessage("Task added.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create planner task.");
    } finally {
      setSaving(false);
    }
  }

  async function updateTask(id: number, updates: Partial<PlannerTask>) {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/al/planner/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const payload = (await response.json()) as { ok?: boolean; error?: string; task?: PlannerTask };
      if (!response.ok || !payload.ok || !payload.task) {
        throw new Error(payload.error || "Could not update task.");
      }
      setTasks((current) => current.map((task) => (task.id === id ? payload.task! : task)));
      setMessage("Task updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update task.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="h-full w-full overflow-y-auto bg-[#07100b] px-4 py-6 text-[#eaf4ef] sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300/45">
            Planner
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-[#f3faf6] sm:text-4xl">
            Shared due dates and to-dos
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-emerald-100/70 sm:text-base">
            Put the next actions here instead of losing them in chat. AL can work from this list, and you can review what is due today, this week, and what is already done.
          </p>
        </div>

        <section className="rounded-3xl border border-emerald-900/20 bg-[#101714] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto]">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Add a task title"
              className="rounded-2xl border border-emerald-900/25 bg-[#0b110e] px-4 py-3 text-sm text-[#eaf4ef] outline-none"
            />
            <input
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              type="date"
              className="rounded-2xl border border-emerald-900/25 bg-[#0b110e] px-4 py-3 text-sm text-[#eaf4ef] outline-none"
            />
            <select
              value={assignedTo}
              onChange={(event) => setAssignedTo(event.target.value as "dez" | "al")}
              className="rounded-2xl border border-emerald-900/25 bg-[#0b110e] px-4 py-3 text-sm text-[#eaf4ef] outline-none"
            >
              <option value="dez">Due for Dez</option>
              <option value="al">Due for AL</option>
            </select>
            <input
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              placeholder="Short note or handoff"
              className="rounded-2xl border border-emerald-900/25 bg-[#0b110e] px-4 py-3 text-sm text-[#eaf4ef] outline-none"
            />
            <button
              type="button"
              onClick={createTask}
              disabled={saving}
              className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-[#05110b] transition hover:bg-emerald-400 disabled:opacity-60"
            >
              Add
            </button>
          </div>
          {message ? <p className="mt-4 text-sm text-emerald-200/80">{message}</p> : null}
        </section>

        <section className="rounded-3xl border border-emerald-900/20 bg-[#101714] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300/45">
            This week
          </p>
          <div className="mt-4 grid gap-4 lg:grid-cols-7">
            {weekBuckets.map((bucket) => (
              <div key={bucket.key} className="rounded-2xl border border-emerald-900/20 bg-[#0b110e] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/45">
                  {bucket.label}
                </p>
                <div className="mt-3 space-y-2">
                  {bucket.tasks.length > 0 ? (
                    bucket.tasks.map((task) => (
                      <div key={task.id} className="rounded-xl bg-[#101714] p-3 text-sm text-emerald-100/80">
                        <p className="font-semibold text-[#f3faf6]">{task.title}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.14em] text-emerald-300/40">
                          {task.assignedTo === "dez" ? "Dez" : "AL"}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-emerald-100/35">No tasks</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          {[
            { title: "Due for Dez", tasks: dezTasks, assignee: "dez" as const },
            { title: "Due for AL", tasks: alTasks, assignee: "al" as const },
          ].map((column) => (
            <div
              key={column.title}
              className="rounded-3xl border border-emerald-900/20 bg-[#101714] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)]"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300/45">
                {column.title}
              </p>
              <div className="mt-4 space-y-3">
                {column.tasks.length > 0 ? (
                  column.tasks.map((task) => (
                    <div key={task.id} className="rounded-2xl border border-emerald-900/20 bg-[#0b110e] p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-semibold text-[#f3faf6]">{task.title}</p>
                          {task.details ? (
                            <p className="mt-2 text-sm leading-6 text-emerald-100/70">{task.details}</p>
                          ) : null}
                        </div>
                        <p className="text-xs uppercase tracking-[0.18em] text-emerald-300/45">
                          {formatDueLabel(task.dueDate)}
                        </p>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => updateTask(task.id, { status: "done" })}
                          disabled={saving}
                          className="rounded-xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-[#05110b]"
                        >
                          Mark done
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateTask(task.id, {
                              assignedTo: task.assignedTo === "dez" ? "al" : "dez",
                            })
                          }
                          disabled={saving}
                          className="rounded-xl border border-emerald-800/40 bg-[#111916] px-3 py-2 text-xs font-semibold text-emerald-100"
                        >
                          Send to {task.assignedTo === "dez" ? "AL" : "Dez"}
                        </button>
                        <button
                          type="button"
                          onClick={() => updateTask(task.id, { status: "cancelled" })}
                          disabled={saving}
                          className="rounded-xl border border-slate-600/40 bg-slate-500/10 px-3 py-2 text-xs font-semibold text-slate-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-emerald-900/20 bg-[#0b110e] p-4 text-sm text-emerald-100/45">
                    No open tasks here.
                  </div>
                )}
              </div>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-emerald-900/20 bg-[#101714] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300/45">
            Closed recently
          </p>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {closedTasks.length > 0 ? (
              closedTasks.map((task) => (
                <div key={task.id} className="rounded-2xl border border-emerald-900/20 bg-[#0b110e] p-4">
                  <p className="font-semibold text-[#f3faf6]">{task.title}</p>
                  <p className="mt-1 text-sm text-emerald-100/55">
                    {task.status} · {task.assignedTo === "dez" ? "Dez" : "AL"} · {formatDueLabel(task.dueDate)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-emerald-100/45">No completed or cancelled tasks yet.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
