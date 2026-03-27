'use client'

import { useState, FormEvent } from 'react'
import { TCPA_CONSENT_TEXT } from '@/lib/constants'

/**
 * TextUsForm — lightweight "Text Us" form.
 *
 * Customer enters first name, phone, optional message.
 * On submit, POSTs to /api/text-us which forwards to Sentinel.
 * Sentinel sends a welcome SMS to the customer, creating a live
 * two-way thread visible in the Sentinel SMS tile.
 */
export function TextUsForm({
  address,
  city,
  state,
  className = '',
}: {
  address?: string
  city?: string
  state?: string
  className?: string
}) {
  const [formData, setFormData] = useState({
    firstName: '',
    phone: '',
    message: '',
    company: '', // honeypot
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

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

  const canSubmit =
    formData.firstName.trim().length >= 1 &&
    formData.phone.replace(/\D/g, '').length >= 10

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!canSubmit || isSubmitting) return

    setIsSubmitting(true)
    setErrorMessage('')
    setStatus('idle')

    try {
      const res = await fetch('/api/text-us', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          phone: formData.phone.replace(/\D/g, ''),
          message: formData.message.trim() || undefined,
          address: address || undefined,
          city: city || undefined,
          state: state || undefined,
          company: formData.company, // honeypot
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to send')
      }

      setStatus('success')
      setFormData({ firstName: '', phone: '', message: '', company: '' })
    } catch (err) {
      setStatus('error')
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Something went wrong. Try calling us at 509-822-5460.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (status === 'success') {
    return (
      <div className={`rounded-2xl bg-green-50 border border-green-200 p-6 text-center ${className}`}>
        <div className="text-3xl mb-2">&#x2705;</div>
        <h3 className="text-lg font-semibold text-green-900 mb-1">
          Text sent!
        </h3>
        <p className="text-green-700 text-sm">
          Check your phone — you should receive a text from us shortly. Reply
          anytime and we will get back to you.
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`rounded-2xl bg-white border border-zinc-200 shadow-sm p-6 space-y-4 ${className}`}
    >
      <div className="text-center mb-2">
        <h3 className="text-lg font-semibold text-zinc-900">
          Text us — we will reply fast
        </h3>
        <p className="text-sm text-zinc-500">
          Enter your info and we will text you right back.
        </p>
      </div>

      {/* Honeypot */}
      <input
        type="text"
        name="company"
        value={formData.company}
        onChange={(e) => setFormData((prev) => ({ ...prev, company: e.target.value }))}
        autoComplete="off"
        tabIndex={-1}
        aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px', opacity: 0 }}
      />

      <div>
        <label htmlFor="textus-name" className="block text-sm font-medium text-zinc-700 mb-1">
          First name
        </label>
        <input
          id="textus-name"
          type="text"
          value={formData.firstName}
          onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
          placeholder="Your first name"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-zinc-900 placeholder:text-zinc-400 focus:border-green-600 focus:ring-1 focus:ring-green-600 outline-none"
          autoComplete="given-name"
          required
        />
      </div>

      <div>
        <label htmlFor="textus-phone" className="block text-sm font-medium text-zinc-700 mb-1">
          Phone number
        </label>
        <input
          id="textus-phone"
          type="tel"
          value={formData.phone}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, phone: formatPhone(e.target.value) }))
          }
          placeholder="(509) 555-1234"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-zinc-900 placeholder:text-zinc-400 focus:border-green-600 focus:ring-1 focus:ring-green-600 outline-none"
          autoComplete="tel"
          required
        />
      </div>

      <div>
        <label htmlFor="textus-message" className="block text-sm font-medium text-zinc-700 mb-1">
          Message <span className="text-zinc-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="textus-message"
          value={formData.message}
          onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
          placeholder="Tell us a little about your situation..."
          rows={2}
          maxLength={500}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-zinc-900 placeholder:text-zinc-400 focus:border-green-600 focus:ring-1 focus:ring-green-600 outline-none resize-none"
        />
      </div>

      {status === 'error' && (
        <p className="text-red-600 text-sm">{errorMessage}</p>
      )}

      <button
        type="submit"
        disabled={!canSubmit || isSubmitting}
        className="w-full rounded-lg bg-green-700 hover:bg-green-800 disabled:bg-zinc-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 transition-colors"
      >
        {isSubmitting ? 'Sending...' : 'Text Me'}
      </button>

      <p className="text-xs text-zinc-400 leading-relaxed">
        {TCPA_CONSENT_TEXT}
      </p>
    </form>
  )
}
