'use client'

/**
 * Property management inquiry form.
 *
 * Intentionally free of any analytics or Google Ads calls. This service is
 * not advertised, so nothing here should reach the Ads account or the seller
 * conversion reporting. Submissions go to /api/property-management, which
 * emails Adam directly and does not touch the seller lead pipeline.
 */

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { SITE } from '@/lib/constants'

interface FormState {
  fullName: string
  phone: string
  email: string
  propertyLocation: string
  doors: string
  occupancy: string
  message: string
  honeypot: string
  landingPage: string
}

const initialFormState: FormState = {
  fullName: '',
  phone: '',
  email: '',
  propertyLocation: '',
  doors: '',
  occupancy: '',
  message: '',
  honeypot: '',
  landingPage: '',
}

const doorOptions = ['1 door', '2-4 doors', '5-10 doors', '10+ doors'] as const

const occupancyOptions = ['Tenants in place', 'Vacant', 'Mixed', 'Not sure yet'] as const

const inputClass =
  'w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3.5 text-base text-ink-600 placeholder:text-stone-300 transition-colors focus:border-forest-400 focus:ring-forest-400'

const labelClass = 'mb-2 block text-sm font-semibold text-ink-500'

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

function ChoiceRow({
  legend,
  options,
  value,
  onSelect,
}: {
  legend: string
  options: readonly string[]
  value: string
  onSelect: (next: string) => void
}) {
  return (
    <fieldset>
      <legend className={labelClass}>{legend}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={value === option}
            onClick={() => onSelect(value === option ? '' : option)}
            className={`rounded-2xl border px-4 py-3 text-left text-sm transition-colors ${
              value === option
                ? 'border-forest-500 bg-forest-50 text-forest-700'
                : 'border-stone-200 bg-stone-50 text-ink-500 hover:border-stone-300'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

export function PropertyManagementForm() {
  const [formData, setFormData] = useState<FormState>(initialFormState)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    setFormData((prev) => ({ ...prev, landingPage: window.location.pathname }))
  }, [])

  const updateField = (field: keyof FormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const canSubmit =
    formData.fullName.trim().length >= 2 &&
    formData.phone.replace(/\D/g, '').length >= 10 &&
    formData.propertyLocation.trim().length >= 2 &&
    (!formData.email.trim() || /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email))

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSubmit || isSubmitting) return

    setIsSubmitting(true)
    setErrorMessage('')

    try {
      const response = await fetch('/api/property-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setErrorMessage(data.error || `Something went wrong. Please call us at ${SITE.phone}.`)
        return
      }

      setIsSubmitted(true)
    } catch (error) {
      setErrorMessage(`Network error. Please call us at ${SITE.phone}.`)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="rounded-[28px] border border-stone-200 bg-white p-8 text-center shadow-soft">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-forest-50">
          <svg
            className="h-6 w-6 text-forest-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="mt-4 font-display text-xl text-ink-600">Got it - thanks.</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-400">
          Your inquiry went straight to us. Expect a call or email back shortly. If
          you would rather not wait, call {SITE.phone}.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-soft sm:p-8">
      <p className="text-center text-sm font-medium text-forest-600">
        Tell us about the property. We will get back to you directly.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <label htmlFor="pm-fullName" className={labelClass}>
            Your name
          </label>
          <input
            id="pm-fullName"
            name="fullName"
            type="text"
            required
            autoComplete="name"
            placeholder="Your name"
            value={formData.fullName}
            onChange={(event) => updateField('fullName', event.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="pm-phone" className={labelClass}>
            Phone
          </label>
          <input
            id="pm-phone"
            name="phone"
            type="tel"
            required
            autoComplete="tel"
            placeholder="(509) 555-1234"
            value={formData.phone}
            onChange={(event) => updateField('phone', formatPhone(event.target.value))}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="pm-email" className={labelClass}>
            Email <span className="font-normal text-ink-300">(optional)</span>
          </label>
          <input
            id="pm-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@email.com"
            value={formData.email}
            onChange={(event) => updateField('email', event.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="pm-propertyLocation" className={labelClass}>
            Property address or city
          </label>
          <input
            id="pm-propertyLocation"
            name="propertyLocation"
            type="text"
            required
            autoComplete="street-address"
            placeholder="123 Main St, Spokane, WA"
            value={formData.propertyLocation}
            onChange={(event) => updateField('propertyLocation', event.target.value)}
            className={inputClass}
          />
        </div>

        <ChoiceRow
          legend="How many doors?"
          options={doorOptions}
          value={formData.doors}
          onSelect={(next) => updateField('doors', next)}
        />

        <ChoiceRow
          legend="Current occupancy"
          options={occupancyOptions}
          value={formData.occupancy}
          onSelect={(next) => updateField('occupancy', next)}
        />

        <div>
          <label htmlFor="pm-message" className={labelClass}>
            Anything we should know? <span className="font-normal text-ink-300">(optional)</span>
          </label>
          <textarea
            id="pm-message"
            name="message"
            rows={4}
            placeholder="Current rent, what is not working, timing, or anything else."
            value={formData.message}
            onChange={(event) => updateField('message', event.target.value)}
            className={`${inputClass} resize-y`}
          />
        </div>

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

        {errorMessage ? (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {errorMessage}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={!canSubmit || isSubmitting}
          className="btn-primary w-full rounded-2xl px-5 py-4 text-base disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Sending...' : 'Send Inquiry'}
        </button>

        <p className="text-[11px] leading-relaxed text-ink-400">
          We use this only to reply about managing your property. No marketing
          lists, no third parties. See our{' '}
          <Link href="/privacy" className="font-semibold underline hover:text-ink-700">
            Privacy Policy
          </Link>{' '}
          and{' '}
          <Link href="/terms" className="font-semibold underline hover:text-ink-700">
            Terms
          </Link>
          .
        </p>
      </form>
    </div>
  )
}
