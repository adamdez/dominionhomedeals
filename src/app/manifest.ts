import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AL Boreland",
    short_name: "AL",
    description: "Phone-first command center for AL, Board Room approvals, and Planner tasks.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0a0f0d",
    theme_color: "#0a0f0d",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/al-apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
