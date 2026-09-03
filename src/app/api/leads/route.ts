import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { SITE } from '@/lib/constants'
import {
  DOMINION_OPTIONS_FLOW, DominionOptionsSubmissionConflictError,
  dominionOptionsDeliveryStatus, isDominionOptionsSubmissionId,
  recordDominionLeadSubmission, recordDominionOptionsLeadSubmission,
  recordDominionOptionsDelivery,
  type DominionDeliveryMap, type DominionDeliveryOutcome,
  type DominionSellerAuthority,
} from '@/lib/dominion-leads'
import { syncSellerLeadToMailchimp } from '@/lib/mailchimp'
import { reportOpenAILeadCreated, type OpenAIConversionOutcome } from '@/server/openai-ads-conversions'
import { isSellerMeasurementQa } from '@/lib/seller-measurement-policy'
import { normalizeSellerFunnelEvent, recordSellerFunnelEvent } from '@/lib/seller-funnel-events'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface LeadPayload {
  internalQa?: boolean
  address: string
  city?: string
  state?: string
  zip?: string
  condition?: string
  timeline?: string
  primaryConstraint?: string
  firstName: string
  lastName?: string
  phone: string
  email?: string
  tcpaConsent?: boolean
  tcpaTimestamp?: string | null
  sms_consent?: boolean
  sms_consent_timestamp?: string | null
  smsOptIn?: boolean
  smsOptInTimestamp?: string | null
  honeypot?: string
  source?: string
  landingPage?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmTerm?: string
  utmContent?: string
  gclid?: string
  oppref?: string
  gbraid?: string
  wbraid?: string
  gadSource?: string
  gadCampaignId?: string
  keyword?: string
  matchtype?: string
  adgroup?: string
  searchterm?: string
  openaiObref?: string
  adAttribution?: Record<string, unknown>
  submissionFlow?: string
  submissionId?: string
  funnelVisitId?: string
  sellerAuthority?: DominionSellerAuthority
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function validatePhone(phone: string): boolean {
  return phone.replace(/\D/g, '').length >= 10
}

function validateEmail(email: string): boolean {
  return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)
}

function sanitize(str: string): string {
  return str
    .trim()
    .substring(0, 500)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function plainText(value: string): string {
  return value.trim().slice(0, 500)
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

const AD_ATTRIBUTION_KEYS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'gclid',
  'gbraid',
  'wbraid',
  'gad_source',
  'gad_campaignid',
  'keyword',
  'matchtype',
  'adgroup',
  'searchterm',
])

function sanitizeAttribution(raw: unknown, preserveRawValues = false): Record<string, string> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}

  const entries = Object.entries(raw as Record<string, unknown>)
    .filter(([key, value]) => {
      const normalizedKey = key.toLowerCase()
      return (
        typeof value === 'string' &&
        (preserveRawValues
          ? value.length > 0 && value.length <= 8192
          : value.trim().length > 0) &&
        (AD_ATTRIBUTION_KEYS.has(normalizedKey) || normalizedKey.startsWith('hsa_') ||
          (preserveRawValues && normalizedKey === 'oppref'))
      )
    })
    // The official opaque referral must survive every storage/forwarding hop
    // byte-for-byte, including whitespace. Do not silently truncate it.
    .sort(([a], [b]) => preserveRawValues ? Number(b === 'oppref') - Number(a === 'oppref') : 0)
    .map(([key, value]) => {
      const normalizedKey = key.toLowerCase()
      return [sanitize(normalizedKey).slice(0, 80), preserveRawValues
        ? String(value) : sanitize(String(value)).slice(0, 300)] as const
    })
    .filter(([key, value]) => key && value)
    .slice(0, 80)

  return Object.fromEntries(entries)
}

function attributionSummary(adAttribution: Record<string, string>): string {
  return Object.entries(adAttribution)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n')
}

function optionalText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function getTeamSmsRecipients(): string[] {
  const configured = process.env.LEAD_SMS_RECIPIENTS
    ?.split(',')
    .map((recipient) => recipient.trim())
    .filter(Boolean)

  if (configured?.length) return configured

  return [
    '5095907091@mms.att.net', // Adam - AT&T MMS gateway is more reliable than txt.att.net.
    '5096669518@vtext.com', // Logan - Verizon
  ]
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs)
    }),
  ])
}

function withOptionsTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>
  const timeout = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}

function optionsFailure(error: string, status: number) {
  return NextResponse.json({ success: false, accepted: false, controlRecorded: false,
    receiptId: null, duplicate: false, error }, { status })
}

function settledDelivery(result: PromiseSettledResult<DominionDeliveryOutcome>): DominionDeliveryOutcome {
  // A timed-out/non-acknowledged operation may have completed remotely.
  // Never claim it failed safely, or blindly replay it on a duplicate request.
  return result.status === 'fulfilled' ? result.value : { status: 'outcome_unknown' }
}

async function recordOptionsFunnelMilestone(input: {
  eventId: string
  visitId: string
  eventType: 'lead_accepted' | 'conversion_reported' | 'conversion_failed' | 'conversion_validated' | 'conversion_skipped' | 'conversion_unknown'
  occurredAt: string
  leadReceiptId: string
  detail?: string
  adAttribution: Record<string, string>
}) {
  const event = normalizeSellerFunnelEvent({
    eventId: input.eventId,
    visitId: input.visitId,
    eventType: input.eventType,
    occurredAt: input.occurredAt,
    pagePath: '/sell/options',
    leadReceiptId: input.leadReceiptId,
    detail: input.detail,
    platform: 'unknown',
    deviceClass: 'unknown',
    viewportBucket: 'unknown',
    referrerClass: 'unknown',
    attribution: input.adAttribution,
  })
  if (!event) throw new Error('Invalid server seller-funnel milestone.')
  return recordSellerFunnelEvent(event)
}

async function reportAndRecordOpenAIConversion(input: {
  internalQa: boolean
  submissionId: string
  funnelVisitId?: string
  occurredAt: string
  leadReceiptId: string
  oppref?: string
  obref?: string
  adAttribution: Record<string, string>
}): Promise<OpenAIConversionOutcome> {
  const outcome = await reportOpenAILeadCreated({
    submissionId: input.submissionId,
    occurredAt: input.occurredAt,
    oppref: input.oppref,
    obref: input.obref,
    internalQa: input.internalQa,
  })

  try {
    if (!input.funnelVisitId) return outcome
    await recordOptionsFunnelMilestone({
      eventId: randomUUID(),
      visitId: input.funnelVisitId,
      eventType: outcome.status === 'skipped' ? 'conversion_skipped' :
        outcome.status === 'outcome_unknown' ? 'conversion_unknown' :
        outcome.status !== 'provider_accepted' ? 'conversion_failed' :
          outcome.measurementMode === 'validation' ? 'conversion_validated' : 'conversion_reported',
      occurredAt: new Date().toISOString(),
      leadReceiptId: input.leadReceiptId,
      detail: outcome.referenceId || outcome.status,
      adAttribution: input.adAttribution,
    })
  } catch (error) {
    console.error('[OPENAI CONVERSION AUDIT EVENT ERROR]', {
      receiptId: input.leadReceiptId,
      message: error instanceof Error ? error.message : 'Unknown conversion audit error.',
    })
  }
  return outcome
}

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 3600000 })
    return false
  }
  entry.count++
  return entry.count > 5
}

/* ------------------------------------------------------------------ */
/*  Email via Resend                                                   */
/* ------------------------------------------------------------------ */

async function sendEmailNotification(lead: Record<string, unknown>): Promise<DominionDeliveryOutcome> {
  const RESEND_API_KEY = process.env.RESEND_API_KEY
  if (!RESEND_API_KEY) {
    console.log('[EMAIL] No RESEND_API_KEY set — skipping email for lead:', lead.firstName, lead.lastName, lead.city)
    return { status: 'skipped' }
  }

  const priorityLabel = lead.timeline === 'ASAP' ? '🔴 URGENT' : lead.timeline === 'Soon' ? '🟡 SOON' : '🟢 NORMAL'
  const optionsSubmissionId = lead.submissionFlow === DOMINION_OPTIONS_FLOW &&
    isDominionOptionsSubmissionId(lead.submissionId) ? lead.submissionId.toLowerCase() : null

  const htmlLead = lead.submissionFlow === DOMINION_OPTIONS_FLOW
    ? Object.fromEntries(Object.entries(lead).map(([key, value]) =>
      [key, typeof value === 'string' ? escapeHtml(value) : value]))
    : lead
  const propertyLine = [htmlLead.city, htmlLead.state, htmlLead.zip].filter(Boolean).join(' ').trim() || 'Not provided'
  const email = typeof htmlLead.email === 'string' && htmlLead.email ? htmlLead.email : ''
  const emailCell = email
    ? `<a href="mailto:${email}" style="color: #1a3a2a;">${email}</a>`
    : 'Not provided'
  const adAttribution =
    lead.adAttribution && typeof lead.adAttribution === 'object' && !Array.isArray(lead.adAttribution)
      ? (lead.adAttribution as Record<string, string>)
      : {}
  const adAttributionHtml = Object.entries(adAttribution)
    .map(([key, value]) => `<br/>${key}: ${lead.submissionFlow === DOMINION_OPTIONS_FLOW
      ? escapeHtml(value) : value}`)
    .join('')

  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1a3a2a; color: white; padding: 20px 24px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 20px;">🏠 New Lead from dominionhomedeals.com</h1>
        <p style="margin: 4px 0 0; opacity: 0.8; font-size: 14px;">${priorityLabel} — ${htmlLead.timeline}</p>
      </div>
      
      <div style="background: #f9f8f6; padding: 24px; border: 1px solid #e5e3df;">
        <h2 style="margin: 0 0 16px; font-size: 16px; color: #1a3a2a;">Contact Info</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #666; width: 120px;">Name</td>
            <td style="padding: 6px 0; font-weight: 600;">${htmlLead.firstName} ${htmlLead.lastName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #666;">Phone</td>
            <td style="padding: 6px 0; font-weight: 600;"><a href="tel:${htmlLead.phone}" style="color: #1a3a2a;">${htmlLead.phone}</a></td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #666;">Email</td>
            <td style="padding: 6px 0;">${emailCell}</td>
          </tr>
        </table>
      </div>

      <div style="padding: 24px; border: 1px solid #e5e3df; border-top: none;">
        <h2 style="margin: 0 0 16px; font-size: 16px; color: #1a3a2a;">Property Details</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #666; width: 120px;">Address</td>
            <td style="padding: 6px 0; font-weight: 600;">${htmlLead.address}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #666;">City / State</td>
            <td style="padding: 6px 0;">${propertyLine}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #666;">Condition</td>
            <td style="padding: 6px 0;">${htmlLead.condition}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #666;">Timeline</td>
            <td style="padding: 6px 0; font-weight: 600; color: ${lead.timeline === 'ASAP' ? '#dc2626' : '#1a3a2a'};">${htmlLead.timeline}</td>
          </tr>${lead.submissionFlow === DOMINION_OPTIONS_FLOW ? `
          <tr>
            <td style="padding: 6px 0; color: #666;">Main problem</td>
            <td style="padding: 6px 0;">${htmlLead.primaryConstraint}</td>
          </tr>` : ''}
        </table>
      </div>

      <div style="padding: 24px; border: 1px solid #e5e3df; border-top: none; border-radius: 0 0 8px 8px;">
        <h2 style="margin: 0 0 12px; font-size: 16px; color: #1a3a2a;">SMS Consent</h2>
        <p style="margin: 0; font-size: 12px; color: #888;">
          SMS consent: ${lead.smsConsent ? 'Yes' : 'No'}<br/>
          SMS consent captured at: ${lead.smsConsent ? htmlLead.smsConsentTimestamp : 'Not opted in'}<br/>
          SMS consent IP: ${htmlLead.smsConsentIP}<br/>
          Source: ${htmlLead.source} | Page: ${htmlLead.landingPage}
        </p>
        ${lead.utmSource ? `<p style="margin: 8px 0 0; font-size: 12px; color: #888;">UTM: ${htmlLead.utmSource} / ${htmlLead.utmMedium} / ${htmlLead.utmCampaign}</p>` : ''}
        ${lead.gclid ? `<p style="margin: 8px 0 0; font-size: 12px; color: #888;">GCLID: ${lead.submissionFlow === DOMINION_OPTIONS_FLOW ? escapeHtml(String(lead.gclid)) : lead.gclid}</p>` : ''}
        ${adAttributionHtml ? `<p style="margin: 8px 0 0; font-size: 12px; color: #888;">Ad params:${adAttributionHtml}</p>` : ''}
      </div>
    </div>
  `

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Dominion Homes Leads <leads@dominionhomedeals.com>',
        to: ['adam@dominionhomedeals.com', 'logan@dominionhomedeals.com', 'leads@dominionhomedeals.com'],
        subject: `${priorityLabel} New Lead: ${lead.firstName} ${lead.lastName} — ${lead.address}, ${lead.city}`,
        html: htmlBody,
        // The trusted-sender Gmail guard uses both headers, never copy/subject text.
        ...(optionsSubmissionId ? { headers: {
          'X-Dominion-Submission-Flow': DOMINION_OPTIONS_FLOW,
          'X-Dominion-Submission-Id': optionsSubmissionId,
        } } : {}),
      }),
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error('[EMAIL ERROR]', errorText)
      return { status: 'failed' }
    } else {
      if (optionsSubmissionId) {
        const data = await res.json()
        if (!data || typeof data.id !== 'string' || !data.id.trim()) {
          // A 2xx without a provider message ID cannot be reconciled as confirmed
          // acceptance. Keep the durable inquiry; do not blindly send it again.
          console.error('[EMAIL] Options message acknowledgment was not confirmed')
          return { status: 'outcome_unknown' }
        }
        console.log('[EMAIL] Options notification accepted:', data.id)
        return { status: 'provider_accepted', referenceId: data.id }
      }
      console.log('[EMAIL] Sent to adam@ and logan@dominionhomedeals.com')
      return { status: 'provider_accepted' }
    }
  } catch (err) {
    console.error('[EMAIL ERROR]', err)
    return { status: 'outcome_unknown' }
  }
}

/* ------------------------------------------------------------------ */
/*  SMS via email-to-SMS carrier gateway (uses Resend, no Twilio)      */
/* ------------------------------------------------------------------ */

async function sendSmsNotification(lead: Record<string, unknown>) {
  if (lead.submissionFlow === DOMINION_OPTIONS_FLOW) return
  const RESEND_API_KEY = process.env.RESEND_API_KEY
  if (!RESEND_API_KEY) {
    console.log('[SMS] No RESEND_API_KEY — skipping SMS notification')
    return
  }

  const priorityEmoji = lead.timeline === 'ASAP' ? '🔴 URGENT' : lead.timeline === 'Soon' ? '🟡 SOON' : '🟢'

  // Keep it short — carrier SMS gateways truncate long messages
  const message = `${priorityEmoji} NEW LEAD: ${lead.firstName} ${lead.lastName}\n${lead.address}, ${lead.city} ${lead.state}\nPhone: ${lead.phone}\n${lead.condition} | ${lead.timeline}\n\nCall them back ASAP!`

  // Internal team alert gateways. Seller SMS consent is tracked separately.
  const smsRecipients = getTeamSmsRecipients()

  try {
    await Promise.allSettled(
      smsRecipients.map(async (gateway) => {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: 'Dominion Leads <leads@dominionhomedeals.com>',
            to: [gateway],
            subject: `New Lead: ${lead.firstName} ${lead.lastName}`,
            text: message,
          }),
        })

        if (!res.ok) {
          const errorText = await res.text()
          console.error(`[SMS] Failed to send to ${gateway}:`, errorText)
        } else {
          console.log(`[SMS] Sent to ${gateway}`)
        }
      })
    )
  } catch (err) {
    console.error('[SMS ERROR]', err)
  }
}

/* ------------------------------------------------------------------ */
/*  Forward lead to Sentinel CRM                                       */
/* ------------------------------------------------------------------ */

async function forwardToSentinel(lead: Record<string, unknown>): Promise<void> {
  if (lead.submissionFlow === DOMINION_OPTIONS_FLOW) return
  const sentinelUrl = process.env.SENTINEL_API_URL
  const intakeSecret = process.env.SENTINEL_INTAKE_SECRET

  if (!sentinelUrl || !intakeSecret) {
    console.log('[SENTINEL] Not configured — skipping CRM forwarding')
    return
  }

  try {
    const adAttribution =
      lead.adAttribution && typeof lead.adAttribution === 'object' && !Array.isArray(lead.adAttribution)
        ? (lead.adAttribution as Record<string, string>)
        : {}
    const adNotes = attributionSummary(adAttribution)

    const res = await fetch(`${sentinelUrl}/api/inbound/webform`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-intake-secret': intakeSecret,
      },
      body: JSON.stringify({
        // Contact info
        name: `${lead.firstName} ${lead.lastName}`.trim(),
        owner_name: `${lead.firstName} ${lead.lastName}`.trim(),
        phone: lead.phone,
        email: lead.email,

        // Property
        property_address: lead.address,
        address: lead.address,
        city: lead.city,
        state: lead.state,
        zip: lead.zip,

        // Attribution
        gclid: lead.gclid || null,
        landing_page: lead.landingPage || null,
        source_vendor: 'dominionhomedeals.com',
        source_campaign: lead.utmCampaign || null,
        intake_method: 'website_form',

        // Context
        notes: [
          `Condition: ${lead.condition}`,
          `Timeline: ${lead.timeline}`,
          lead.utmSource ? `UTM: ${lead.utmSource}/${lead.utmMedium}/${lead.utmCampaign}` : null,
          adNotes ? `Ad attribution:\n${adNotes}` : null,
        ].filter(Boolean).join('\n'),

        // Raw payload for audit
        raw_source_ref: `website_${lead.submittedAt}`,
        received_at: lead.submittedAt,
        sms_consent: lead.smsConsent,
        sms_consent_timestamp: lead.smsConsentTimestamp,
        sms_consent_ip: lead.smsConsentIP,
        ad_attribution: adAttribution,
      }),
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error('[SENTINEL] Forward failed:', res.status, errorText)
    } else {
      const data = await res.json()
      console.log('[SENTINEL] Lead forwarded successfully:', data.leadId ?? data.resolution ?? 'ok')
    }
  } catch (err) {
    console.error('[SENTINEL] Forward error:', err)
  }
}

/* ------------------------------------------------------------------ */
/*  Forward lead to Lazarus create-only intake                         */
/* ------------------------------------------------------------------ */

async function forwardToLazarus(lead: Record<string, unknown>): Promise<DominionDeliveryOutcome> {
  const isOptionsFlow = lead.submissionFlow === DOMINION_OPTIONS_FLOW
  // Dedicated settings prevent enabling this new flow from rerouting legacy forms.
  // Never fall back between the options-only and existing legacy configurations.
  const intakeUrl = (isOptionsFlow ? process.env.LAZARUS_OPTIONS_INTAKE_URL : process.env.LAZARUS_INTAKE_URL)?.trim()
  const intakeKey = (isOptionsFlow ? process.env.LAZARUS_OPTIONS_INTAKE_CREATE_LEAD_KEY : process.env.LAZARUS_INTAKE_CREATE_LEAD_KEY)?.trim()

  if (!intakeUrl || !intakeKey) {
    console.log('[LAZARUS] Not configured - skipping create-only forwarding')
    return { status: 'skipped' }
  }

  const adAttribution =
    lead.adAttribution && typeof lead.adAttribution === 'object' && !Array.isArray(lead.adAttribution)
      ? (lead.adAttribution as Record<string, string>)
      : {}
  const adNotes = attributionSummary(adAttribution)

  const sourceDetails = Object.fromEntries(
    Object.entries({
      sourceLabel: 'Dominion website seller form',
      sourceType: 'Website',
      propertyZip: optionalText(lead.zip),
      landingPage: optionalText(lead.landingPage),
      utmSource: optionalText(lead.utmSource),
      utmMedium: optionalText(lead.utmMedium),
      utmCampaign: optionalText(lead.utmCampaign),
      utmTerm: optionalText(lead.utmTerm),
      utmContent: optionalText(lead.utmContent),
      gclid: optionalText(lead.gclid),
      ...(isOptionsFlow ? {
        condition: typeof lead.condition === 'string' ? lead.condition : null,
        timeline: typeof lead.timeline === 'string' ? lead.timeline : null,
        smsConsent: lead.smsConsent === true ? 'yes' : 'no',
        smsConsentCapturedAt: lead.smsConsent === true && typeof lead.smsConsentTimestamp === 'string'
          ? lead.smsConsentTimestamp : null,
        smsConsentIp: lead.smsConsent === true && typeof lead.smsConsentIP === 'string'
          ? lead.smsConsentIP : null,
        oppref: typeof adAttribution.oppref === 'string' && adAttribution.oppref.length > 0
          ? adAttribution.oppref : null,
        primaryConstraint: optionalText(lead.primaryConstraint),
        submissionFlow: DOMINION_OPTIONS_FLOW,
        submissionId: optionalText(lead.submissionId),
        sellerAuthority: optionalText(lead.sellerAuthority),
        adAttributionJson: JSON.stringify(adAttribution),
        intakeMode: 'create_only',
        automatedSellerSms: 'disabled_for_this_intake',
      } : {}),
    }).filter(([, value]) => typeof value === 'string' && (isOptionsFlow ? value.length > 0 : value.trim()))
  )

  const notes = [
    'Website seller lead from dominionhomedeals.com.',
    lead.submittedAt ? `Submitted: ${lead.submittedAt}` : null,
    lead.condition ? `Condition: ${lead.condition}` : null,
    lead.timeline ? `Timeline: ${lead.timeline}` : null,
    isOptionsFlow && lead.primaryConstraint ? `Main problem to solve: ${lead.primaryConstraint}` : null,
    lead.smsConsent ? `SMS consent captured: ${lead.smsConsentTimestamp || 'yes'}` : 'SMS consent: no',
    lead.landingPage ? `Landing page: ${lead.landingPage}` : null,
    adNotes ? `Ad attribution:\n${adNotes}` : null,
  ].filter(Boolean).join('\n')

  try {
    const res = await fetch(intakeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-lazarus-intake-key': intakeKey,
      },
      body: JSON.stringify({
        name: `${lead.firstName || ''} ${lead.lastName || ''}`.trim(),
        phone: lead.phone,
        email: lead.email,
        address: lead.address,
        city: lead.city,
        state: lead.state,
        zip: lead.zip,
        status: 'new',
        notes,
        sourceDetails,
      }),
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error('[LAZARUS] Forward failed:', res.status, errorText)
      return { status: 'failed' }
    } else {
      const data = await res.json()
      if (isOptionsFlow) {
        if (!data || typeof data.ppcLeadId !== 'string' || !data.ppcLeadId.trim() ||
          !data.lead || data.lead.id !== data.ppcLeadId ||
          (data.leadId !== undefined && data.leadId !== data.ppcLeadId)) {
          // A generic Leads/Files record is not a PPC card. Require the explicit
          // PPC identity, and reconcile ambiguous responses without replaying.
          console.error('[LAZARUS] Options PPC record acknowledgment was not confirmed')
          return { status: 'outcome_unknown' }
        }
        console.log('[LAZARUS] Options PPC record confirmed:', data.ppcLeadId)
        return { status: 'provider_accepted', referenceId: data.ppcLeadId }
      }
      console.log('[LAZARUS] Lead created:', data.leadId ?? 'ok')
      return { status: 'provider_accepted', ...(typeof data.leadId === 'string'
        ? { referenceId: data.leadId.slice(0, 160) } : {}) }
    }
  } catch (err) {
    console.error('[LAZARUS] Forward error:', err)
    return { status: 'outcome_unknown' }
  }
}

/* ------------------------------------------------------------------ */
/*  POST handler                                                       */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  let isOptionsFlow = false
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown'

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many submissions. Please try again later.' },
        { status: 429 }
      )
    }

    const contentLength = Number(request.headers.get('content-length') || '0')
    if (contentLength > 100_000) {
      return NextResponse.json({ error: 'Request is too large.' }, { status: 413 })
    }
    const body: LeadPayload = await request.json()
    isOptionsFlow = body?.submissionFlow === DOMINION_OPTIONS_FLOW

    // Honeypot
    if (body.honeypot) {
      console.log(`[SPAM] Honeypot triggered from ${ip}`)
      if (isOptionsFlow) return NextResponse.json({ success: true, accepted: false,
        controlRecorded: false, receiptId: null, duplicate: false, message: 'Thank you!' })
      return NextResponse.json({ success: true, message: 'Thank you!' })
    }

    // Validation
    const errors: string[] = []
    if (isOptionsFlow) {
      const textFields = ['address', 'city', 'state', 'zip', 'condition', 'timeline', 'primaryConstraint',
        'firstName', 'lastName', 'phone', 'email', 'source', 'landingPage', 'utmSource', 'utmMedium',
        'utmCampaign', 'utmTerm', 'utmContent', 'gclid', 'oppref', 'gbraid', 'wbraid', 'gadSource',
        'gadCampaignId', 'keyword', 'matchtype', 'adgroup', 'searchterm', 'openaiObref', 'funnelVisitId', 'tcpaTimestamp',
        'sms_consent_timestamp', 'smsOptInTimestamp'] as const
      if (textFields.some((field) => body[field] != null && typeof body[field] !== 'string')) {
        return optionsFailure('Please check the form details and try again.', 400)
      }
      if (!isDominionOptionsSubmissionId(body.submissionId)) errors.push('Valid submission reference required')
      if (body.funnelVisitId && !isDominionOptionsSubmissionId(body.funnelVisitId)) {
        errors.push('Valid funnel visit reference required')
      }
      if (body.oppref && body.oppref.length > 8192) errors.push('Invalid ad attribution reference')
      if (body.openaiObref && (body.openaiObref.length > 2048 ||
        body.openaiObref.trim() !== body.openaiObref || /[\u0000-\u001f\u007f]/.test(body.openaiObref))) {
        errors.push('Invalid browser attribution reference')
      }
      if (body.sellerAuthority !== 'owner' && body.sellerAuthority !== 'authorized_representative') {
        errors.push('Please confirm your relationship to the property')
      }
      if (!['WA', 'ID'].includes(body.state?.trim().toUpperCase() || '')) {
        errors.push('Please include the property state: WA or ID')
      }
      if (!body.address || body.address.trim().length < 6) errors.push('Complete property address required')
    }
    if (!body.address || body.address.trim().length < 3) errors.push('Address required')
    if (!body.firstName?.trim()) errors.push('First name required')
    if (!body.phone || !validatePhone(body.phone)) errors.push('Valid phone required')
    if (body.email && !validateEmail(body.email)) errors.push('Valid email required')

    if (errors.length > 0) {
      if (isOptionsFlow) return optionsFailure(errors.join('. '), 400)
      return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 400 })
    }

    const submittedAt = new Date().toISOString()
    const smsConsent = body.sms_consent === true || body.smsOptIn === true
    const smsConsentTimestamp = smsConsent
      ? body.sms_consent_timestamp || body.smsOptInTimestamp || submittedAt
      : null
    const submittedAdFields = {
      utm_source: body.utmSource,
      utm_medium: body.utmMedium,
      utm_campaign: body.utmCampaign,
      utm_term: body.utmTerm,
      utm_content: body.utmContent,
      gclid: body.gclid,
      oppref: body.oppref,
      gbraid: body.gbraid,
      wbraid: body.wbraid,
      gad_source: body.gadSource,
      gad_campaignid: body.gadCampaignId,
      keyword: body.keyword,
      matchtype: body.matchtype,
      adgroup: body.adgroup,
      searchterm: body.searchterm,
    }
    const adAttribution = sanitizeAttribution({
      ...(body.adAttribution || {}),
      // Missing top-level fields must not erase a supplied structured value.
      ...(isOptionsFlow ? Object.fromEntries(Object.entries(submittedAdFields)
        .filter(([, value]) => typeof value === 'string' && value.length > 0)) : submittedAdFields),
    }, isOptionsFlow)

    // Build lead object
    const cleanText = isOptionsFlow ? plainText : sanitize
    const lead = {
      address: cleanText(body.address),
      city: cleanText(body.city || ''),
      state: isOptionsFlow ? body.state!.trim().toUpperCase() : sanitize(body.state || 'WA'),
      zip: cleanText(body.zip || ''),
      condition: cleanText(body.condition || 'Not provided'),
      timeline: cleanText(body.timeline || 'Not provided'),
      firstName: cleanText(body.firstName),
      lastName: cleanText(body.lastName || ''),
      phone: body.phone.replace(/\D/g, '').substring(0, 11),
      email: body.email ? cleanText(body.email).toLowerCase() : '',
      tcpaConsented: body.tcpaConsent === true,
      tcpaTimestamp: body.tcpaTimestamp || null,
      tcpaIP: ip,
      smsConsent,
      smsConsentTimestamp,
      smsConsentIP: ip,
      smsOptIn: smsConsent,
      smsOptInTimestamp: smsConsentTimestamp,
      source: cleanText(body.source || 'website'),
      landingPage: cleanText(body.landingPage || '/'),
      utmSource: cleanText(body.utmSource || ''),
      utmMedium: cleanText(body.utmMedium || ''),
      utmCampaign: cleanText(body.utmCampaign || ''),
      utmTerm: cleanText(body.utmTerm || ''),
      utmContent: cleanText(body.utmContent || ''),
      gclid: adAttribution.gclid || (body.gclid ? cleanText(body.gclid) : null),
      adAttribution,
      submittedAt,
      ...(isOptionsFlow ? {
        primaryConstraint: cleanText(body.primaryConstraint || 'Not provided'),
        submissionFlow: DOMINION_OPTIONS_FLOW,
        submissionId: body.submissionId!.toLowerCase(),
        funnelVisitId: body.funnelVisitId?.toLowerCase() || '',
        openaiObref: body.openaiObref || '',
        sellerAuthority: body.sellerAuthority,
      } : {}),
    }

    const controlInput = {
      firstName: lead.firstName, lastName: lead.lastName, phone: lead.phone, email: lead.email,
      address: lead.address, city: lead.city, state: lead.state, zip: lead.zip,
      condition: lead.condition, timeline: lead.timeline,
      source: lead.source, landingPage: lead.landingPage, utmSource: lead.utmSource,
      utmMedium: lead.utmMedium, utmCampaign: lead.utmCampaign, utmTerm: lead.utmTerm,
      utmContent: lead.utmContent, gclid: lead.gclid, adAttribution: lead.adAttribution,
      smsConsent: lead.smsConsent, smsConsentTimestamp: lead.smsConsentTimestamp,
      smsConsentIP: lead.smsConsentIP, submittedAt: lead.submittedAt,
      ...(isOptionsFlow ? { primaryConstraint: lead.primaryConstraint,
        funnelVisitId: lead.funnelVisitId, sellerAuthority: lead.sellerAuthority,
        tcpaConsented: lead.tcpaConsented } : {}),
    }

    if (isOptionsFlow) {
      // QA marks only suppress ad measurement. All validation and intake protections stay intact.
      const internalQa = isSellerMeasurementQa(body)
      let receipt
      try {
        receipt = await withOptionsTimeout(recordDominionOptionsLeadSubmission(controlInput, body.submissionId!, { internalQa }),
          5000, 'seller-options receipt')
      } catch (error) {
        if (error instanceof DominionOptionsSubmissionConflictError) {
          return optionsFailure('These details differ from the saved submission. Please call us to confirm any changes.', 409)
        }
        console.error('[OPTIONS RECEIPT UNCONFIRMED]')
        return optionsFailure(`We could not confirm your submission. Please call or text us at ${SITE.phone}.`, 503)
      }

      let deliveryStatus = dominionOptionsDeliveryStatus(receipt.record.optionsReceipt?.delivery)
      if (!receipt.duplicate) {
        // Options inquiries go only to the existing operator email recipients and
        // the dedicated create-only intake. No automated texts or other enrollment.
        const receiptId = String(receipt.record.id)
        const funnelVisitId = lead.funnelVisitId
        const submissionId = lead.submissionId!
        const deliveryTasks: Array<Promise<DominionDeliveryOutcome>> = [
          withOptionsTimeout(sendEmailNotification(lead), 5000, 'options email notification'),
          withOptionsTimeout(forwardToLazarus(lead), 5000, 'options lazarus forward'),
          withOptionsTimeout(reportAndRecordOpenAIConversion({
            internalQa,
            submissionId,
            funnelVisitId,
            occurredAt: lead.submittedAt,
            leadReceiptId: receiptId,
            oppref: lead.adAttribution.oppref,
            obref: lead.openaiObref,
            adAttribution: lead.adAttribution,
          }), 5000, 'OpenAI lead conversion'),
        ]
        if (funnelVisitId) {
          deliveryTasks.push(
            withOptionsTimeout(recordOptionsFunnelMilestone({
              eventId: submissionId,
              visitId: funnelVisitId,
              eventType: 'lead_accepted',
              detail: internalQa ? 'internal_qa' : 'unmarked',
              occurredAt: lead.submittedAt,
              leadReceiptId: receiptId,
              adAttribution: lead.adAttribution,
            }).then(() => ({ status: 'provider_accepted' as const })), 3000, 'seller funnel lead acceptance'),
          )
        }
        const deliveries = await Promise.allSettled(deliveryTasks)
        const delivery: DominionDeliveryMap = {
          email: settledDelivery(deliveries[0]), lazarus: settledDelivery(deliveries[1]),
          teamSms: { status: 'skipped' }, sentinel: { status: 'skipped' }, mailchimp: { status: 'skipped' },
        }
        if (funnelVisitId && deliveries[3]?.status === 'rejected') {
          console.error('[SELLER FUNNEL ACCEPTANCE EVENT ERROR]', { receiptId })
        }
        if (deliveries[2]?.status === 'fulfilled') {
          const conversion = deliveries[2].value as DominionDeliveryOutcome
          if (conversion.status === 'failed' || conversion.status === 'outcome_unknown') {
            console.error('[OPENAI LEAD CONVERSION NEEDS REVIEW]', {
              receiptId,
              referenceId: conversion.referenceId || null,
            })
          }
        } else if (deliveries[2]?.status === 'rejected') {
          console.error('[OPENAI LEAD CONVERSION OUTCOME UNKNOWN]', { receiptId })
        }
        deliveryStatus = dominionOptionsDeliveryStatus(delivery)
        try {
          const conversion = deliveries[2]?.status === 'fulfilled'
            ? deliveries[2].value as OpenAIConversionOutcome
            : { status: 'outcome_unknown' as const, referenceId: 'task_timeout_unknown',
              measurementMode: internalQa ? 'qa' as const :
                process.env.OPENAI_ADS_CONVERSIONS_VALIDATE_ONLY === 'true' ? 'validation' as const : 'production' as const }
          await withOptionsTimeout(recordDominionOptionsDelivery(receipt, delivery, conversion), 3000, 'delivery outcome record')
        } catch {
          // The initial durable pending envelope remains a reconciliation item.
          deliveryStatus = 'needs_review'
          console.error('[OPTIONS DELIVERY RECONCILIATION REQUIRED]', { receiptId: String(receipt.record.id) })
        }
        if (deliveryStatus === 'needs_review') {
          console.error('[OPTIONS DELIVERY NEEDS REVIEW]', { receiptId: String(receipt.record.id) })
        }
      }

      // Saved inquiry is not a delivered notification or a qualified seller.
      return NextResponse.json({ success: true, accepted: true, controlRecorded: true,
        receiptId: String(receipt.record.id), duplicate: receipt.duplicate, deliveryStatus,
        openaiBrowserEligible: !receipt.duplicate && !internalQa &&
          receipt.record.optionsReceipt?.measurementClass !== 'internal_qa' &&
          process.env.OPENAI_ADS_CONVERSIONS_VALIDATE_ONLY !== 'true',
        message: 'Your inquiry has been recorded.' })
    }

    // Log non-PII summary (visible in Vercel logs)
    console.log('[NEW LEAD]', lead.firstName, lead.lastName, '—', lead.city, lead.state, '—', lead.timeline, '—', lead.condition)

    // Send email + internal team SMS + forward to Sentinel CRM in parallel
    // All are best-effort — failures don't block the response
    const sideEffectPromises = [
      withTimeout(sendEmailNotification(lead), 1500, 'email notification'),
      withTimeout(sendSmsNotification(lead), 3500, 'sms notification'),
      withTimeout(forwardToSentinel(lead), 1500, 'sentinel forward'),
      withTimeout(forwardToLazarus(lead), 1500, 'lazarus forward'),
      withTimeout(syncSellerLeadToMailchimp(lead), 1500, 'mailchimp seller sync'),
      withTimeout(recordDominionLeadSubmission(controlInput), 1500, 'lead control write'),
    ]

    const sideEffects = await Promise.allSettled(sideEffectPromises)

    const controlWrite = sideEffects[sideEffects.length - 1]
    if (controlWrite?.status === 'rejected') {
      console.error('[LEAD CONTROL ERROR]', {
        message:
          controlWrite.reason instanceof Error
            ? controlWrite.reason.message
            : String(controlWrite.reason || 'Unknown Dominion lead control failure.'),
        submittedAt: lead.submittedAt,
        seller: `${lead.firstName} ${lead.lastName}`.trim(),
        property: `${lead.address}, ${lead.city}, ${lead.state} ${lead.zip}`.trim(),
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you! One of our team members will reach out within 24 hours.',
      controlRecorded: controlWrite?.status !== 'rejected',
    })
  } catch (err) {
    console.error('[LEAD API ERROR]', err)
    if (isOptionsFlow) return optionsFailure(`We could not confirm your submission. Please call or text us at ${SITE.phone}.`, 500)
    return NextResponse.json(
      { error: `Something went wrong. Please call or text us at ${SITE.phone}.` },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok', endpoint: '/api/leads' })
}
