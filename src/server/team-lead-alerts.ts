import 'server-only'
import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto'
import { getDominionServiceClient } from '@/lib/dominion-supabase'

const TABLE = 'dominion_seller_team_alerts'
const ORIGIN = 'https://www.dominionhomedeals.com'
const STATUS_PATH = '/api/internal/team-alert-status'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const OWNERS = ['Adam', 'Logan'] as const
type Owner = typeof OWNERS[number]
type Config = { account: string; token: string; service: string; from: string; recipients: Record<Owner,string>; enabledAt: number; qaId?: string }
type Alert = { id: string; recipient: Owner; submission_id: string; status: string; provider_sid?: string }

export function teamAlertConfig(env = process.env): Config | null {
  if (env.TEAM_ALERT_SMS_ENABLED !== 'true' || env.VERCEL_ENV !== 'production') return null
  let recipients: Record<Owner,string>
  try { recipients = JSON.parse(env.TEAM_ALERT_SMS_RECIPIENTS || '{}') } catch { throw new Error('Verify team alert recipients') }
  if (Object.keys(recipients).length !== 2 || !OWNERS.every(owner => /^\+1\d{10}$/.test(recipients[owner] || '')) ||
    !recipients.Adam.endsWith('7091') || !recipients.Logan.endsWith('5992') || recipients.Adam === recipients.Logan) throw new Error('Verify team alert recipients')
  const account = env.TEAM_ALERT_SMS_ACCOUNT_SID || '', token = env.TEAM_ALERT_SMS_AUTH_TOKEN || ''
  const service = env.TEAM_ALERT_SMS_SERVICE_SID || '', from = env.TEAM_ALERT_SMS_FROM || ''
  const enabledAt = Date.parse(env.TEAM_ALERT_SMS_ENABLED_AT || '')
  if (!/^AC[0-9a-f]{32}$/i.test(account) || !token || !/^MG[0-9a-f]{32}$/i.test(service) || !/^\+1\d{10}$/.test(from) || !Number.isFinite(enabledAt)) throw new Error('Verify team alert sender')
  return { account, token, service, from, recipients, enabledAt, qaId: env.TEAM_ALERT_SMS_TEST_SUBMISSION_ID }
}

export function teamAlertEligible(input: { submissionId: string; receivedAt: string; internalQa: boolean }, config: Config | null) {
  return Boolean(config && UUID.test(input.submissionId) && Date.parse(input.receivedAt) >= config.enabledAt &&
    (!input.internalQa || input.submissionId === config.qaId))
}

export function teamAlertBody(submissionId: string, test: boolean, crmReady = true) {
  if (!UUID.test(submissionId)) throw new Error('Invalid submission identity')
  return crmReady
    ? `Dominion${test ? ' TEST' : ''}: New seller inquiry. Open the lead: https://lazarus.dominionhomedeals.com/ppc?ppcLeadId=ppc-options-${submissionId}`
    : `Dominion${test ? ' TEST' : ''}: Seller inquiry saved. CRM handoff needs review; check the lead email. https://lazarus.dominionhomedeals.com/ppc`
}

function database() { const db = getDominionServiceClient(); if (!db) throw new Error('Team alert storage unavailable'); return db }
function checked(error: unknown) { if (error) throw new Error('Team alert receipt needs review') }

export async function queueTeamLeadAlerts(input: { submissionId: string; receivedAt: string; internalQa: boolean; crmReady?: boolean }) {
  const config = teamAlertConfig()
  if (!teamAlertEligible(input, config) || !config) return false
  const rows = OWNERS.map(recipient => ({ id: randomUUID(), submission_id: input.submissionId,
    recipient, phone_ending: config.recipients[recipient].slice(-4),
    phone_digest: createHash('sha256').update(config.recipients[recipient]).digest('hex'),
    status: 'pending', is_test: input.internalQa, crm_ready: input.crmReady !== false }))
  const { error } = await database().from(TABLE).upsert(rows, { onConflict: 'submission_id,recipient', ignoreDuplicates: true })
  checked(error)
  return true
}

async function patchAlert(id: string, values: Record<string,unknown>, allowed: string[]) {
  const { error } = await database().from(TABLE).update({ ...values, updated_at: new Date().toISOString() }).eq('id',id).in('status',allowed)
  checked(error)
}

// Atomic claim before provider contact. Never replay an uncertain accepted send.
export async function dispatchTeamLeadAlerts(submissionId: string) {
  const config = teamAlertConfig(); if (!config || !UUID.test(submissionId)) return
  const db = database()
  const { data, error } = await db.from(TABLE).select('id,recipient,submission_id,status,phone_digest,is_test,crm_ready').eq('submission_id',submissionId).eq('status','pending')
  checked(error)
  await Promise.all((data || []).map(async (row: Alert & { phone_digest: string; is_test: boolean; crm_ready: boolean }) => {
    if (!OWNERS.includes(row.recipient) || row.phone_digest !== createHash('sha256').update(config.recipients[row.recipient]).digest('hex')) return
    const claim = await db.from(TABLE).update({ status:'sending',attempted_at:new Date().toISOString(),updated_at:new Date().toISOString() }).eq('id',row.id).eq('status','pending').select('id')
    checked(claim.error); if (claim.data?.length !== 1) return
    try {
      // Respect the existing shared STOP list, without enrolling anyone in seller campaigns.
      const phone = config.recipients[row.recipient]
      const suppressions = await db.from('lazarus_message_suppressions').select('id').in('contact_value',[phone,phone.slice(1),phone.slice(2)]).limit(1)
      checked(suppressions.error)
      if (suppressions.data?.length) { await patchAlert(row.id,{status:'failed',error_code:'recipient_suppressed'},['sending']); return }
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${config.account}/Messages.json`, {
        method:'POST', headers:{ Authorization:`Basic ${Buffer.from(`${config.account}:${config.token}`).toString('base64')}`,'Content-Type':'application/x-www-form-urlencoded' },
        body:new URLSearchParams({ To:phone,From:config.from,MessagingServiceSid:config.service,
          Body:teamAlertBody(row.submission_id,row.is_test,row.crm_ready),StatusCallback:`${ORIGIN}${STATUS_PATH}?alert_id=${row.id}` }),
        signal:AbortSignal.timeout(12000),
      })
      const result = await response.json().catch(() => null)
      if (!response.ok) {
        const rejected = response.status >= 400 && response.status < 500 && ![408,409,425,429].includes(response.status)
        await patchAlert(row.id,{status:rejected?'failed':'unknown',error_code:String(result?.code || response.status)},['sending']); return
      }
      if (!/^SM[0-9a-f]{32}$/i.test(result?.sid || '')) { await patchAlert(row.id,{status:'unknown',error_code:'missing_provider_receipt'},['sending']); return }
      await patchAlert(row.id,{status:'accepted',provider_sid:result.sid,provider_status:String(result.status || 'accepted')},['sending'])
    } catch {
      await patchAlert(row.id,{status:'unknown',error_code:'transport_or_receipt_unknown'},['sending']).catch(() => undefined)
    }
  }))
}

export function validTeamAlertSignature(url: string, fields: Record<string,string>, signature: string, token: string) {
  if (!signature || !token) return false
  const value = url + Object.keys(fields).sort().map(key => key + fields[key]).join('')
  const expected = Buffer.from(createHmac('sha1',token).update(value).digest('base64'))
  const actual = Buffer.from(signature)
  return expected.length === actual.length && timingSafeEqual(expected,actual)
}

export async function receiveTeamAlertStatus(request: Request): Promise<number> {
  const config = teamAlertConfig(); if (!config) return 503
  const id = new URL(request.url).searchParams.get('alert_id') || ''
  if (!UUID.test(id)) return 400
  const fields: Record<string,string> = {}
  for (const [key,value] of await request.formData()) {
    if (typeof value !== 'string' || key in fields) return 400
    fields[key] = value
  }
  if (!validTeamAlertSignature(`${ORIGIN}${STATUS_PATH}?alert_id=${id}`,fields,request.headers.get('x-twilio-signature') || '',config.token)) return 403
  const owner = OWNERS.find(value => config.recipients[value] === fields.To)
  if (fields.AccountSid !== config.account || fields.From !== config.from || !owner || !/^SM[0-9a-f]{32}$/i.test(fields.MessageSid || '')) return 403
  const status = fields.MessageStatus
  if (!['accepted','queued','sending','sent','delivered','failed','undelivered'].includes(status)) return 204
  const db = database()
  const found = await db.from(TABLE).select('id,recipient,status,provider_sid').eq('id',id).single()
  checked(found.error)
  const row = found.data as Alert | null
  if (!row || row.recipient !== owner || (row.provider_sid && row.provider_sid !== fields.MessageSid)) return 403
  const next = status === 'delivered' ? 'delivered' : ['failed','undelivered'].includes(status) ? 'failed' : 'accepted'
  // Late queued/sent callbacks cannot overwrite a terminal receipt.
  await patchAlert(id,{status:next,provider_sid:fields.MessageSid,provider_status:status,error_code:fields.ErrorCode || null},next === 'delivered' ? ['sending','accepted','unknown','failed'] : ['sending','accepted','unknown'])
  return 204
}
