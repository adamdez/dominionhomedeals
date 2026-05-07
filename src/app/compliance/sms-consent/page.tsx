import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "SMS Consent Flow Evidence — Dominion Homes, LLC",
  description:
    "Public evidence page documenting Dominion Homes, LLC's SMS consent opt-in flow for 10DLC / TCR campaign review.",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://www.dominionhomedeals.com/compliance/sms-consent" },
};

const consentLanguage =
  "I agree to receive recurring marketing and informational text messages from Dominion Homes, LLC about my property inquiry, including cash offer follow-ups, appointment scheduling, transaction status updates, and document-signing links, at the phone number provided. Messages may be sent using automated technology. Consent is not required to receive an offer. Message frequency varies, up to 10 msgs/month. Msg & data rates may apply. Reply STOP to opt out or HELP for help. We do not sell or share SMS opt-in information. See our Privacy Policy and Terms.";

export default function SmsConsentEvidencePage() {
  return (
    <main className="bg-stone-50 py-12 sm:py-16">
      <div className="mx-auto max-w-5xl px-5 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-soft sm:p-8">
          <p className="text-xs font-bold uppercase tracking-widest text-forest-500">
            Compliance Evidence
          </p>
          <h1 className="mt-3 font-display text-3xl font-bold text-ink-600 sm:text-4xl">
            SMS Consent Flow Evidence — Dominion Homes, LLC
          </h1>

          <p className="mt-6 text-sm leading-relaxed text-stone-600 sm:text-base">
            This page documents the SMS opt-in flow used on dominionhomedeals.com for 10DLC / TCR campaign review. End users opt in by ticking an unchecked SMS consent checkbox shown directly under the phone number field in the cash offer lead form at https://www.dominionhomedeals.com/#get-offer. The same checkbox is also shown again before final submission. Consent is not a condition of purchase or receiving an offer. Form submission is not blocked if the checkbox is unticked; in that case, the user's phone number is not enrolled in the SMS program. The exact consent language displayed at submission time is reproduced below.
          </p>

          <div className="mt-8 overflow-hidden rounded-xl border border-stone-200 bg-stone-100">
            <img
              src="/compliance/sms-consent-screenshot.png"
              alt="Production lead form phone step showing the unchecked SMS consent checkbox below the phone field."
              className="w-full"
            />
          </div>

          <section className="mt-8 rounded-xl border border-stone-200 bg-stone-50 p-5">
            <h2 className="font-display text-xl font-semibold text-ink-600">
              SMS Consent Checkbox Label
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-stone-700">
              {consentLanguage}
            </p>
          </section>

          <div className="mt-8 flex flex-wrap gap-3 text-sm font-medium">
            <Link
              href="/privacy#sms-terms"
              className="rounded-full border border-forest-200 px-4 py-2 text-forest-600 transition-colors hover:border-forest-400 hover:text-forest-700"
            >
              Privacy Policy SMS section
            </Link>
            <Link
              href="/terms"
              className="rounded-full border border-forest-200 px-4 py-2 text-forest-600 transition-colors hover:border-forest-400 hover:text-forest-700"
            >
              Terms
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
