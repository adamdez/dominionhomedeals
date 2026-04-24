"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";

type InterestType = "active_buyer" | "passive_investor" | "both";

interface FormState {
  fullName: string;
  email: string;
  phone: string;
  interestType: InterestType;
  buyerStrategies: string[];
  opportunityInterests: string[];
  capitalRange: string;
  interestDetails: string;
  preferredMarkets: string;
  timeline: string;
  contactConsent: boolean;
  honeypot: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmTerm: string;
  utmContent: string;
  gclid: string;
  landingPage: string;
}

type FormErrors = Partial<Record<keyof FormState | "submit", string>>;

const initialState: FormState = {
  fullName: "",
  email: "",
  phone: "",
  interestType: "both",
  buyerStrategies: [],
  opportunityInterests: [],
  capitalRange: "Prefer not to say",
  interestDetails: "",
  preferredMarkets: "",
  timeline: "Ready now",
  contactConsent: false,
  honeypot: "",
  utmSource: "",
  utmMedium: "",
  utmCampaign: "",
  utmTerm: "",
  utmContent: "",
  gclid: "",
  landingPage: "",
};

const interestTypeOptions: { value: InterestType; label: string; description: string }[] = [
  {
    value: "active_buyer",
    label: "Active buyer",
    description: "I buy properties, flips, rentals, or assignable deals.",
  },
  {
    value: "passive_investor",
    label: "Passive investor",
    description: "I may place capital into real estate opportunities.",
  },
  {
    value: "both",
    label: "Both",
    description: "I buy deals and may also consider capital placement.",
  },
];

const buyerStrategyOptions = [
  "Fix-and-flip",
  "Buy and hold rentals",
  "BRRRR / value-add",
  "Small multifamily",
  "Assignable / wholesale deals",
  "Land or other",
];

const opportunityInterestOptions = [
  "Debt / private lending",
  "Equity / JV opportunities",
  "Long-term rentals",
  "Fix-and-flip projects",
  "Open to hearing opportunities",
];

const capitalRangeOptions = [
  "Under $100k",
  "$100k-$300k",
  "$300k+",
  "Prefer not to say",
];

const timelineOptions = [
  "Ready now",
  "In the next 30-90 days",
  "Just exploring",
];

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 10);
  if (digits.length < 4) return digits;
  if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function toggleOption(options: string[], option: string): string[] {
  return options.includes(option)
    ? options.filter((item) => item !== option)
    : [...options, option];
}

export function BuyerInvestorLeadForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const gclidFromQuery = params.get("gclid") || "";
    let storedGclid = "";

    try {
      storedGclid = localStorage.getItem("gclid") || "";
    } catch (error) {}

    setForm((prev) => ({
      ...prev,
      utmSource: params.get("utm_source") || "",
      utmMedium: params.get("utm_medium") || "",
      utmCampaign: params.get("utm_campaign") || "",
      utmTerm: params.get("utm_term") || "",
      utmContent: params.get("utm_content") || "",
      gclid: gclidFromQuery || storedGclid || "",
      landingPage: window.location.pathname + window.location.search,
    }));
  }, []);

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  function validate(): boolean {
    const next: FormErrors = {};
    if (!form.fullName.trim()) next.fullName = "Name is required";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = "Valid email is required";
    }
    if (!form.phone.trim() || form.phone.replace(/\D/g, "").length < 10) {
      next.phone = "Valid 10-digit phone is required";
    }
    if (!form.preferredMarkets.trim()) {
      next.preferredMarkets = "Tell us which markets you prefer";
    }
    if (!form.contactConsent) next.contactConsent = "You must consent to be contacted";

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validate()) return;

    setStatus("loading");
    setErrors({});

    try {
      const response = await fetch("/api/buyers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          interestType: form.interestType,
          buyerStrategies: form.buyerStrategies,
          opportunityInterests: form.opportunityInterests,
          capitalRange: form.capitalRange,
          interestDetails: form.interestDetails,
          preferredMarkets: form.preferredMarkets,
          timeline: form.timeline,
          contactConsent: form.contactConsent,
          honeypot: form.honeypot,
          source: "buyers_page",
          landingPage: form.landingPage,
          utmSource: form.utmSource,
          utmMedium: form.utmMedium,
          utmCampaign: form.utmCampaign,
          utmTerm: form.utmTerm,
          utmContent: form.utmContent,
          gclid: form.gclid,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        setStatus("error");
        setErrors({ submit: data.error || `Something went wrong. Please call ${SITE.phone}.` });
        return;
      }

      setStatus("success");
      window.location.assign("/buyers/thank-you");
    } catch {
      setStatus("error");
      setErrors({ submit: `Network error. Please call or text ${SITE.phone}.` });
    }
  }

  return (
    <div id="join-list" className="scroll-mt-24 rounded-[28px] border border-stone-200 bg-white p-5 shadow-soft sm:p-7">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-forest-500">
          Join the list
        </p>
        <h2 className="mt-2 font-display text-3xl text-ink-700">
          Tell us what fits.
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-400">
          Share your criteria once. When something may match, our local team can reach out.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="buyer-name" className="mb-1.5 block text-sm font-semibold text-ink-600">
              Full name <span className="text-red-500">*</span>
            </label>
            <input
              id="buyer-name"
              type="text"
              autoComplete="name"
              value={form.fullName}
              onChange={(event) => updateField("fullName", event.target.value)}
              placeholder="Jane Smith"
              className={cn(
                "w-full rounded-xl border bg-stone-50 px-4 py-3 text-sm text-ink-600 placeholder:text-ink-300 transition-colors focus:ring-2 focus:ring-forest-400",
                errors.fullName ? "border-red-400 bg-red-50" : "border-stone-200 hover:border-stone-300",
              )}
            />
            {errors.fullName ? <p className="mt-1.5 text-xs text-red-600">{errors.fullName}</p> : null}
          </div>

          <div>
            <label htmlFor="buyer-phone" className="mb-1.5 block text-sm font-semibold text-ink-600">
              Phone <span className="text-red-500">*</span>
            </label>
            <input
              id="buyer-phone"
              type="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={(event) => updateField("phone", formatPhone(event.target.value))}
              placeholder="(509) 555-0100"
              className={cn(
                "w-full rounded-xl border bg-stone-50 px-4 py-3 text-sm text-ink-600 placeholder:text-ink-300 transition-colors focus:ring-2 focus:ring-forest-400",
                errors.phone ? "border-red-400 bg-red-50" : "border-stone-200 hover:border-stone-300",
              )}
            />
            {errors.phone ? <p className="mt-1.5 text-xs text-red-600">{errors.phone}</p> : null}
          </div>
        </div>

        <div>
          <label htmlFor="buyer-email" className="mb-1.5 block text-sm font-semibold text-ink-600">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            id="buyer-email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
            placeholder="jane@example.com"
            className={cn(
              "w-full rounded-xl border bg-stone-50 px-4 py-3 text-sm text-ink-600 placeholder:text-ink-300 transition-colors focus:ring-2 focus:ring-forest-400",
              errors.email ? "border-red-400 bg-red-50" : "border-stone-200 hover:border-stone-300",
            )}
          />
          {errors.email ? <p className="mt-1.5 text-xs text-red-600">{errors.email}</p> : null}
        </div>

        <fieldset>
          <legend className="text-sm font-semibold text-ink-600">What best describes you?</legend>
          <div className="mt-3 grid gap-2">
            {interestTypeOptions.map((option) => (
              <label
                key={option.value}
                className={cn(
                  "cursor-pointer rounded-2xl border px-4 py-3 transition-colors",
                  form.interestType === option.value
                    ? "border-forest-500 bg-forest-50"
                    : "border-stone-200 bg-stone-50 hover:border-stone-300",
                )}
              >
                <input
                  type="radio"
                  name="interestType"
                  value={option.value}
                  checked={form.interestType === option.value}
                  onChange={() => updateField("interestType", option.value)}
                  className="sr-only"
                />
                <span className="block text-sm font-semibold text-ink-600">{option.label}</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-ink-400">{option.description}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-semibold text-ink-600">Buyer strategy</legend>
          <p className="mt-1 text-xs text-ink-300">Select any that fit.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {buyerStrategyOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => updateField("buyerStrategies", toggleOption(form.buyerStrategies, option))}
                className={cn(
                  "rounded-xl border px-3.5 py-2.5 text-left text-sm transition-colors",
                  form.buyerStrategies.includes(option)
                    ? "border-forest-500 bg-forest-50 text-forest-700"
                    : "border-stone-200 bg-stone-50 text-ink-500 hover:border-stone-300",
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-semibold text-ink-600">Investor interest</legend>
          <p className="mt-1 text-xs text-ink-300">For capital placement conversations, if applicable.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {opportunityInterestOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() =>
                  updateField("opportunityInterests", toggleOption(form.opportunityInterests, option))
                }
                className={cn(
                  "rounded-xl border px-3.5 py-2.5 text-left text-sm transition-colors",
                  form.opportunityInterests.includes(option)
                    ? "border-forest-500 bg-forest-50 text-forest-700"
                    : "border-stone-200 bg-stone-50 text-ink-500 hover:border-stone-300",
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="capital-range" className="mb-1.5 block text-sm font-semibold text-ink-600">
              Capital range
            </label>
            <select
              id="capital-range"
              value={form.capitalRange}
              onChange={(event) => updateField("capitalRange", event.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-ink-600 transition-colors hover:border-stone-300 focus:ring-2 focus:ring-forest-400"
            >
              {capitalRangeOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="timeline" className="mb-1.5 block text-sm font-semibold text-ink-600">
              Timeline / readiness
            </label>
            <select
              id="timeline"
              value={form.timeline}
              onChange={(event) => updateField("timeline", event.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-ink-600 transition-colors hover:border-stone-300 focus:ring-2 focus:ring-forest-400"
            >
              {timelineOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="preferred-markets" className="mb-1.5 block text-sm font-semibold text-ink-600">
            Preferred markets <span className="text-red-500">*</span>
          </label>
          <input
            id="preferred-markets"
            type="text"
            value={form.preferredMarkets}
            onChange={(event) => updateField("preferredMarkets", event.target.value)}
            placeholder="Spokane, Spokane Valley, Coeur d'Alene, North Idaho"
            className={cn(
              "w-full rounded-xl border bg-stone-50 px-4 py-3 text-sm text-ink-600 placeholder:text-ink-300 transition-colors focus:ring-2 focus:ring-forest-400",
              errors.preferredMarkets ? "border-red-400 bg-red-50" : "border-stone-200 hover:border-stone-300",
            )}
          />
          {errors.preferredMarkets ? (
            <p className="mt-1.5 text-xs text-red-600">{errors.preferredMarkets}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="interest-details" className="mb-1.5 block text-sm font-semibold text-ink-600">
            Buy box / interest details
          </label>
          <textarea
            id="interest-details"
            rows={4}
            value={form.interestDetails}
            onChange={(event) => updateField("interestDetails", event.target.value)}
            placeholder="Spokane SFRs under $350k, small multifamily, first-position lending, looking for passive opportunities..."
            className="w-full resize-none rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-ink-600 placeholder:text-ink-300 transition-colors hover:border-stone-300 focus:ring-2 focus:ring-forest-400"
          />
        </div>

        <input
          type="text"
          name="company_website"
          value={form.honeypot}
          onChange={(event) => updateField("honeypot", event.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0, width: 0 }}
        />

        <div
          className={cn(
            "rounded-xl border p-4",
            errors.contactConsent ? "border-red-300 bg-red-50" : "border-stone-200 bg-stone-100",
          )}
        >
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={form.contactConsent}
              onChange={(event) => updateField("contactConsent", event.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-stone-300 text-forest-500 focus:ring-forest-400"
            />
            <span className="text-xs leading-relaxed text-ink-400">
              By submitting, you consent to receive calls, text messages, and emails from Dominion Homes, LLC
              about potential real estate opportunities. Consent is not a condition of purchase. Message and data
              rates may apply. Reply STOP to opt out, HELP for help.{" "}
              <Link href="/privacy" className="underline hover:text-ink-500">
                Privacy Policy
              </Link>
              . <span className="text-red-500">*</span>
            </span>
          </label>
          {errors.contactConsent ? (
            <p className="ml-7 mt-1.5 text-xs text-red-600">{errors.contactConsent}</p>
          ) : null}
        </div>

        {errors.submit ? (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errors.submit}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={status === "loading"}
          className="btn-primary w-full py-4 text-base disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "loading" ? "Submitting..." : "Join the Buyer & Investor List"}
        </button>

        <p className="text-center text-xs leading-relaxed text-ink-300">
          Submission does not guarantee deal access or investment placement. Opportunities are subject to fit,
          availability, and applicable laws.
        </p>
      </form>
    </div>
  );
}
