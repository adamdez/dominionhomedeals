import { NextRequest, NextResponse } from "next/server";
import { fetchParcelView, MAX_PARCELS_PER_VIEW, SPOKANE_COUNTY_BOUNDS } from "@/lib/land-finder/gis";
import { hasLandFinderSession } from "@/lib/land-finder/auth";
import type { LandMode } from "@/lib/land-finder/types";

export const dynamic = "force-dynamic";

function parseNumber(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseBbox(value: string | null): [number, number, number, number] | null {
  const values = value?.split(",").map(Number) || [];
  if (values.length !== 4 || values.some((part) => !Number.isFinite(part))) return null;
  const [west, south, east, north] = values;
  if (west >= east || south >= north) return null;
  if (
    east < SPOKANE_COUNTY_BOUNDS.west ||
    west > SPOKANE_COUNTY_BOUNDS.east ||
    north < SPOKANE_COUNTY_BOUNDS.south ||
    south > SPOKANE_COUNTY_BOUNDS.north
  ) {
    return null;
  }
  return [west, south, east, north];
}

export async function GET(request: NextRequest) {
  if (!(await hasLandFinderSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bbox = parseBbox(request.nextUrl.searchParams.get("bbox"));
  const minAcres = Math.max(0, parseNumber(request.nextUrl.searchParams.get("minAcres"), 0.5));
  const maxAcres = Math.min(100_000, parseNumber(request.nextUrl.searchParams.get("maxAcres"), 100_000));
  const mode: LandMode = request.nextUrl.searchParams.get("mode") === "expanded" ? "expanded" : "vacant";
  if (!bbox || minAcres > maxAcres) {
    return NextResponse.json({ error: "Invalid parcel view" }, { status: 400 });
  }

  try {
    const result = await fetchParcelView({ bbox, minAcres, maxAcres, mode });
    if (result.total > MAX_PARCELS_PER_VIEW) {
      return NextResponse.json(
        { error: "zoom_required", total: result.total, limit: MAX_PARCELS_PER_VIEW },
        { status: 422, headers: { "Cache-Control": "no-store" } },
      );
    }
    return NextResponse.json(
      { ...result, source: "Spokane County Assessor SCOUTSimple", retrievedAt: new Date().toISOString() },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Land Finder parcel query failed", error);
    return NextResponse.json(
      { error: "County parcel service is temporarily unavailable" },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
