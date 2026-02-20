// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  response.headers.set("X-DNS-Prefetch-Control", "on");
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");

  // Audit log for lead API access
  if (request.nextUrl.pathname.startsWith("/api/leads")) {
    console.log(JSON.stringify({
      type: "LEAD_API_ACCESS",
      timestamp: new Date().toISOString(),
      ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown",
      method: request.method,
      path: request.nextUrl.pathname,
    }));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images|fonts|icons).*)"],
};
