import { NextRequest, NextResponse } from "next/server";
import { createPlannerTask, listPlannerTasks } from "@/lib/al-planner";
import { isAuthenticatedAlSession } from "@/lib/al-review";

export async function GET(request: NextRequest) {
  const session = request.cookies.get("al_session");
  if (!isAuthenticatedAlSession(session?.value)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const tasks = await listPlannerTasks();
  return NextResponse.json({ ok: true, tasks });
}

export async function POST(request: NextRequest) {
  const session = request.cookies.get("al_session");
  if (!isAuthenticatedAlSession(session?.value)) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: {
    title?: string;
    details?: string;
    dueDate?: string | null;
    assignedTo?: "dez" | "al";
    createdBy?: string;
    source?: string;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.title || !body.title.trim()) {
    return NextResponse.json({ error: "Task title is required." }, { status: 400 });
  }

  const task = await createPlannerTask({
    title: body.title,
    details: body.details,
    dueDate: body.dueDate,
    assignedTo: body.assignedTo,
    createdBy: body.createdBy || "Authenticated AL operator",
    source: body.source || "planner_ui",
  });

  return NextResponse.json({ ok: true, task });
}
