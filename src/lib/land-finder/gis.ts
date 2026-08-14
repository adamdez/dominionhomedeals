import type {
  LandMode,
  ParcelFeature,
  ParcelFeatureCollection,
  ParcelGeometry,
  ParcelProperties,
} from "@/lib/land-finder/types";

const PARCEL_QUERY_URL =
  "https://gismo.spokanecounty.org/arcgis/rest/services/Assessor/SCOUTSimple/MapServer/0/query";
const OUT_FIELDS = [
  "PID_NUM",
  "prop_use_desc",
  "site_address",
  "site_city",
  "site_state",
  "site_zip",
  "acreage",
  "land_value",
  "asmt_year",
  "seg_status",
].join(",");

export const SPOKANE_COUNTY_BOUNDS = {
  west: -117.8533,
  south: 47.2368,
  east: -116.9824,
  north: 48.0682,
} as const;

export const MAX_PARCELS_PER_VIEW = 1750;

const EXPANDED_LAND_USES = [
  "Vacant Land",
  "Cur - Use - Ag",
  "Designated Forest Lnd",
  "Cur - Use - Open",
  "Agricultural",
] as const;

type ArcGisFeature = {
  type?: unknown;
  id?: unknown;
  geometry?: { type?: unknown; coordinates?: unknown } | null;
  properties?: Record<string, unknown> | null;
};

type ArcGisFeatureResponse = {
  type?: unknown;
  features?: ArcGisFeature[];
  exceededTransferLimit?: boolean;
  error?: { message?: string; details?: string[] };
};

type ArcGisCountResponse = {
  count?: number;
  error?: { message?: string; details?: string[] };
};

function landUseWhere(mode: LandMode): string {
  if (mode === "vacant") return "prop_use_desc = 'Vacant Land'";
  return `prop_use_desc IN (${EXPANDED_LAND_USES.map((value) => `'${value}'`).join(",")})`;
}

function escapeSqlLiteral(value: string): string {
  return value.replaceAll("'", "''");
}

function numberOrNull(value: unknown): number | null {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function textOrEmpty(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function sanitizeGeometry(value: ArcGisFeature["geometry"]): ParcelGeometry | null {
  if (!value || (value.type !== "Polygon" && value.type !== "MultiPolygon")) return null;
  if (!Array.isArray(value.coordinates)) return null;
  return { type: value.type, coordinates: value.coordinates };
}

export function sanitizeParcelFeature(feature: ArcGisFeature): ParcelFeature | null {
  const source = feature.properties;
  const geometry = sanitizeGeometry(feature.geometry);
  const parcelId = textOrEmpty(source?.PID_NUM);
  const acres = numberOrNull(source?.acreage);
  if (!source || !geometry || !parcelId || acres === null) return null;

  const useDescription = textOrEmpty(source.prop_use_desc);
  const properties: ParcelProperties = {
    parcelId,
    address: textOrEmpty(source.site_address),
    city: textOrEmpty(source.site_city),
    state: textOrEmpty(source.site_state) || "WA",
    zip: textOrEmpty(source.site_zip),
    acres,
    useDescription,
    landValue: numberOrNull(source.land_value),
    assessmentYear: numberOrNull(source.asmt_year),
    qualification: useDescription === "Vacant Land" ? "confirmed_vacant" : "verify_improvements",
  };

  return {
    type: "Feature",
    id: parcelId,
    geometry,
    properties,
  };
}

function makeParcelWhere(mode: LandMode, minAcres: number, maxAcres: number): string {
  return [
    "seg_status LIKE 'Active%'",
    `acreage >= ${minAcres}`,
    `acreage <= ${maxAcres}`,
    landUseWhere(mode),
  ].join(" AND ");
}

async function fetchArcGis<T>(params: URLSearchParams): Promise<T> {
  const response = await fetch(`${PARCEL_QUERY_URL}?${params.toString()}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`Spokane County GIS returned ${response.status}`);

  const data = (await response.json()) as T & { error?: { message?: string; details?: string[] } };
  if (data.error) {
    throw new Error([data.error.message, ...(data.error.details || [])].filter(Boolean).join(": "));
  }
  return data;
}

function geometryParams(bbox: [number, number, number, number]): Record<string, string> {
  return {
    geometry: bbox.join(","),
    geometryType: "esriGeometryEnvelope",
    inSR: "4326",
    outSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
  };
}

export async function fetchParcelView(options: {
  bbox: [number, number, number, number];
  minAcres: number;
  maxAcres: number;
  mode: LandMode;
}): Promise<{ parcels: ParcelFeatureCollection; total: number }> {
  const where = makeParcelWhere(options.mode, options.minAcres, options.maxAcres);
  const shared = { where, ...geometryParams(options.bbox) };
  const countParams = new URLSearchParams({ f: "json", returnCountOnly: "true", ...shared });
  const countData = await fetchArcGis<ArcGisCountResponse>(countParams);
  const total = countData.count || 0;

  if (total > MAX_PARCELS_PER_VIEW) {
    return { parcels: { type: "FeatureCollection", features: [] }, total };
  }

  if (total === 0) {
    return { parcels: { type: "FeatureCollection", features: [] }, total };
  }

  const featureParams = new URLSearchParams({
    f: "geojson",
    returnGeometry: "true",
    outFields: OUT_FIELDS,
    resultRecordCount: String(MAX_PARCELS_PER_VIEW),
    ...shared,
  });
  const featureData = await fetchArcGis<ArcGisFeatureResponse>(featureParams);
  const features = (featureData.features || [])
    .map(sanitizeParcelFeature)
    .filter((feature): feature is ParcelFeature => feature !== null);

  return { parcels: { type: "FeatureCollection", features }, total };
}

export async function searchParcels(query: string, mode: LandMode): Promise<ParcelFeatureCollection> {
  const normalized = query.trim();
  const parcelNumber = /^\d{5}\.\d{4}$/.test(normalized);
  const searchWhere = parcelNumber
    ? `PID_NUM = '${escapeSqlLiteral(normalized)}'`
    : `site_address LIKE '%${escapeSqlLiteral(normalized)}%'`;
  const where = `seg_status LIKE 'Active%' AND ${landUseWhere(mode)} AND ${searchWhere}`;
  const params = new URLSearchParams({
    f: "geojson",
    where,
    outFields: OUT_FIELDS,
    outSR: "4326",
    returnGeometry: "true",
    resultRecordCount: "8",
  });
  const data = await fetchArcGis<ArcGisFeatureResponse>(params);
  const features = (data.features || [])
    .map(sanitizeParcelFeature)
    .filter((feature): feature is ParcelFeature => feature !== null);
  return { type: "FeatureCollection", features };
}

export async function fetchParcelsByIds(parcelIds: string[]): Promise<ParcelFeatureCollection> {
  const uniqueIds = [...new Set(parcelIds)].filter((value) => /^\d{5}\.\d{4}$/.test(value)).slice(0, 500);
  const features: ParcelFeature[] = [];
  for (let index = 0; index < uniqueIds.length; index += 100) {
    const chunk = uniqueIds.slice(index, index + 100);
    const where = `seg_status LIKE 'Active%' AND PID_NUM IN (${chunk.map((value) => `'${value}'`).join(",")})`;
    const params = new URLSearchParams({
      f: "geojson",
      where,
      outFields: OUT_FIELDS,
      outSR: "4326",
      returnGeometry: "true",
      resultRecordCount: String(chunk.length),
    });
    const data = await fetchArcGis<ArcGisFeatureResponse>(params);
    features.push(
      ...(data.features || [])
        .map(sanitizeParcelFeature)
        .filter((feature): feature is ParcelFeature => feature !== null),
    );
  }
  return { type: "FeatureCollection", features };
}
