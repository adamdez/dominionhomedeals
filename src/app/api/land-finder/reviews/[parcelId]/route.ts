import { NextResponse } from "next/server";
import { hasLandFinderSession } from "@/lib/land-finder/auth";
import {
  isSpokaneParcelId,
  parseReviewInput,
  reviewInputToRow,
  reviewRowToModel,
} from "@/lib/land-finder/reviews";
import { getLandFinderServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  context: { params: Promise<{ parcelId: string }> },
) {
  if (!(await hasLandFinderSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { parcelId: encodedParcelId } = await context.params;
  const parcelId = decodeURIComponent(encodedParcelId);
  const input = parseReviewInput(await request.json().catch(() => null));
  if (!isSpokaneParcelId(parcelId) || !input) {
    return NextResponse.json({ error: "Invalid review" }, { status: 400 });
  }

  const supabase = getLandFinderServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Review sync is not configured", code: "persistence_unavailable" },
      { status: 503 },
    );
  }

  const { data, error } = await supabase
    .from("lazarus_land_finder_reviews")
    .upsert(reviewInputToRow(parcelId, input), { onConflict: "parcel_id" })
    .select("*")
    .single();
  if (error || !data) {
    return NextResponse.json(
      { error: "Review could not be synced", code: "persistence_unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    { review: reviewRowToModel(data) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
