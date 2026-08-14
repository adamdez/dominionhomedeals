import { NextResponse } from "next/server";
import { hasLandFinderSession } from "@/lib/land-finder/auth";
import { fetchParcelsByIds } from "@/lib/land-finder/gis";
import { reviewRowToModel } from "@/lib/land-finder/reviews";
import { getLandFinderServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await hasLandFinderSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getLandFinderServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Review sync is not configured", code: "persistence_unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { data, error } = await supabase
    .from("lazarus_land_finder_reviews")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(5000);
  if (error) {
    return NextResponse.json(
      { error: "Review sync is not ready", code: "persistence_unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const reviews = (data || []).map((row) => reviewRowToModel(row));
  const savedParcels = await fetchParcelsByIds(
    reviews.filter((review) => review.favorite).map((review) => review.parcelId),
  ).catch(() => ({ type: "FeatureCollection" as const, features: [] }));

  return NextResponse.json(
    { reviews, savedParcels },
    { headers: { "Cache-Control": "no-store" } },
  );
}
