'use client';
import { useEffect, useState } from 'react';
import { reportMetaBrowserReceipt, blockMetaFeedbackMeasurement } from '@/lib/meta-browser-measurement';
import { browserMetaPrivacyBlocked } from '@/lib/meta-measurement-policy';
export function MetaReceiptTracker({ pixelId, mode, deployment }: { pixelId: string; mode: string; deployment: string }) {
  const [blocked, setBlocked] = useState(false);
  const [working,setWorking]=useState(false);
  const [message,setMessage]=useState('');
  async function block() {
    setWorking(true);
    try { const result=await blockMetaFeedbackMeasurement();setBlocked(true);
      setMessage(result.requestsBlocked ? 'Future Meta measurement is blocked for your saved requests and this browser.' : 'Future Meta measurement is blocked in this browser.');
    } catch { setMessage('Browser measurement is blocked. We could not confirm the request privacy update. Please retry.'); }
    finally { setWorking(false); }
  }
  useEffect(() => {
    if (browserMetaPrivacyBlocked()) { void block(); } else reportMetaBrowserReceipt(pixelId, mode, deployment);
  }, [pixelId, mode, deployment]);
  return <div className="mt-5"><button type="button" className="text-xs text-ink-400 underline" disabled={blocked||working} onClick={()=>void block()}>
    {working?'Saving privacy choice…':blocked?'Meta measurement blocked':'Block future Meta measurement'}</button>
    {message?<p role="status" className="mt-2 text-xs text-ink-400">{message}</p>:null}</div>;
}
