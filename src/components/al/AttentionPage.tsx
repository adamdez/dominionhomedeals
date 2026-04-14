import Link from "next/link";
import type { AttentionBrief } from "@/lib/al-attention-brief";

function sectionTone(owner: "Dez" | "AL" | "System") {
  if (owner === "System") {
    return { badge: "al-gemstone-red", title: "text-[var(--al-red)]" };
  }
  if (owner === "AL") {
    return { badge: "al-gemstone-cyan", title: "text-[var(--al-cyan)]" };
  }
  return { badge: "al-gemstone-amber", title: "text-[var(--al-amber)]" };
}

function formatGeneratedAt(value: string) {
  return new Date(value).toLocaleString();
}

export function AttentionPage({
  brief,
  commandCenterPath,
}: {
  brief: AttentionBrief;
  commandCenterPath: string;
}) {
  const sections = [
    {
      title: "Waiting on Dez",
      owner: "Dez" as const,
      empty: "Nothing is actively waiting on Dez right now.",
      items: brief.waitingOnDez,
    },
    {
      title: "Waiting on AL",
      owner: "AL" as const,
      empty: "Nothing is actively waiting on AL right now.",
      items: brief.waitingOnAl,
    },
    {
      title: "Blocked Systems",
      owner: "System" as const,
      empty: "No blocked systems are in the top attention set right now.",
      items: brief.blockedSystems,
    },
  ];

  return (
    <main className="h-full w-full overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="al-text-mono-label text-[var(--al-cyan-muted)]">
              Attention Brief
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-[var(--al-text-primary)] sm:text-4xl">
              What actually needs attention
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--al-text-secondary)] sm:text-base">
              This is the tight morning-style brief from Planner and Board Room truth. It should tell you what is waiting on Dez, what is waiting on AL, what is blocked, and what the next move should be.
            </p>
          </div>
          <Link
            href={commandCenterPath}
            className="rounded-2xl al-glass-subtle px-4 py-3 text-sm font-semibold text-[var(--al-text-primary)] transition hover:border-[var(--al-border-hover)]"
          >
            Back to Command Center
          </Link>
        </div>

        <section className="al-glass-card al-specular rounded-3xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="al-text-mono-label text-[var(--al-cyan-muted)]">
                Top next move
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-[var(--al-text-primary)]">
                {brief.topNextMove}
              </h2>
            </div>
            <span className="al-gemstone-cyan rounded-full px-4 py-2 text-sm font-semibold">
              Built {formatGeneratedAt(brief.generatedAt)}
            </span>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          {sections.map((section) => {
            const tone = sectionTone(section.owner);
            return (
              <div
                key={section.title}
                className="al-glass-card al-inner-light rounded-3xl p-6"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className={`al-text-mono-label ${tone.title}`}>
                      {section.title}
                    </p>
                    <h2 className="mt-3 text-2xl font-semibold text-[var(--al-text-primary)]">
                      {section.items.length}
                    </h2>
                  </div>
                  <span className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] ${tone.badge}`}>
                    {section.owner}
                  </span>
                </div>
                <div className="mt-5 space-y-3">
                  {section.items.length > 0 ? (
                    section.items.map((item) => (
                      <article
                        key={`${section.title}-${item.href}-${item.title}`}
                        className="al-glass-subtle al-inner-light rounded-2xl p-4"
                      >
                        <p className="text-base font-semibold text-[var(--al-text-primary)]">{item.title}</p>
                        <p className="mt-2 text-sm leading-6 text-[var(--al-text-secondary)]">{item.reason}</p>
                        <div className="mt-4">
                          <a
                            href={item.href}
                            className="al-specular-button rounded-2xl bg-[var(--al-cyan)] px-4 py-3 text-sm font-semibold text-[var(--al-void)] transition hover:shadow-[var(--al-cyan-glow-strong)]"
                          >
                            Open item
                          </a>
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="al-glass-recessed rounded-2xl p-4 text-sm leading-6 text-[var(--al-text-tertiary)]">
                      {section.empty}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}
