import type { MetadataRoute } from "next";
import { SITE } from "@/lib/constants";
import { PUBLIC_CRAWLER_TOKENS } from "@/lib/crawler-access";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: "/api/",
      },
      ...PUBLIC_CRAWLER_TOKENS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: "/api/",
      })),
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
