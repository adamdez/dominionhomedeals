import { NextRequest, NextResponse } from "next/server";
import {
  isAuthenticatedAlSession,
  syncBrowserCommerceReviewJob,
  type ReviewArtifactUploadInput,
} from "@/lib/al-review";

interface SyncRequestBody {
  bridgeResult?: Record<string, unknown>;
  artifacts?: Record<string, ReviewArtifactUploadInput | undefined>;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ jobId: string }> },
) {
  const session = request.cookies.get("al_session");
  if (!isAuthenticatedAlSession(session?.value)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { jobId: rawJobId } = await context.params;
  const jobId = Number(rawJobId);
  if (!Number.isInteger(jobId) || jobId <= 0) {
    return NextResponse.json({ error: "Invalid review job id." }, { status: 400 });
  }

  let body: SyncRequestBody;
  try {
    body = (await request.json()) as SyncRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  try {
    const synced = await syncBrowserCommerceReviewJob({
      jobId,
      origin: request.nextUrl.origin,
      host: request.headers.get("host"),
      browserResult:
        body.bridgeResult && typeof body.bridgeResult === "object" ? body.bridgeResult : {},
      artifacts: body.artifacts,
    });

    return NextResponse.json({
      ok: true,
      reviewPageUrl: synced.reviewPageUrl,
      reviewState: synced.reviewState,
      reviewSurface: synced.reviewSurface,
      nextAction: synced.nextAction,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not sync browser-commerce review.";
    const status = /not found/i.test(message) ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
