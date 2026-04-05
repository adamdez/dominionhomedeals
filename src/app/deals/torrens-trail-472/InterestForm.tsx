'use client'

import { useState, FormEvent } from 'react'

interface FormState {
  name: string
  email: string
  phone: string
  message: string
  tcpaConsent: boolean
}

const initialState: FormState = {
  name: '',
  email: '',
  phone: '',
  message: '',
  tcpaConsent: false,
}

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 10)
  if (digits.length < 4) return digits
  if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

export function InterestForm() {
  const [form, setForm] = useState<FormState>(initialState)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  type FormErrors = {
    name?: string
    email?: string
    phone?: string
    message?: string
    tcpaConsent?: string
    submit?: string
  }

  const [errors, setErrors] = useState<FormErrors>({})

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : name === 'phone' ? formatPhone(value) : value,
    }))
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  function validate(): boolean {
    const next: FormErrors = {}
    if (!form.name.trim()) next.name = 'Name is required'
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = 'Valid email is required'
    }
    if (!form.phone.trim() || form.phone.replace(/\D/g, '').length < 10) {
      next.phone = 'Valid 10-digit phone is required'
    }
    if (!form.tcpaConsent) next.tcpaConsent = 'You must consent to be contacted'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setStatus('loading')
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: '472 Torrens Trail',
          city: 'Spirit Lake',
          state: 'ID',
          zip: '83869',
          condition: 'Minor Repairs',
          timeline: 'Flexible',
          firstName: form.name.split(' ')[0] ?? form.name,
          lastName: form.name.split(' ').slice(1).join(' ') || '',
          email: form.email,
          phone: form.phone,
          message: form.message,
          tcpaConsent: form.tcpaConsent,
          tcpaTimestamp: new Date().toISOString(),
          landingPage: '/deals/torrens-trail-472',
          source: 'deal-page-torrens-trail',
        }),
      })

      if (!res.ok) throw new Error('Submission failed')
      setStatus('success')
      setForm(initialState)
    } catch {
      setStatus('error')
      setErrors({ submit: 'Something went wrong. Please call or text us directly.' })
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-2xl bg-forest-50 border border-forest-200 p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-forest-500">
          <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="font-display text-xl font-semibold text-forest-700 mb-2">We got your message!</h3>
        <p className="text-ink-400 text-sm leading-relaxed">
          Thanks for your interest in 472 Torrens Trail. Adam or Logan will be in touch within a few hours.
          <br />Have questions now? Call or text <a href="tel:509-822-5460" className="font-semibold text-forest-600 underline underline-offset-2">509-822-5460</a>.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-semibold text-ink-600 mb-1.5">
          Full Name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Jane Smith"
          className={`w-full rounded-xl border px-4 py-3 text-sm text-ink-600 bg-white placeholder-ink-300
            transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-forest-400 focus:ring-offset-1
            ${errors.name ? 'border-red-400 bg-red-50' : 'border-stone-300 hover:border-stone-400'}`}
        />
        {errors.name && <p className="mt-1.5 text-xs text-red-600">{errors.name}</p>}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-ink-600 mb-1.5">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={handleChange}
          placeholder="jane@example.com"
          className={`w-full rounded-xl border px-4 py-3 text-sm text-ink-600 bg-white placeholder-ink-300
            transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-forest-400 focus:ring-offset-1
            ${errors.email ? 'border-red-400 bg-red-50' : 'border-stone-300 hover:border-stone-400'}`}
        />
        {errors.email && <p className="mt-1.5 text-xs text-red-600">{errors.email}</p>}
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="phone" className="block text-sm font-semibold text-ink-600 mb-1.5">
          Phone <span className="text-red-500">*</span>
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          value={form.phone}
          onChange={handleChange}
          placeholder="(509) 555-0100"
          className={`w-full rounded-xl border px-4 py-3 text-sm text-ink-600 bg-white placeholder-ink-300
            transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-forest-400 focus:ring-offset-1
            ${errors.phone ? 'border-red-400 bg-red-50' : 'border-stone-300 hover:border-stone-400'}`}
        />
        {errors.phone && <p className="mt-1.5 text-xs text-red-600">{errors.phone}</p>}
      </div>

      {/* Message */}
      <div>
        <label htmlFor="message" className="block text-sm font-semibold text-ink-600 mb-1.5">
          Message <span className="text-ink-300 font-normal">(optional)</span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          value={form.message}
          onChange={handleChange}
          placeholder="Questions, financing situation, preferred showing time…"
          className="w-full rounded-xl border border-stone-300 px-4 py-3 text-sm text-ink-600 bg-white placeholder-ink-300
            transition-colors duration-150 hover:border-stone-400 focus:outline-none focus:ring-2
            focus:ring-forest-400 focus:ring-offset-1 resize-none"
        />
      </div>

      {/* TCPA consent */}
      <div className={`rounded-xl border p-4 ${errors.tcpaConsent ? 'border-red-300 bg-red-50' : 'border-stone-200 bg-stone-100'}`}>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="tcpaConsent"
            checked={form.tcpaConsent}
            onChange={handleChange}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-stone-300 text-forest-500 focus:ring-forest-400"
          />
          <span className="text-xs leading-relaxed text-ink-400">
            By submitting, you consent to be contacted by Dominion Home Deals via phone, text, and email.{' '}
            <span className="text-red-500">*</span>
          </span>
        </label>
        {errors.tcpaConsent && <p className="mt-1.5 ml-7 text-xs text-red-600">{errors.tcpaConsent}</p>}
      </div>

      {/* Submit error */}
      {errors.submit && (
        <p className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {errors.submit}
        </p>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={status === 'loading'}
        className="btn-primary w-full text-base py-4 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {status === 'loading' ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Sending…
          </span>
        ) : (
          'Request More Info'
        )}
      </button>

      <p className="text-center text-xs text-ink-300">
        Or call/text directly:{' '}
        <a href="tel:509-822-5460" className="font-semibold text-forest-500 hover:text-forest-600 underline underline-offset-2">
          509-822-5460
        </a>
      </p>
    </form>
  )
}
