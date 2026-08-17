import type {
  DistressCategory,
  DistressConfidence,
  DistressQualification,
  DistressSignalFact,
  DistressSignalSource,
  DistressSignalStatus,
  ParcelDistressSignal,
  ParcelSignalSummary,
} from "@/lib/land-finder/types";

export const DISTRESS_CATEGORY_LABELS: Record<DistressCategory, string> = {
  county_foreclosure: "County foreclosure",
  tax: "Tax",
  foreclosure: "Foreclosure",
  probate: "Probate / death",
  bankruptcy: "Bankruptcy",
  enforcement: "Enforcement",
  condition: "Property condition",
};

export interface LazarusSignalLead {
  id: string;
  tags: unknown;
  source_details: unknown;
  status: unknown;
  created_at: unknown;
  last_touched_at: unknown;
}

const SPOKANE_PARCEL = /^\d{5}\.\d{4}$/;
export const TAX_DELINQUENCY_CUTOFF_YEAR = 2025;
const CONFIDENCE_RANK: Record<DistressConfidence, number> = { low: 1, medium: 2, high: 3 };
const STATUS_RANK: Record<DistressSignalStatus, number> = { resolved: 1, review: 2, active: 3 };
const CATEGORY_ORDER: DistressCategory[] = [
  "county_foreclosure",
  "foreclosure",
  "tax",
  "bankruptcy",
  "probate",
  "enforcement",
  "condition",
];

function clean(value: unknown): string {
  return typeof value === "string" || typeof value === "number"
    ? String(value).replace(/\s+/g, " ").trim()
    : "";
}

function detailsFor(lead: LazarusSignalLead): Record<string, unknown> {
  return lead.source_details && typeof lead.source_details === "object" && !Array.isArray(lead.source_details)
    ? lead.source_details as Record<string, unknown>
    : {};
}

function tagsFor(lead: LazarusSignalLead): Set<string> {
  return new Set(
    (Array.isArray(lead.tags) ? lead.tags : [])
      .map((value) => clean(value).toLowerCase())
      .filter(Boolean),
  );
}

function firstText(details: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = clean(details[key]);
    if (value) return value;
  }
  return "";
}

function normalizedDate(value: unknown): string | null {
  const text = clean(value);
  if (!text) return null;
  const shortDate = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  const parsed = shortDate
    ? new Date(Date.UTC(Number(shortDate[3]), Number(shortDate[1]) - 1, Number(shortDate[2])))
    : new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function latestDate(values: unknown[]): string | null {
  return values
    .map(normalizedDate)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1) || null;
}

function ageDays(value: string | null, now: Date): number | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return Math.max(0, Math.floor((now.getTime() - parsed.getTime()) / 86_400_000));
}

function freshnessStatus(
  value: string | null,
  maxActiveDays: number,
  now: Date,
  resolved = false,
): DistressSignalStatus {
  if (resolved) return "resolved";
  const age = ageDays(value, now);
  return age !== null && age > maxActiveDays ? "review" : "active";
}

function safeUrl(value: unknown): string | null {
  const text = clean(value);
  if (!text) return null;
  try {
    const url = new URL(text);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function sourceKind(url: string | null, sourceType: string): DistressSignalSource["kind"] {
  const haystack = `${url || ""} ${sourceType}`.toLowerCase();
  if (/court|waeb\.uscourts|courtdocumentviewer/.test(haystack)) return "court";
  if (/spokanecounty|spokanecity|spokanevalley|scout|recorder|eagleweb/.test(haystack)) return "official";
  if (/drive[- ]?by|field/.test(haystack)) return "field";
  return "imported";
}

function sourcesFrom(
  details: Record<string, unknown>,
  urlKeys: string[],
  checkedAt: string | null,
): DistressSignalSource[] {
  const sourceType = firstText(details, ["sourceType"]);
  const label = firstText(details, ["sourceLabel", "propertySourceLabel"]) || sourceType || "Lazarus source";
  const sources = urlKeys
    .map((key) => safeUrl(details[key]))
    .filter((url): url is string => Boolean(url))
    .map((url) => ({ label, url, kind: sourceKind(url, sourceType), checkedAt }));
  if (sources.length) return dedupeSources(sources);
  return [{ label, url: null, kind: sourceKind(null, sourceType), checkedAt }];
}

function dedupeSources(sources: DistressSignalSource[]): DistressSignalSource[] {
  const seen = new Set<string>();
  return sources.filter((source) => {
    const key = `${source.label}|${source.url || ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function facts(values: Array<[string, unknown]>): DistressSignalFact[] {
  return values
    .map(([label, value]) => ({ label, value: clean(value) }))
    .filter((fact) => Boolean(fact.value));
}

function formatAmount(value: unknown): string {
  const text = clean(value).replace(/[$,]/g, "");
  const number = Number(text);
  if (!Number.isFinite(number) || number <= 0) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(number);
}

function taxYear(value: unknown): number | null {
  const year = Number(clean(value));
  return Number.isInteger(year) && year >= 1900 && year <= 2100 ? year : null;
}

function positiveAmount(value: unknown): boolean {
  const amount = Number(clean(value).replace(/[$,]/g, ""));
  return Number.isFinite(amount) && amount > 0;
}

function parseTaxYears(value: unknown): { years: number[]; recognized: boolean } {
  if (Array.isArray(value)) {
    const years = value.flatMap((entry) => {
      if (entry && typeof entry === "object" && "year" in entry) {
        const record = entry as Record<string, unknown>;
        const year = taxYear(record.year);
        const balanceKeys = ["owing", "remaining", "balance", "amountDue"];
        const balances = balanceKeys.filter((key) => key in record).map((key) => record[key]);
        return year !== null && (!balances.length || balances.some(positiveAmount)) ? [year] : [];
      }
      const year = taxYear(entry);
      return year === null ? [] : [year];
    });
    return { years: [...new Set(years)].sort((left, right) => left - right), recognized: true };
  }

  const text = clean(value);
  if (!text) return { years: [], recognized: false };
  try {
    return parseTaxYears(JSON.parse(text));
  } catch {
    const yearBalances = [...text.matchAll(/\b(19\d{2}|20\d{2}|2100)\b\s*:\s*\$?([\d,]+(?:\.\d+)?)/g)];
    if (yearBalances.length) {
      return {
        years: [...new Set(yearBalances
          .filter((match) => positiveAmount(match[2]))
          .map((match) => Number(match[1])))].sort((left, right) => left - right),
        recognized: true,
      };
    }
    const years = [...text.matchAll(/\b(19\d{2}|20\d{2}|2100)\b/g)].map((match) => Number(match[1]));
    return { years: [...new Set(years)].sort((left, right) => left - right), recognized: years.length > 0 };
  }
}

function currentUnpaidTaxYears(details: Record<string, unknown>): number[] {
  for (const key of ["urgentTaxCurrentYearsOwing", "taxYearsOwing", "taxDeadlineTaxYears"]) {
    const parsed = parseTaxYears(details[key]);
    if (parsed.recognized) return parsed.years;
  }

  const directBalances = [2023, 2024, 2025, 2026]
    .filter((year) => positiveAmount(details[`urgentTaxBalance${year}`]));
  if (directBalances.length) return directBalances;

  const oldest = taxYear(firstText(details, ["urgentTaxOldestPositiveYear", "oldestOwedYear"]));
  if (oldest !== null) return [oldest];

  const deadlineYear = clean(details.taxDeadlineRule).match(/\b(19\d{2}|20\d{2}|2100)\b/);
  return deadlineYear ? [Number(deadlineYear[1])] : [];
}

function makeSignal(options: Omit<ParcelDistressSignal, "id">): ParcelDistressSignal {
  return { ...options, id: `${options.category}:${options.parcelId}:${options.lazarusLeadIds[0] || "source"}` };
}

function taxSignal(lead: LazarusSignalLead, details: Record<string, unknown>, parcelId: string, now: Date) {
  const tags = tagsFor(lead);
  const urgent = tags.has("urgent_tax") || clean(details.taxDistressStatus).toLowerCase() === "urgent_tax";
  const cleared = Boolean(clean(details.urgentTaxClearedAt));
  const checkedAt = latestDate([
    details.urgentTaxVerifiedAt,
    details.urgentTaxLastCountyCheckAt,
    details.urgentTaxLatestScoutCheckedAt,
    details.urgentTaxLastScoutCheckAt,
    details.taxDeadlineVerifiedAt,
    details.taxDeadlineScoutScrapedAt,
    details.urgentTaxCurrentAsOf,
    lead.last_touched_at,
    lead.created_at,
  ]);
  const amount = formatAmount(firstText(details, [
    "urgentTaxCurrentBalanceTotal",
    "urgentTaxCurrentTotalDue",
    "urgentTaxLatestTotalOwed",
    "urgentTaxTotalOwed",
    "amountDue",
  ]));
  const unpaidYears = currentUnpaidTaxYears(details);
  const oldestUnpaidYear = unpaidYears[0] || null;
  const years = unpaidYears.join(", ");
  const meetsCutoff = oldestUnpaidYear !== null && oldestUnpaidYear <= TAX_DELINQUENCY_CUTOFF_YEAR;
  const foreclosureCase = firstText(details, ["urgentTaxForeclosureCase"]);
  const verified = Boolean(firstText(details, [
    "urgentTaxVerifiedAt",
    "urgentTaxLastCountyCheckAt",
    "taxDeadlineVerifiedAt",
    "taxVerificationSource",
    "urgentTaxVerificationSource",
  ])) || ["tax", "urgent_tax"].includes(clean(details.taxDistressStatus).toLowerCase());
  const status = cleared
    ? "resolved"
    : meetsCutoff
      ? freshnessStatus(checkedAt, 550, now)
      : "review";
  const summary = [
    meetsCutoff
      ? `Property taxes from ${oldestUnpaidYear} remain reported owing.`
      : "A property-tax issue is recorded, but 2025-or-older delinquency is not proven.",
    amount ? `${amount} reported owing.` : "",
    foreclosureCase ? "A tax-foreclosure case is referenced." : "",
  ].filter(Boolean).join(" ");

  return makeSignal({
    parcelId,
    category: "tax",
    title: meetsCutoff
      ? urgent ? "Urgent 2025-or-older property tax" : "2025-or-older property tax delinquency"
      : "Property tax evidence needs review",
    summary,
    confidence: verified ? "high" : "medium",
    status,
    eventAt: oldestUnpaidYear ? normalizedDate(`${oldestUnpaidYear}-01-01`) : null,
    checkedAt,
    sources: dedupeSources([
      ...sourcesFrom(details, [
        "urgentTaxVerificationUrl",
        "urgentTaxSource",
        "taxDeadlineSource",
        "taxVerificationSource",
        "scoutUrl",
      ], checkedAt),
      ...(verified ? [{
        label: "Spokane County SCOUT",
        url: `https://cp.spokanecounty.org/scout/propertyinformation/?PID=${encodeURIComponent(parcelId)}`,
        kind: "official" as const,
        checkedAt,
      }] : []),
    ]),
    facts: facts([
      ["Amount owing", amount],
      ["Years reported owing", years],
      ["Oldest unpaid year", oldestUnpaidYear],
      ["Qualification", meetsCutoff ? `${TAX_DELINQUENCY_CUTOFF_YEAR} or older` : "Not yet proven"],
      ["Foreclosure case", foreclosureCase],
    ]),
    lazarusLeadIds: [lead.id],
  });
}

function foreclosureSignal(lead: LazarusSignalLead, details: Record<string, unknown>, parcelId: string, now: Date) {
  const classification = firstText(details, ["foreclosureClassification"]);
  const statusText = firstText(details, ["foreclosureStatus"]);
  const resolved = /DISCONTINUED|CURED|RELEASED|DISMISSED/i.test(`${classification} ${statusText}`);
  const checkedAt = latestDate([
    details.foreclosureStatusCheckedAt,
    details.foreclosureHistoryCheckedAt,
    details.publicRecordCheckedAt,
    lead.last_touched_at,
    lead.created_at,
  ]);
  const eventAt = latestDate([
    details.foreclosureLatestSignalDate,
    details.foreclosureStatusRecordedDate,
    details.foreclosureCurrentFilingDate,
    details.foreclosureFirstSignalDate,
  ]);
  const formal = /TRUSTEE_SALE|JUDICIAL_FORECLOSURE|COMMERCE_NOD/i.test(classification);
  const documentType = firstText(details, ["foreclosurePrimaryDocumentType", "foreclosureStatusEventType"]);
  const caseNumber = firstText(details, ["foreclosureCourtCaseNumber"]);

  return makeSignal({
    parcelId,
    category: "foreclosure",
    title: resolved ? "Foreclosure filing resolved" : formal ? "Active pre-foreclosure" : "Foreclosure precursor",
    summary: resolved
      ? "The latest Lazarus evidence marks this foreclosure process discontinued or resolved."
      : [documentType || "A foreclosure-related public filing is linked to this parcel.", caseNumber ? `Court case ${caseNumber}.` : ""].filter(Boolean).join(" "),
    confidence: formal ? "high" : "medium",
    status: freshnessStatus(checkedAt || eventAt, 550, now, resolved),
    eventAt,
    checkedAt,
    sources: sourcesFrom(details, [
      "foreclosureStatusSourceUrl",
      "recorderDetailUrl",
      "courtDetailUrl",
      "courtCaseDetailUrl",
      "noticeUrl",
      "scoutUrl",
    ], checkedAt),
    facts: facts([
      ["Filing", documentType],
      ["Classification", classification.replaceAll("_", " ")],
      ["Court case", caseNumber],
      ["Latest event", eventAt],
    ]),
    lazarusLeadIds: [lead.id],
  });
}

function probateSignal(lead: LazarusSignalLead, details: Record<string, unknown>, parcelId: string, now: Date) {
  const tags = tagsFor(lead);
  const probate = tags.has("probate") || /probate/i.test(clean(details.probateQualificationStatus));
  const qualified = clean(details.probateQualificationStatus).toLowerCase() === "qualified";
  const propertyConfidence = firstText(details, ["propertyMatchConfidence", "identityConfidence"]).toLowerCase();
  const authorityConfidence = clean(details.authorityConfidence).toLowerCase();
  const hasAuthority = Boolean(firstText(details, ["personalRepresentative"])) || authorityConfidence === "high";
  const checkedAt = latestDate([
    details.courtPrDocumentFileDate,
    details.deathPipelineUpdatedAt,
    details.parcelScrapedAt,
    lead.last_touched_at,
    lead.created_at,
  ]);
  const needsPropertyReview = clean(details.propertyReviewStatus).toLowerCase() === "needed";
  const high = qualified || (propertyConfidence === "high" && (probate || hasAuthority));
  const status = needsPropertyReview ? "review" : freshnessStatus(checkedAt, 1825, now);
  const caseNumber = firstText(details, ["probateCaseNumber", "caseId"]);

  return makeSignal({
    parcelId,
    category: "probate",
    title: probate ? "Probate property" : "Death / pre-probate",
    summary: qualified
      ? "Probate authority and the parcel match are qualified."
      : hasAuthority
        ? "A personal representative is identified and the property is linked to the estate."
        : "A death or estate record is linked to this parcel for review.",
    confidence: high ? "high" : propertyConfidence === "medium" ? "medium" : "low",
    status,
    eventAt: normalizedDate(details.dateOfDeath),
    checkedAt,
    sources: sourcesFrom(details, [
      "courtPrDocumentUrl",
      "courtCaseDetailUrl",
      "courtNoticeDocumentUrl",
      "noticeUrl",
      "deathSourceUrl",
      "obituaryUrl",
      "propertySourceUrl",
      "scoutUrl",
    ], checkedAt),
    facts: facts([
      ["Case", caseNumber],
      ["Property match", propertyConfidence],
      ["Authority", qualified || hasAuthority ? "Identified" : "Needs review"],
      ["Date of death", details.dateOfDeath],
    ]),
    lazarusLeadIds: [lead.id],
  });
}

function bankruptcySignal(lead: LazarusSignalLead, details: Record<string, unknown>, parcelId: string, now: Date) {
  const caseNumber = firstText(details, ["bankruptcyCaseNumber"]);
  if (!caseNumber) return null;
  const eventAt = latestDate([details.bankruptcyEventDate, lead.created_at]);
  const checkedAt = latestDate([details.publicRecordCheckedAt, details.checkedAt, lead.last_touched_at, eventAt]);
  const propertyLinked = /BANKRUPTCY_LINKED|PUBLIC_RSS_OWNER_MATCHED/i.test(firstText(details, [
    "earlyDistressTransactionContext",
    "transactionContext",
    "bankruptcyHistoryStatus",
  ])) || Boolean(clean(details.parcelId));

  return makeSignal({
    parcelId,
    category: "bankruptcy",
    title: "Property-linked bankruptcy",
    summary: firstText(details, ["bankruptcyEventName"]) || "A bankruptcy case with a property or mortgage event is linked to this parcel.",
    confidence: propertyLinked ? "high" : "medium",
    status: freshnessStatus(checkedAt || eventAt, 1095, now),
    eventAt,
    checkedAt,
    sources: sourcesFrom(details, ["bankruptcyDocumentUrl", "bankruptcyCaseUrl", "scoutUrl"], checkedAt),
    facts: facts([
      ["Case", caseNumber],
      ["Chapter", details.bankruptcyChapter],
      ["Event", details.bankruptcyEventName],
    ]),
    lazarusLeadIds: [lead.id],
  });
}

function enforcementSignal(lead: LazarusSignalLead, details: Record<string, unknown>, parcelId: string, now: Date) {
  const primarySignal = firstText(details, ["primarySignal", "earlyDistressReason"]);
  const checkedAt = latestDate([details.checkedAt, details.publicRecordCheckedAt, lead.last_touched_at, lead.created_at]);
  const sourceUrl = firstText(details, ["primarySourceUrl", "noticeUrl", "courtDetailUrl"]);
  const propertyConfidence = firstText(details, ["propertyMatchConfidence", "identityStatus"]).toLowerCase();
  const high = Boolean(sourceUrl) && ["high", "verified", "matched", "resolved"].includes(propertyConfidence);

  return makeSignal({
    parcelId,
    category: "enforcement",
    title: "Public enforcement",
    summary: primarySignal || "A code, nuisance, dangerous-building, demolition, or related public proceeding is linked to this parcel.",
    confidence: high ? "high" : "medium",
    status: freshnessStatus(checkedAt, 730, now),
    eventAt: latestDate([details.currentFilingDate, details.latestSignalDate, details.checkedAt]),
    checkedAt,
    sources: sourcesFrom(details, ["primarySourceUrl", "noticeUrl", "courtDetailUrl", "propertySourceUrl", "scoutUrl"], checkedAt),
    facts: facts([
      ["Signal", primarySignal],
      ["Property match", propertyConfidence],
    ]),
    lazarusLeadIds: [lead.id],
  });
}

function conditionSignal(lead: LazarusSignalLead, details: Record<string, unknown>, parcelId: string, now: Date) {
  const rawTags = Array.isArray(details.driveByTags)
    ? details.driveByTags
    : clean(details.driveByTags).split(/[;,|]/);
  const observationTags = rawTags.map((value) => clean(value).replaceAll("_", " ")).filter(Boolean);
  const eventAt = latestDate([details.driveByCapturedAt, lead.created_at]);
  const summary = observationTags.length
    ? `Field observation: ${observationTags.join(", ")}.`
    : "A drive-by or field observation identified visible property distress.";

  return makeSignal({
    parcelId,
    category: "condition",
    title: "Observed property condition",
    summary,
    confidence: "medium",
    status: freshnessStatus(eventAt, 365, now),
    eventAt,
    checkedAt: eventAt,
    sources: sourcesFrom(details, ["driveByGoogleMapsUrl", "scoutUrl"], eventAt),
    facts: facts([
      ["Observed", observationTags.join(", ")],
      ["Captured", eventAt],
    ]),
    lazarusLeadIds: [lead.id],
  });
}

export function signalsFromLazarusLead(lead: LazarusSignalLead, now = new Date()): ParcelDistressSignal[] {
  const details = detailsFor(lead);
  const parcelId = clean(details.parcelId);
  if (!SPOKANE_PARCEL.test(parcelId)) return [];

  const tags = tagsFor(lead);
  const sourceType = firstText(details, ["sourceType"]);
  const output: ParcelDistressSignal[] = [];

  const hasVerifiedTaxFields = Boolean(firstText(details, [
    "taxDeadlineVerifiedAt",
    "urgentTaxVerifiedAt",
    "urgentTaxLastCountyCheckAt",
    "urgentTaxLastScoutCheckAt",
  ]));
  if (tags.has("tax") || tags.has("urgent_tax") || /tax delinquent|tax deed|tax owed|urgent tax/i.test(sourceType) || hasVerifiedTaxFields) {
    output.push(taxSignal(lead, details, parcelId, now));
  }
  if (tags.has("pre_foreclosure") || /pre-foreclosure/i.test(sourceType)) {
    output.push(foreclosureSignal(lead, details, parcelId, now));
  }
  if (tags.has("probate") || tags.has("pre_probate") || tags.has("death_pipeline") || /probate/i.test(sourceType)) {
    output.push(probateSignal(lead, details, parcelId, now));
  }
  const bankruptcy = bankruptcySignal(lead, details, parcelId, now);
  if (bankruptcy) output.push(bankruptcy);
  if (tags.has("early_distress") || /enforcement|code enforcement/i.test(sourceType)) {
    output.push(enforcementSignal(lead, details, parcelId, now));
  }
  if (tags.has("driveby") || /drive[- ]?by/i.test(sourceType)) {
    output.push(conditionSignal(lead, details, parcelId, now));
  }

  return output;
}

function signalPriority(signal: ParcelDistressSignal): number {
  return STATUS_RANK[signal.status] * 100 + CONFIDENCE_RANK[signal.confidence] * 10 + (signal.title.includes("Urgent") ? 1 : 0);
}

function mergeCategorySignals(signals: ParcelDistressSignal[]): ParcelDistressSignal {
  const sorted = [...signals].sort((left, right) => signalPriority(right) - signalPriority(left));
  const best = sorted[0];
  const dates = sorted.flatMap((signal) => [signal.checkedAt, signal.eventAt]);
  const sourceMap = new Map<string, DistressSignalSource>();
  const factMap = new Map<string, DistressSignalFact>();
  sorted.forEach((signal) => {
    signal.sources.forEach((source) => sourceMap.set(`${source.label}|${source.url || ""}`, source));
    signal.facts.forEach((fact) => {
      if (!factMap.has(fact.label)) factMap.set(fact.label, fact);
    });
  });

  return {
    ...best,
    id: `${best.category}:${best.parcelId}`,
    checkedAt: latestDate(dates),
    sources: [...sourceMap.values()].slice(0, 8),
    facts: [...factMap.values()].slice(0, 8),
    lazarusLeadIds: [...new Set(sorted.flatMap((signal) => signal.lazarusLeadIds))],
  };
}

function qualificationFor(signals: ParcelDistressSignal[]): DistressQualification {
  const active = signals.filter((signal) => signal.status === "active");
  if (!active.length) return signals.some((signal) => signal.status === "review") ? "candidate" : "none";
  if (active.some((signal) => signal.confidence === "high")) return "verified";
  const independentSources = new Set(active.flatMap((signal) =>
    signal.sources.map((source) => source.url).filter((url): url is string => Boolean(url))
  ));
  if (active.length >= 2 || independentSources.size >= 2) return "corroborated";
  return "candidate";
}

export function buildParcelSignalSummaries(
  leads: LazarusSignalLead[],
  now = new Date(),
  additionalSignals: ParcelDistressSignal[] = [],
): ParcelSignalSummary[] {
  const byParcel = new Map<string, ParcelDistressSignal[]>();
  [...leads.flatMap((lead) => signalsFromLazarusLead(lead, now)), ...additionalSignals].forEach((signal) => {
    const signals = byParcel.get(signal.parcelId) || [];
    signals.push(signal);
    byParcel.set(signal.parcelId, signals);
  });

  return [...byParcel.entries()].map(([parcelId, signals]) => {
    const grouped = new Map<DistressCategory, ParcelDistressSignal[]>();
    signals.forEach((signal) => grouped.set(signal.category, [...(grouped.get(signal.category) || []), signal]));
    const merged = [...grouped.values()]
      .map(mergeCategorySignals)
      .sort((left, right) => CATEGORY_ORDER.indexOf(left.category) - CATEGORY_ORDER.indexOf(right.category));
    const active = merged.filter((signal) => signal.status === "active");
    return {
      parcelId,
      qualification: qualificationFor(merged),
      activeSignalCount: active.length,
      verifiedSignalCount: active.filter((signal) => signal.confidence === "high").length,
      evidenceCount: merged.reduce((total, signal) => total + signal.sources.length, 0),
      categories: active.map((signal) => signal.category),
      latestSignalAt: latestDate(merged.flatMap((signal) => [signal.checkedAt, signal.eventAt])),
      signals: merged,
    };
  }).sort((left, right) => {
    const qualificationRank: Record<DistressQualification, number> = { verified: 4, corroborated: 3, candidate: 2, none: 1 };
    return qualificationRank[right.qualification] - qualificationRank[left.qualification]
      || right.activeSignalCount - left.activeSignalCount
      || left.parcelId.localeCompare(right.parcelId);
  });
}

export function summaryQualifiesAsDistress(summary: ParcelSignalSummary | undefined): boolean {
  return summary?.qualification === "verified" || summary?.qualification === "corroborated";
}

export function summaryMatchesSignalFilters(
  summary: ParcelSignalSummary | undefined,
  options: {
    categories: DistressCategory[];
    verifiedOnly: boolean;
    multiSignalOnly: boolean;
    manualEvidence?: boolean;
  },
): boolean {
  const manualCount = options.manualEvidence ? 1 : 0;
  const hasQualifiedDistress = summaryQualifiesAsDistress(summary) || options.manualEvidence;
  if (!hasQualifiedDistress) return false;
  if (options.categories.length && !options.categories.some((category) => summary?.categories.includes(category))) return false;
  if (options.verifiedOnly && summary?.qualification !== "verified" && !options.manualEvidence) return false;
  if (options.multiSignalOnly && (summary?.activeSignalCount || 0) + manualCount < 2) return false;
  return true;
}
