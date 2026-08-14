import type { SupabaseClient } from "@supabase/supabase-js";
import type { ParcelSignalSummary } from "@/lib/land-finder/types";
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

let cached: { expiresAt: number; summaries: ParcelSignalSummary[] } | null = null;
let inflight: Promise<ParcelSignalSummary[]> | null = null;

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

export async function fetchParcelSignalSummaries(
  client: SupabaseClient,
  options: { bypassCache?: boolean; now?: Date } = {},
): Promise<ParcelSignalSummary[]> {
  const now = options.now || new Date();
  if (!options.bypassCache && cached && cached.expiresAt > now.getTime()) return cached.summaries;
  if (!options.bypassCache && inflight) return inflight;

  const load = async () => {
    const summaries = buildParcelSignalSummaries(await readSourceRows(client), now);
    cached = { expiresAt: now.getTime() + CACHE_MS, summaries };
    return summaries;
  };

  inflight = load();
  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}

export function clearParcelSignalCache() {
  cached = null;
  inflight = null;
}
