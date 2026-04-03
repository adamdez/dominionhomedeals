import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ALLOWED_COUNTRIES = new Set(["US"]);
const ALLOWED_BOT_PATTERNS = [
  /Googlebot/i,
  /AdsBot-Google/i,
  /Google-InspectionTool/i,
  /Mediapartners-Google/i,
  /Bingbot/i,
  /DuckDuckBot/i,
  /facebookexternalhit/i,
  /Twitterbot/i,
  /LinkedInBot/i,
  /Slackbot/i,
  /WhatsApp/i,
];

function isAllowedBot(userAgent: string): boolean {
  return ALLOWED_BOT_PATTERNS.some((pattern) => pattern.test(userAgent));
}

function shouldBlockByCountry(request: NextRequest): boolean {
  const userAgent = request.headers.get("user-agent") ?? "";
  if (isAllowedBot(userAgent)) return false;

  const country = request.headers.get("x-vercel-ip-country")?.toUpperCase();
  if (!country) return false;

  return !ALLOWED_COUNTRIES.has(country);
}

function blockedCountryResponse(request: NextRequest): NextResponse {
  const country = request.headers.get("x-vercel-ip-country")?.toUpperCase() ?? "UNKNOWN";
  const acceptsHtml = (request.headers.get("accept") ?? "").includes("text/html");

  if (acceptsHtml) {
    return new NextResponse(
      `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Access Restricted | Dominion Homes</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 24px;
        background: #f7f5ef;
        color: #2f2a22;
        font-family: Georgia, serif;
      }
      main {
        max-width: 640px;
        background: #fffdf8;
        border: 1px solid #ded8c8;
        border-radius: 18px;
        padding: 32px;
        box-shadow: 0 18px 48px rgba(47, 42, 34, 0.08);
      }
      h1 {
        margin: 0 0 12px;
        font-size: 32px;
      }
      p {
        line-height: 1.6;
        margin: 0 0 12px;
      }
      strong {
        color: #5c4720;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Access Restricted</h1>
      <p>Dominion Homes currently serves visitors located in the United States only.</p>
      <p>If you believe this is a mistake, please call or text <strong>509-822-5460</strong>.</p>
      <p>Request country: <strong>${country}</strong></p>
    </main>
  </body>
</html>`,
      {
        status: 403,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
        },
      },
    );
  }

  return NextResponse.json(
    { error: "Access restricted to United States traffic", country },
    { status: 403, headers: { "Cache-Control": "no-store" } },
  );
}

export function middleware(request: NextRequest) {
  if (shouldBlockByCountry(request)) {
    return blockedCountryResponse(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images|fonts|icons).*)"],
};
