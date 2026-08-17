import type { SupabaseClient } from "@supabase/supabase-js";
import type { ParcelFeatureCollection, ParcelSignalSummary } from "@/lib/land-finder/types";
import {
  fetchCountyForeclosureSnapshot,
  signalsFromCountyForeclosures,
} from "@/lib/land-finder/county-foreclosures";
import { fetchParcelsByIds } from "@/lib/land-finder/gis";
import {
  buildParcelSignalSummaries,
  type LazarusSignalLead,
} from "@/lib/land-finder/signals";

const PAGE_SIZE = 1000;
const MAX_SOURCE_ROWS = 5000;
const CACHE_MS = 2 * 60 * 1000;
const SIGNAL_TAGS = [
  "tax",
  "urgent_tax",
  "pre_foreclosure",
  "early_distress",
  "probate",
  "pre_probate",
  "death_pipeline",
  "driveby",
];

const RELEVANT_FILTER = [
  ...SIGNAL_TAGS.map((tag) => `tags.cs.["${tag}"]`),
  "source_details->>sourceType.ilike.*Tax*",
  "source_details->>sourceType.eq.Sentinel Active",
  "source_details->>sourceType.eq.Drive-by",
  "source_details->>sourceType.ilike.*Enforcement*",
].join(",");

export interface ParcelSignalData {
  summaries: ParcelSignalSummary[];
  highlightParcels: ParcelFeatureCollection;
  countyForeclosure: {
    available: boolean;
    asOf: string | null;
    parcelCount: number;
    geometryCount: number;
  };
  sources: string[];
}

let cached: { expiresAt: number; data: ParcelSignalData } | null = null;
let inflight: Promise<ParcelSignalData> | null = null;

async function readSourceRows(client: SupabaseClient): Promise<LazarusSignalLead[]> {
  const rows: LazarusSignalLead[] = [];
  for (let offset = 0; offset < MAX_SOURCE_ROWS; offset += PAGE_SIZE) {
    const { data, error } = await client
      .from("lazarus_leads")
      .select("id,tags,source_details,status,created_at,last_touched_at")
      .or(RELEVANT_FILTER)
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw new Error(`Distress source read failed: ${error.message}`);
    rows.push(...((data || []) as LazarusSignalLead[]));
    if (!data || data.length < PAGE_SIZE) break;
  }
  return rows;
}

export async function fetchParcelSignalData(
  client: SupabaseClient | null,
  options: { bypassCache?: boolean; now?: Date } = {},
): Promise<ParcelSignalData> {
  const now = options.now || new Date();
  if (!options.bypassCache && cached && cached.expiresAt > now.getTime()) return cached.data;
  if (!options.bypassCache && inflight) return inflight;

  const load = async () => {
    const [lazarusResult, countyResult] = await Promise.allSettled([
      client ? readSourceRows(client) : Promise.resolve([]),
      fetchCountyForeclosureSnapshot(),
    ]);
    if (lazarusResult.status === "rejected" && countyResult.status === "rejected") {
      throw new Error(`All distress sources failed: ${lazarusResult.reason}; ${countyResult.reason}`);
    }

    const leads = lazarusResult.status === "fulfilled" ? lazarusResult.value : [];
    const countySnapshot = countyResult.status === "fulfilled" ? countyResult.value : null;
    if (countyResult.status === "rejected") {
      console.error("Land Finder county foreclosure source failed", countyResult.reason);
    }
    const countySignals = countySnapshot ? signalsFromCountyForeclosures(countySnapshot) : [];
    const summaries = buildParcelSignalSummaries(leads, now, countySignals);
    let highlightParcels: ParcelFeatureCollection = { type: "FeatureCollection", features: [] };
    if (countySnapshot) {
      try {
        highlightParcels = await fetchParcelsByIds(countySnapshot.parcels.map((parcel) => parcel.parcelId));
      } catch (error) {
        console.error("Land Finder county foreclosure geometry query failed", error);
      }
    }

    const data: ParcelSignalData = {
      summaries,
      highlightParcels,
      countyForeclosure: {
        available: Boolean(countySnapshot),
        asOf: countySnapshot?.asOf || null,
        parcelCount: countySnapshot?.parcels.length || 0,
        geometryCount: highlightParcels.features.length,
      },
      sources: [
        ...(lazarusResult.status === "fulfilled" && client ? ["Lazarus parcel-linked Dominion distress pipelines"] : []),
        ...(countySnapshot ? ["Spokane County Treasurer foreclosure list"] : []),
      ],
    };
    cached = { expiresAt: now.getTime() + CACHE_MS, data };
    return data;
  };

  inflight = load();
  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}

export async function fetchParcelSignalSummaries(
  client: SupabaseClient,
  options: { bypassCache?: boolean; now?: Date } = {},
): Promise<ParcelSignalSummary[]> {
  return (await fetchParcelSignalData(client, options)).summaries;
}

export function clearParcelSignalCache() {
  cached = null;
  inflight = null;
}
