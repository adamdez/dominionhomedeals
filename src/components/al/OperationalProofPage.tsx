import Link from "next/link";
import type {
  OperationalProofCheck,
  OperationalProofReport,
  OperationalProofStatus,
} from "@/lib/al-operational-proof";

function toneForStatus(status: OperationalProofStatus) {
  if (status === "failing") {
    return { card: "al-gemstone-red", pill: "al-gemstone-red" };
  }
  if (status === "warning") {
    return { card: "al-gemstone-amber", pill: "al-gemstone-amber" };
  }
  return { card: "al-gemstone-green", pill: "al-gemstone-green" };
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
    <main className="h-full w-full overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="al-text-mono-label text-[var(--al-cyan-muted)]">
              Operational Proof
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-[var(--al-text-primary)] sm:text-4xl">
              Prove the loops before we widen the system
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--al-text-secondary)] sm:text-base">
              This view scores the live AL control loops. It is here to answer whether the system is actually moving work, not whether it has more features.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href={commandCenterPath}
              className="rounded-2xl al-glass-subtle px-4 py-3 text-sm font-semibold text-[var(--al-text-primary)] transition hover:border-[var(--al-border-hover)]"
            >
              Back to Command Center
            </Link>
          </div>
        </div>

        <section className="al-glass-card al-specular rounded-3xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="al-text-mono-label text-[var(--al-cyan-muted)]">
                Top next move
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-[var(--al-text-primary)]">
                {report.topNextMove}
              </h2>
            </div>
            <span className="al-gemstone-cyan rounded-full px-4 py-2 text-sm font-semibold">
              Built {formatTimestamp(report.generatedAt)}
            </span>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="al-glass-card al-specular rounded-3xl p-5">
            <p className="al-text-mono-label text-[var(--al-green)]">
              Healthy loops
            </p>
            <p className="mt-3 text-3xl font-semibold text-[var(--al-text-primary)] al-glow-metric">
              {report.summary.healthy}
            </p>
            <p className="mt-2 text-sm text-[var(--al-text-secondary)]">
              These are presently doing what they should.
            </p>
          </div>
          <div className="al-glass-card al-inner-light rounded-3xl p-5">
            <p className="al-text-mono-label text-[var(--al-amber)]">
              Warning loops
            </p>
            <p className="mt-3 text-3xl font-semibold text-[var(--al-text-primary)]">
              {report.summary.warning}
            </p>
            <p className="mt-2 text-sm text-[var(--al-text-secondary)]">
              These are alive, but they still need tightening.
            </p>
          </div>
          <div className="al-glass-card al-inner-light rounded-3xl p-5">
            <p className="al-text-mono-label text-[var(--al-red)]">
              Failing loops
            </p>
            <p className="mt-3 text-3xl font-semibold text-[var(--al-text-primary)]">
              {report.summary.failing}
            </p>
            <p className="mt-2 text-sm text-[var(--al-text-secondary)]">
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
                className="al-glass-card al-inner-light rounded-3xl p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="al-text-mono-label text-[var(--al-cyan-muted)]">
                      Control loop
                    </p>
                    <h2 className="mt-3 text-2xl font-semibold text-[var(--al-text-primary)]">
                      {check.title}
                    </h2>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] ${tone.pill}`}
                  >
                    {check.status}
                  </span>
                </div>

                <div className={`mt-5 rounded-2xl p-4 ${tone.card}`}>
                  <p className="text-sm font-semibold leading-6">{check.summary}</p>
                </div>

                <div className="mt-5 space-y-3">
                  {check.evidence.map((line) => (
                    <div
                      key={`${check.id}-${line}`}
                      className="al-glass-recessed rounded-2xl p-4 text-sm leading-6 text-[var(--al-text-secondary)]"
                    >
                      {line}
                    </div>
                  ))}
                </div>

                <div className="mt-5">
                  <a
                    href={check.href}
                    className="al-specular-button inline-flex rounded-2xl bg-[var(--al-cyan)] px-4 py-3 text-sm font-semibold text-[var(--al-void)] transition hover:shadow-[var(--al-cyan-glow-strong)]"
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
