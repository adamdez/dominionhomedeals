// src/app/terms/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: `Terms and Conditions for ${SITE.legalName}. Review the terms governing your use of our website and services.`,
  robots: { index: true, follow: true },
  alternates: { canonical: `${SITE.url}/terms` },
};

export default function TermsPage() {
  const lastUpdated = "February 23, 2026";

  return (
    <div className="bg-stone-50">
      {/* Hero */}
      <section className="border-b border-stone-200 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-5 sm:px-6 lg:px-8">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-forest-500">
            Legal
          </p>
          <h1 className="font-display text-3xl font-bold text-ink-600 sm:text-4xl">
            Terms &amp; Conditions
          </h1>
          <p className="mt-4 text-base text-stone-500">
            Last updated: {lastUpdated}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-14 sm:py-20">
        <div className="mx-auto max-w-3xl px-5 sm:px-6 lg:px-8">
          <div className="prose prose-stone prose-sm sm:prose-base max-w-none [&_h2]:font-display [&_h2]:text-ink-600 [&_h2]:text-xl sm:[&_h2]:text-2xl [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:text-ink-600 [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:text-stone-600 [&_p]:leading-relaxed [&_li]:text-stone-600 [&_a]:text-forest-600 [&_a]:underline hover:[&_a]:text-forest-700">

            <p>
              These Terms and Conditions (&quot;Terms&quot;) govern your use of the website{" "}
              <Link href="/">{SITE.url.replace("https://", "")}</Link> (the &quot;Site&quot;) and any related services provided by {SITE.legalName} (&quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). By accessing or using our Site, you agree to be bound by these Terms. If you do not agree, please do not use our Site.
            </p>

            <h2>1. About Our Company</h2>
            <p>
              {SITE.legalName} is a real estate investment company located in {SITE.address.city}, {SITE.address.state} {SITE.address.zip}. We buy residential properties directly from homeowners for cash. <strong>We are principals — not licensed real estate agents or brokers.</strong> We are not affiliated with any government agency. All transactions are conducted as principal-to-principal purchases.
            </p>

            <h2>2. Use of Our Site</h2>
            <p>You agree to use the Site only for lawful purposes and in accordance with these Terms. You agree not to:</p>
            <ul>
              <li>Use the Site in any way that violates any applicable federal, state, or local law or regulation</li>
              <li>Submit false, misleading, or fraudulent information</li>
              <li>Attempt to interfere with, compromise, or disrupt the Site or its servers</li>
              <li>Use any automated system (bots, scrapers, etc.) to access the Site without our express written permission</li>
              <li>Impersonate or attempt to impersonate the Company, a Company employee, another user, or any other person or entity</li>
            </ul>

            <h2>3. Property Information and Cash Offers</h2>
            <p>
              By submitting your property information through our Site forms, phone calls, text messages, or other communications, you represent that:
            </p>
            <ul>
              <li>You are the legal owner of the property or are authorized by the owner to inquire about a sale</li>
              <li>The information you provide is accurate and complete to the best of your knowledge</li>
              <li>You understand that any preliminary cash offer is subject to verification of property details, title review, and other due diligence</li>
            </ul>
            <p>
              <strong>No offer made through the Site or initial communications constitutes a binding contract.</strong> A binding agreement to purchase your property will only exist when both parties have executed a written purchase agreement. All offers are subject to our standard due diligence, title verification, and the terms of any executed purchase agreement.
            </p>

            <h2>4. Communications Consent</h2>
            <p>
              By submitting a form on our Site or providing your contact information, you consent to receive communications from {SITE.legalName}, including phone calls, text messages (SMS/MMS), and emails, regarding your property inquiry. This may include messages sent using automated technology.
            </p>
            <p>
              <strong>Consent is not a condition of receiving an offer.</strong> You may opt out at any time: reply STOP to text messages, request removal during a phone call, click unsubscribe in emails, or contact us at{" "}
              <a href={`mailto:${SITE.email}`}>{SITE.email}</a>. Message and data rates may apply. Message frequency varies. See our{" "}
              <Link href="/privacy">Privacy Policy</Link> for full details.
            </p>

            <h2>5. No Real Estate Advice</h2>
            <p>
              The content on our Site is for informational purposes only. Nothing on this Site constitutes real estate, legal, financial, or tax advice. We are not acting as your real estate agent, attorney, or financial advisor. We strongly recommend that you consult with licensed professionals (attorney, CPA, real estate agent) before making any decisions about selling your property.
            </p>

            <h2>6. Idaho and Washington Compliance</h2>

            <h3>6a. Idaho (ID Title 54 &amp; Idaho Consumer Protection Act)</h3>
            <p>
              As a real estate investment company operating in Idaho, we comply with applicable Idaho statutes, including but not limited to Idaho Code Title 54 (Professions, Vocations, and Businesses) and the Idaho Consumer Protection Act (Idaho Code Title 48, Chapter 6). We do not engage in activities requiring a real estate license under Idaho law because we purchase properties as principals for our own account.
            </p>

            <h3>6b. Washington (WA RCW 64.04 &amp; Consumer Protection Act)</h3>
            <p>
              For properties located in Washington State, we comply with applicable Washington statutes, including but not limited to RCW 64.04 (Conveyances), RCW 19.86 (Consumer Protection Act), and all applicable real property disclosure requirements. All Washington property transactions will use standard Washington State purchase and sale agreements and comply with Washington closing and recording requirements.
            </p>

            <h2>7. Title and Closing</h2>
            <p>
              All property transactions are closed through a licensed title company. We currently close through WFG National Title Insurance Company or another reputable title company operating in Idaho and Washington. The title company handles escrow, title search, recording, and disbursement of funds to protect both parties.
            </p>

            <h2>8. No Guarantees</h2>
            <p>
              We do not guarantee that we will make an offer on every property, that any offer will meet your expectations, or that any transaction will close. Market conditions, property condition, title issues, and other factors may affect our ability to make an offer or complete a transaction.
            </p>

            <h2>9. Intellectual Property</h2>
            <p>
              All content on the Site — including text, graphics, logos, images, and software — is the property of {SITE.legalName} or its licensors and is protected by copyright, trademark, and other intellectual property laws. You may not reproduce, distribute, modify, or create derivative works from our content without our express written permission.
            </p>

            <h2>10. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, {SITE.legalName}, its members, officers, employees, agents, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the Site or our services. Our total liability for any claim arising from or related to these Terms shall not exceed the amount you have paid to us, if any, in the 12 months preceding the claim.
            </p>

            <h2>11. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless {SITE.legalName}, its members, officers, employees, and agents from and against any claims, damages, losses, liabilities, and expenses (including reasonable attorneys&apos; fees) arising out of or related to your use of the Site, your violation of these Terms, or your violation of any third-party rights.
            </p>

            <h2>12. Disclaimer of Warranties</h2>
            <p>
              THE SITE AND SERVICES ARE PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SITE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.
            </p>

            <h2>13. Governing Law and Disputes</h2>
            <p>
              These Terms are governed by and construed in accordance with the laws of the State of Idaho, without regard to its conflict of law principles. Any disputes arising out of or related to these Terms or the Site shall be resolved in the state or federal courts located in Kootenai County, Idaho. You consent to the personal jurisdiction of such courts.
            </p>

            <h2>14. Severability</h2>
            <p>
              If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary so that the remaining provisions remain in full force and effect.
            </p>

            <h2>15. Changes to These Terms</h2>
            <p>
              We may update these Terms from time to time. The &quot;Last updated&quot; date at the top of this page indicates when the Terms were last revised. Continued use of the Site after changes constitutes acceptance of the updated Terms.
            </p>

            <h2>16. Contact Us</h2>
            <p>If you have any questions about these Terms, please contact us:</p>
            <p>
              <strong>{SITE.legalName}</strong><br />
              {SITE.address.city}, {SITE.address.state} {SITE.address.zip}<br />
              Phone: <a href={`tel:${SITE.phone.replace(/-/g, "")}`}>{SITE.phone}</a><br />
              Email: <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
            </p>

          </div>

          {/* Back link */}
          <div className="mt-12 border-t border-stone-200 pt-6">
            <Link
              href="/"
              className="text-sm font-medium text-forest-600 hover:text-forest-700 transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
