import 'server-only';
import { isIP } from 'node:net';
import { SITE } from '@/lib/constants';
import type { DominionDeliveryOutcome } from '@/lib/dominion-leads';
import { hasMetaMeasurementPermission, isMetaProductionHost, metaLeadEventId,
  META_MEASUREMENT_PATH, normalizeMetaCookie, normalizeMetaClickCookie, type MetaMeasurementChoice } from '@/lib/meta-measurement-policy';

export interface MetaLeadInput {
  submissionId: string;
  occurredAt: string;
  host: string;
  choice?: MetaMeasurementChoice;
  internalQa?: boolean;
  /** Internal server decision only; never included in a Meta payload. */
  leadEligible?: boolean;
  globalPrivacyControl?: boolean;
  ip?: string;
  userAgent?: string;
}
export type MetaConversionOutcome = DominionDeliveryOutcome & {
  measurementMode: 'production' | 'test' | 'qa' | 'disabled';
  eventId: string;
};

export function metaMeasurementConfig(input: MetaLeadInput):
  | { skipped: MetaConversionOutcome; mode?: undefined; eventId?: undefined }
  | { skipped?: undefined; pixelId: string; token: string; version: string; testCode: string | undefined;
      mode: 'production' | 'test'; eventId: string } {
  const eventId = metaLeadEventId(input.submissionId);
  const skipped = (reason: string, mode: MetaConversionOutcome['measurementMode'] = 'disabled') =>
    ({ status: 'skipped' as const, referenceId: reason, measurementMode: mode, eventId });
  if (input.internalQa) return { skipped: skipped('internal_qa', 'qa') };
  if (!hasMetaMeasurementPermission(input.choice) || input.globalPrivacyControl) {
    return { skipped: skipped('privacy_blocked') };
  }
  if (input.leadEligible === false) return { skipped: skipped('outside_service_area') };
  const mode = process.env.META_ADS_MEASUREMENT_MODE;
  if (mode !== 'production' && mode !== 'test') return { skipped: skipped('measurement_disabled') };
  if (process.env.VERCEL_ENV !== 'production' && mode === 'production') {
    return { skipped: skipped('nonproduction_deployment') };
  }
  if (!isMetaProductionHost(input.host)) return { skipped: skipped('unapproved_host') };
  const pixelId = process.env.META_ADS_PIXEL_ID?.trim();
  const token = process.env.META_ADS_CONVERSIONS_ACCESS_TOKEN?.trim();
  const version = process.env.META_GRAPH_API_VERSION?.trim();
  const testCode = process.env.META_ADS_TEST_EVENT_CODE?.trim();
  if (!pixelId || !/^\d{5,30}$/.test(pixelId) || !token || !version || !/^v\d+\.\d+$/.test(version)) {
    return { skipped: skipped('not_configured') };
  }
  if (mode === 'test' && !testCode) return { skipped: skipped('test_code_missing') };
  // A leftover test code cannot quietly turn a production release into a test.
  if (mode === 'production' && testCode) return { skipped: skipped('production_has_test_code') };
  return { pixelId, token, version, testCode, mode, eventId };
}

export function buildMetaLeadEvent(input: MetaLeadInput) {
  const fbp = normalizeMetaCookie(input.choice?.fbp);
  const fbc = normalizeMetaClickCookie(input.choice?.fbc);
  return {
    event_name: 'Lead', event_id: metaLeadEventId(input.submissionId),
    event_time: Math.floor(new Date(input.occurredAt).getTime() / 1000),
    action_source: 'website', event_source_url: `${SITE.url}${META_MEASUREMENT_PATH}`,
    user_data: {
      ...(input.ip && isIP(input.ip) ? { client_ip_address: input.ip } : {}),
      ...(input.userAgent && input.userAgent.length <= 512 && !/[\r\n]/.test(input.userAgent)
        ? { client_user_agent: input.userAgent } : {}),
      ...(fbp ? { fbp } : {}), ...(fbc ? { fbc } : {}),
    },
  };
}

export async function reportMetaLead(input: MetaLeadInput): Promise<MetaConversionOutcome> {
  const config = metaMeasurementConfig(input);
  if (config.skipped) return config.skipped;
  const { pixelId, token, version, testCode, mode, eventId } = config;
  const event = buildMetaLeadEvent(input);
  if (!Number.isFinite(event.event_time) || !Object.keys(event.user_data).length) {
    return { status: 'skipped', referenceId: 'matching_context_missing', measurementMode: mode!, eventId: eventId! };
  }
  let response: Response;
  try {
    response = await fetch(`https://graph.facebook.com/${version}/${pixelId}/events`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: [event], ...(mode === 'test' ? { test_event_code: testCode } : {}) }),
      cache: 'no-store', signal: AbortSignal.timeout(4000),
    });
  } catch {
    return { status: 'outcome_unknown', referenceId: 'transport_unknown', measurementMode: mode!, eventId: eventId! };
  }
  if (!response.ok) return { status: 'failed', referenceId: `http_${response.status}`, measurementMode: mode!, eventId: eventId! };
  try {
    const data = await response.json();
    return { status: data.events_received === 1 ? 'provider_accepted' : 'outcome_unknown',
      referenceId: data.events_received === 1 ? 'events_received_1' : 'unconfirmed_response', measurementMode: mode!, eventId: eventId! };
  } catch {
    return { status: 'outcome_unknown', referenceId: 'unreadable_response', measurementMode: mode!, eventId: eventId! };
  }
}
