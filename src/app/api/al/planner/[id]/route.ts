import { NextRequest, NextResponse } from "next/server";
import { updatePlannerTask, type PlannerTaskAssignee, type PlannerTaskStatus } from "@/lib/al-planner";
import { isAuthenticatedAlSession } from "@/lib/al-review";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = request.cookies.get("al_session");
  if (!isAuthenticatedAlSession(session?.value)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id: rawId } = await context.params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid planner task id." }, { status: 400 });
  }

  let body: {
    title?: string;
    details?: string;
    dueDate?: string | null;
    assignedTo?: PlannerTaskAssignee;
    status?: PlannerTaskStatus;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const task = await updatePlannerTask(id, {
    title: body.title,
    details: body.details,
    dueDate: body.dueDate,
    assignedTo: body.assignedTo,
    status: body.status,
  });

  return NextResponse.json({ ok: true, task });
}
