import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Al Boreland — Command Center",
  robots: { index: false, follow: false },
};

export default function AlLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[200] flex bg-[#0a0f0d] text-[#e2ede8] overflow-hidden">
      {children}
    </div>
  );
}
