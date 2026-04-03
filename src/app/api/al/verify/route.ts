import { NextRequest, NextResponse } from "next/server";

const SESSION_VALUE = "al_authenticated_v1";

export async function GET(request: NextRequest) {
  const cookie = request.cookies.get("al_session");
  return NextResponse.json({
    authenticated: cookie?.value === SESSION_VALUE,
  });
}

export async function POST(request: NextRequest) {
  const { password } = await request.json();
  const correct = (process.env.AL_ACCESS_PASSWORD || "dominion2024").trim();

  if (password !== correct) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set("al_session", SESSION_VALUE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  return response;
}
