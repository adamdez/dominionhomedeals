import type { Metadata, Viewport } from "next";
import { getAlCanonicalOrigin } from "@/lib/al-platform";

export const dynamic = "force-dynamic";

const AL_CANONICAL_ORIGIN = getAlCanonicalOrigin();

export const metadata: Metadata = {
  title: "Command Center",
  robots: { index: false, follow: false },
  alternates: { canonical: `${AL_CANONICAL_ORIGIN}/` },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/al-favicon-32x32.png?v=2", sizes: "32x32", type: "image/png" },
      { url: "/icons/al-favicon-16x16.png?v=2", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/icons/al-apple-touch-icon.png?v=2", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AL Boreland",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#050911",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function AlLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#050911] text-[var(--al-text-primary)]">{children}</div>
  );
}
