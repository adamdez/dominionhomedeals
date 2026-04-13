import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  getAlCanonicalHost,
  isBorelandRootHost,
  isPrivateAlSurfaceHost,
  normalizeHost,
} from "@/lib/al-platform";

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

function withPathHeader(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set("x-pathname", request.nextUrl.pathname);
  return headers;
}

function nextWithPath(request: NextRequest) {
  return NextResponse.next({ request: { headers: withPathHeader(request) } });
}

function rewriteWithPath(request: NextRequest, url: URL) {
  return NextResponse.rewrite(url, { request: { headers: withPathHeader(request) } });
}

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
  const host = normalizeHost(request.headers.get("host"));
  const isPrivateHost = isPrivateAlSurfaceHost(host);
  const brandName = isPrivateHost ? "Boreland Ops" : "Dominion Homes";
  const contactLine = isPrivateHost
    ? "This private operating system is restricted to approved access."
    : "If you believe this is a mistake, please call or text 509-822-5460.";

  if (acceptsHtml) {
    return new NextResponse(
      `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Access Restricted | ${brandName}</title>
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
      <p>${brandName} currently serves visitors located in the United States only.</p>
      <p>${contactLine}</p>
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
    { error: "Access restricted to United States traffic", country, brand: brandName },
    { status: 403, headers: { "Cache-Control": "no-store" } },
  );
}

function hasFileExtension(pathname: string): boolean {
  return /\/[^/]+\.[a-z0-9]+$/i.test(pathname);
}

function isStaticLikePath(pathname: string): boolean {
  return (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/fonts/") ||
    pathname.startsWith("/icons/") ||
    pathname === "/favicon.ico" ||
    pathname === "/manifest.webmanifest" ||
    hasFileExtension(pathname)
  );
}

function redirectToCanonicalAlPath(request: NextRequest): NextResponse | null {
  const pathname = request.nextUrl.pathname;
  if (pathname === "/al" || pathname.startsWith("/al/")) {
    const stripped = pathname.replace(/^\/al/, "") || "/";
    const nextUrl = request.nextUrl.clone();
    nextUrl.pathname = stripped;
    return NextResponse.redirect(nextUrl, 308);
  }
  return null;
}

function rewriteCanonicalAlHost(request: NextRequest): NextResponse | null {
  const pathname = request.nextUrl.pathname;
  if (pathname === "/robots.txt") {
    const nextUrl = request.nextUrl.clone();
    nextUrl.pathname = "/private-robots.txt";
    return rewriteWithPath(request, nextUrl);
  }

  if (pathname === "/sitemap.xml") {
    return new NextResponse("Not Found", { status: 404 });
  }

  if (pathname.startsWith("/api/") || isStaticLikePath(pathname)) {
    return null;
  }

  const redirect = redirectToCanonicalAlPath(request);
  if (redirect) return redirect;

  const nextUrl = request.nextUrl.clone();
  nextUrl.pathname = pathname === "/" ? "/al" : `/al${pathname}`;
  return rewriteWithPath(request, nextUrl);
}

function rewriteBorelandRootHost(request: NextRequest): NextResponse | null {
  const pathname = request.nextUrl.pathname;

  if (pathname === "/robots.txt") {
    const nextUrl = request.nextUrl.clone();
    nextUrl.pathname = "/private-robots.txt";
    return rewriteWithPath(request, nextUrl);
  }

  if (pathname === "/sitemap.xml") {
    return new NextResponse("Not Found", { status: 404 });
  }

  if (pathname.startsWith("/api/")) {
    return new NextResponse("Not Found", { status: 404 });
  }

  if (pathname === "/app" || pathname.startsWith("/app/")) {
    const nextUrl = request.nextUrl.clone();
    nextUrl.hostname = getAlCanonicalHost();
    nextUrl.pathname = pathname.replace(/^\/app/, "") || "/";
    return NextResponse.redirect(nextUrl, 308);
  }

  if (isStaticLikePath(pathname)) {
    return null;
  }

  const nextUrl = request.nextUrl.clone();
  nextUrl.pathname = "/borelandops-root";
  return rewriteWithPath(request, nextUrl);
}

export function middleware(request: NextRequest) {
  if (shouldBlockByCountry(request)) {
    return blockedCountryResponse(request);
  }

  const host = normalizeHost(request.headers.get("host"));
  if (host === getAlCanonicalHost()) {
    const rewritten = rewriteCanonicalAlHost(request);
    if (rewritten) {
      if (isPrivateAlSurfaceHost(host)) {
        rewritten.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
      }
      return rewritten;
    }
  }

  if (isBorelandRootHost(host)) {
    const rewritten = rewriteBorelandRootHost(request);
    if (rewritten) {
      rewritten.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
      return rewritten;
    }
  }

  const response = nextWithPath(request);
  if (isPrivateAlSurfaceHost(host)) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images|fonts|icons).*)"],
};
