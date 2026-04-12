import { NextRequest, NextResponse } from "next/server";
import {
  createInboxItem,
  listInboxItems,
  type InboxBusiness,
  type InboxLane,
} from "@/lib/al-inbox";
import { isAuthenticatedAlSession } from "@/lib/al-review";

export async function GET(request: NextRequest) {
  const session = request.cookies.get("al_session");
  if (!isAuthenticatedAlSession(session?.value)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const items = await listInboxItems();
  return NextResponse.json({ ok: true, items });
}

export async function POST(request: NextRequest) {
  const session = request.cookies.get("al_session");
  if (!isAuthenticatedAlSession(session?.value)) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: {
    title?: string;
    body?: string;
    business?: InboxBusiness;
    lane?: InboxLane;
    createdBy?: string;
    source?: string;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.body || !body.body.trim()) {
    return NextResponse.json({ error: "Inbox item body is required." }, { status: 400 });
  }

  const item = await createInboxItem({
    title: body.title,
    body: body.body,
    business: body.business,
    lane: body.lane,
    createdBy: body.createdBy || "Authenticated AL operator",
    source: body.source || "al_inbox_ui",
  });

  return NextResponse.json({ ok: true, item });
}
