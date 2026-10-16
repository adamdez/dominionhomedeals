'use client';
import { useEffect, useState } from 'react';
import { reportMetaBrowserReceipt } from '@/lib/meta-browser-measurement';
export function MetaReceiptTracker({ pixelId, mode, deployment }: { pixelId: string; mode: string; deployment: string }) {
  const [blocked, setBlocked] = useState(false);
  useEffect(() => { reportMetaBrowserReceipt(pixelId, mode, deployment); }, [pixelId, mode, deployment]);
  return <button type="button" className="mt-5 text-xs text-ink-400 underline" disabled={blocked} onClick={() => {
    try { localStorage.setItem('dominion_meta_opt_out', '1'); } catch {}
    window.fbq?.('consent', 'revoke');
    setBlocked(true);
  }}>{blocked ? 'Future Meta measurement is blocked in this browser.' : 'Block future Meta measurement in this browser'}</button>;
}
