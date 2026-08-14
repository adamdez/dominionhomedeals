import { NextResponse } from "next/server";
import {
  createLandFinderSession,
  isLandFinderAuthConfigured,
  landFinderPasswordMatches,
  LAND_FINDER_COOKIE,
  LAND_FINDER_SESSION_SECONDS,
} from "@/lib/land-finder/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isLandFinderAuthConfigured()) {
    return NextResponse.json(
      { error: "Land Finder access is not configured" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const body = (await request.json().catch(() => null)) as { password?: unknown } | null;
  if (!body || typeof body.password !== "string" || !landFinderPasswordMatches(body.password)) {
    return NextResponse.json(
      { error: "Incorrect password" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const response = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  response.cookies.set(LAND_FINDER_COOKIE, createLandFinderSession(), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: LAND_FINDER_SESSION_SECONDS,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  response.cookies.set(LAND_FINDER_COOKIE, "", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}
