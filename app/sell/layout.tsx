import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: "noindex, nofollow", // PPC landing pages — don't index
};

/**
 * /sell/* layout — shared wrapper for all PPC landing pages.
 * Clean, distraction-free layout (no nav links to leak visitors).
 * Google Ads gtag conversion tracking is loaded here once for all sell pages.
 */
export default function SellLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Google Ads conversion tracking — replace G-XXXXXXXXXX and AW-XXXXXXXXXX with real IDs */}
      <script
        async
        src="https://www.googletagmanager.com/gtag/js?id=AW-XXXXXXXXXX"
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-XXXXXXXXXX');
          `,
        }}
      />
      <div className="min-h-screen bg-zinc-950 text-white">
        {children}
      </div>
    </>
  );
}
