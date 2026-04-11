import type { Metadata, Viewport } from "next";
import { AlShellFrame } from "@/components/al/AlShellFrame";
import { MobileDock } from "@/components/al/MobileDock";

export const metadata: Metadata = {
  title: "AL Boreland Command Center",
  robots: { index: false, follow: false },
  alternates: { canonical: "https://al.dominionhomedeals.com/" },
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
  themeColor: "#0a0f0d",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function AlLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="al-workshop-bg fixed inset-0 z-[200] flex overflow-hidden text-[#e2ede8]">
      <AlShellFrame>{children}</AlShellFrame>
      <MobileDock />
    </div>
  );
}
