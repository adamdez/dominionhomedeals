import Link from "next/link";
import type { AttentionBrief } from "@/lib/al-attention-brief";

function sectionTone(owner: "Dez" | "AL" | "System") {
  if (owner === "System") {
    return {
      badge: "border-red-500/20 bg-red-500/10 text-red-100",
      title: "text-red-100",
    };
  }
  if (owner === "AL") {
    return {
      badge: "border-sky-500/20 bg-sky-500/10 text-sky-100",
      title: "text-sky-100",
    };
  }
  return {
    badge: "border-amber-500/20 bg-amber-500/10 text-amber-100",
    title: "text-amber-100",
  };
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
    <main className="h-full w-full overflow-y-auto bg-[#07100b] px-4 py-6 text-[#eaf4ef] sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300/45">
              Attention Brief
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-[#f3faf6] sm:text-4xl">
              What actually needs attention
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-emerald-100/70 sm:text-base">
              This is the tight morning-style brief from Planner and Board Room truth. It should tell you what is waiting on Dez, what is waiting on AL, what is blocked, and what the next move should be.
            </p>
          </div>
          <Link
            href={commandCenterPath}
            className="rounded-2xl border border-emerald-900/25 bg-[#101714] px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:border-emerald-500/40"
          >
            Back to Command Center
          </Link>
        </div>

        <section className="rounded-3xl border border-emerald-900/20 bg-[#101714] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300/45">
                Top next move
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[#f3faf6]">
                {brief.topNextMove}
              </h2>
            </div>
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200">
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
                className="rounded-3xl border border-emerald-900/20 bg-[#101714] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${tone.title}`}>
                      {section.title}
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-[#f3faf6]">
                      {section.items.length}
                    </h2>
                  </div>
                  <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] ${tone.badge}`}>
                    {section.owner}
                  </span>
                </div>
                <div className="mt-5 space-y-3">
                  {section.items.length > 0 ? (
                    section.items.map((item) => (
                      <article
                        key={`${section.title}-${item.href}-${item.title}`}
                        className="rounded-2xl border border-emerald-900/20 bg-[#0b110e] p-4"
                      >
                        <p className="text-base font-semibold text-[#f3faf6]">{item.title}</p>
                        <p className="mt-2 text-sm leading-6 text-emerald-100/70">{item.reason}</p>
                        <div className="mt-4">
                          <a
                            href={item.href}
                            className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-[#05110b] transition hover:bg-emerald-400"
                          >
                            Open item
                          </a>
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-emerald-900/20 bg-[#0b110e] p-4 text-sm leading-6 text-emerald-100/60">
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
