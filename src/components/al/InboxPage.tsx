"use client";

import { useMemo, useState } from "react";

type InboxItem = {
  id: number;
  title: string;
  body: string;
  status: "queued" | "running" | "done" | "blocked" | "cancelled";
  business: "dominion" | "wrenchready" | "cross-business" | "general";
  lane: "chairman" | "ceo" | "creative" | "systems" | "research" | "follow-through";
  createdBy: string;
  source: string;
  startedAt: string | null;
  completedAt: string | null;
  lastError: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

function labelBusiness(value: InboxItem["business"]) {
  switch (value) {
    case "dominion":
      return "Dominion";
    case "wrenchready":
      return "WrenchReady";
    case "cross-business":
      return "Cross-business";
    default:
      return "General";
  }
}

function labelLane(value: InboxItem["lane"]) {
  switch (value) {
    case "ceo":
      return "CEO";
    case "creative":
      return "Creative";
    case "systems":
      return "Systems";
    case "research":
      return "Research";
    case "follow-through":
      return "Follow-through";
    default:
      return "Chairman";
  }
}

function formatTimestamp(value: string | null) {
  if (!value) return "No timestamp yet";
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function statusTone(status: InboxItem["status"]) {
  switch (status) {
    case "running":
      return "al-gemstone-cyan";
    case "done":
      return "al-gemstone-green";
    case "blocked":
      return "al-gemstone-red";
    case "cancelled":
      return "al-gemstone-neutral";
    default:
      return "al-gemstone-amber";
  }
}

export function InboxPage({ initialItems }: { initialItems: InboxItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const queued = useMemo(() => items.filter((item) => item.status === "queued"), [items]);
  const running = useMemo(() => items.filter((item) => item.status === "running"), [items]);
  const recent = useMemo(
    () => items.filter((item) => item.status !== "queued" && item.status !== "running").slice(0, 12),
    [items],
  );

  async function refreshInbox() {
    const response = await fetch("/api/al/inbox", { credentials: "same-origin" });
    const payload = (await response.json()) as { ok?: boolean; items?: InboxItem[]; error?: string };
    if (!response.ok || !payload.ok || !payload.items) {
      throw new Error(payload.error || "Could not refresh inbox.");
    }
    setItems(payload.items);
  }

  async function createItem() {
    if (!body.trim()) {
      setMessage("Add the ask you want AL to queue.");
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/al/inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body,
          createdBy: "Dez",
          source: "inbox_ui",
        }),
      });
      const payload = (await response.json()) as { ok?: boolean; item?: InboxItem; error?: string };
      if (!response.ok || !payload.ok || !payload.item) {
        throw new Error(payload.error || "Could not queue ask.");
      }
      setItems((current) => [payload.item!, ...current]);
      setBody("");
      setMessage("Ask queued.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not queue ask.");
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(id: number, status: InboxItem["status"]) {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/al/inbox/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const payload = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Could not update inbox item.");
      }
      await refreshInbox();
      setMessage("Inbox updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update inbox item.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="h-full w-full overflow-y-auto px-4 py-5 pb-28 sm:px-6 lg:px-8 lg:pb-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div>
          <p className="al-text-mono-label text-[var(--al-cyan-muted)]">
            AL inbox
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-[var(--al-text-primary)] sm:text-4xl">
            Queue asks without jamming the chat
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--al-text-secondary)] sm:text-base">
            This is the intake queue for AL. Use it when multiple asks are flying at once across Dominion, WrenchReady, and the shared operating lanes, then let the command center drain them one by one instead of forcing you to wait on a single long turn.
          </p>
        </div>

        <section className="al-glass-card al-specular rounded-3xl p-4 sm:p-6">
          <p className="al-text-mono-label text-[var(--al-cyan-muted)]">
            Add an ask
          </p>
          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto]">
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={3}
              placeholder="Queue something for AL without blocking the current turn..."
              className="min-h-[108px] resize-y rounded-2xl al-glass-recessed px-4 py-3.5 text-sm text-[var(--al-text-primary)] placeholder-[var(--al-text-ghost)] outline-none focus:border-[var(--al-border-active)]"
            />
            <button
              type="button"
              onClick={createItem}
              disabled={saving}
              className="al-specular-button rounded-2xl bg-[var(--al-cyan)] px-5 py-3.5 text-sm font-semibold text-[var(--al-void)] transition hover:shadow-[var(--al-cyan-glow-strong)] disabled:opacity-60"
            >
              Queue ask
            </button>
          </div>
          {message ? <p className="mt-4 text-sm text-[var(--al-text-secondary)]">{message}</p> : null}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
          <QueueColumn
            title="Queued"
            description="Ready to hand AL as soon as the active lane clears."
            items={queued}
            empty="No queued asks right now."
            onCancel={(id) => updateStatus(id, "cancelled")}
          />
          <QueueColumn
            title="Running"
            description="Already in motion from the queue."
            items={running}
            empty="Nothing is currently draining from the inbox."
            onCancel={(id) => updateStatus(id, "cancelled")}
          />
        </section>

        <section className="al-glass-card al-inner-light rounded-3xl p-4 sm:p-6">
          <p className="al-text-mono-label text-[var(--al-cyan-muted)]">
            Recent outcomes
          </p>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {recent.length > 0 ? (
              recent.map((item) => (
                <div key={item.id} className="al-glass-subtle al-inner-light rounded-2xl p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${statusTone(item.status)}`}>
                      {item.status}
                    </span>
                    <span className="al-text-mono-label">
                      {labelBusiness(item.business)} · {labelLane(item.lane)}
                    </span>
                  </div>
                  <p className="mt-3 text-base font-semibold text-[var(--al-text-primary)]">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--al-text-secondary)]">{item.body}</p>
                  <p className="mt-3 text-xs text-[var(--al-text-tertiary)]">
                    {item.status === "done" ? "Completed" : item.status === "blocked" ? "Blocked" : "Updated"} {formatTimestamp(item.completedAt || item.updatedAt)}
                  </p>
                  {item.lastError ? (
                    <p className="mt-2 text-sm leading-6 text-[var(--al-red)]">{item.lastError}</p>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="al-glass-recessed rounded-2xl p-4 text-sm text-[var(--al-text-tertiary)]">
                Nothing has been closed from the inbox yet.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function QueueColumn({
  title,
  description,
  items,
  empty,
  onCancel,
}: {
  title: string;
  description: string;
  items: InboxItem[];
  empty: string;
  onCancel: (id: number) => void;
}) {
  return (
    <section className="al-glass-card al-inner-light rounded-3xl p-4 sm:p-6">
      <p className="al-text-mono-label text-[var(--al-cyan-muted)]">
        {title}
      </p>
      <p className="mt-2 text-sm leading-6 text-[var(--al-text-secondary)]">{description}</p>
      <div className="mt-4 space-y-3">
        {items.length > 0 ? (
          items.map((item) => (
            <div key={item.id} className="al-glass-subtle al-inner-light rounded-2xl p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${statusTone(item.status)}`}>
                  {item.status}
                </span>
                <span className="al-text-mono-label">
                  {labelBusiness(item.business)} · {labelLane(item.lane)}
                </span>
              </div>
              <p className="mt-3 text-base font-semibold text-[var(--al-text-primary)]">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--al-text-secondary)]">{item.body}</p>
              <p className="mt-3 text-xs text-[var(--al-text-tertiary)]">
                Queued {formatTimestamp(item.createdAt)} · Updated {formatTimestamp(item.updatedAt)}
              </p>
              {item.lastError ? (
                <p className="mt-2 text-sm leading-6 text-[var(--al-red)]">{item.lastError}</p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onCancel(item.id)}
                  className="al-gemstone-neutral rounded-xl px-3 py-2 text-xs font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="al-glass-recessed rounded-2xl p-4 text-sm text-[var(--al-text-tertiary)]">
            {empty}
          </div>
        )}
      </div>
    </section>
  );
}
