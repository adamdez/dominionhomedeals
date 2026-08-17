import {
  BadgeDollarSign,
  Building2,
  ExternalLink,
  FileWarning,
  Flame,
  Gavel,
  Landmark,
  ShieldCheck,
  Siren,
} from "lucide-react";
import type { ComponentType } from "react";
import type {
  DistressCategory,
  ParcelDistressSignal,
  ParcelSignalSummary,
} from "@/lib/land-finder/types";
import { DISTRESS_CATEGORY_LABELS } from "@/lib/land-finder/signals";

const CATEGORY_ICONS: Record<DistressCategory, ComponentType<{ size?: number; "aria-hidden"?: boolean }>> = {
  county_foreclosure: Siren,
  tax: BadgeDollarSign,
  foreclosure: Gavel,
  probate: FileWarning,
  bankruptcy: Landmark,
  enforcement: Building2,
  condition: Flame,
};

function dateLabel(value: string | null): string {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function signalStateLabel(signal: ParcelDistressSignal): string {
  if (signal.status === "resolved") return "Resolved";
  if (signal.status === "review") return "Refresh needed";
  return signal.confidence === "high" ? "Verified" : signal.confidence === "medium" ? "Supported" : "Review";
}

function factValue(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}T/.test(value)) return dateLabel(value);
  if (/^[A-Z_ ]+$/.test(value) && /[A-Z]{2}/.test(value)) {
    const normalized = value.replaceAll("_", " ").toLowerCase();
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }
  return value;
}

function SignalRow({ signal }: { signal: ParcelDistressSignal }) {
  const Icon = CATEGORY_ICONS[signal.category];
  const sourceLinks = signal.sources.filter((source) => source.url).slice(0, 2);
  const leadId = signal.lazarusLeadIds[0];

  return (
    <article className={`lf-signal-row is-${signal.status}`}>
      <div className="lf-signal-icon"><Icon size={18} aria-hidden /></div>
      <div className="lf-signal-content">
        <div className="lf-signal-heading">
          <strong>{signal.title}</strong>
          <span>{signalStateLabel(signal)}</span>
        </div>
        <p>{signal.summary}</p>
        {signal.facts.length ? (
          <dl className="lf-signal-facts">
            {signal.facts.slice(0, 6).map((fact) => (
              <div key={`${fact.label}-${fact.value}`}><dt>{fact.label}</dt><dd>{factValue(fact.value)}</dd></div>
            ))}
          </dl>
        ) : null}
        <div className="lf-signal-links">
          {sourceLinks.map((source, index) => (
            <a key={`${source.url}-${index}`} href={source.url || "#"} target="_blank" rel="noreferrer">
              {index === 0 ? "Source" : `Source ${index + 1}`} <ExternalLink size={13} />
            </a>
          ))}
          {leadId ? (
            <a href={`https://lazarus.dominionhomedeals.com/?leadId=${encodeURIComponent(leadId)}`} target="_blank" rel="noreferrer">
              Lazarus <ExternalLink size={13} />
            </a>
          ) : null}
          <span>{dateLabel(signal.checkedAt || signal.eventAt)}</span>
        </div>
      </div>
    </article>
  );
}

export function ParcelSignalPanel({
  summary,
  manualEvidence,
}: {
  summary?: ParcelSignalSummary;
  manualEvidence?: { sourceUrl: string | null; verifiedAt: string | null };
}) {
  const automatedActive = summary?.activeSignalCount || 0;
  const activeCount = automatedActive + (manualEvidence ? 1 : 0);
  const qualification = summary?.qualification || (manualEvidence ? "verified" : "none");
  const heading = qualification === "verified"
    ? "Verified distress"
    : qualification === "corroborated"
      ? "Corroborated distress"
      : qualification === "candidate"
        ? "Evidence needs refresh"
        : manualEvidence
          ? "Manual distress evidence"
          : "No verified distress";

  return (
    <section className={`lf-signal-panel is-${qualification}`} aria-label="Distress evidence">
      <header className="lf-signal-summary">
        <div className="lf-signal-summary-icon"><ShieldCheck size={19} aria-hidden /></div>
        <div>
          <strong>{heading}</strong>
          <span>{activeCount ? `${activeCount} active signal${activeCount === 1 ? "" : "s"}` : "No current qualifying signal"}</span>
        </div>
        {summary?.evidenceCount ? <b>{summary.evidenceCount} source{summary.evidenceCount === 1 ? "" : "s"}</b> : null}
      </header>

      {summary?.categories.length ? (
        <div className="lf-signal-categories">
          {summary.categories.map((category) => <span key={category}>{DISTRESS_CATEGORY_LABELS[category]}</span>)}
        </div>
      ) : null}

      {summary?.signals.map((signal) => <SignalRow key={signal.id} signal={signal} />)}

      {manualEvidence ? (
        <article className="lf-signal-row is-active is-manual">
          <div className="lf-signal-icon"><ShieldCheck size={18} aria-hidden /></div>
          <div className="lf-signal-content">
            <div className="lf-signal-heading"><strong>Team evidence</strong><span>Manual</span></div>
            <p>A team member marked this parcel as having distress evidence.</p>
            <div className="lf-signal-links">
              {manualEvidence.sourceUrl ? <a href={manualEvidence.sourceUrl} target="_blank" rel="noreferrer">Source <ExternalLink size={13} /></a> : null}
              <span>{dateLabel(manualEvidence.verifiedAt)}</span>
            </div>
          </div>
        </article>
      ) : null}
    </section>
  );
}
