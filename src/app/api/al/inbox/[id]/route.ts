import { NextRequest, NextResponse } from "next/server";
import {
  updateInboxItem,
  type InboxBusiness,
  type InboxLane,
  type InboxItemStatus,
} from "@/lib/al-inbox";
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
  const id = Number.parseInt(rawId, 10);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid inbox item id." }, { status: 400 });
  }

  let body: {
    title?: string;
    body?: string;
    status?: InboxItemStatus;
    business?: InboxBusiness;
    lane?: InboxLane;
    startedAt?: string | null;
    completedAt?: string | null;
    lastError?: string | null;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  try {
    const item = await updateInboxItem(id, body);
    return NextResponse.json({ ok: true, item });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update inbox item." },
      { status: 400 },
    );
  }
}
