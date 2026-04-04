import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Al Boreland — Command Center",
  robots: { index: false, follow: false },
  alternates: { canonical: "https://al.dominionhomedeals.com/" },
  icons: {
    icon: [
      { url: "/icons/al-favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/al-favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/icons/al-apple-touch-icon.png", sizes: "180x180" },
    ],
  },
};

export default function AlLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[200] flex bg-[#0a0f0d] text-[#e2ede8] overflow-hidden">
      {children}
    </div>
  );
}
