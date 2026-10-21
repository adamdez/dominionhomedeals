'use client'

import { FormEvent, type SyntheticEvent, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { SITE, SMS_CONSENT_TEXT } from '@/lib/constants'
import {
  META_SELLER_QUALIFICATION_VERSION,
  META_SELLER_SERVICE_AREAS,
  metaSellerServiceArea,
} from '@/lib/meta-seller-qualifier'
import {
  getMetaSellerVisitId,
  trackMetaSellerFunnelEvent,
} from '@/lib/meta-seller-funnel-tracking'
import { isInternalQaSession, readSellerAttribution } from '@/lib/seller-funnel-tracking'
import { META_SELLER_LANDINGS, type MetaSellerVariant } from '@/lib/meta-seller-landing'
import { openMetaMeasuredReceipt, readMetaMeasurementChoice, rememberMetaFeedbackReceipt } from '@/lib/meta-browser-measurement'
import { MetaReceiptTracker } from '@/components/analytics/MetaReceiptTracker'
import { prepareMetaSellerSubmission, type MetaSellerSubmissionAttempt } from '@/lib/meta-seller-submission'
import { completedMetaField, metaProgressField } from '@/lib/meta-seller-form-progress'
import { browserMetaPrivacyBlocked } from '@/lib/meta-measurement-policy'
type AnswerKey =
  | 'serviceArea'
  | 'timeline'
  | 'sellerAuthority'
  | 'propertyType'
  | 'listingStatus'
  | 'offerReadiness'
  | 'priceTradeoff'
  | 'condition'

interface Answers {
  serviceArea: string
  timeline: string
  sellerAuthority: string
  propertyType: string
  listingStatus: string
  offerReadiness: string
  priceTradeoff: string
  condition: string
}

interface ContactData {
  fullName: string
  phone: string
  email: string
  address: string
  bestTimeToSpeak: string
  sellerReason: string
  contactConsent: boolean
  smsConsent: boolean
  honeypot: string
}

interface Option {
  value: string
  label: string
}

interface Step {
  key: AnswerKey
  question: string
  helper?: string
  options: readonly Option[]
}

const initialAnswers: Answers = {
  serviceArea: '',
  timeline: 'unsure',
  sellerAuthority: 'unsure',
  propertyType: 'unsure',
  listingStatus: 'unsure',
  offerReadiness: 'unsure',
  priceTradeoff: 'unsure',
  condition: 'unsure',
}

const initialContact: ContactData = {
  fullName: '',
  phone: '',
  email: '',
  address: '',
  bestTimeToSpeak: 'anytime',
  sellerReason: 'prefer_not_to_say',
  contactConsent: false,
  smsConsent: false,
  honeypot: '',
}

const steps: readonly Step[] = [
  {
    key: 'serviceArea',
    question: 'Where is the property?',
    options: [
      ...META_SELLER_SERVICE_AREAS.map((area) => ({ value: area.value, label: area.label })),
      { value: 'outside_service_area', label: 'Somewhere else' },
    ],
  },
  {
    key: 'timeline',
    question: 'How soon do you want to sell?',
    options: [
      { value: 'asap', label: 'As soon as possible' },
      { value: 'within_30_days', label: 'Within 30 days' },
      { value: 'within_31_to_60_days', label: 'Within 31 to 60 days' },
      { value: 'more_than_60_days', label: 'More than 60 days' },
      { value: 'checking_value', label: 'I am just checking what it might be worth' },
    ],
  },
  {
    key: 'sellerAuthority',
    question: 'Are you an owner or legally authorized to sell the property?',
    options: [
      { value: 'owner', label: 'I own all or part of it' },
      { value: 'authorized_representative', label: 'I am legally authorized to handle the sale' },
      { value: 'heir_without_authority', label: 'I am an heir or family member but do not have authority yet' },
      { value: 'helper_tenant_agent', label: 'I am helping, renting, or acting as an agent' },
      { value: 'researching', label: 'I am just researching' },
    ],
  },
  {
    key: 'propertyType',
    question: 'What kind of property is it?',
    options: [
      { value: 'site_built', label: 'Site-built or framed house' },
      { value: 'manufactured_with_owned_land', label: 'Manufactured home with land included' },
      { value: 'manufactured_without_land', label: 'Manufactured or mobile home without owned land' },
      { value: 'vacant_land', label: 'Vacant land' },
      { value: 'commercial_or_five_plus', label: 'Commercial or five or more units' },
      { value: 'other', label: 'Something else' },
    ],
  },
  {
    key: 'listingStatus',
    question: 'Is the property currently listed with an agent?',
    options: [
      { value: 'not_listed', label: 'No' },
      { value: 'listed', label: 'Yes' },
      { value: 'unsure', label: 'I am not sure' },
    ],
  },
  {
    key: 'offerReadiness',
    question: 'Are you ready for Dominion to prepare an as-is cash offer now?',
    options: [
      { value: 'wants_offer_now', label: 'Yes. I want an offer now' },
      { value: 'value_only', label: 'I only want a value estimate' },
      { value: 'not_ready', label: 'I am not ready for an offer' },
      { value: 'retail_only', label: 'I need fully repaired retail value' },
    ],
  },
  {
    key: 'priceTradeoff',
    question: 'A direct as-is offer will be less than the price of a fully repaired home sold on the MLS. Do you understand that tradeoff and still want an offer?',
    options: [
      { value: 'accepts_below_repaired_retail', label: 'Yes. I understand and still want an offer' },
      { value: 'requires_retail', label: 'No. I need full repaired retail value' },
      { value: 'unsure', label: 'I am not sure' },
    ],
  },
  {
    key: 'condition',
    question: 'How much work does the property need?',
    helper: 'Condition helps us prepare. It does not decide whether you can request an offer.',
    options: [
      { value: 'move_in_ready', label: 'Move-in ready' },
      { value: 'normal_wear', label: 'Normal wear' },
      { value: 'repairs_needed', label: 'Repairs needed' },
      { value: 'major_work', label: 'Major repairs or unsafe areas' },
    ],
  },
]

const reasonOptions = [
  ['repairs', 'Repairs or deferred maintenance'],
  ['inherited_estate', 'Inherited or estate property'],
  ['rental', 'Rental or tenant situation'],
  ['vacant', 'Vacant property'],
  ['relocating', 'Moving or relocating'],
  ['other', 'Something else'],
  ['prefer_not_to_say', 'Prefer not to say'],
] as const

const bestTimeOptions = [
  ['morning', 'Morning'],
  ['afternoon', 'Afternoon'],
  ['evening', 'Evening'],
  ['anytime', 'Any time'],
] as const

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/)
  return { firstName: parts[0] || '', lastName: parts.slice(1).join(' ') }
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 10)
  if (digits.length >= 7) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  if (digits.length >= 4) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return digits ? `(${digits}` : ''
}

function acceptedReceipt(responseOk: boolean, value: unknown) {
  if (!responseOk || !value || typeof value !== 'object' || Array.isArray(value)) return null
  const data = value as Record<string, unknown>
  return data.success === true && data.accepted === true && data.controlRecorded === true &&
    typeof data.receiptId === 'string' && data.receiptId && typeof data.duplicate === 'boolean'
    ? { receiptId: data.receiptId, duplicate: data.duplicate }
    : null
}

export function MetaSellerFormJump({ variant }: { variant: MetaSellerVariant }) {
  return <a href="#seller-contact" className="btn-primary mt-5 lg:hidden" onClick={() => trackMetaSellerFunnelEvent('cta_clicked', { variant, detail: 'offer_jump', onceKey: 'offer_jump' })}>
    {variant === 'direct' ? 'Request My Cash Offer' : 'Talk About My Property'}
  </a>
}

export function MetaSellerQualifier({ variant = 'repairs' }: { variant?: MetaSellerVariant }) {
  const [answers, setAnswers] = useState<Answers>(initialAnswers)
  const [contact, setContact] = useState<ContactData>(initialContact)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [measurementConsent, setMeasurementConsent] = useState(false)
  const [privacyBlocked, setPrivacyBlocked] = useState(true)
  const [receipt, setReceipt] = useState<{ receiptId: string; duplicate: boolean } | null>(null)
  const attempt = useRef<MetaSellerSubmissionAttempt | null>(null)

  useEffect(() => {
    setPrivacyBlocked(browserMetaPrivacyBlocked())
    trackMetaSellerFunnelEvent('landing_arrived', {
      variant,
      onceKey: `landing:${variant}`,
    })
  }, [variant])

  const formView = useRef<HTMLInputElement>(null)
  const cashOffer = variant === 'direct'

  useEffect(() => {
    const field = formView.current
    if (!field || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        trackMetaSellerFunnelEvent('form_viewed', { variant, stage: 'contact', onceKey: 'form_viewed' })
        observer.disconnect()
      }
    }, { threshold: 0.5 })
    observer.observe(field)
    return () => observer.disconnect()
  }, [variant])

  function formInteraction(event: SyntheticEvent<HTMLFormElement>) {
    const field = event.target as HTMLInputElement | HTMLSelectElement
    if (!metaProgressField(field.name)) return
    trackMetaSellerFunnelEvent('form_started', { variant, stage: 'contact', onceKey: 'form_started' })
  }

  function fieldCompleted(event: SyntheticEvent<HTMLFormElement>) {
    const field = event.target as HTMLInputElement | HTMLSelectElement
    const detail = completedMetaField(field.name, field.value, field.validity?.valid === true, 'checked' in field && field.checked)
    if (detail) trackMetaSellerFunnelEvent('field_completed', { variant, stage: detail === 'service_area' ? 'service_area' : 'contact', detail, onceKey: `field:${detail}` })
  }

  const variantIntro = META_SELLER_LANDINGS[variant].formIntro

  const contactValid = useMemo(() => {
    const digits = contact.phone.replace(/\D/g, '')
    const emailValid = !contact.email.trim() || /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(contact.email)
    return contact.fullName.trim().length >= 2 && digits.length >= 10 && contact.address.trim().length >= 6 &&
      Boolean(answers.serviceArea) && contact.contactConsent && emailValid
  }, [contact, answers.serviceArea])

  useEffect(() => {
    if (contactValid) trackMetaSellerFunnelEvent('form_ready', { variant, stage: 'contact', onceKey: 'form_ready' })
  }, [contactValid, variant])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!contactValid || submitting) {
      setError('Complete the required contact details so Dominion can respond to the offer request.')
      trackMetaSellerFunnelEvent('validation_failed', { variant, stage: 'contact', detail: 'contact_invalid' })
      return
    }
    if (isInternalQaSession()) {
      setError('Internal QA mode. This test submission was intentionally not sent.')
      return
    }

    const area = metaSellerServiceArea(answers.serviceArea)
    if (!answers.serviceArea) {
      setError('Choose a valid service area before submitting.')
      return
    }
    const attribution = readSellerAttribution()
    const { firstName, lastName } = splitName(contact.fullName)
    const submittedAt = new Date().toISOString()
    const zip = contact.address.match(/\b(\d{5})(?:-\d{4})?\b/)?.[1] || ''
    const input = {
      qualificationVersion: META_SELLER_QUALIFICATION_VERSION,
      ...answers,
      sellerReason: contact.sellerReason,
      bestTimeToSpeak: contact.bestTimeToSpeak,
      contactConsent: contact.contactConsent,
      address: contact.address,
      city: area?.city || '',
      state: area?.state || '',
      zip,
      firstName,
      lastName,
      phone: contact.phone,
      email: contact.email,
      tcpaConsent: false,
      sms_consent: contact.smsConsent,
      sms_consent_timestamp: contact.smsConsent ? submittedAt : null,
      smsOptIn: contact.smsConsent,
      smsOptInTimestamp: contact.smsConsent ? submittedAt : null,
      honeypot: contact.honeypot,
      source: 'meta_website',
      // UTM/account IDs travel through the explicit attribution allowlist.
      // Raw click identifiers and arbitrary query text stay out of CRM exports.
      landingPage: window.location.pathname,
      utmSource: attribution.utm_source || '',
      utmMedium: attribution.utm_medium || '',
      utmCampaign: attribution.utm_campaign || '',
      utmTerm: attribution.utm_term || '',
      utmContent: attribution.utm_content || variant,
      adAttribution: attribution,
      submissionFlow: 'seller_options_v1',
      funnelVisitId: getMetaSellerVisitId(variant),
      metaVariant: variant,
      metaMeasurement: readMetaMeasurementChoice(measurementConsent),
    }
    attempt.current = prepareMetaSellerSubmission(attempt.current, input)

    trackMetaSellerFunnelEvent('submit_attempted', { variant, stage: 'contact' })
    setSubmitting(true)
    setError('')
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: attempt.current.body,
      })
      const data = await response.json()
      const accepted = acceptedReceipt(response.ok, data)
      if (!accepted) {
        trackMetaSellerFunnelEvent('submit_failed', {
          variant,
          stage: 'contact',
          detail: response.status >= 500 ? 'server_error' : 'receipt_unconfirmed',
        })
        setError(typeof data?.error === 'string' && data.error
          ? data.error
          : `We could not confirm receipt. Please try again or call ${SITE.phone}.`)
        return
      }
      setReceipt(accepted)
      rememberMetaFeedbackReceipt(attempt.current.submissionId,attempt.current.privacyToken,measurementConsent && !privacyBlocked)
      if (!accepted.duplicate && data.metaBrowserEligible === true && typeof data.metaEventId === 'string') {
        openMetaMeasuredReceipt(data.metaEventId, measurementConsent)
      }
    } catch {
      trackMetaSellerFunnelEvent('submit_failed', { variant, stage: 'contact', detail: 'network_error' })
      setError(`We could not confirm receipt. Please try again or call ${SITE.phone}.`)
    } finally {
      setSubmitting(false)
    }
  }

  if (receipt) {
    return (
      <div role="status" aria-live="polite" className="rounded-[28px] border border-forest-200 bg-white p-6 shadow-soft sm:p-8">
        <p className="text-sm font-semibold text-forest-600">Property inquiry received</p>
        <h2 className="mt-3 font-display text-3xl text-ink-600">Dominion has your property details.</h2>
        <p className="mt-4 leading-relaxed text-ink-400">
          {receipt.duplicate ? 'This request was already recorded.' : 'Your request was recorded.'}
          {' '}A team member will review it and contact you. This receipt is not a property offer or a promise to buy.
        </p>
        <p className="mt-5 break-all text-xs text-ink-400">Reference: {receipt.receiptId}</p>
        <a href={`tel:${SITE.phone.replace(/\D/g, '')}`} className="btn-secondary mt-6">Call {SITE.phone}</a>
        <MetaReceiptTracker pixelId="" mode="disabled" deployment="" />
      </div>
    )
  }

  return (
    <div id="seller-contact" data-form-revision="offer_form_v2" className="scroll-mt-24 rounded-[28px] border border-stone-200 bg-white p-5 shadow-soft sm:p-8">
      <p className="text-sm font-semibold text-forest-600">{cashOffer ? 'Your as-is cash offer' : 'Talk through your selling options'}</p>
      <h2 className="mt-2 font-display text-3xl text-ink-700">{cashOffer ? 'Start with your house.' : 'Start with the property and how to reach you.'}</h2>
      <p className="mt-3 text-sm leading-relaxed text-ink-400">{variantIntro}</p>
        <form onSubmit={submit} onChangeCapture={formInteraction} onBlurCapture={fieldCompleted}
          onFocusCapture={event => {
            const target = event.target
            if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) return
            const field = metaProgressField(target.name)
            if (field) trackMetaSellerFunnelEvent('field_focused', { variant, stage: field === 'service_area' ? 'service_area' : 'contact', detail: field, onceKey: `focus:${field}` })
          }}
          onInvalidCapture={event => {
            const target = event.target
            if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) return
            const optionalSection = target.closest('details')
            if (optionalSection) optionalSection.open = true
            setError('Complete the required fields below to request your offer.')
            const field = metaProgressField(target.name)
            if (field) trackMetaSellerFunnelEvent('validation_failed', { variant, stage: 'contact', detail: field, onceKey: `invalid:${field}` })
          }} className="mt-5 space-y-4">

          <input
            type="text"
            name="company"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            value={contact.honeypot}
            onChange={(event) => setContact((data) => ({ ...data, honeypot: event.target.value }))}
            className="absolute -left-[9999px] h-px w-px opacity-0"
          />
          <label className="block text-sm font-semibold text-ink-500">
            Full name <span className="font-normal text-ink-400">required</span>
            <input
              required
              name="full_name" ref={formView} minLength={2}
              autoComplete="name"
              value={contact.fullName}
              onChange={(event) => setContact((data) => ({ ...data, fullName: event.target.value }))}
              className="mt-2 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-base text-ink-600 focus:border-forest-400 focus:ring-forest-400"
            />
          </label>
          <label className="block text-sm font-semibold text-ink-500">
            Best phone number <span className="font-normal text-ink-400">required</span>
            <input
              required
              type="tel" name="phone" minLength={14}
              inputMode="tel"
              autoComplete="tel"
              value={contact.phone}
              onChange={(event) => setContact((data) => ({ ...data, phone: formatPhone(event.target.value) }))}
              className="mt-2 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-base text-ink-600 focus:border-forest-400 focus:ring-forest-400"
            />
          </label>
          <label className="block text-sm font-semibold text-ink-500">
            Full property address <span className="font-normal text-ink-400">required</span>
            <input
              required
              name="address" minLength={6}
              autoComplete="street-address"
              placeholder="123 Main St, Spokane, WA 99205"
              value={contact.address}
              onChange={(event) => setContact((data) => ({ ...data, address: event.target.value }))}
              className="mt-2 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-base text-ink-600 focus:border-forest-400 focus:ring-forest-400"
            />
          </label>
          <label className="block text-sm font-semibold text-ink-500">
            Property area <span className="font-normal text-ink-400">required</span>
            <select name="service_area" required value={answers.serviceArea} onChange={event => setAnswers(previous => ({ ...previous, serviceArea: event.target.value }))}
              className="mt-2 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-base text-ink-600">
              <option value="">Choose the property area</option>
              {steps[0].options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <details className="rounded-2xl border border-stone-200 p-4">
            <summary className="cursor-pointer text-sm font-semibold text-forest-600">Optional: more details & email</summary>
            <p className="mt-3 text-sm text-ink-400">These answers help us prepare for a conversation. The offer questions apply if you want to discuss a direct investor offer. You can leave them unanswered.</p>
            <div className="mt-4 space-y-4">
          <label className="block text-sm font-semibold text-ink-500">
            Email <span className="font-normal text-ink-300">optional</span>
            <input
              type="email" name="email"
              autoComplete="email"
              value={contact.email}
              onChange={(event) => setContact((data) => ({ ...data, email: event.target.value }))}
              className="mt-2 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-base text-ink-600 focus:border-forest-400 focus:ring-forest-400"
            />
          </label>

              {steps.slice(1).map(step => <label key={step.key} className="block text-sm font-semibold text-ink-500">
                {step.question}
                <select value={answers[step.key]} onChange={event => setAnswers(previous => ({ ...previous, [step.key]: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-base text-ink-600">
                  {!step.options.some(option => option.value === 'unsure') ? <option value="unsure">Not sure yet / prefer to discuss</option> : null}
                  {step.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>)}
          <label className="block text-sm font-semibold text-ink-500">
            Best time to call
            <select
              value={contact.bestTimeToSpeak}
              onChange={(event) => setContact((data) => ({ ...data, bestTimeToSpeak: event.target.value }))}
              className="mt-2 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-base text-ink-600 focus:border-forest-400 focus:ring-forest-400"
            >
              <option value="">Choose one</option>
              {bestTimeOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold text-ink-500">
            Main reason for selling <span className="font-normal text-ink-300">optional context</span>
            <select
              value={contact.sellerReason}
              onChange={(event) => setContact((data) => ({ ...data, sellerReason: event.target.value }))}
              className="mt-2 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-base text-ink-600 focus:border-forest-400 focus:ring-forest-400"
            >
              <option value="">Choose one</option>
              {reasonOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
            </div>
          </details>
          <label className="flex items-start gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4 text-sm leading-relaxed text-ink-500">
            <input
              required
              type="checkbox" name="contact_permission"
              checked={contact.contactConsent}
              onChange={(event) => setContact((data) => ({ ...data, contactConsent: event.target.checked }))}
              className="mt-1 h-4 w-4 rounded border-stone-300 text-forest-600 focus:ring-forest-400"
            />
            <span>I want Dominion Homes to contact me by phone or email about this property and possible sale.</span>
          </label>
          <details className="rounded-2xl border border-stone-200 p-4">
            <summary className="cursor-pointer text-sm font-semibold text-forest-600">Optional: text updates</summary>
          <label className="flex items-start gap-3 rounded-2xl border border-forest-200 bg-forest-50 px-4 py-4 text-[11px] leading-relaxed text-ink-500">
            <input
              type="checkbox"
              checked={contact.smsConsent}
              onChange={(event) => setContact((data) => ({ ...data, smsConsent: event.target.checked }))}
              className="mt-1 h-4 w-4 shrink-0 rounded border-stone-300 text-forest-600 focus:ring-forest-400"
            />
            <span>{SMS_CONSENT_TEXT}</span>
          </label>
          </details>
          <label className="flex items-start gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4 text-xs leading-relaxed text-ink-400">
            <input type="checkbox" checked={measurementConsent} disabled={privacyBlocked || submitting}
              onChange={(event) => setMeasurementConsent(event.target.checked)} className="mt-1 h-4 w-4 shrink-0 rounded border-stone-300 text-forest-600" />
            <span>Optional. Allow Meta to measure this request and later steps such as a seller conversation or completed sale. We use browser and device information. Your contact details and property answers are not shared with Meta. This does not affect your offer request.{' '}
              <Link href="/privacy#meta-measurement" className="underline">How measurement works</Link>.
              {privacyBlocked ? ' Your browser privacy choice currently blocks this measurement.' : ''}</span>
          </label>
          <p className="text-[11px] leading-relaxed text-ink-400">
            Text updates and ad measurement are optional. See our{' '}
            <Link href="/privacy#sms-terms" className="font-semibold underline">Privacy Policy</Link>{' '}
            and <Link href="/terms" className="font-semibold underline">Terms</Link>.
          </p>
          {error ? <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
          <button disabled={submitting} type="submit" className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50">
            {submitting ? 'Sending request…' : cashOffer ? 'Request My Cash Offer' : 'Ask Dominion to Contact Me'}
          </button>
        </form>

      <p className="mt-6 text-xs leading-relaxed text-ink-300">We’ll review the property before preparing an offer. No commitment to sell.</p>
    </div>
  )
}
