import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    experimental: {
        inlineCss: true,
    },
    images: {
          formats: ["image/avif", "image/webp"],
          deviceSizes: [640, 750, 828, 1080, 1200, 1920],
          imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
          minimumCacheTTL: 60 * 60 * 24 * 30,
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
                                ],
            },
                ];
    },
};

export default nextConfig;
