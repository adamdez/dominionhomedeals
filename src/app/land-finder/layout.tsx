import type { Metadata, Viewport } from "next";
import "maplibre-gl/dist/maplibre-gl.css";
import "./land-finder.css";

export const metadata: Metadata = {
  title: "Land Finder",
  description: "Private Spokane County parcel research workspace.",
  robots: { index: false, follow: false, noarchive: true, nocache: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#17201d",
};

export default function LandFinderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
