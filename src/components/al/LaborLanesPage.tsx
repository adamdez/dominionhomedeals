import Link from "next/link";
import type { LaborLane, LaborLaneReport, LaborLaneStatus } from "@/lib/al-labor-lanes";

function toneForStatus(status: LaborLaneStatus) {
  if (status === "blocked") {
    return { card: "al-gemstone-red", pill: "al-gemstone-red" };
  }
  if (status === "warning") {
    return { card: "al-gemstone-amber", pill: "al-gemstone-amber" };
  }
  return { card: "al-gemstone-green", pill: "al-gemstone-green" };
}

function statusOrder(status: LaborLaneStatus) {
  if (status === "blocked") return 3;
  if (status === "warning") return 2;
  return 1;
}

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString();
}

function sectionList(title: string, items: string[]) {
  return (
    <div>
      <p className="al-text-mono-label text-[var(--al-cyan-muted)]">
        {title}
      </p>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <div
            key={`${title}-${item}`}
            className="al-glass-recessed rounded-2xl p-3 text-sm leading-6 text-[var(--al-text-secondary)]"
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function laneCard(lane: LaborLane) {
  const tone = toneForStatus(lane.status);

  return (
    <article
      key={lane.id}
      className="al-glass-card al-inner-light rounded-3xl p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="al-text-mono-label text-[var(--al-cyan-muted)]">
            Labor lane
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-[var(--al-text-primary)]">{lane.title}</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--al-text-secondary)]">{lane.coverage}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] ${tone.pill}`}
        >
          {lane.status}
        </span>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <div className={`rounded-2xl p-4 ${tone.card}`}>
            <p className="text-sm font-semibold leading-6">{lane.summary}</p>
          </div>
          <div className="mt-4 al-glass-subtle al-inner-light rounded-2xl p-4">
            <p className="al-text-mono-label text-[var(--al-cyan-muted)]">
              Owner and next move
            </p>
            <p className="mt-3 text-sm font-semibold text-[var(--al-text-primary)]">{lane.owner}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--al-text-secondary)]">{lane.nextMove}</p>
          </div>
        </div>

        <div className="space-y-4">
          {sectionList("Source of truth", lane.sourceOfTruth)}
          {sectionList("Execution surfaces", lane.executionSurfaces)}
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {lane.evidence.map((line) => (
          <div
            key={`${lane.id}-${line}`}
            className="al-glass-recessed rounded-2xl p-4 text-sm leading-6 text-[var(--al-text-secondary)]"
          >
            {line}
          </div>
        ))}
      </div>

      <div className="mt-5">
        <a
          href={lane.href}
          className="al-specular-button inline-flex rounded-2xl bg-[var(--al-cyan)] px-4 py-3 text-sm font-semibold text-[var(--al-void)] transition hover:shadow-[var(--al-cyan-glow-strong)]"
        >
          Open lane surface
        </a>
      </div>
    </article>
  );
}

export function LaborLanesPage({
  report,
  commandCenterPath,
}: {
  report: LaborLaneReport;
  commandCenterPath: string;
}) {
  const lanes = [...report.lanes].sort(
    (left, right) => statusOrder(right.status) - statusOrder(left.status),
  );

  return (
    <main className="h-full w-full overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="al-text-mono-label text-[var(--al-cyan-muted)]">
              Labor Lanes
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-[var(--al-text-primary)] sm:text-4xl">
              AL only replaces labor when the lanes are real
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--al-text-secondary)] sm:text-base">
              This is the shared labor map for AL. Each lane has to earn trust with a source of truth, execution surface, verification path, and clear next move before it can replace real hiring or outsourcing.
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
              <h2 className="mt-3 text-2xl font-semibold text-[var(--al-text-primary)]">{report.topNextMove}</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--al-text-secondary)]">
                {report.headline}
              </p>
            </div>
            <span className="al-gemstone-cyan rounded-full px-4 py-2 text-sm font-semibold">
              Built {formatTimestamp(report.generatedAt)}
            </span>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="al-glass-card al-specular rounded-3xl p-5">
            <p className="al-text-mono-label text-[var(--al-green)]">
              Live lanes
            </p>
            <p className="mt-3 text-3xl font-semibold text-[var(--al-text-primary)] al-glow-metric">{report.summary.live}</p>
            <p className="mt-2 text-sm text-[var(--al-text-secondary)]">
              These lanes are strongest right now.
            </p>
          </div>
          <div className="al-glass-card al-inner-light rounded-3xl p-5">
            <p className="al-text-mono-label text-[var(--al-amber)]">
              Warning lanes
            </p>
            <p className="mt-3 text-3xl font-semibold text-[var(--al-text-primary)]">{report.summary.warning}</p>
            <p className="mt-2 text-sm text-[var(--al-text-secondary)]">
              These are moving, but still need tightening.
            </p>
          </div>
          <div className="al-glass-card al-inner-light rounded-3xl p-5">
            <p className="al-text-mono-label text-[var(--al-red)]">
              Blocked lanes
            </p>
            <p className="mt-3 text-3xl font-semibold text-[var(--al-text-primary)]">{report.summary.blocked}</p>
            <p className="mt-2 text-sm text-[var(--al-text-secondary)]">
              These still lean on founder memory or outside labor.
            </p>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          {lanes.map((lane) => laneCard(lane))}
        </section>
      </div>
    </main>
  );
}
