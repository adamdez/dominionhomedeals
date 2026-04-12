import Link from "next/link";
import type { LaborLane, LaborLaneReport, LaborLaneStatus } from "@/lib/al-labor-lanes";

function toneForStatus(status: LaborLaneStatus) {
  if (status === "blocked") {
    return {
      card: "border-red-500/20 bg-red-500/10 text-red-100",
      pill: "border-red-500/25 bg-red-500/10 text-red-100",
    };
  }
  if (status === "warning") {
    return {
      card: "border-amber-500/20 bg-amber-500/10 text-amber-100",
      pill: "border-amber-500/25 bg-amber-500/10 text-amber-100",
    };
  }
  return {
    card: "border-emerald-500/20 bg-emerald-500/10 text-emerald-100",
    pill: "border-emerald-500/25 bg-emerald-500/10 text-emerald-100",
  };
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
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300/45">
        {title}
      </p>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <div
            key={`${title}-${item}`}
            className="rounded-2xl border border-emerald-900/20 bg-[#0b110e] p-3 text-sm leading-6 text-emerald-100/75"
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
      className="rounded-3xl border border-emerald-900/20 bg-[#101714] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)]"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300/45">
            Labor lane
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[#f3faf6]">{lane.title}</h2>
          <p className="mt-2 text-sm leading-6 text-emerald-100/65">{lane.coverage}</p>
        </div>
        <span
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] ${tone.pill}`}
        >
          {lane.status}
        </span>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <div className={`rounded-2xl border p-4 ${tone.card}`}>
            <p className="text-sm font-semibold leading-6">{lane.summary}</p>
          </div>
          <div className="mt-4 rounded-2xl border border-emerald-900/20 bg-[#0b110e] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300/45">
              Owner and next move
            </p>
            <p className="mt-3 text-sm font-semibold text-[#f3faf6]">{lane.owner}</p>
            <p className="mt-2 text-sm leading-6 text-emerald-100/75">{lane.nextMove}</p>
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
            className="rounded-2xl border border-emerald-900/20 bg-[#0b110e] p-4 text-sm leading-6 text-emerald-100/75"
          >
            {line}
          </div>
        ))}
      </div>

      <div className="mt-5">
        <a
          href={lane.href}
          className="inline-flex rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-[#05110b] transition hover:bg-emerald-400"
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
    <main className="h-full w-full overflow-y-auto bg-[#07100b] px-4 py-6 text-[#eaf4ef] sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300/45">
              Labor Lanes
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-[#f3faf6] sm:text-4xl">
              AL only replaces labor when the lanes are real
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-emerald-100/70 sm:text-base">
              This is the shared labor map for AL. Each lane has to earn trust with a source of truth, execution surface, verification path, and clear next move before it can replace real hiring or outsourcing.
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
              <h2 className="mt-2 text-2xl font-semibold text-[#f3faf6]">{report.topNextMove}</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-emerald-100/70">
                {report.headline}
              </p>
            </div>
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200">
              Built {formatTimestamp(report.generatedAt)}
            </span>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-emerald-500/15 bg-[#101714] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200/70">
              Live lanes
            </p>
            <p className="mt-3 text-3xl font-semibold text-emerald-100">{report.summary.live}</p>
            <p className="mt-2 text-sm text-emerald-100/65">
              These lanes are strongest right now.
            </p>
          </div>
          <div className="rounded-3xl border border-amber-500/15 bg-[#101714] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200/70">
              Warning lanes
            </p>
            <p className="mt-3 text-3xl font-semibold text-amber-100">{report.summary.warning}</p>
            <p className="mt-2 text-sm text-amber-100/70">
              These are moving, but still need tightening.
            </p>
          </div>
          <div className="rounded-3xl border border-red-500/15 bg-[#101714] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-200/70">
              Blocked lanes
            </p>
            <p className="mt-3 text-3xl font-semibold text-red-100">{report.summary.blocked}</p>
            <p className="mt-2 text-sm text-red-100/70">
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
