import { NextResponse } from "next/server";
import { hasLandFinderSession } from "@/lib/land-finder/auth";
import { fetchParcelSignalData } from "@/lib/land-finder/signal-store";
import { getLandFinderServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await hasLandFinderSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getLandFinderServiceClient();
  try {
    const data = await fetchParcelSignalData(supabase);
    const { summaries } = data;
    return NextResponse.json(
      {
        summaries,
        highlightParcels: data.highlightParcels,
        countyForeclosure: data.countyForeclosure,
        parcelCount: summaries.length,
        activeParcelCount: summaries.filter((summary) =>
          summary.qualification === "verified" || summary.qualification === "corroborated"
        ).length,
        retrievedAt: new Date().toISOString(),
        source: data.sources.join("; "),
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Land Finder distress signal query failed", error);
    return NextResponse.json(
      { error: "Distress intelligence is temporarily unavailable", code: "signals_unavailable" },
      { status: 503, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
