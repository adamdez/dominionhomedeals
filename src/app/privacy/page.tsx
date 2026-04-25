// src/app/privacy/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `Privacy Policy for ${SITE.legalName}. Learn how we collect, use, and protect your personal information when you interact with our website and services.`,
  robots: { index: true, follow: true },
  alternates: { canonical: `${SITE.url}/privacy` },
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "April 23, 2026";

  return (
    <div className="bg-stone-50">
      {/* Hero */}
      <section className="border-b border-stone-200 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-5 sm:px-6 lg:px-8">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-forest-500">
            Legal
          </p>
          <h1 className="font-display text-3xl font-bold text-ink-600 sm:text-4xl">
            Privacy Policy
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
              {SITE.legalName} (&quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) respects your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website{" "}
              <Link href="/">{SITE.url.replace("https://", "")}</Link> (the &quot;Site&quot;), interact with us via phone, text message, email, or other communications, or use any of our services.
            </p>
            <p>
              By using our Site or providing your information to us, you agree to the collection and use of information in accordance with this Privacy Policy. If you do not agree, please do not use our Site or services.
            </p>

            <h2>1. Who We Are</h2>
            <p>
              {SITE.legalName} is a real estate investment company based in {SITE.address.city}, {SITE.address.state} {SITE.address.zip}. We are principals — we buy properties directly. We are not licensed real estate agents or brokers, and we are not affiliated with any government agency. Our phone number is{" "}
              <a href={`tel:${SITE.phone.replace(/-/g, "")}`}>{SITE.phone}</a> and our email is{" "}
              <a href={`mailto:${SITE.adminEmail}`}>{SITE.adminEmail}</a>.
            </p>

            <h2>2. Information We Collect</h2>

            <h3>2a. Information You Provide Directly</h3>
            <p>When you fill out a form, call us, text us, email us, or otherwise interact with us, we may collect:</p>
            <ul>
              <li>Full name</li>
              <li>Phone number(s)</li>
              <li>Email address</li>
              <li>Property address and details (condition, situation, timeline)</li>
              <li>Mailing address</li>
              <li>Any other information you choose to provide about your property or situation</li>
            </ul>

            <h3>2b. Information Collected Automatically</h3>
            <p>When you visit our Site, we may automatically collect:</p>
            <ul>
              <li>IP address and approximate geolocation</li>
              <li>Browser type and version</li>
              <li>Device type and operating system</li>
              <li>Pages visited, time spent, and referring URL</li>
              <li>Cookies and similar tracking technologies (see Section 7 below)</li>
            </ul>

            <h3>2c. Information from Third Parties</h3>
            <p>We may receive information about properties and property owners from publicly available sources, including county assessor records, tax records, court records, and third-party data providers, to identify homeowners who may benefit from a cash offer.</p>

            <h2>3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Respond to your inquiry and provide you with a cash offer for your property</li>
              <li>Communicate with you about your property, our offer, and the transaction process</li>
              <li>Send you follow-up communications via phone, text, and/or email related to your inquiry</li>
              <li>Operate, improve, and personalize our Site and services</li>
              <li>Analyze usage patterns to improve user experience</li>
              <li>Comply with legal and regulatory obligations</li>
              <li>Prevent fraud and protect the security of our Site</li>
            </ul>

            <h2>4. Consent to Communications (TCPA Compliance)</h2>
            <p>
              <strong>By submitting a form on our Site or providing your phone number to us, you provide your express written consent</strong> to receive calls, text messages (including SMS and MMS), and emails from {SITE.legalName} at the phone number(s) and/or email address you provide. This may include communications sent using an automatic telephone dialing system and/or prerecorded or artificial voice messages.
            </p>
            <p>
              <strong>Consent is not a condition of purchase or receiving an offer.</strong> You may receive up to 10 messages per month. Message and data rates may apply. Message frequency varies based on your inquiry and transaction status.
            </p>
            <p>
              <strong>To opt out of text messages:</strong> Reply STOP to any text message you receive from us. You will receive a confirmation message and no further texts will be sent unless you re-consent.
            </p>
            <p>
              <strong>To opt out of calls:</strong> Tell us during any call or contact us at{" "}
              <a href={`mailto:${SITE.adminEmail}`}>{SITE.adminEmail}</a> or{" "}
              <a href={`tel:${SITE.phone.replace(/-/g, "")}`}>{SITE.phone}</a>.
            </p>
            <p>
              <strong>To opt out of emails:</strong> Click the &quot;unsubscribe&quot; link in any email or contact us directly.
            </p>
            <p>
              All consent records are maintained in our system with immutable timestamps for compliance purposes.
            </p>

            <h2>5. How We Share Your Information</h2>
            <p>We do not sell your personal information. We may share your information with:</p>
            <p>
              No mobile information, including phone numbers and SMS opt-in consent, will be shared with third parties or affiliates for marketing or promotional purposes. Information sharing with subcontractors strictly in support of our services (for example, message delivery via Twilio) is permitted. SMS opt-in data and consent are excluded from all other sharing categories.
            </p>
            <ul>
              <li><strong>Service providers:</strong> Third parties who help us operate our business, including title companies (e.g., WFG National Title), communication platforms, analytics providers, and CRM systems, subject to confidentiality obligations.</li>
              <li><strong>Transaction parties:</strong> Title companies, closing agents, attorneys, and other parties necessary to complete a real estate transaction, if you accept our offer.</li>
              <li><strong>Legal requirements:</strong> When required by law, regulation, court order, or governmental request, or to protect the rights, property, or safety of {SITE.legalName}, our users, or others.</li>
              <li><strong>Business transfers:</strong> In connection with a merger, acquisition, or sale of all or a portion of our assets.</li>
            </ul>

            <h2>6. Data Retention</h2>
            <p>
              We retain your personal information for as long as necessary to fulfill the purposes described in this Privacy Policy, comply with legal obligations (including TCPA consent records), resolve disputes, and enforce our agreements. When no longer needed, we securely delete or anonymize your information.
            </p>

            <h2>7. Cookies and Tracking Technologies</h2>
            <p>We use cookies and similar technologies to:</p>
            <ul>
              <li>Remember your preferences and improve your experience</li>
              <li>Analyze Site traffic and usage patterns (via Google Analytics)</li>
              <li>Measure the effectiveness of our advertising campaigns</li>
              <li>Provide relevant content based on your location and interests</li>
            </ul>
            <p>
              You can control cookies through your browser settings. Disabling cookies may affect the functionality of our Site. We use Google Analytics, which is subject to the{" "}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google Privacy Policy</a>.
            </p>

            <h2>8. Your Rights</h2>
            <p>Depending on your location, you may have the following rights regarding your personal information:</p>
            <ul>
              <li><strong>Access:</strong> Request a copy of the personal information we hold about you.</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information.</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information, subject to legal retention requirements.</li>
              <li><strong>Opt-out:</strong> Opt out of communications as described in Section 4.</li>
            </ul>
            <p>
              To exercise any of these rights, contact us at{" "}
              <a href={`mailto:${SITE.adminEmail}`}>{SITE.adminEmail}</a> or call{" "}
              <a href={`tel:${SITE.phone.replace(/-/g, "")}`}>{SITE.phone}</a>.
              We will respond to your request within 30 days.
            </p>

            <h2>9. Idaho and Washington Residents</h2>
            <p>
              {SITE.legalName} operates in compliance with Idaho law (including Idaho Consumer Protection Act, Idaho Code Title 48) and Washington law (including WA RCW 19.255 — Personal Information, WA RCW 64.04 — Real Property Transfers). We maintain appropriate safeguards for any personal information collected from residents of Idaho and Washington.
            </p>

            <h2>10. Security</h2>
            <p>
              We implement commercially reasonable technical and organizational security measures to protect your personal information from unauthorized access, disclosure, alteration, or destruction. However, no method of internet transmission or electronic storage is 100% secure. We cannot guarantee absolute security.
            </p>

            <h2>11. Third-Party Links</h2>
            <p>
              Our Site may contain links to third-party websites. We are not responsible for the privacy practices or content of those websites. We encourage you to review the privacy policies of any third-party sites you visit.
            </p>

            <h2>12. Children&apos;s Privacy</h2>
            <p>
              Our Site and services are not directed to individuals under 18 years of age. We do not knowingly collect personal information from children under 18. If we learn we have collected information from a child under 18, we will delete it promptly.
            </p>

            <h2>13. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. The &quot;Last updated&quot; date at the top of this page indicates when the policy was last revised. We encourage you to review this page periodically. Continued use of our Site or services after changes constitutes acceptance of the updated Privacy Policy.
            </p>

            <h2>14. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy or our data practices, please contact us:</p>
            <p>
              <strong>{SITE.legalName}</strong><br />
              {SITE.address.city}, {SITE.address.state} {SITE.address.zip}<br />
              Phone: <a href={`tel:${SITE.phone.replace(/-/g, "")}`}>{SITE.phone}</a><br />
              Email: <a href={`mailto:${SITE.adminEmail}`}>{SITE.adminEmail}</a>
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
