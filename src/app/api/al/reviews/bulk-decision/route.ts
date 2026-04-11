import { NextRequest, NextResponse } from "next/server";
import {
  BOARDROOM_QUEUE_ACTIONS,
  BoardroomDecisionError,
  applyBoardroomDecision,
} from "@/lib/al-review-decisions";
import { isAuthenticatedAlSession, type ReviewDecisionAction } from "@/lib/al-review";

type BulkDecisionResult =
  | {
      jobId: number;
      ok: true;
      reviewState: string;
      nextAction: string;
    }
  | {
      jobId: number;
      ok: false;
      error: string;
      status: number;
    };

export async function POST(request: NextRequest) {
  const session = request.cookies.get("al_session");
  if (!isAuthenticatedAlSession(session?.value)) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: {
    action?: ReviewDecisionAction;
    jobIds?: unknown;
  };
  try {
    body = (await request.json()) as {
      action?: ReviewDecisionAction;
      jobIds?: unknown;
    };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.action || !BOARDROOM_QUEUE_ACTIONS.has(body.action)) {
    return NextResponse.json({ error: "Unknown bulk Board Room action." }, { status: 400 });
  }

  const jobIds = Array.isArray(body.jobIds)
    ? Array.from(
        new Set(
          body.jobIds
            .map((value) => Number(value))
            .filter((value) => Number.isInteger(value) && value > 0),
        ),
      )
    : [];

  if (jobIds.length === 0) {
    return NextResponse.json(
      { error: "At least one Board Room presentation id is required." },
      { status: 400 },
    );
  }

  const results: BulkDecisionResult[] = [];

  for (const jobId of jobIds) {
    try {
      const result = await applyBoardroomDecision({
        jobId,
        action: body.action,
        actor: "Authenticated AL operator",
      });
      results.push({
        jobId,
        ok: true,
        reviewState: result.reviewState,
        nextAction: result.nextAction,
      });
    } catch (error) {
      if (error instanceof BoardroomDecisionError) {
        results.push({
          jobId,
          ok: false,
          error: error.message,
          status: error.status,
        });
        continue;
      }

      results.push({
        jobId,
        ok: false,
        error: error instanceof Error ? error.message : "Board Room bulk decision failed.",
        status: 500,
      });
    }
  }

  const successIds = results.filter((result) => result.ok).map((result) => result.jobId);
  const failures = results.filter(
    (result): result is Extract<BulkDecisionResult, { ok: false }> => !result.ok,
  );

  return NextResponse.json({
    ok: failures.length === 0,
    action: body.action,
    results,
    successIds,
    failureCount: failures.length,
    processedCount: successIds.length,
  });
}
