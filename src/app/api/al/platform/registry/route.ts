import { NextRequest, NextResponse } from "next/server";
import {
  buildBusinessManagerSummaries,
  getAlBusinessRegistrySnapshot,
} from "@/lib/al-business-registry";
import {
  getAlCanonicalHost,
  getAlCanonicalOrigin,
} from "@/lib/al-platform";
import { isAuthenticatedAlSession } from "@/lib/al-review";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = request.cookies.get("al_session");
  if (!isAuthenticatedAlSession(session?.value)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const host = request.headers.get("host");
  const origin = request.nextUrl.origin;
  const modules = getAlBusinessRegistrySnapshot();
  const managerSummaries = await buildBusinessManagerSummaries({ host, origin });

  return NextResponse.json({
    ok: true,
    platform: {
      canonicalHost: getAlCanonicalHost(),
      canonicalOrigin: getAlCanonicalOrigin(),
      requestHost: host,
      requestOrigin: origin,
    },
    modules,
    managerSummaries,
  });
}
