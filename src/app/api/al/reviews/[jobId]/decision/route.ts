import { NextRequest, NextResponse } from "next/server";
import {
  fetchAlJob,
  isAuthenticatedAlSession,
  parseJobContext,
  reviewActionToState,
  updateAlJobContext,
  type ReviewDecisionAction,
} from "@/lib/al-review";

const ALLOWED_ACTIONS = new Set<ReviewDecisionAction>([
  "approved_for_checkout",
  "changes_requested",
  "resume_local_session_required",
  "blocked_vendor_session",
  "select_alternative_option",
]);

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

  const job = await fetchAlJob(jobId);
  if (!job || job.job_type !== "browser_commerce_design") {
    return NextResponse.json({ error: "Review job not found." }, { status: 404 });
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

  if (!body.action || !ALLOWED_ACTIONS.has(body.action)) {
    return NextResponse.json({ error: "Unknown review action." }, { status: 400 });
  }

  const contextValue = parseJobContext(job.context);
  const currentHistory = Array.isArray(contextValue.review_decisions)
    ? contextValue.review_decisions.filter(
        (entry): entry is Record<string, unknown> =>
          Boolean(entry) && typeof entry === "object" && !Array.isArray(entry),
      )
    : [];
  const nextState = reviewActionToState(body.action);
  const note = typeof body.note === "string" ? body.note.trim().slice(0, 2000) : "";
  const selectedAlternative =
    typeof body.selectedAlternative === "string" ? body.selectedAlternative.trim().slice(0, 300) : "";
  const timestamp = new Date().toISOString();
  const nextAction =
    nextState === "approved_for_checkout"
      ? "The design is approved for checkout readiness. Resume the local cart session when you are ready to inspect the live vendor cart before any manual checkout."
      : nextState === "changes_requested"
        ? "Review changes were requested. Re-run the browser/vendor flow after updating the preferred design or vendor direction."
        : nextState === "resume_local_session_required"
          ? "Resume the local cart session on Dez's machine to inspect or recover the vendor cart before any further review."
          : "Vendor session is blocked and needs repair before this browser-commerce job can move forward.";

  const updatedContext = {
    ...contextValue,
    review_state: nextState,
    next_action: nextAction,
    review_decisions: [
      ...currentHistory,
      {
        at: timestamp,
        actor: "Authenticated AL operator",
        action: body.action,
        note: note || null,
        selected_alternative: selectedAlternative || null,
        resulting_state: nextState,
      },
    ],
    selected_alternative_option:
      body.action === "select_alternative_option" ? selectedAlternative || null : contextValue.selected_alternative_option || null,
  };

  await updateAlJobContext(jobId, updatedContext);

  return NextResponse.json({
    ok: true,
    reviewState: nextState,
    nextAction,
    selectedAlternative: selectedAlternative || null,
  });
}
