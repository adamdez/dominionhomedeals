'use client'

import { useState, useEffect, FormEvent } from 'react'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface FormData {
  // Step 1
  address: string
  city: string
  state: string
  zip: string
  // Step 2
  condition: string
  timeline: string
  // Step 3
  firstName: string
  lastName: string
  phone: string
  email: string
  // Compliance
  tcpaConsent: boolean
  // Honeypot
  honeypot: string
  // UTM
  utmSource: string
  utmMedium: string
  utmCampaign: string
  utmTerm: string
  utmContent: string
  landingPage: string
}

const initialFormData: FormData = {
  address: '',
  city: '',
  state: 'WA',
  zip: '',
  condition: '',
  timeline: '',
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  tcpaConsent: false,
  honeypot: '',
  utmSource: '',
  utmMedium: '',
  utmCampaign: '',
  utmTerm: '',
  utmContent: '',
  landingPage: '',
}

const conditionOptions = [
  { value: 'Great Shape', emoji: '✨', label: 'Great Shape' },
  { value: 'Minor Repairs', emoji: '🔧', label: 'Minor Repairs' },
  { value: 'Needs Work', emoji: '🏗', label: 'Needs Work' },
  { value: 'Major Issues', emoji: '⚠️', label: 'Major Issues' },
]

const timelineOptions = [
  { value: 'ASAP', label: 'ASAP', sub: 'Under 2 weeks' },
  { value: 'Soon', label: 'Soon', sub: '2–4 weeks' },
  { value: 'A Few Months', label: 'A Few Months', sub: '1–3 months' },
  { value: 'Flexible', label: 'Flexible', sub: 'No rush' },
]

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function LeadForm() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  // Capture UTM params on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      setFormData((prev) => ({
        ...prev,
        utmSource: params.get('utm_source') || '',
        utmMedium: params.get('utm_medium') || '',
        utmCampaign: params.get('utm_campaign') || '',
        utmTerm: params.get('utm_term') || '',
        utmContent: params.get('utm_content') || '',
        landingPage: window.location.pathname,
      }))
    }
  }, [])

  const updateField = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Format phone as user types
  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '').substring(0, 10)
    if (cleaned.length >= 7) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
    } else if (cleaned.length >= 4) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`
    } else if (cleaned.length > 0) {
      return `(${cleaned}`
    }
    return ''
  }

  const canAdvanceStep1 = formData.address.trim().length >= 3 && formData.city.trim().length >= 2 && formData.zip.length >= 5
  const canAdvanceStep2 = formData.condition !== '' && formData.timeline !== ''
  const canSubmit = formData.firstName.trim() && formData.lastName.trim() && formData.phone.replace(/\D/g, '').length >= 10 && formData.email.includes('@') && formData.tcpaConsent

  const handleStep1Submit = (e: FormEvent) => {
    e.preventDefault()
    if (canAdvanceStep1) setStep(2)
  }

  const handleStep2Continue = () => {
    if (canAdvanceStep2) setStep(3)
  }

  const handleFinalSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!canSubmit || isSubmitting) return

    setIsSubmitting(true)
    setErrorMessage('')

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tcpaTimestamp: new Date().toISOString(),
          source: 'website',
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setSubmitStatus('success')
      } else {
        setErrorMessage(data.error || 'Something went wrong. Please call us at 208-625-8078.')
        setSubmitStatus('error')
      }
    } catch {
      setErrorMessage('Network error. Please call us at 208-625-8078.')
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ---- SUCCESS STATE ----
  if (submitStatus === 'success') {
    return (
      <div className="text-center py-8 px-4">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-forest-50">
          <svg className="h-8 w-8 text-forest-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="font-display text-2xl text-ink-700">We Got Your Info!</h3>
        <p className="mt-2 text-ink-400">
          One of our team — Adam, Nathan, or Logan — will reach out within 24 hours to discuss your property at{' '}
          <span className="font-medium text-ink-600">{formData.address}, {formData.city}</span>.
        </p>
        <p className="mt-4 text-sm text-ink-300">
          Need to talk sooner?{' '}
          <a href="tel:2086258078" className="font-medium text-forest-600 hover:text-forest-700">
            Call 208-625-8078
          </a>
        </p>
      </div>
    )
  }

  return (
    <div id="get-offer">
      <p className="mb-4 text-center text-sm text-ink-400">
        Takes about 60 seconds — no obligation
      </p>

      {/* Step Indicator */}
      <div className="mb-6 flex items-center justify-center gap-0">
        {[
          { num: 1, label: 'Property' },
          { num: 2, label: 'Details' },
          { num: 3, label: 'Contact' },
        ].map((s, i) => (
          <div key={s.num} className="flex items-center">
            <div className="flex items-center gap-1.5">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  step >= s.num
                    ? 'bg-forest-500 text-white'
                    : 'bg-stone-200 text-stone-400'
                }`}
              >
                {s.num}
              </span>
              <span
                className={`text-sm font-medium ${
                  step >= s.num ? 'text-ink-600' : 'text-stone-300'
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < 2 && (
              <div
                className={`mx-3 h-px w-10 ${
                  step > s.num ? 'bg-forest-500' : 'bg-stone-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* ============ STEP 1: Property Address ============ */}
      {step === 1 && (
        <form onSubmit={handleStep1Submit} className="space-y-3.5">
          <div>
            <label htmlFor="address" className="mb-1 block text-sm font-semibold text-ink-500">
              Property Address
            </label>
            <input
              id="address"
              name="address"
              type="text"
              required
              placeholder="123 Main St"
              value={formData.address}
              onChange={(e) => updateField('address', e.target.value)}
              className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3.5 py-3 text-ink-600 placeholder:text-stone-300 focus:border-forest-400 focus:ring-forest-400 transition-colors text-[15px]"
            />
          </div>
          <div className="grid grid-cols-5 gap-2.5">
            <div className="col-span-2">
              <input
                name="city"
                type="text"
                required
                placeholder="City"
                value={formData.city}
                onChange={(e) => updateField('city', e.target.value)}
                className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3.5 py-3 text-ink-600 placeholder:text-stone-300 focus:border-forest-400 focus:ring-forest-400 transition-colors text-[15px]"
              />
            </div>
            <select
              name="state"
              value={formData.state}
              onChange={(e) => updateField('state', e.target.value)}
              className="rounded-lg border border-stone-200 bg-stone-50 px-2 py-3 text-ink-600 focus:border-forest-400 focus:ring-forest-400 text-[15px]"
            >
              <option value="WA">WA</option>
              <option value="ID">ID</option>
            </select>
            <div className="col-span-2">
              <input
                name="zip"
                type="text"
                required
                placeholder="ZIP"
                maxLength={5}
                value={formData.zip}
                onChange={(e) => updateField('zip', e.target.value.replace(/\D/g, ''))}
                className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3.5 py-3 text-ink-600 placeholder:text-stone-300 focus:border-forest-400 focus:ring-forest-400 transition-colors text-[15px]"
              />
            </div>
          </div>

          {/* Honeypot — hidden from real users */}
          <input
            type="text"
            name="company_website"
            value={formData.honeypot}
            onChange={(e) => updateField('honeypot', e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, width: 0 }}
          />

          <button
            type="submit"
            disabled={!canAdvanceStep1}
            className="w-full rounded-xl bg-forest-600 py-3.5 text-[15px] font-semibold text-white transition hover:bg-forest-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue →
          </button>
        </form>
      )}

      {/* ============ STEP 2: Property Details ============ */}
      {step === 2 && (
        <div className="space-y-5">
          <div>
            <p className="mb-3 text-sm font-semibold text-ink-500">
              What condition is the property in?
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {conditionOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateField('condition', opt.value)}
                  className={`flex items-center gap-2 rounded-lg border px-3.5 py-3 text-left text-[15px] transition ${
                    formData.condition === opt.value
                      ? 'border-forest-500 bg-forest-50 text-forest-700 font-medium'
                      : 'border-stone-200 bg-white text-ink-500 hover:border-stone-300'
                  }`}
                >
                  <span>{opt.emoji}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold text-ink-500">
              How soon do you want to sell?
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {timelineOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateField('timeline', opt.value)}
                  className={`rounded-lg border px-3.5 py-3 text-left transition ${
                    formData.timeline === opt.value
                      ? 'border-forest-500 bg-forest-50 text-forest-700'
                      : 'border-stone-200 bg-white text-ink-500 hover:border-stone-300'
                  }`}
                >
                  <span className={`text-[15px] ${formData.timeline === opt.value ? 'font-medium' : ''}`}>
                    {opt.label}
                  </span>
                  <span className="block text-xs text-ink-300">{opt.sub}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleStep2Continue}
            disabled={!canAdvanceStep2}
            className="w-full rounded-xl bg-forest-600 py-3.5 text-[15px] font-semibold text-white transition hover:bg-forest-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue →
          </button>

          <button
            type="button"
            onClick={() => setStep(1)}
            className="w-full text-center text-sm text-ink-400 hover:text-ink-600"
          >
            ← Back
          </button>
        </div>
      )}

      {/* ============ STEP 3: Contact + TCPA ============ */}
      {step === 3 && (
        <form onSubmit={handleFinalSubmit} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-2.5">
            <input
              name="firstName"
              type="text"
              required
              placeholder="First name"
              value={formData.firstName}
              onChange={(e) => updateField('firstName', e.target.value)}
              className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3.5 py-3 text-ink-600 placeholder:text-stone-300 focus:border-forest-400 focus:ring-forest-400 transition-colors text-[15px]"
            />
            <input
              name="lastName"
              type="text"
              required
              placeholder="Last name"
              value={formData.lastName}
              onChange={(e) => updateField('lastName', e.target.value)}
              className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3.5 py-3 text-ink-600 placeholder:text-stone-300 focus:border-forest-400 focus:ring-forest-400 transition-colors text-[15px]"
            />
          </div>

          <div>
            <label htmlFor="phone" className="mb-1 block text-sm font-semibold text-ink-500">
              Phone
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              placeholder="(509) 555-1234"
              value={formData.phone}
              onChange={(e) => updateField('phone', formatPhone(e.target.value))}
              className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3.5 py-3 text-ink-600 placeholder:text-stone-300 focus:border-forest-400 focus:ring-forest-400 transition-colors text-[15px]"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-semibold text-ink-500">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="you@email.com"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3.5 py-3 text-ink-600 placeholder:text-stone-300 focus:border-forest-400 focus:ring-forest-400 transition-colors text-[15px]"
            />
          </div>

          {/* ---- TCPA Consent Checkbox ---- */}
          <div className="rounded-lg border border-stone-100 bg-stone-50 p-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="tcpaConsent"
                checked={formData.tcpaConsent}
                onChange={(e) => updateField('tcpaConsent', e.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 rounded border-stone-300 text-forest-600 focus:ring-forest-500"
              />
              <span className="text-[11px] leading-relaxed text-ink-400">
                By checking this box, you consent to receive calls, texts, and emails from
                Dominion Homes, LLC at the number and email provided, including by autodialer
                and prerecorded messages, for the purpose of discussing the sale of your
                property. Consent is not a condition of purchase. Message and data rates may
                apply. Reply STOP to opt out.
              </span>
            </label>
          </div>

          {/* Error message */}
          {submitStatus === 'error' && errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className="w-full rounded-xl bg-forest-600 py-3.5 text-[15px] font-semibold text-white transition hover:bg-forest-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Submitting...
              </span>
            ) : (
              'Get My Cash Offer →'
            )}
          </button>

          <button
            type="button"
            onClick={() => setStep(2)}
            className="w-full text-center text-sm text-ink-400 hover:text-ink-600"
          >
            ← Back
          </button>
        </form>
      )}

      {/* Trust badges */}
      <div className="mt-4 flex items-center justify-center gap-4 text-xs text-ink-300">
        <span className="flex items-center gap-1">
          <svg className="h-3.5 w-3.5 text-forest-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Secure &amp; private
        </span>
        <span>No obligation</span>
        <span>Local team calls you</span>
      </div>
    </div>
  )
}
