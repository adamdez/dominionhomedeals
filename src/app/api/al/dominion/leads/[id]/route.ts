import { NextRequest, NextResponse } from "next/server";
import {
  describeDominionLeadHealth,
  type DominionLeadOwner,
  type DominionLeadStatus,
  updateDominionLead,
} from "@/lib/dominion-leads";
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
    return NextResponse.json({ error: "Invalid Dominion lead id." }, { status: 400 });
  }

  let body: {
    status?: DominionLeadStatus;
    owner?: DominionLeadOwner;
    nextActionDueDate?: string | null;
    notes?: string;
    markTouchedNow?: boolean;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const lead = await updateDominionLead(id, body);
  return NextResponse.json({
    ok: true,
    lead,
    health: describeDominionLeadHealth(lead),
  });
}
