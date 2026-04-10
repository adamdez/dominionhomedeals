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
  "close_presentation",
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
    return NextResponse.json({ error: "Invalid Board Room presentation id." }, { status: 400 });
  }

  const job = await fetchAlJob(jobId);
  if (!job) {
    return NextResponse.json({ error: "Board Room presentation not found." }, { status: 404 });
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
  const isBrowserCommercePresentation =
    job.job_type === "browser_commerce_design" &&
    Boolean(contextValue.review_surface && typeof contextValue.review_surface === "object");
  const hasGenericPresentation =
    (typeof contextValue.presentation_title === "string" && contextValue.presentation_title.trim()) ||
    (typeof contextValue.presentation_body === "string" && contextValue.presentation_body.trim()) ||
    (typeof job.result === "string" && job.result.trim());

  if (!isBrowserCommercePresentation && !hasGenericPresentation) {
    return NextResponse.json({ error: "Board Room presentation not found." }, { status: 404 });
  }

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
  const nextAction = isBrowserCommercePresentation
    ? nextState === "approved_for_checkout"
      ? "The recommendation is approved for checkout readiness. Resume the live vendor cart only when you are ready to inspect it before any manual checkout."
      : nextState === "changes_requested"
        ? "Changes were requested. Update the recommendation package, then return to Board Room with the revised presentation."
        : nextState === "resume_local_session_required"
          ? "Resume the local execution session on Dez's machine to inspect or recover the live vendor cart before any further review."
          : "The execution path is blocked and needs repair before this presentation can move forward."
    : nextState === "approved_for_checkout"
      ? "The recommendation is approved. AL can continue the chosen execution path and return with the next review checkpoint."
      : nextState === "presentation_closed"
        ? "This presentation is closed. It stays in the audit trail, but it is removed from the active Board Room queue."
      : nextState === "changes_requested"
        ? "Changes were requested. Update the presentation, keep the recommendation tight, and return to Board Room with the revised package."
        : nextState === "resume_local_session_required"
          ? "Resume the active execution lane before this presentation can move forward."
          : "The execution path is blocked and needs repair before this presentation can move forward.";

  const updatedContext = {
    ...contextValue,
    review_state: nextState,
    presentation_status_label:
      nextState === "presentation_closed"
        ? "closed"
        : contextValue.presentation_status_label || null,
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
