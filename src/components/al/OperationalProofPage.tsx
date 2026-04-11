import Link from "next/link";
import type {
  OperationalProofCheck,
  OperationalProofReport,
  OperationalProofStatus,
} from "@/lib/al-operational-proof";

function toneForStatus(status: OperationalProofStatus) {
  if (status === "failing") {
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

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString();
}

function severityOrder(check: OperationalProofCheck) {
  if (check.status === "failing") return 3;
  if (check.status === "warning") return 2;
  return 1;
}

export function OperationalProofPage({
  report,
  commandCenterPath,
}: {
  report: OperationalProofReport;
  commandCenterPath: string;
}) {
  const checks = [...report.checks].sort(
    (left, right) => severityOrder(right) - severityOrder(left),
  );

  return (
    <main className="h-full w-full overflow-y-auto bg-[#07100b] px-4 py-6 text-[#eaf4ef] sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300/45">
              Operational Proof
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-[#f3faf6] sm:text-4xl">
              Prove the loops before we widen the system
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-emerald-100/70 sm:text-base">
              This view scores the live AL control loops. It is here to answer whether the system is actually moving work, not whether it has more features.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href={commandCenterPath}
              className="rounded-2xl border border-emerald-900/25 bg-[#101714] px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:border-emerald-500/40"
            >
              Back to Command Center
            </Link>
          </div>
        </div>

        <section className="rounded-3xl border border-emerald-900/20 bg-[#101714] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300/45">
                Top next move
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[#f3faf6]">
                {report.topNextMove}
              </h2>
            </div>
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200">
              Built {formatTimestamp(report.generatedAt)}
            </span>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-emerald-500/15 bg-[#101714] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200/70">
              Healthy loops
            </p>
            <p className="mt-3 text-3xl font-semibold text-emerald-100">
              {report.summary.healthy}
            </p>
            <p className="mt-2 text-sm text-emerald-100/65">
              These are presently doing what they should.
            </p>
          </div>
          <div className="rounded-3xl border border-amber-500/15 bg-[#101714] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200/70">
              Warning loops
            </p>
            <p className="mt-3 text-3xl font-semibold text-amber-100">
              {report.summary.warning}
            </p>
            <p className="mt-2 text-sm text-amber-100/70">
              These are alive, but they still need tightening.
            </p>
          </div>
          <div className="rounded-3xl border border-red-500/15 bg-[#101714] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-200/70">
              Failing loops
            </p>
            <p className="mt-3 text-3xl font-semibold text-red-100">
              {report.summary.failing}
            </p>
            <p className="mt-2 text-sm text-red-100/70">
              These need repair before we should trust more automation or volume.
            </p>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          {checks.map((check) => {
            const tone = toneForStatus(check.status);

            return (
              <article
                key={check.id}
                className="rounded-3xl border border-emerald-900/20 bg-[#101714] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300/45">
                      Control loop
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-[#f3faf6]">
                      {check.title}
                    </h2>
                  </div>
                  <span
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] ${tone.pill}`}
                  >
                    {check.status}
                  </span>
                </div>

                <div className={`mt-5 rounded-2xl border p-4 ${tone.card}`}>
                  <p className="text-sm font-semibold leading-6">{check.summary}</p>
                </div>

                <div className="mt-5 space-y-3">
                  {check.evidence.map((line) => (
                    <div
                      key={`${check.id}-${line}`}
                      className="rounded-2xl border border-emerald-900/20 bg-[#0b110e] p-4 text-sm leading-6 text-emerald-100/75"
                    >
                      {line}
                    </div>
                  ))}
                </div>

                <div className="mt-5">
                  <a
                    href={check.href}
                    className="inline-flex rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-[#05110b] transition hover:bg-emerald-400"
                  >
                    Open control surface
                  </a>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
