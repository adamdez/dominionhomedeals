'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { trackFormStep, trackLeadFormSubmission, trackOpenAILeadCreated } from '@/lib/tracking'
import {
  getSellerFunnelVisitId,
  isInternalQaSession,
  readOpenAIBrowserReference,
  readSellerAttribution,
  trackSellerFunnelEvent,
} from '@/lib/seller-funnel-tracking'
import { SITE, SMS_CONSENT_TEXT, SMS_CTA_DISCLOSURE } from '@/lib/constants'

type Stage = 'address' | 'name' | 'phone' | 'details'

interface FormData {
  address: string
  fullName: string
  phone: string
  email: string
  primaryConstraint: string
  sellerAuthority: string
  condition: string
  timeline: string
  smsConsent: boolean
  honeypot: string
  utmSource: string
  utmMedium: string
  utmCampaign: string
  utmTerm: string
  utmContent: string
  gclid: string
  oppref: string
  funnelVisitId: string
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
  primaryConstraint: '',
  sellerAuthority: '',
  condition: '',
  timeline: '',
  smsConsent: false,
  honeypot: '',
  utmSource: '',
  utmMedium: '',
  utmCampaign: '',
  utmTerm: '',
  utmContent: '',
  gclid: '',
  oppref: '',
  funnelVisitId: '',
  landingPage: '',
  city: '',
  state: 'WA',
  zip: '',
}

const stages: Stage[] = ['address', 'name', 'phone', 'details']

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

const primaryConstraintOptions = [
  'Maximize my realistic net',
  'Avoid repairs or cleanout',
  'Find a buyer who will follow through',
  'Gain time for moving or occupants',
  'Compare listing with selling as-is',
  'Something else',
] as const

function SmsConsentCheckbox({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="rounded-2xl border border-forest-200 bg-forest-50 px-4 py-4">
      <label htmlFor="smsConsent" className="flex cursor-pointer items-start gap-3">
        <input
          id="smsConsent"
          name="smsConsent"
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 rounded border-stone-300 text-forest-600 focus:ring-forest-400"
        />
        <span className="text-[11px] leading-relaxed text-ink-600">
          {SMS_CONSENT_TEXT} See our{' '}
          <Link href="/privacy#sms-terms" className="font-semibold underline hover:text-ink-700">
            Privacy Policy
          </Link>{' '}
          and{' '}
          <Link href="/terms" className="font-semibold underline hover:text-ink-700">
            Terms
          </Link>
          .
        </span>
      </label>
    </div>
  )
}

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

function inferOptionsCityStateZip(address: string) {
  const normalizedAddress = address.trim()
  // Read the state at the end of the address, never from a street direction.
  const locationMatch = normalizedAddress.match(
    /(?:,\s*|\s+)(WA|ID|Washington|Idaho)(?:[\s,]+(\d{5})(?:-\d{4})?)?(?:[\s,]+(?:USA?|United States))?\s*$/i
  )
  const stateName = locationMatch?.[1]?.toUpperCase() || ''
  const beforeState = locationMatch
    ? normalizedAddress.slice(0, locationMatch.index).replace(/,\s*$/, '')
    : ''
  const cityMatch = beforeState.match(/,\s*([^,]+)$/)

  return {
    city: cityMatch?.[1]?.trim() || '',
    state: stateName === 'WA' || stateName === 'WASHINGTON'
      ? 'WA'
      : stateName === 'ID' || stateName === 'IDAHO' ? 'ID' : '',
    zip: locationMatch?.[2] || '',
  }
}

interface LeadFormProps {
  intro?: string
  addressLabel?: string
  submitLabel?: string
  requirePropertyState?: boolean
  submissionFlow?: 'seller_options_v1'
}

interface OptionsReceipt {
  receiptId: string
  duplicate: boolean
}

function acceptedOptionsReceipt(responseOk: boolean, value: unknown): OptionsReceipt | null {
  if (!responseOk || !value || typeof value !== 'object' || Array.isArray(value)) return null
  const data = value as Record<string, unknown>
  if (
    data.success !== true || data.accepted !== true || data.controlRecorded !== true ||
    typeof data.receiptId !== 'string' || !data.receiptId.trim() ||
    typeof data.duplicate !== 'boolean'
  ) return null
  return { receiptId: data.receiptId.trim(), duplicate: data.duplicate }
}

function hasSellerAuthority(value: string) {
  return value === 'owner' || value === 'authorized_representative'
}

export function LeadForm({
  intro = 'Start with the address. We will ask one thing at a time.',
  addressLabel = "What's the property address?",
  submitLabel = 'Get My Cash Offer',
  requirePropertyState = false,
  submissionFlow,
}: LeadFormProps = {}) {
  const isSellerOptions = submissionFlow === 'seller_options_v1'
  const [stage, setStage] = useState<Stage>('address')
  const [formData, setFormData] = useState<FormData>(() => (
    isSellerOptions ? { ...initialFormData, state: '' } : initialFormData
  ))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [optionsReceipt, setOptionsReceipt] = useState<OptionsReceipt | null>(null)
  const submissionLock = useRef(false)
  const optionsAttempt = useRef<{ fingerprint: string; body: string; submissionId: string } | null>(null)
  const receiptElement = useRef<HTMLDivElement>(null)
  const formFocused = useRef(false)
  const inputStartedStages = useRef(new Set<Stage>())

  useEffect(() => {
    if (optionsReceipt) receiptElement.current?.focus()
  }, [optionsReceipt])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const params = new URLSearchParams(window.location.search)
    const gclidFromQuery = params.get('gclid') || ''
    const opprefFromQuery = params.get('oppref') || ''
    const sellerAttribution = isSellerOptions ? readSellerAttribution() : {}
    let storedGclid = ''

    try {
      if (!isSellerOptions) {
        storedGclid = localStorage.getItem('gclid') || ''
      }
    } catch (error) {}

    setFormData((prev) => ({
      ...prev,
      utmSource: params.get('utm_source') || '',
      utmMedium: params.get('utm_medium') || '',
      utmCampaign: params.get('utm_campaign') || '',
      utmTerm: params.get('utm_term') || '',
      utmContent: params.get('utm_content') || '',
      gclid: isSellerOptions ? sellerAttribution.gclid || gclidFromQuery : gclidFromQuery || storedGclid || '',
      oppref: isSellerOptions ? sellerAttribution.oppref || opprefFromQuery : '',
      funnelVisitId: isSellerOptions ? getSellerFunnelVisitId() : '',
      landingPage: window.location.pathname + window.location.search,
    }))
  }, [isSellerOptions])

  const updateField = (field: keyof FormData, value: string | boolean) => {
    if (isSellerOptions && submissionLock.current) return
    if (isSellerOptions && field !== 'honeypot' && field !== 'smsConsent' &&
      !inputStartedStages.current.has(stage) && typeof value === 'string' && value.length > 0) {
      inputStartedStages.current.add(stage)
      trackSellerFunnelEvent('input_started', { stage, onceKey: `input_started:${stage}` })
    }
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const trackValidationFailure = (detail: string) => {
    if (!isSellerOptions) return
    trackSellerFunnelEvent('validation_failed', { stage, detail })
  }

  const canContinueCurrentStage = () => {
    switch (stage) {
      case 'address':
        return formData.address.trim().length >= 6 && (
          !requirePropertyState || Boolean(inferOptionsCityStateZip(formData.address).state)
        )
      case 'name':
        return formData.fullName.trim().length >= 2
      case 'phone':
        return formData.phone.replace(/\D/g, '').length >= 10
      case 'details':
        return (
          (!isSellerOptions || hasSellerAuthority(formData.sellerAuthority)) && (
            !formData.email.trim() ||
            /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)
          )
        )
      default:
        return false
    }
  }

  const advanceStage = () => {
    const currentIndex = stages.indexOf(stage)
    const nextStage = stages[currentIndex + 1]
    if (!nextStage) return

    if (isSellerOptions) {
      trackSellerFunnelEvent('step_completed', { stage, onceKey: `step_completed:${stage}` })
    }
    trackFormStep(currentIndex + 2, nextStage)
    setStage(nextStage)
  }

  const goBack = () => {
    if (isSellerOptions && submissionLock.current) return
    const currentIndex = stages.indexOf(stage)
    const previousStage = stages[currentIndex - 1]
    if (!previousStage) return
    setStage(previousStage)
  }

  const submitLead = async () => {
    if (isSubmitting || (isSellerOptions && submissionLock.current)) return
    if (isSellerOptions && isInternalQaSession()) {
      setErrorMessage('Internal QA mode: this test submission was intentionally not sent.')
      return
    }

    const inferredAddressParts = isSellerOptions
      ? inferOptionsCityStateZip(formData.address)
      : inferCityStateZip(formData.address)
    if (requirePropertyState && !inferredAddressParts.state) {
      trackValidationFailure('state_missing')
      setErrorMessage('Please include WA or ID in the property address.')
      setStage('address')
      return
    }
    if (isSellerOptions && !hasSellerAuthority(formData.sellerAuthority)) {
      trackValidationFailure('authority_missing')
      setErrorMessage('Please select your role with the property.')
      setStage('details')
      return
    }

    submissionLock.current = isSellerOptions
    setIsSubmitting(true)
    setErrorMessage('')

    const { firstName, lastName } = splitFullName(formData.fullName)
    const propertyState = isSellerOptions
      ? inferredAddressParts.state || formData.state
      : formData.state || inferredAddressParts.state
    const submittedAt = new Date().toISOString()
    const smsConsentTimestamp = formData.smsConsent ? submittedAt : null
    const receiptError = "We couldn't confirm receipt. Your entries are still here. Please try again or call " + SITE.phone + "."
    let accepted = false
    let optionsSubmissionId = ''

    try {
      const leadPayload = {
        address: formData.address,
        city: formData.city || inferredAddressParts.city,
        state: propertyState,
        zip: formData.zip || inferredAddressParts.zip,
        condition: formData.condition,
        timeline: formData.timeline,
        firstName,
        lastName,
        phone: formData.phone,
        email: formData.email,
        tcpaConsent: false,
        tcpaTimestamp: null,
        sms_consent: formData.smsConsent,
        sms_consent_timestamp: smsConsentTimestamp,
        smsOptIn: formData.smsConsent,
        smsOptInTimestamp: smsConsentTimestamp,
        honeypot: formData.honeypot,
        source: 'website',
        landingPage: formData.landingPage,
        utmSource: formData.utmSource,
        utmMedium: formData.utmMedium,
        utmCampaign: formData.utmCampaign,
        utmTerm: formData.utmTerm,
        utmContent: formData.utmContent,
        gclid: formData.gclid,
      }
      let body = JSON.stringify(leadPayload)
      let trackingLandingPage = formData.landingPage

      if (isSellerOptions) {
        const sellerAttribution = readSellerAttribution()
        const optionsPayload = {
          ...leadPayload,
          primaryConstraint: formData.primaryConstraint,
          submissionFlow: 'seller_options_v1',
          sellerAuthority: formData.sellerAuthority,
          oppref: sellerAttribution.oppref || formData.oppref,
          gclid: sellerAttribution.gclid || formData.gclid,
          openaiObref: readOpenAIBrowserReference(),
          funnelVisitId: formData.funnelVisitId || getSellerFunnelVisitId(),
          adAttribution: sellerAttribution,
          landingPage: window.location.pathname + window.location.search,
        }
        trackingLandingPage = optionsPayload.landingPage
        // Keep the exact request, including consent times, for an identical retry.
        // Generated times are not a change to what the homeowner submitted.
        const fingerprint = JSON.stringify({
          ...optionsPayload,
          sms_consent_timestamp: null,
          smsOptInTimestamp: null,
        })
        if (!optionsAttempt.current || optionsAttempt.current.fingerprint !== fingerprint) {
          const submissionId = crypto.randomUUID()
          optionsAttempt.current = {
            fingerprint,
            submissionId,
            body: JSON.stringify({ ...optionsPayload, submissionId }),
          }
        }
        optionsSubmissionId = optionsAttempt.current.submissionId
        body = optionsAttempt.current.body
      }

      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      })
      const data = await response.json()
      const receipt = isSellerOptions && !formData.honeypot
        ? acceptedOptionsReceipt(response.ok, data)
        : null

      if (isSellerOptions ? !receipt : !response.ok || !data.success) {
        if (isSellerOptions) {
          trackSellerFunnelEvent('submit_failed', {
            stage: 'details',
            detail: response.status >= 500 ? 'server_error' : 'receipt_unconfirmed',
          })
        }
        setErrorMessage(isSellerOptions
          ? (typeof data?.error === 'string' && data.error ? data.error : receiptError)
          : data.error || `Something went wrong. Please call us at ${SITE.phone}.`)
        return
      }

      if (receipt) {
        accepted = true
        setOptionsReceipt(receipt)
      }

      if (!isSellerOptions || receipt?.duplicate === false) {
        try {
          trackLeadFormSubmission({
            landingPage: trackingLandingPage,
            utmSource: formData.utmSource,
            utmMedium: formData.utmMedium,
            utmCampaign: formData.utmCampaign,
            propertyCity: formData.city || inferredAddressParts.city,
            propertyState,
            sellerTimeline: formData.timeline || 'Not provided',
            propertyCondition: formData.condition || 'Not provided',
          })
          if (isSellerOptions && optionsSubmissionId && data.openaiBrowserEligible === true) {
            trackOpenAILeadCreated(optionsSubmissionId)
          }
        } catch (trackingError) {
          // A tracking error cannot turn a recorded options inquiry into a retry.
          if (!isSellerOptions) throw trackingError
        }
      }

      if (!isSellerOptions) window.location.assign('/sell/thank-you')
    } catch (error) {
      if (isSellerOptions) {
        trackSellerFunnelEvent('submit_failed', { stage: 'details', detail: 'network_error' })
      }
      setErrorMessage(isSellerOptions ? receiptError : `Network error. Please call us at ${SITE.phone}.`)
    } finally {
      setIsSubmitting(false)
      if (!accepted) submissionLock.current = false
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!canContinueCurrentStage()) return

    if (stage === 'details') {
      if (isSellerOptions) trackSellerFunnelEvent('submit_attempted', { stage: 'details' })
      await submitLead()
      return
    }

    advanceStage()
  }

  const progressIndex = stages.indexOf(stage)

  if (isSellerOptions && optionsReceipt) {
    return (
      <div
        ref={receiptElement}
        tabIndex={-1}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        aria-labelledby="seller-options-receipt-heading"
        className="rounded-[28px] border border-forest-200 bg-white p-6 shadow-soft sm:p-8"
      >
        <p className="text-sm font-semibold text-forest-600">Inquiry received</p>
        <h2 id="seller-options-receipt-heading" className="mt-3 font-display text-3xl text-ink-600">
          Thanks for telling us about your house.
        </h2>
        <p className="mt-4 leading-relaxed text-ink-400">
          {optionsReceipt.duplicate
            ? 'We already have this inquiry. You do not need to submit it again.'
            : 'Your inquiry has been recorded.'}
          {' '}The next step is a conversation about the house, what matters to you,
          and which selling paths may fit.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-ink-400">
          This receipt confirms your inquiry, not an offer or a confirmed sale.
          There is no obligation to accept an offer.
        </p>
        <p className="mt-5 break-all text-xs text-ink-400">Reference: {optionsReceipt.receiptId}</p>
        <a href={`tel:${SITE.phone.replace(/\D/g, '')}`} className="btn-secondary mt-6">
          Call {SITE.phone}
        </a>
      </div>
    )
  }

  return (
    <div className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-soft sm:p-8">
      <p className="text-center text-sm font-medium text-forest-600">
        {intro}
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
        {stage === 'phone' && `Thanks, ${formData.fullName}. What is the best phone number?`}
        {stage === 'details' && (isSellerOptions
          ? 'Tell us your role with the property. The remaining details are optional.'
          : 'Optional details help us review the property, but your phone number is enough to get started.')}
      </div>

      <div className="mt-4 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-[11px] leading-relaxed text-ink-500">
        {SMS_CTA_DISCLOSURE}{' '}
        <Link href="/privacy#sms-terms" className="font-semibold underline hover:text-ink-700">
          Privacy Policy
        </Link>{' '}
        and{' '}
        <Link href="/terms" className="font-semibold underline hover:text-ink-700">
          Terms
        </Link>
        .
      </div>

      <form
        onSubmit={handleSubmit}
        onFocusCapture={() => {
          if (!isSellerOptions || formFocused.current) return
          formFocused.current = true
          trackSellerFunnelEvent('form_focused', { stage, onceKey: 'form_focused' })
        }}
        aria-busy={isSellerOptions && isSubmitting ? true : undefined}
        className="mt-5 space-y-4"
      >
        {stage === 'address' && (
          <div>
            <label htmlFor="address" className="mb-2 block text-sm font-semibold text-ink-500">
              {addressLabel}
            </label>
            <input
              id="address"
              name="address"
              type="text"
              required
              autoComplete="street-address"
              placeholder="123 Main St, Spokane, WA 99205"
              aria-describedby={requirePropertyState ? 'property-address-hint' : undefined}
              value={formData.address}
              onChange={(event) => updateField('address', event.target.value)}
              onBlur={() => {
                if (formData.address.trim().length < 6) trackValidationFailure('address_too_short')
                else if (requirePropertyState && !inferOptionsCityStateZip(formData.address).state) {
                  trackValidationFailure('state_missing')
                }
              }}
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4 text-base text-ink-600 placeholder:text-stone-300 transition-colors focus:border-forest-400 focus:ring-forest-400"
            />
            {requirePropertyState ? (
              <p id="property-address-hint" className="mt-2 text-xs leading-relaxed text-ink-400">
                Include the city and state, such as Spokane, WA or Coeur d&apos;Alene, ID.
              </p>
            ) : null}
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
              onBlur={() => {
                if (formData.fullName.trim().length < 2) trackValidationFailure('name_too_short')
              }}
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4 text-base text-ink-600 placeholder:text-stone-300 transition-colors focus:border-forest-400 focus:ring-forest-400"
            />
          </div>
        )}

        {stage === 'phone' && (
          <div className="space-y-3">
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
                onBlur={() => {
                  if (formData.phone.replace(/\D/g, '').length < 10) trackValidationFailure('phone_invalid')
                }}
                className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4 text-base text-ink-600 placeholder:text-stone-300 transition-colors focus:border-forest-400 focus:ring-forest-400"
              />
            </div>
            <SmsConsentCheckbox
              checked={formData.smsConsent}
              onChange={(checked) => updateField('smsConsent', checked)}
            />
          </div>
        )}

        {stage === 'details' && (
          <div className="space-y-5">
            {isSellerOptions ? (
              <div>
                <label htmlFor="sellerAuthority" className="mb-2 block text-sm font-semibold text-ink-500">
                  What is your role with the property? (required)
                </label>
                <select
                  id="sellerAuthority"
                  name="sellerAuthority"
                  required
                  disabled={isSubmitting}
                  aria-describedby="seller-authority-hint"
                  value={formData.sellerAuthority}
                  onChange={(event) => updateField('sellerAuthority', event.target.value)}
                  onBlur={() => {
                    if (!hasSellerAuthority(formData.sellerAuthority)) trackValidationFailure('authority_missing')
                  }}
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4 text-base text-ink-600 focus:border-forest-400 focus:ring-forest-400"
                >
                  <option value="">Select your role</option>
                  <option value="owner">I own the property</option>
                  <option value="authorized_representative">I am authorized to represent the owner</option>
                </select>
                <p id="seller-authority-hint" className="mt-2 text-xs leading-relaxed text-ink-400">
                  This is your self-reported role. Ownership or authority may need to be verified before a sale.
                </p>
              </div>
            ) : null}

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-semibold text-ink-500">
                Optional: what&apos;s the best email for follow-up?
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@email.com"
                value={formData.email}
                onChange={(event) => updateField('email', event.target.value)}
                onBlur={() => {
                  if (formData.email.trim() && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
                    trackValidationFailure('email_invalid')
                  }
                }}
                className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4 text-base text-ink-600 placeholder:text-stone-300 transition-colors focus:border-forest-400 focus:ring-forest-400"
              />
            </div>

            <SmsConsentCheckbox
              checked={formData.smsConsent}
              onChange={(checked) => updateField('smsConsent', checked)}
            />

            {isSellerOptions ? <div>
              <p className="text-sm font-semibold text-ink-500">
                Optional: what are you mainly trying to solve?
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {primaryConstraintOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() =>
                      updateField(
                        'primaryConstraint',
                        formData.primaryConstraint === option ? '' : option
                      )
                    }
                    className={`rounded-2xl border px-4 py-3 text-left text-sm transition-colors ${
                      formData.primaryConstraint === option
                        ? 'border-forest-500 bg-forest-50 text-forest-700'
                        : 'border-stone-200 bg-stone-50 text-ink-500 hover:border-stone-300'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div> : null}

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
        {isSellerOptions ? <input type="hidden" name="oppref" value={formData.oppref} readOnly /> : null}
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
          className="btn-primary w-full rounded-2xl px-5 py-4 text-base disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : stage === 'address' || stage === 'details' ? submitLabel : 'Continue'}
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

      </form>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-xs text-ink-300">
        <span className="rounded-full bg-stone-100 px-3 py-1.5">Your info stays private</span>
        <span className="rounded-full bg-stone-100 px-3 py-1.5">No obligation</span>
        <span className="rounded-full bg-stone-100 px-3 py-1.5">Local team follow-up</span>
      </div>
    </div>
  )
}
