'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { trackFormStep, trackLeadFormSubmission } from '@/lib/tracking'

type Stage = 'address' | 'name' | 'phone' | 'email' | 'details'

interface FormData {
  address: string
  fullName: string
  phone: string
  email: string
  condition: string
  timeline: string
  honeypot: string
  utmSource: string
  utmMedium: string
  utmCampaign: string
  utmTerm: string
  utmContent: string
  gclid: string
  landingPage: string
  city: string
  state: string
  zip: string
}

const initialFormData: FormData = {
  address: '',
  fullName: '',
  phone: '',
  email: '',
  condition: '',
  timeline: '',
  honeypot: '',
  utmSource: '',
  utmMedium: '',
  utmCampaign: '',
  utmTerm: '',
  utmContent: '',
  gclid: '',
  landingPage: '',
  city: '',
  state: 'WA',
  zip: '',
}

const stages: Stage[] = ['address', 'name', 'phone', 'email', 'details']

const conditionOptions = [
  'Great shape',
  'Minor repairs',
  'Needs work',
  'Major issues',
] as const

const timelineOptions = [
  'ASAP',
  '2-4 weeks',
  '1-3 months',
  'Just exploring',
] as const

function splitFullName(fullName: string) {
  const trimmed = fullName.trim()
  if (!trimmed) {
    return { firstName: '', lastName: '' }
  }

  const parts = trimmed.split(/\s+/)
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' '),
  }
}

function formatPhone(value: string) {
  const cleaned = value.replace(/\D/g, '').slice(0, 10)
  if (cleaned.length >= 7) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  if (cleaned.length >= 4) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`
  }
  if (cleaned.length > 0) {
    return `(${cleaned}`
  }
  return ''
}

function inferCityStateZip(address: string) {
  const zipMatch = address.match(/\b(\d{5})(?:-\d{4})?\b/)
  const stateMatch = address.match(/\b([A-Z]{2})\b/)
  const cityStateMatch = address.match(/,\s*([^,]+?),\s*[A-Z]{2}\b/)

  return {
    city: cityStateMatch?.[1]?.trim() || '',
    state: stateMatch?.[1] || 'WA',
    zip: zipMatch?.[1] || '',
  }
}

export function LeadForm() {
  const [stage, setStage] = useState<Stage>('address')
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined') return

    const params = new URLSearchParams(window.location.search)
    const gclidFromQuery = params.get('gclid') || ''
    let storedGclid = ''

    try {
      storedGclid = localStorage.getItem('gclid') || ''
    } catch (error) {}

    setFormData((prev) => ({
      ...prev,
      utmSource: params.get('utm_source') || '',
      utmMedium: params.get('utm_medium') || '',
      utmCampaign: params.get('utm_campaign') || '',
      utmTerm: params.get('utm_term') || '',
      utmContent: params.get('utm_content') || '',
      gclid: gclidFromQuery || storedGclid || '',
      landingPage: window.location.pathname + window.location.search,
    }))
  }, [])

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const canContinueCurrentStage = () => {
    switch (stage) {
      case 'address':
        return formData.address.trim().length >= 6
      case 'name':
        return formData.fullName.trim().length >= 2
      case 'phone':
        return formData.phone.replace(/\D/g, '').length >= 10
      case 'email':
        return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)
      case 'details':
        return true
      default:
        return false
    }
  }

  const advanceStage = () => {
    const currentIndex = stages.indexOf(stage)
    const nextStage = stages[currentIndex + 1]
    if (!nextStage) return

    trackFormStep(currentIndex + 2, nextStage)
    setStage(nextStage)
  }

  const goBack = () => {
    const currentIndex = stages.indexOf(stage)
    const previousStage = stages[currentIndex - 1]
    if (!previousStage) return
    setStage(previousStage)
  }

  const submitLead = async () => {
    if (isSubmitting) return

    setIsSubmitting(true)
    setErrorMessage('')

    const { firstName, lastName } = splitFullName(formData.fullName)
    const inferredAddressParts = inferCityStateZip(formData.address)
    const consentedAt = new Date().toISOString()

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: formData.address,
          city: formData.city || inferredAddressParts.city,
          state: formData.state || inferredAddressParts.state,
          zip: formData.zip || inferredAddressParts.zip,
          condition: formData.condition,
          timeline: formData.timeline,
          firstName,
          lastName,
          phone: formData.phone,
          email: formData.email,
          tcpaConsent: true,
          tcpaTimestamp: consentedAt,
          smsOptIn: true,
          smsOptInTimestamp: consentedAt,
          honeypot: formData.honeypot,
          source: 'website',
          landingPage: formData.landingPage,
          utmSource: formData.utmSource,
          utmMedium: formData.utmMedium,
          utmCampaign: formData.utmCampaign,
          utmTerm: formData.utmTerm,
          utmContent: formData.utmContent,
          gclid: formData.gclid,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setErrorMessage(data.error || 'Something went wrong. Please call us at 509-822-5460.')
        return
      }

      trackLeadFormSubmission({
        landingPage: formData.landingPage,
        utmSource: formData.utmSource,
        utmMedium: formData.utmMedium,
        utmCampaign: formData.utmCampaign,
        propertyCity: formData.city || inferredAddressParts.city,
        propertyState: formData.state || inferredAddressParts.state,
        sellerTimeline: formData.timeline || 'Not provided',
        propertyCondition: formData.condition || 'Not provided',
      })

      window.location.assign('/sell/thank-you')
    } catch (error) {
      setErrorMessage('Network error. Please call us at 509-822-5460.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!canContinueCurrentStage()) return

    if (stage === 'details') {
      await submitLead()
      return
    }

    advanceStage()
  }

  const progressIndex = stages.indexOf(stage)

  return (
    <div id="get-offer" className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-soft sm:p-8">
      <p className="text-center text-sm font-medium text-forest-600">
        Start with the address. We will ask one thing at a time.
      </p>

      <div className="mt-6 flex items-center justify-center gap-2.5">
        {stages.map((item, index) => (
          <span
            key={item}
            className={`h-2.5 rounded-full transition-all ${
              index <= progressIndex ? 'w-8 bg-forest-500' : 'w-2.5 bg-stone-200'
            }`}
          />
        ))}
      </div>

      <div className="mt-6 rounded-2xl bg-stone-50 px-4 py-3 text-sm text-ink-400">
        {stage === 'address' && 'What is the property address?'}
        {stage === 'name' && `Property: ${formData.address}`}
        {stage === 'phone' && `Got it. Who should we ask for? ${formData.fullName}`}
        {stage === 'email' &&
          `Thanks ${formData.fullName.split(/\s+/)[0] || ''}. What is the best number to reach you? ${formData.phone}`}
        {stage === 'details' &&
          `Where should we send the offer follow-up? ${formData.email}`}
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        {stage === 'address' && (
          <div>
            <label htmlFor="address" className="mb-2 block text-sm font-semibold text-ink-500">
              What&apos;s the property address?
            </label>
            <input
              id="address"
              name="address"
              type="text"
              required
              autoComplete="street-address"
              placeholder="123 Main St, Spokane, WA 99205"
              value={formData.address}
              onChange={(event) => updateField('address', event.target.value)}
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4 text-base text-ink-600 placeholder:text-stone-300 transition-colors focus:border-forest-400 focus:ring-forest-400"
            />
          </div>
        )}

        {stage === 'name' && (
          <div>
            <label htmlFor="fullName" className="mb-2 block text-sm font-semibold text-ink-500">
              What&apos;s your name?
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              autoComplete="name"
              placeholder="Your name"
              value={formData.fullName}
              onChange={(event) => updateField('fullName', event.target.value)}
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4 text-base text-ink-600 placeholder:text-stone-300 transition-colors focus:border-forest-400 focus:ring-forest-400"
            />
          </div>
        )}

        {stage === 'phone' && (
          <div>
            <label htmlFor="phone" className="mb-2 block text-sm font-semibold text-ink-500">
              What&apos;s the best phone number?
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              autoComplete="tel"
              placeholder="(509) 555-1234"
              value={formData.phone}
              onChange={(event) => updateField('phone', formatPhone(event.target.value))}
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4 text-base text-ink-600 placeholder:text-stone-300 transition-colors focus:border-forest-400 focus:ring-forest-400"
            />
          </div>
        )}

        {stage === 'email' && (
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-semibold text-ink-500">
              What&apos;s the best email for the offer?
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@email.com"
              value={formData.email}
              onChange={(event) => updateField('email', event.target.value)}
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4 text-base text-ink-600 placeholder:text-stone-300 transition-colors focus:border-forest-400 focus:ring-forest-400"
            />
          </div>
        )}

        {stage === 'details' && (
          <div className="space-y-5">
            <div>
              <p className="text-sm font-semibold text-ink-500">
                Optional: what condition is the property in?
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {conditionOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() =>
                      updateField('condition', formData.condition === option ? '' : option)
                    }
                    className={`rounded-2xl border px-4 py-3 text-left text-sm transition-colors ${
                      formData.condition === option
                        ? 'border-forest-500 bg-forest-50 text-forest-700'
                        : 'border-stone-200 bg-stone-50 text-ink-500 hover:border-stone-300'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-ink-500">
                Optional: when do you want to sell?
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {timelineOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() =>
                      updateField('timeline', formData.timeline === option ? '' : option)
                    }
                    className={`rounded-2xl border px-4 py-3 text-left text-sm transition-colors ${
                      formData.timeline === option
                        ? 'border-forest-500 bg-forest-50 text-forest-700'
                        : 'border-stone-200 bg-stone-50 text-ink-500 hover:border-stone-300'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <input
          type="text"
          name="company_website"
          value={formData.honeypot}
          onChange={(event) => updateField('honeypot', event.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, width: 0 }}
        />

        <input type="hidden" name="gclid" value={formData.gclid} readOnly />
        <input type="hidden" name="utm_source" value={formData.utmSource} readOnly />
        <input type="hidden" name="utm_medium" value={formData.utmMedium} readOnly />
        <input type="hidden" name="utm_campaign" value={formData.utmCampaign} readOnly />
        <input type="hidden" name="landing_page" value={formData.landingPage} readOnly />

        {errorMessage ? (
          <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={!canContinueCurrentStage() || isSubmitting}
          className="w-full rounded-2xl bg-forest-600 px-5 py-4 text-base font-semibold text-white transition hover:bg-forest-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting...' : stage === 'address' ? 'Get My Cash Offer' : stage === 'details' ? 'Get My Cash Offer' : 'Continue'}
        </button>

        {stage !== 'address' ? (
          <button
            type="button"
            onClick={goBack}
            className="w-full text-center text-sm text-ink-400 transition-colors hover:text-ink-600"
          >
            Back
          </button>
        ) : null}

        {stage === 'details' ? (
          <p className="px-2 text-center text-[11px] leading-relaxed text-ink-400">
            By clicking &ldquo;Get My Cash Offer,&rdquo; you consent to receive calls, text
            messages (SMS/MMS), and emails from Dominion Homes, LLC at the phone number
            and email provided, including messages sent using autodialer or automated
            technology. Consent is not a condition of purchase. Message frequency varies,
            up to 10 msgs/month. Message and data rates may apply. Reply STOP to opt out,
            HELP for help. See our{' '}
            <Link href="/privacy" className="underline hover:text-ink-500">
              Privacy Policy
            </Link>{' '}
            and{' '}
            <Link href="/terms" className="underline hover:text-ink-500">
              Terms
            </Link>
            .
          </p>
        ) : null}
      </form>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-xs text-ink-300">
        <span className="rounded-full bg-stone-100 px-3 py-1.5">Private and secure</span>
        <span className="rounded-full bg-stone-100 px-3 py-1.5">No obligation</span>
        <span className="rounded-full bg-stone-100 px-3 py-1.5">Local team follow-up</span>
      </div>
    </div>
  )
}
