import { NextRequest, NextResponse } from 'next/server'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface LeadPayload {
  address: string
  city: string
  state: string
  zip: string
  condition: string
  timeline: string
  firstName: string
  lastName: string
  phone: string
  email: string
  tcpaConsent: boolean
  tcpaTimestamp: string
  honeypot?: string
  source?: string
  landingPage?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmTerm?: string
  utmContent?: string
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function validatePhone(phone: string): boolean {
  return phone.replace(/\D/g, '').length >= 10
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function sanitize(str: string): string {
  return str.trim().replace(/<[^>]*>/g, '').substring(0, 500)
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

async function sendEmailNotification(lead: Record<string, unknown>) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY
  if (!RESEND_API_KEY) {
    console.log('[EMAIL] No RESEND_API_KEY set — skipping email. Lead data:')
    console.log(JSON.stringify(lead, null, 2))
    return
  }

  const priorityLabel = lead.timeline === 'ASAP' ? '🔴 URGENT' : lead.timeline === 'Soon' ? '🟡 SOON' : '🟢 NORMAL'

  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1a3a2a; color: white; padding: 20px 24px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 20px;">🏠 New Lead from dominionhomedeals.com</h1>
        <p style="margin: 4px 0 0; opacity: 0.8; font-size: 14px;">${priorityLabel} — ${lead.timeline}</p>
      </div>
      
      <div style="background: #f9f8f6; padding: 24px; border: 1px solid #e5e3df;">
        <h2 style="margin: 0 0 16px; font-size: 16px; color: #1a3a2a;">Contact Info</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #666; width: 120px;">Name</td>
            <td style="padding: 6px 0; font-weight: 600;">${lead.firstName} ${lead.lastName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #666;">Phone</td>
            <td style="padding: 6px 0; font-weight: 600;"><a href="tel:${lead.phone}" style="color: #1a3a2a;">${lead.phone}</a></td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #666;">Email</td>
            <td style="padding: 6px 0;"><a href="mailto:${lead.email}" style="color: #1a3a2a;">${lead.email}</a></td>
          </tr>
        </table>
      </div>

      <div style="padding: 24px; border: 1px solid #e5e3df; border-top: none;">
        <h2 style="margin: 0 0 16px; font-size: 16px; color: #1a3a2a;">Property Details</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #666; width: 120px;">Address</td>
            <td style="padding: 6px 0; font-weight: 600;">${lead.address}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #666;">City / State</td>
            <td style="padding: 6px 0;">${lead.city}, ${lead.state} ${lead.zip}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #666;">Condition</td>
            <td style="padding: 6px 0;">${lead.condition}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #666;">Timeline</td>
            <td style="padding: 6px 0; font-weight: 600; color: ${lead.timeline === 'ASAP' ? '#dc2626' : '#1a3a2a'};">${lead.timeline}</td>
          </tr>
        </table>
      </div>

      <div style="padding: 24px; border: 1px solid #e5e3df; border-top: none; border-radius: 0 0 8px 8px;">
        <h2 style="margin: 0 0 12px; font-size: 16px; color: #1a3a2a;">TCPA Consent ✅</h2>
        <p style="margin: 0; font-size: 12px; color: #888;">
          Consented at: ${lead.tcpaTimestamp}<br/>
          IP: ${lead.tcpaIP}<br/>
          Source: ${lead.source} | Page: ${lead.landingPage}
        </p>
        ${lead.utmSource ? `<p style="margin: 8px 0 0; font-size: 12px; color: #888;">UTM: ${lead.utmSource} / ${lead.utmMedium} / ${lead.utmCampaign}</p>` : ''}
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
        to: ['offers@dominionhomedeals.com'],
        subject: `${priorityLabel} New Lead: ${lead.firstName} ${lead.lastName} — ${lead.address}, ${lead.city}`,
        html: htmlBody,
      }),
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error('[EMAIL ERROR]', errorText)
    } else {
      console.log('[EMAIL] Sent to offers@dominionhomedeals.com')
    }
  } catch (err) {
    console.error('[EMAIL ERROR]', err)
  }
}

/* ------------------------------------------------------------------ */
/*  SMS via Twilio                                                     */
/* ------------------------------------------------------------------ */

async function sendSmsNotification(lead: Record<string, unknown>) {
  const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID
  const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN
  const TWILIO_FROM = process.env.TWILIO_PHONE_NUMBER

  if (!TWILIO_SID || !TWILIO_TOKEN || !TWILIO_FROM) {
    console.log('[SMS] Twilio not configured — skipping SMS notification')
    return
  }

  const priorityEmoji = lead.timeline === 'ASAP' ? '🔴' : lead.timeline === 'Soon' ? '🟡' : '🟢'

  const message = `${priorityEmoji} NEW LEAD\n${lead.firstName} ${lead.lastName}\n📍 ${lead.address}, ${lead.city} ${lead.state}\n📱 ${lead.phone}\n🏠 ${lead.condition} | ${lead.timeline}\n\nCall them back ASAP!`

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: 'Basic ' + Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64'),
        },
        body: new URLSearchParams({
          To: '+12086258078',
          From: TWILIO_FROM,
          Body: message,
        }),
      }
    )

    if (!res.ok) {
      const errorText = await res.text()
      console.error('[SMS ERROR]', errorText)
    } else {
      console.log('[SMS] Sent to 208-625-8078')
    }
  } catch (err) {
    console.error('[SMS ERROR]', err)
  }
}

/* ------------------------------------------------------------------ */
/*  POST handler                                                       */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
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

    const body: LeadPayload = await request.json()

    // Honeypot
    if (body.honeypot) {
      console.log(`[SPAM] Honeypot triggered from ${ip}`)
      return NextResponse.json({ success: true, message: 'Thank you!' })
    }

    // Validation
    const errors: string[] = []
    if (!body.address || body.address.trim().length < 3) errors.push('Address required')
    if (!body.city || body.city.trim().length < 2) errors.push('City required')
    if (!body.state || !['WA', 'ID'].includes(body.state)) errors.push('Invalid state')
    if (!body.zip || body.zip.length < 5) errors.push('ZIP required')
    if (!body.condition) errors.push('Condition required')
    if (!body.timeline) errors.push('Timeline required')
    if (!body.firstName?.trim()) errors.push('First name required')
    if (!body.lastName?.trim()) errors.push('Last name required')
    if (!body.phone || !validatePhone(body.phone)) errors.push('Valid phone required')
    if (!body.email || !validateEmail(body.email)) errors.push('Valid email required')
    if (!body.tcpaConsent) errors.push('Consent required')

    if (errors.length > 0) {
      return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 400 })
    }

    // Build lead object
    const lead = {
      address: sanitize(body.address),
      city: sanitize(body.city),
      state: body.state,
      zip: sanitize(body.zip),
      condition: sanitize(body.condition),
      timeline: sanitize(body.timeline),
      firstName: sanitize(body.firstName),
      lastName: sanitize(body.lastName),
      phone: body.phone.replace(/\D/g, '').substring(0, 11),
      email: sanitize(body.email).toLowerCase(),
      tcpaConsented: true,
      tcpaTimestamp: body.tcpaTimestamp || new Date().toISOString(),
      tcpaIP: ip,
      source: sanitize(body.source || 'website'),
      landingPage: sanitize(body.landingPage || '/'),
      utmSource: sanitize(body.utmSource || ''),
      utmMedium: sanitize(body.utmMedium || ''),
      utmCampaign: sanitize(body.utmCampaign || ''),
      submittedAt: new Date().toISOString(),
    }

    // Always log to console (visible in Vercel logs too)
    console.log('[NEW LEAD]', JSON.stringify(lead, null, 2))

    // Send email + SMS in parallel (don't block the response)
    await Promise.allSettled([
      sendEmailNotification(lead),
      sendSmsNotification(lead),
    ])

    return NextResponse.json({
      success: true,
      message: 'Thank you! One of our team members will reach out within 24 hours.',
    })
  } catch (err) {
    console.error('[LEAD API ERROR]', err)
    return NextResponse.json(
      { error: 'Something went wrong. Please call us at 208-625-8078.' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok', endpoint: '/api/leads' })
}