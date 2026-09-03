/** Explicit test markers only. This excludes measurement; it never bypasses intake checks. */
export function isSellerMeasurementQa(input: {
  internalQa?: unknown;
  landingPage?: string;
  utmSource?: string;
  adAttribution?: Record<string, unknown>;
}): boolean {
  if (input.internalQa === true) return true;
  const sources = [input.utmSource, input.adAttribution?.utm_source];
  try {
    const params = new URL(input.landingPage || '/', 'https://www.dominionhomedeals.com').searchParams;
    if (params.get('internal_qa') === '1') return true;
    sources.push(params.get('utm_source') || '');
  } catch { /* A malformed URL does not relax any intake validation. */ }
  return sources.some((source) => typeof source === 'string' &&
    ['codex', 'codex_internal_qa'].includes(source.trim().toLowerCase()));
}
