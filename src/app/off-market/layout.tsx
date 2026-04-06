import type { Metadata } from 'next'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function OffMarketLayout({ children }: { children: React.ReactNode }) {
  return <div className="off-market-section">{children}</div>
}
