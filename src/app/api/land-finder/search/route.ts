import { NextRequest, NextResponse } from "next/server";
import { hasLandFinderSession } from "@/lib/land-finder/auth";
import { searchParcels } from "@/lib/land-finder/gis";
import type { LandMode } from "@/lib/land-finder/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!(await hasLandFinderSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const query = request.nextUrl.searchParams.get("q")?.trim() || "";
  const mode: LandMode = request.nextUrl.searchParams.get("mode") === "expanded" ? "expanded" : "vacant";
  if (query.length < 3 || query.length > 80) {
    return NextResponse.json({ error: "Enter an APN or at least 3 address characters" }, { status: 400 });
  }

  try {
    const parcels = await searchParcels(query, mode);
    return NextResponse.json(
      { parcels, source: "Spokane County Assessor SCOUTSimple" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Land Finder parcel search failed", error);
    return NextResponse.json(
      { error: "County parcel search is temporarily unavailable" },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
