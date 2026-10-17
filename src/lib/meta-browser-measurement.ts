'use client';
import { browserMetaPrivacyBlocked, hasMetaMeasurementPermission, isMetaProductionHost,
  META_MEASUREMENT_CONSENT_VERSION, META_MEASUREMENT_PATH, metaFbcForLanding, normalizeMetaCookie } from '@/lib/meta-measurement-policy';
import { isInternalQaSession } from '@/lib/seller-funnel-tracking';

const RECEIPT_EVENT_KEY = 'dominion_meta_accepted_event';
const FEEDBACK_PRIVACY_KEY = 'dominion_meta_feedback_privacy';
type FeedbackPrivacyReceipt = { submissionId:string; token:string; expiresAt:number };
let pendingFeedbackPrivacy: FeedbackPrivacyReceipt[]=[];
export function rememberMetaFeedbackReceipt(submissionId:string, token:string, allowed:boolean) {
  if (!allowed || !/^[0-9a-f-]{36}$/i.test(submissionId) || !/^[a-f0-9]{64}$/.test(token)) return;
  const receipt={submissionId,token,expiresAt:Date.now()+90*86400000};
  pendingFeedbackPrivacy=[...pendingFeedbackPrivacy.filter(v=>v.submissionId!==submissionId),receipt];
  try {
    const previous = JSON.parse(localStorage.getItem(FEEDBACK_PRIVACY_KEY)||'[]');
    const receipts:FeedbackPrivacyReceipt[] = Array.isArray(previous) ? previous.filter(v=>v.expiresAt>Date.now() && v.submissionId!==submissionId) : [];
    localStorage.setItem(FEEDBACK_PRIVACY_KEY,JSON.stringify([...receipts,receipt]));
  } catch { /* The inline receipt can still use the in-memory capability. */ }
}
export async function blockMetaFeedbackMeasurement() {
  try { localStorage.setItem('dominion_meta_opt_out','1'); } catch {}
  window.fbq?.('consent','revoke');
  let receipts:FeedbackPrivacyReceipt[] = pendingFeedbackPrivacy;
  try { const saved=JSON.parse(localStorage.getItem(FEEDBACK_PRIVACY_KEY)||'[]'); if(Array.isArray(saved)) receipts=[...saved,...receipts]; } catch {}
  receipts=[...new Map(receipts.filter(v=>v.expiresAt>Date.now()).map(v=>[v.submissionId,v])).values()];
  if (!receipts.length) return { browserBlocked:true, requestsBlocked:0 };
  let requestsBlocked=0;
  for (const receipt of receipts) {
    const response=await fetch('/api/meta-measurement/revoke',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({submissionId:receipt.submissionId,token:receipt.token})});
    if (!response.ok || (await response.json()).blocked!==true) throw new Error('Browser measurement is blocked. Could not confirm the request privacy update. Please retry.');
    requestsBlocked++;
  }
  return {browserBlocked:true,requestsBlocked};
}
type PixelQueue = ((...args: unknown[]) => void) & { callMethod?: (...args: unknown[]) => void;
  queue: unknown[][]; push: PixelQueue; loaded: boolean; version: string };
declare global { interface Window { fbq?: PixelQueue; _fbq?: PixelQueue; } }

export function readMetaMeasurementChoice(consent: boolean) {
  const blocked = browserMetaPrivacyBlocked();
  const read = (name: string) => {
    const item = document.cookie.split(';').map((entry) => entry.trim()).find((entry) => entry.startsWith(`${name}=`));
    return normalizeMetaCookie(item?.slice(name.length + 1));
  };
  return { consent, consentVersion: META_MEASUREMENT_CONSENT_VERSION, optedOut: blocked,
    globalPrivacyControl: (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true,
    ...(consent && !blocked && !isInternalQaSession() && isMetaProductionHost(window.location.hostname)
      ? { fbp: read('_fbp'), fbc: metaFbcForLanding(window.location.search, read('_fbc')) } : {}) };
}

export function openMetaMeasuredReceipt(eventId: string, consent: boolean): boolean {
  if (!consent || browserMetaPrivacyBlocked() || isInternalQaSession() || !isMetaProductionHost(window.location.hostname) ||
    !/^dh_lead_[0-9a-f-]{36}$/.test(eventId)) return false;
  try {
    sessionStorage.setItem(RECEIPT_EVENT_KEY, JSON.stringify({ eventId, consent: true,
      consentVersion: META_MEASUREMENT_CONSENT_VERSION, expiresAt: Date.now() + 300000 }));
    // A full navigation removes seller fields. No referrer leaks the landing query.
    const link = document.createElement('a');
    link.href = META_MEASUREMENT_PATH;
    link.referrerPolicy = 'no-referrer';
    link.rel = 'noreferrer';
    document.body.appendChild(link); link.click(); link.remove();
    return true;
  } catch { return false; }
}

export function reportMetaBrowserReceipt(pixelId: string, mode: string, deployment: string): boolean {
  if (typeof window === 'undefined' || mode !== 'production' || deployment !== 'production' ||
    !/^\d{5,30}$/.test(pixelId) || !isMetaProductionHost(window.location.hostname) ||
    isInternalQaSession() || browserMetaPrivacyBlocked() || window.location.pathname !== META_MEASUREMENT_PATH ||
    window.location.search || window.location.hash || document.referrer) return false;
  try {
    const saved = JSON.parse(sessionStorage.getItem(RECEIPT_EVENT_KEY) || 'null');
    if (!saved || !hasMetaMeasurementPermission(saved) || saved.expiresAt < Date.now() ||
      !/^dh_lead_[0-9a-f-]{36}$/.test(saved.eventId)) return false;
    // Consume before transport so reload cannot repeat browser reporting.
    sessionStorage.removeItem(RECEIPT_EVENT_KEY);
    if (window.fbq) return false; // No second/account-ambiguous Pixel initialization.
    const queue = function (...args: unknown[]) {
      if (queue.callMethod) queue.callMethod(...args); else queue.queue.push(args);
    } as PixelQueue;
    queue.queue = []; queue.push = queue; queue.loaded = true; queue.version = '2.0';
    window.fbq = queue; window._fbq = queue;
    queue('set', 'autoConfig', false, pixelId);
    queue('consent', 'grant');
    queue('init', pixelId);
    queue('trackSingle', pixelId, 'PageView');
    queue('trackSingle', pixelId, 'Lead', {}, { eventID: saved.eventId });
    const script = document.createElement('script');
    script.async = true; script.referrerPolicy = 'no-referrer';
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(script);
    return true; // Queued only. Provider acceptance must be verified in Events Manager.
  } catch { return false; }
}
