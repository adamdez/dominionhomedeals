export const META_MEASUREMENT_CONSENT_VERSION = 'meta_measurement_v1';
export const META_MEASUREMENT_PATH = '/sell/offer-check/received';
export const META_PRODUCTION_HOSTS = ['www.dominionhomedeals.com', 'dominionhomedeals.com'];

export interface MetaMeasurementChoice {
  consent?: unknown;
  consentVersion?: unknown;
  optedOut?: unknown;
  globalPrivacyControl?: unknown;
  fbp?: unknown;
  fbc?: unknown;
}

export function metaLeadEventId(submissionId: string): string {
  return `dh_lead_${submissionId.toLowerCase()}`;
}

export function hasMetaMeasurementPermission(choice: MetaMeasurementChoice | undefined): boolean {
  return choice?.consent === true && choice.consentVersion === META_MEASUREMENT_CONSENT_VERSION &&
    choice.optedOut !== true && choice.globalPrivacyControl !== true;
}

export function normalizeMetaCookie(value: unknown): string | undefined {
  // Meta matching cookies only. Arbitrary text and qualification answers never pass.
  return typeof value === 'string' && /^fb\.\d{1,2}\.\d{10,13}\.[A-Za-z0-9_-]{1,500}$/.test(value)
    ? value : undefined;
}

const META_CLICK_MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;
export function normalizeMetaClickCookie(value: unknown, now = Date.now()): string | undefined {
  if (typeof value !== 'string') return undefined;
  const match = /^fb\.([012])\.(\d{13})\.([A-Za-z0-9_-]{20,500})$/.exec(value);
  if (!match) return undefined;
  const age = now - Number(match[2]);
  return age >= -60000 && age <= META_CLICK_MAX_AGE_MS ? value : undefined;
}

export function metaFbcForLanding(search: string, previousCookie: unknown, now = Date.now()): string | undefined {
  const existing = normalizeMetaClickCookie(previousCookie, now);
  const clicks = new URLSearchParams(search).getAll('fbclid');
  if (!clicks.length) return existing;
  // Do not combine duplicate parameters, trim, decode twice, or modify case.
  if (clicks.length !== 1 || !/^[A-Za-z0-9_-]{20,500}$/.test(clicks[0])) return undefined;
  if (existing && existing.split('.').slice(3).join('.') === clicks[0]) return existing;
  // Cookie is scoped to dominionhomedeals.com, so the documented index is 1.
  return `fb.1.${Math.floor(now)}.${clicks[0]}`;
}

export function isMetaProductionHost(host: string): boolean {
  return META_PRODUCTION_HOSTS.includes(host.toLowerCase().replace(/:\d+$/, ''));
}

export function browserMetaPrivacyBlocked(): boolean {
  if (typeof window === 'undefined') return true;
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  try {
    return nav.globalPrivacyControl === true || navigator.doNotTrack === '1' ||
      localStorage.getItem('dominion_meta_opt_out') === '1';
  } catch { return true; }
}
