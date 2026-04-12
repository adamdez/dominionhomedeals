export const dynamic = "force-dynamic";

export function GET() {
  return new Response("User-agent: *\nDisallow: /\n", {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}
