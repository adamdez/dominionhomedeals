import { NextRequest, NextResponse } from "next/server";
import {
  BOARDROOM_ALLOWED_ACTIONS,
  BoardroomDecisionError,
  applyBoardroomDecision,
} from "@/lib/al-review-decisions";
import { isAuthenticatedAlSession, type ReviewDecisionAction } from "@/lib/al-review";

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
    return NextResponse.json({ error: "Invalid Board Room presentation id." }, { status: 400 });
  }

  let body: {
    action?: ReviewDecisionAction;
    note?: string;
    selectedAlternative?: string;
  };
  try {
    body = (await request.json()) as {
      action?: ReviewDecisionAction;
      note?: string;
      selectedAlternative?: string;
    };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.action || !BOARDROOM_ALLOWED_ACTIONS.has(body.action)) {
    return NextResponse.json({ error: "Unknown review action." }, { status: 400 });
  }

  try {
    const result = await applyBoardroomDecision({
      jobId,
      action: body.action,
      note: body.note,
      selectedAlternative: body.selectedAlternative,
      actor: "Authenticated AL operator",
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof BoardroomDecisionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Board Room decision failed." },
      { status: 500 },
    );
  }
}
