import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
          formats: ["image/avif", "image/webp"],
          deviceSizes: [640, 750, 828, 1080, 1200, 1920],
          imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
          minimumCacheTTL: 60 * 60 * 24 * 30,
    },
    async rewrites() {
          return {
            beforeFiles: [
              {
                source: "/:path*",
                has: [{ type: "host", value: "al.dominionhomedeals.com" }],
                destination: "/al/:path*",
              },
            ],
          };
    },
    async redirects() {
          return [
            {
                      source: "/privacy-policy",
                      destination: "/privacy",
                      permanent: true,
            },
            {
                      source: "/terms-and-conditions",
                      destination: "/terms",
                      permanent: true,
            },
            {
                      source: "/al/:path*",
                      has: [{ type: "host", value: "(?:www\\.)?dominionhomedeals\\.com" }],
                      destination: "https://al.dominionhomedeals.com/:path*",
                      permanent: true,
            },
                ];
    },
    async headers() {
          return [
            {
                      source: "/(.*)",
                      headers: [
                        { key: "X-Frame-Options", value: "DENY" },
                        { key: "X-Content-Type-Options", value: "nosniff" },
                        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
                        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
                        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
                                ],
            },
                ];
    },
};

export default nextConfig;
