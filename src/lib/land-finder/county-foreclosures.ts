import type { ParcelDistressSignal } from "@/lib/land-finder/types";

export const COUNTY_FORECLOSURE_LIST_URL = "https://cp.spokanecounty.org/treasurer/foreclosures/";
export const COUNTY_FORECLOSURE_PDF_URL = "https://www.spokanecounty.gov/DocumentCenter/View/73241/2026-Foreclosure-List";

export interface CountyForeclosureParcel {
  parcelId: string;
  address: string;
  city: string;
  listedAmount: number;
  detailUrl: string;
}

export interface CountyForeclosureSnapshot {
  asOf: string;
  asOfLabel: string;
  parcels: CountyForeclosureParcel[];
}

function decodeHtml(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/\s+/g, " ")
    .trim();
}

function parseAsOf(html: string): { iso: string; label: string } {
  const match = html.match(/All Data Below Current As Of\s+([^<]+)/i);
  const label = decodeHtml(match?.[1] || "");
  const parsed = new Date(label);
  if (!label || Number.isNaN(parsed.getTime())) {
    throw new Error("Spokane County foreclosure list date was not found.");
  }
  return { iso: parsed.toISOString(), label };
}

export function parseCountyForeclosureHtml(html: string): CountyForeclosureSnapshot {
  const asOf = parseAsOf(html);
  const parcels = [...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].flatMap((row) => {
    const cells = [...row[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((cell) => decodeHtml(cell[1]));
    if (cells.length < 6 || !/^\d{5}\.\d{4}$/.test(cells[0])) return [];

    const hrefMatch = row[1].match(/href=["']([^"']*ParcelDetail\.aspx[^"']*)["']/i);
    const listedAmount = Number(cells[5].replace(/[$,]/g, ""));
    if (!hrefMatch || !Number.isFinite(listedAmount)) return [];

    return [{
      parcelId: cells[0],
      address: cells[1],
      city: cells[2],
      listedAmount,
      detailUrl: new URL(decodeHtml(hrefMatch[1]), COUNTY_FORECLOSURE_LIST_URL).toString(),
    }];
  });

  const unique = [...new Map(parcels.map((parcel) => [parcel.parcelId, parcel])).values()];
  if (!unique.length) throw new Error("Spokane County foreclosure list contained no parcel rows.");
  return { asOf: asOf.iso, asOfLabel: asOf.label, parcels: unique };
}

export async function fetchCountyForeclosureSnapshot(): Promise<CountyForeclosureSnapshot> {
  const response = await fetch(COUNTY_FORECLOSURE_LIST_URL, {
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(`Spokane County foreclosure list returned ${response.status}.`);
  return parseCountyForeclosureHtml(await response.text());
}

function formatAmount(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function signalsFromCountyForeclosures(snapshot: CountyForeclosureSnapshot): ParcelDistressSignal[] {
  const filedListSources = new Date(snapshot.asOf).getUTCFullYear() === 2026
    ? [{ label: "2026 filed foreclosure list", url: COUNTY_FORECLOSURE_PDF_URL, kind: "official" as const, checkedAt: snapshot.asOf }]
    : [];
  return snapshot.parcels.map((parcel) => ({
    id: `county_foreclosure:${parcel.parcelId}`,
    parcelId: parcel.parcelId,
    category: "county_foreclosure",
    title: "County tax foreclosure list",
    summary: `Spokane County lists this parcel in its current tax-foreclosure action with ${formatAmount(parcel.listedAmount)} reported outstanding.`,
    confidence: "high",
    status: "active",
    eventAt: snapshot.asOf,
    checkedAt: snapshot.asOf,
    sources: [
      { label: "Spokane County Treasurer parcel detail", url: parcel.detailUrl, kind: "official", checkedAt: snapshot.asOf },
      ...filedListSources,
    ],
    facts: [
      { label: "Listed amount", value: formatAmount(parcel.listedAmount) },
      { label: "County list address", value: [parcel.address, parcel.city].filter(Boolean).join(", ") },
      { label: "List current as of", value: snapshot.asOf },
    ],
    lazarusLeadIds: [],
  }));
}
