import { createPlannerTask, updatePlannerTask } from "@/lib/al-planner";
import {
  fetchAlJob,
  isTerminalReviewState,
  normalizeReviewState,
  parseJobContext,
  reviewActionToState,
  updateAlJobContext,
  type ReviewDecisionAction,
  type ReviewState,
} from "@/lib/al-review";

export const BOARDROOM_ALLOWED_ACTIONS = new Set<ReviewDecisionAction>([
  "approved_for_checkout",
  "changes_requested",
  "resume_local_session_required",
  "blocked_vendor_session",
  "select_alternative_option",
  "close_presentation",
  "reject_presentation",
  "delete_presentation",
]);

export const BOARDROOM_QUEUE_ACTIONS = new Set<ReviewDecisionAction>([
  "close_presentation",
  "reject_presentation",
  "delete_presentation",
]);

export interface BoardroomFollowUpTaskSummary {
  id: number;
  title: string;
  assigned_to: "dez" | "al";
  status: "open" | "done" | "cancelled";
  source_action: ReviewDecisionAction;
  created_at: string | null;
  details: string;
}

export interface BoardroomDecisionResult {
  ok: true;
  reviewState: ReviewState;
  nextAction: string;
  followUp: BoardroomFollowUpTaskSummary | null;
  selectedAlternative: string | null;
}

export class BoardroomDecisionError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "BoardroomDecisionError";
    this.status = status;
  }
}

function asContextRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function normalizeFollowUpTask(value: unknown): BoardroomFollowUpTaskSummary | null {
  const record = asContextRecord(value);
  if (!record) return null;

  const id = Number(record.id);
  if (!Number.isInteger(id) || id <= 0) return null;

  const title = typeof record.title === "string" ? record.title.trim() : "";
  const details = typeof record.details === "string" ? record.details.trim() : "";
  const status =
    record.status === "done" || record.status === "cancelled" ? record.status : "open";
  const assignedTo = record.assigned_to === "al" ? "al" : "dez";
  const sourceAction = String(record.source_action || "") as ReviewDecisionAction;

  if (!title || !sourceAction) return null;

  return {
    id,
    title,
    assigned_to: assignedTo,
    status,
    source_action: sourceAction,
    created_at: typeof record.created_at === "string" ? record.created_at : null,
    details,
  };
}

function buildFollowUpPlan(input: {
  action: ReviewDecisionAction;
  note: string;
  jobId: number;
  task: string;
  contextValue: Record<string, unknown>;
  isBrowserCommercePresentation: boolean;
}): {
  title: string;
  details: string;
  assignedTo: "dez" | "al";
} | null {
  const owner =
    typeof input.contextValue.owner === "string" && input.contextValue.owner.trim()
      ? input.contextValue.owner.trim()
      : "AL team";
  const titleSeed =
    typeof input.contextValue.presentation_title === "string" &&
    input.contextValue.presentation_title.trim()
      ? input.contextValue.presentation_title.trim()
      : input.task.trim() || `Board Room item #${input.jobId}`;
  const boardroomPath = `/al/boardroom/${input.jobId}`;
  const noteLine = input.note ? `Operator note: ${input.note}` : "";

  switch (input.action) {
    case "changes_requested":
      return {
        title: `Revise Board Room package: ${titleSeed.slice(0, 80)}`,
        assignedTo: "al",
        details: [
          `Board Room operator requested changes for job #${input.jobId}.`,
          `Owner: ${owner}`,
          input.isBrowserCommercePresentation
            ? "Update the recommendation package and return a revised Board Room review surface with proof."
            : "Update the package, tighten the recommendation, and return a revised Board Room presentation.",
          `Board Room link: ${boardroomPath}`,
          noteLine,
        ]
          .filter(Boolean)
          .join("\n"),
      };
    case "resume_local_session_required":
      return {
        title: `Resume execution for Board Room item #${input.jobId}`,
        assignedTo: "dez",
        details: [
          `Board Room operator requested resume for job #${input.jobId}.`,
          `Owner: ${owner}`,
          input.isBrowserCommercePresentation
            ? "Resume the local vendor/cart session, inspect the live state, and return with a fresh review checkpoint."
            : "Resume the execution lane that produced this presentation and return with a fresh checkpoint or clear blocker.",
          typeof input.contextValue.resume_cart_url === "string" &&
          input.contextValue.resume_cart_url.trim()
            ? `Resume URL: ${input.contextValue.resume_cart_url.trim()}`
            : "",
          `Board Room link: ${boardroomPath}`,
          noteLine,
        ]
          .filter(Boolean)
          .join("\n"),
      };
    case "blocked_vendor_session":
      return {
        title: `Unblock Board Room item #${input.jobId}`,
        assignedTo: "dez",
        details: [
          `Board Room operator marked job #${input.jobId} as blocked.`,
          `Owner: ${owner}`,
          "Repair the upstream lane or missing access, then return with either a working review package or a concrete blocker update.",
          `Board Room link: ${boardroomPath}`,
          noteLine,
        ]
          .filter(Boolean)
          .join("\n"),
      };
    case "select_alternative_option": {
      const selectedAlternative =
        typeof input.contextValue.selected_alternative_option === "string"
          ? input.contextValue.selected_alternative_option.trim()
          : "";
      return {
        title: `Pursue alternate Board Room option for item #${input.jobId}`,
        assignedTo: "al",
        details: [
          `Board Room operator selected an alternate option for job #${input.jobId}.`,
          selectedAlternative ? `Selected alternative: ${selectedAlternative}` : "",
          "Rework the package around the chosen alternative and return with an updated recommendation.",
          `Board Room link: ${boardroomPath}`,
          noteLine,
        ]
          .filter(Boolean)
          .join("\n"),
      };
    }
    default:
      return null;
  }
}

function buildNextAction(input: {
  nextState: ReviewState;
  isBrowserCommercePresentation: boolean;
}): string {
  const { nextState, isBrowserCommercePresentation } = input;
  if (isBrowserCommercePresentation) {
    if (nextState === "approved_for_checkout") {
      return "The recommendation is approved for checkout readiness. Resume the live vendor cart only when you are ready to inspect it before any manual checkout.";
    }
    if (nextState === "changes_requested") {
      return "Changes were requested. Update the recommendation package, then return to Board Room with the revised presentation.";
    }
    if (nextState === "presentation_rejected") {
      return "This presentation was rejected. It stays in the audit trail, but it is removed from the active Board Room queue.";
    }
    if (nextState === "presentation_deleted") {
      return "This presentation was removed from the active Board Room queue. The underlying job record is retained for audit.";
    }
    if (nextState === "resume_local_session_required") {
      return "Resume the local execution session on Dez's machine to inspect or recover the live vendor cart before any further review.";
    }
    if (nextState === "presentation_closed") {
      return "This presentation is closed. It stays in the audit trail, but it is removed from the active Board Room queue.";
    }
    return "The execution path is blocked and needs repair before this presentation can move forward.";
  }

  if (nextState === "approved_for_checkout") {
    return "The recommendation is approved. AL can continue the chosen execution path and return with the next review checkpoint.";
  }
  if (nextState === "presentation_closed") {
    return "This presentation is closed. It stays in the audit trail, but it is removed from the active Board Room queue.";
  }
  if (nextState === "presentation_rejected") {
    return "This presentation was rejected. It stays in the audit trail, but it is removed from the active Board Room queue.";
  }
  if (nextState === "presentation_deleted") {
    return "This presentation was removed from the active Board Room queue. The underlying job record is retained for audit.";
  }
  if (nextState === "changes_requested") {
    return "Changes were requested. Update the presentation, keep the recommendation tight, and return to Board Room with the revised package.";
  }
  if (nextState === "resume_local_session_required") {
    return "Resume the active execution lane before this presentation can move forward.";
  }
  return "The execution path is blocked and needs repair before this presentation can move forward.";
}

export async function applyBoardroomDecision(input: {
  jobId: number;
  action: ReviewDecisionAction;
  note?: string;
  selectedAlternative?: string;
  actor?: string;
}): Promise<BoardroomDecisionResult> {
  if (!BOARDROOM_ALLOWED_ACTIONS.has(input.action)) {
    throw new BoardroomDecisionError("Unknown review action.", 400);
  }

  const job = await fetchAlJob(input.jobId);
  if (!job) {
    throw new BoardroomDecisionError("Board Room presentation not found.", 404);
  }

  const contextValue = parseJobContext(job.context);
  const currentState = normalizeReviewState(contextValue.review_state);
  const isBrowserCommercePresentation =
    job.job_type === "browser_commerce_design" &&
    Boolean(contextValue.review_surface && typeof contextValue.review_surface === "object");
  const hasGenericPresentation =
    (typeof contextValue.presentation_title === "string" &&
      contextValue.presentation_title.trim()) ||
    (typeof contextValue.presentation_body === "string" &&
      contextValue.presentation_body.trim()) ||
    (typeof job.result === "string" && job.result.trim());

  if (!isBrowserCommercePresentation && !hasGenericPresentation) {
    throw new BoardroomDecisionError("Board Room presentation not found.", 404);
  }

  if (isTerminalReviewState(currentState)) {
    const existingFollowUp = normalizeFollowUpTask(contextValue.follow_up_task);
    if (BOARDROOM_QUEUE_ACTIONS.has(input.action)) {
      return {
        ok: true,
        reviewState: currentState,
        nextAction:
          typeof contextValue.next_action === "string" && contextValue.next_action.trim()
            ? contextValue.next_action.trim()
            : "This presentation is already out of the active Board Room queue.",
        followUp: existingFollowUp,
        selectedAlternative: null,
      };
    }

    throw new BoardroomDecisionError(
      "This presentation is already closed, rejected, or removed from the active Board Room queue.",
      409,
    );
  }

  const currentHistory = Array.isArray(contextValue.review_decisions)
    ? contextValue.review_decisions.filter(
        (entry): entry is Record<string, unknown> =>
          Boolean(entry) && typeof entry === "object" && !Array.isArray(entry),
      )
    : [];
  const nextState = reviewActionToState(input.action);
  const note = typeof input.note === "string" ? input.note.trim().slice(0, 2000) : "";
  const selectedAlternative =
    typeof input.selectedAlternative === "string"
      ? input.selectedAlternative.trim().slice(0, 300)
      : "";
  const timestamp = new Date().toISOString();
  const actor = input.actor?.trim() || "Authenticated AL operator";
  const nextAction = buildNextAction({
    nextState,
    isBrowserCommercePresentation,
  });

  const followUpPlan = buildFollowUpPlan({
    action: input.action,
    note,
    jobId: input.jobId,
    task: job.task,
    contextValue: {
      ...contextValue,
      selected_alternative_option:
        input.action === "select_alternative_option"
          ? selectedAlternative || null
          : contextValue.selected_alternative_option || null,
    },
    isBrowserCommercePresentation,
  });
  const existingFollowUp = normalizeFollowUpTask(contextValue.follow_up_task);
  let followUpTask = existingFollowUp;

  if (
    followUpPlan &&
    !(
      existingFollowUp &&
      existingFollowUp.status === "open" &&
      existingFollowUp.source_action === input.action
    )
  ) {
    if (existingFollowUp && existingFollowUp.status === "open") {
      await updatePlannerTask(existingFollowUp.id, {
        status: "cancelled",
      });
    }
    const plannerTask = await createPlannerTask({
      title: followUpPlan.title,
      details: followUpPlan.details,
      assignedTo: followUpPlan.assignedTo,
      createdBy: actor,
      source: `boardroom_review:${input.jobId}`,
    });
    followUpTask = {
      id: plannerTask.id,
      title: plannerTask.title,
      assigned_to: plannerTask.assignedTo,
      status: plannerTask.status,
      source_action: input.action,
      created_at: plannerTask.createdAt,
      details: plannerTask.details,
    };
  } else if (
    followUpPlan &&
    existingFollowUp &&
    existingFollowUp.status === "open" &&
    existingFollowUp.source_action === input.action
  ) {
    const plannerTask = await updatePlannerTask(existingFollowUp.id, {
      title: followUpPlan.title,
      details: followUpPlan.details,
      assignedTo: followUpPlan.assignedTo,
      status: "open",
    });
    followUpTask = {
      id: plannerTask.id,
      title: plannerTask.title,
      assigned_to: plannerTask.assignedTo,
      status: plannerTask.status,
      source_action: input.action,
      created_at: plannerTask.createdAt,
      details: plannerTask.details,
    };
  } else if (!followUpPlan) {
    if (
      existingFollowUp &&
      existingFollowUp.status === "open" &&
      BOARDROOM_QUEUE_ACTIONS.has(input.action)
    ) {
      await updatePlannerTask(existingFollowUp.id, {
        status: "cancelled",
      });
    }
    followUpTask = null;
  }

  const updatedContext = {
    ...contextValue,
    review_state: nextState,
    presentation_status_label:
      nextState === "presentation_closed"
        ? "closed"
        : nextState === "presentation_rejected"
          ? "rejected"
          : nextState === "presentation_deleted"
            ? "removed"
            : contextValue.presentation_status_label || null,
    next_action: nextAction,
    last_operator_response_at: timestamp,
    last_operator_response_action: input.action,
    presentation_closed_at:
      nextState === "presentation_closed"
        ? timestamp
        : contextValue.presentation_closed_at || null,
    presentation_rejected_at:
      nextState === "presentation_rejected"
        ? timestamp
        : contextValue.presentation_rejected_at || null,
    presentation_deleted_at:
      nextState === "presentation_deleted"
        ? timestamp
        : contextValue.presentation_deleted_at || null,
    follow_up_task: followUpTask,
    review_decisions: [
      ...currentHistory,
      {
        at: timestamp,
        actor,
        action: input.action,
        note: note || null,
        selected_alternative: selectedAlternative || null,
        resulting_state: nextState,
      },
    ],
    selected_alternative_option:
      input.action === "select_alternative_option"
        ? selectedAlternative || null
        : contextValue.selected_alternative_option || null,
  };

  await updateAlJobContext(input.jobId, updatedContext);

  return {
    ok: true,
    reviewState: nextState,
    nextAction,
    followUp: followUpTask,
    selectedAlternative: selectedAlternative || null,
  };
}
