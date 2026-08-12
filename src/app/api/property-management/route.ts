import { NextRequest, NextResponse } from 'next/server'
import { SITE } from '@/lib/constants'

/**
 * Property management inquiries.
 *
 * Deliberately isolated from the seller pipeline in /api/leads: this route
 * does not write to Supabase, forward to Sentinel or Lazarus, sync to
 * Mailchimp, or fire team SMS alerts. It emails Adam and nothing else, so
 * management inquiries never land in seller lead reporting or Ads data.
 */

const NOTIFICATION_RECIPIENT = 'adam@dominionhomedeals.com'

interface PropertyManagementPayload {
  fullName?: string
  phone?: string
  email?: string
  propertyLocation?: string
  doors?: string
  occupancy?: string
  message?: string
  honeypot?: string
  landingPage?: string
}

function validatePhone(phone: string): boolean {
  return phone.replace(/\D/g, '').length >= 10
}

function validateEmail(email: string): boolean {
  return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)
}

function sanitize(value: unknown, maxLength = 500): string {
  if (typeof value !== 'string') return ''
  return value
    .trim()
    .substring(0, maxLength)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

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

function row(label: string, value: string): string {
  return `
    <tr>
      <td style="padding: 6px 0; color: #666; width: 140px; vertical-align: top;">${label}</td>
      <td style="padding: 6px 0; font-weight: 600;">${value}</td>
    </tr>`
}

async function sendInquiryEmail(inquiry: {
  fullName: string
  phone: string
  email: string
  propertyLocation: string
  doors: string
  occupancy: string
  message: string
  landingPage: string
  submittedAt: string
}): Promise<boolean> {
  const RESEND_API_KEY = process.env.RESEND_API_KEY

  if (!RESEND_API_KEY) {
    console.error('[PM] No RESEND_API_KEY set - cannot deliver property management inquiry')
    return false
  }

  const emailCell = inquiry.email
    ? `<a href="mailto:${inquiry.email}" style="color: #1a3a2a;">${inquiry.email}</a>`
    : 'Not provided'

  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1a3a2a; color: white; padding: 20px 24px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 20px;">Property Management Inquiry</h1>
        <p style="margin: 4px 0 0; opacity: 0.8; font-size: 14px;">dominionhomedeals.com/property-management</p>
      </div>

      <div style="background: #f9f8f6; padding: 24px; border: 1px solid #e5e3df;">
        <h2 style="margin: 0 0 16px; font-size: 16px; color: #1a3a2a;">Owner</h2>
        <table style="width: 100%; border-collapse: collapse;">
          ${row('Name', inquiry.fullName)}
          ${row('Phone', `<a href="tel:${inquiry.phone}" style="color: #1a3a2a;">${inquiry.phone}</a>`)}
          ${row('Email', emailCell)}
        </table>
      </div>

      <div style="padding: 24px; border: 1px solid #e5e3df; border-top: none; border-radius: 0 0 8px 8px;">
        <h2 style="margin: 0 0 16px; font-size: 16px; color: #1a3a2a;">Property</h2>
        <table style="width: 100%; border-collapse: collapse;">
          ${row('Location', inquiry.propertyLocation)}
          ${row('Doors', inquiry.doors || 'Not provided')}
          ${row('Occupancy', inquiry.occupancy || 'Not provided')}
        </table>
        ${
          inquiry.message
            ? `<h2 style="margin: 20px 0 8px; font-size: 16px; color: #1a3a2a;">Notes</h2>
               <p style="margin: 0; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${inquiry.message}</p>`
            : ''
        }
        <p style="margin: 20px 0 0; font-size: 12px; color: #888;">
          Submitted: ${inquiry.submittedAt}<br/>
          Page: ${inquiry.landingPage || '/property-management'}
        </p>
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
        from: 'Dominion Homes <leads@dominionhomedeals.com>',
        to: [NOTIFICATION_RECIPIENT],
        ...(inquiry.email ? { reply_to: inquiry.email } : {}),
        subject: `Property Management Inquiry: ${inquiry.fullName} - ${inquiry.propertyLocation}`,
        html: htmlBody,
      }),
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error('[PM EMAIL ERROR]', res.status, errorText)
      return false
    }

    console.log('[PM EMAIL] Sent to', NOTIFICATION_RECIPIENT)
    return true
  } catch (err) {
    console.error('[PM EMAIL ERROR]', err)
    return false
  }
}

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

    const body: PropertyManagementPayload = await request.json()

    if (body.honeypot) {
      console.log(`[PM SPAM] Honeypot triggered from ${ip}`)
      return NextResponse.json({ success: true })
    }

    const fullName = sanitize(body.fullName, 120)
    const phone = sanitize(body.phone, 40)
    const email = sanitize(body.email, 200)
    const propertyLocation = sanitize(body.propertyLocation, 300)
    const doors = sanitize(body.doors, 60)
    const occupancy = sanitize(body.occupancy, 60)
    const message = sanitize(body.message, 2000)
    const landingPage = sanitize(body.landingPage, 300)

    const errors: string[] = []
    if (fullName.length < 2) errors.push('Name required')
    if (!phone || !validatePhone(phone)) errors.push('Valid phone required')
    if (propertyLocation.length < 2) errors.push('Property location required')
    if (body.email && !validateEmail(String(body.email).trim())) errors.push('Valid email required')

    if (errors.length > 0) {
      return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 400 })
    }

    const delivered = await sendInquiryEmail({
      fullName,
      phone,
      email,
      propertyLocation,
      doors,
      occupancy,
      message,
      landingPage,
      submittedAt: new Date().toISOString(),
    })

    if (!delivered) {
      return NextResponse.json(
        { error: `We could not send that. Please call us at ${SITE.phone}.` },
        { status: 502 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[PM ERROR]', err)
    return NextResponse.json(
      { error: `Something went wrong. Please call us at ${SITE.phone}.` },
      { status: 500 }
    )
  }
}
