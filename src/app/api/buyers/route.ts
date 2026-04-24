import { NextRequest, NextResponse } from "next/server";
import {
  recordBuyerInvestorLeadSubmission,
  type BuyerInvestorInterestType,
} from "@/lib/buyer-investor-leads";

interface BuyerInvestorPayload {
  fullName: string;
  email: string;
  phone: string;
  interestType: BuyerInvestorInterestType;
  buyerStrategies?: string[];
  opportunityInterests?: string[];
  capitalRange?: string;
  interestDetails?: string;
  preferredMarkets?: string;
  timeline?: string;
  contactConsent: boolean;
  honeypot?: string;
  source?: string;
  landingPage?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  gclid?: string;
}

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 3600000 });
    return false;
  }
  entry.count++;
  return entry.count > 5;
}

function validatePhone(phone: string): boolean {
  return phone.replace(/\D/g, "").length >= 10;
}

function validateEmail(email: string): boolean {
  return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email);
}

function sanitize(str: string, max = 500): string {
  return str
    .trim()
    .substring(0, max)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sanitizeList(value: unknown, maxItems = 8): string[] {
  return Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === "string")
        .map((item) => sanitize(item, 120))
        .filter(Boolean)
        .slice(0, maxItems)
    : [];
}

function normalizeInterestType(value: unknown): BuyerInvestorInterestType {
  switch (String(value || "").trim()) {
    case "active_buyer":
    case "passive_investor":
    case "both":
      return value as BuyerInvestorInterestType;
    default:
      return "both";
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
    }),
  ]);
}

function labelInterestType(value: BuyerInvestorInterestType): string {
  switch (value) {
    case "active_buyer":
      return "Active buyer";
    case "passive_investor":
      return "Passive investor";
    case "both":
      return "Buyer and investor";
  }
}

async function sendEmailNotification(lead: Record<string, unknown>) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    console.log("[BUYERS EMAIL] No RESEND_API_KEY set - skipping email for lead:", lead.fullName);
    return;
  }

  const interestType = labelInterestType(lead.interestType as BuyerInvestorInterestType);
  const buyerStrategies = Array.isArray(lead.buyerStrategies) ? lead.buyerStrategies.join(", ") : "Not provided";
  const opportunityInterests = Array.isArray(lead.opportunityInterests)
    ? lead.opportunityInterests.join(", ")
    : "Not provided";

  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 640px; margin: 0 auto;">
      <div style="background: #1a3a2a; color: white; padding: 20px 24px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 20px;">New Buyer / Investor List Signup</h1>
        <p style="margin: 4px 0 0; opacity: 0.8; font-size: 14px;">${interestType} - ${lead.timeline}</p>
      </div>

      <div style="background: #f9f8f6; padding: 24px; border: 1px solid #e5e3df;">
        <h2 style="margin: 0 0 16px; font-size: 16px; color: #1a3a2a;">Contact Info</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 6px 0; color: #666; width: 150px;">Name</td><td style="padding: 6px 0; font-weight: 600;">${lead.fullName}</td></tr>
          <tr><td style="padding: 6px 0; color: #666;">Phone</td><td style="padding: 6px 0; font-weight: 600;"><a href="tel:${lead.phone}" style="color: #1a3a2a;">${lead.phone}</a></td></tr>
          <tr><td style="padding: 6px 0; color: #666;">Email</td><td style="padding: 6px 0;"><a href="mailto:${lead.email}" style="color: #1a3a2a;">${lead.email}</a></td></tr>
        </table>
      </div>

      <div style="padding: 24px; border: 1px solid #e5e3df; border-top: none;">
        <h2 style="margin: 0 0 16px; font-size: 16px; color: #1a3a2a;">Interest Profile</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 6px 0; color: #666; width: 150px;">Interest Type</td><td style="padding: 6px 0; font-weight: 600;">${interestType}</td></tr>
          <tr><td style="padding: 6px 0; color: #666;">Buyer Strategy</td><td style="padding: 6px 0;">${buyerStrategies}</td></tr>
          <tr><td style="padding: 6px 0; color: #666;">Opportunity Interest</td><td style="padding: 6px 0;">${opportunityInterests}</td></tr>
          <tr><td style="padding: 6px 0; color: #666;">Capital Range</td><td style="padding: 6px 0;">${lead.capitalRange}</td></tr>
          <tr><td style="padding: 6px 0; color: #666;">Markets</td><td style="padding: 6px 0;">${lead.preferredMarkets}</td></tr>
          <tr><td style="padding: 6px 0; color: #666;">Timeline</td><td style="padding: 6px 0; font-weight: 600;">${lead.timeline}</td></tr>
        </table>
        <div style="margin-top: 16px; padding: 14px; background: #f5f4f0; border-radius: 8px; color: #343A40; font-size: 14px; line-height: 1.5;">
          ${lead.interestDetails || "No additional notes provided."}
        </div>
      </div>

      <div style="padding: 24px; border: 1px solid #e5e3df; border-top: none; border-radius: 0 0 8px 8px;">
        <h2 style="margin: 0 0 12px; font-size: 16px; color: #1a3a2a;">Consent and Attribution</h2>
        <p style="margin: 0; font-size: 12px; color: #888;">
          Consented at: ${lead.consentTimestamp}<br/>
          IP: ${lead.consentIP}<br/>
          Source: ${lead.source} | Page: ${lead.landingPage}
        </p>
        ${lead.utmSource ? `<p style="margin: 8px 0 0; font-size: 12px; color: #888;">UTM: ${lead.utmSource} / ${lead.utmMedium} / ${lead.utmCampaign}</p>` : ""}
        ${lead.gclid ? `<p style="margin: 8px 0 0; font-size: 12px; color: #888;">GCLID: ${lead.gclid}</p>` : ""}
      </div>
    </div>
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Dominion Homes Leads <leads@dominionhomedeals.com>",
        to: ["adam@dominionhomedeals.com", "logan@dominionhomedeals.com", "leads@dominionhomedeals.com"],
        subject: `New Buyer/Investor Signup: ${lead.fullName} - ${interestType}`,
        html: htmlBody,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("[BUYERS EMAIL ERROR]", errorText);
    }
  } catch (err) {
    console.error("[BUYERS EMAIL ERROR]", err);
  }
}

async function sendSmsNotification(lead: Record<string, unknown>) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    console.log("[BUYERS SMS] No RESEND_API_KEY - skipping SMS notification");
    return;
  }

  const interestType = labelInterestType(lead.interestType as BuyerInvestorInterestType);
  const message = `NEW BUYER/INVESTOR: ${lead.fullName}\n${interestType} | ${lead.capitalRange}\n${lead.phone}\n${lead.preferredMarkets}\n${lead.timeline}`;
  const smsRecipients = ["5095907091@txt.att.net", "5096669518@vtext.com"];

  try {
    await Promise.allSettled(
      smsRecipients.map(async (gateway) => {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "Dominion Leads <leads@dominionhomedeals.com>",
            to: [gateway],
            subject: `Buyer/Investor: ${lead.fullName}`,
            text: message,
          }),
        });

        if (!res.ok) {
          const errorText = await res.text();
          console.error(`[BUYERS SMS] Failed to send to ${gateway}:`, errorText);
        }
      }),
    );
  } catch (err) {
    console.error("[BUYERS SMS ERROR]", err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many submissions. Please try again later." },
        { status: 429 },
      );
    }

    const body: BuyerInvestorPayload = await request.json();

    if (body.honeypot) {
      console.log(`[BUYERS SPAM] Honeypot triggered from ${ip}`);
      return NextResponse.json({ success: true, message: "Thank you!" });
    }

    const errors: string[] = [];
    if (!body.fullName || body.fullName.trim().length < 2) errors.push("Full name required");
    if (!body.phone || !validatePhone(body.phone)) errors.push("Valid phone required");
    if (!body.email || !validateEmail(body.email)) errors.push("Valid email required");
    if (!body.contactConsent) errors.push("Consent required");

    if (errors.length > 0) {
      return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 });
    }

    const submittedAt = new Date().toISOString();
    const lead = {
      fullName: sanitize(body.fullName, 240),
      phone: body.phone.replace(/\D/g, "").substring(0, 11),
      email: sanitize(body.email, 160).toLowerCase(),
      interestType: normalizeInterestType(body.interestType),
      buyerStrategies: sanitizeList(body.buyerStrategies),
      opportunityInterests: sanitizeList(body.opportunityInterests),
      capitalRange: sanitize(body.capitalRange || "Prefer not to say", 80),
      interestDetails: sanitize(body.interestDetails || "", 1000),
      preferredMarkets: sanitize(body.preferredMarkets || "Not provided", 500),
      timeline: sanitize(body.timeline || "Just exploring", 120),
      contactConsented: true,
      consentTimestamp: submittedAt,
      consentIP: ip,
      source: sanitize(body.source || "buyers_page", 120),
      landingPage: sanitize(body.landingPage || "/buyers", 240),
      utmSource: sanitize(body.utmSource || "", 160),
      utmMedium: sanitize(body.utmMedium || "", 160),
      utmCampaign: sanitize(body.utmCampaign || "", 160),
      utmTerm: sanitize(body.utmTerm || "", 160),
      utmContent: sanitize(body.utmContent || "", 160),
      gclid: body.gclid ? sanitize(body.gclid, 160) : "",
      submittedAt,
    };

    console.log("[NEW BUYER/INVESTOR LEAD]", lead.fullName, "-", lead.interestType, "-", lead.capitalRange);

    const sideEffects = await Promise.allSettled([
      withTimeout(sendEmailNotification(lead), 1500, "buyer email notification"),
      withTimeout(sendSmsNotification(lead), 1500, "buyer sms notification"),
      withTimeout(
        recordBuyerInvestorLeadSubmission({
          fullName: lead.fullName,
          phone: lead.phone,
          email: lead.email,
          interestType: lead.interestType,
          buyerStrategies: lead.buyerStrategies,
          opportunityInterests: lead.opportunityInterests,
          capitalRange: lead.capitalRange,
          interestDetails: lead.interestDetails,
          preferredMarkets: lead.preferredMarkets,
          timeline: lead.timeline,
          source: lead.source,
          landingPage: lead.landingPage,
          utmSource: lead.utmSource,
          utmMedium: lead.utmMedium,
          utmCampaign: lead.utmCampaign,
          utmTerm: lead.utmTerm,
          utmContent: lead.utmContent,
          gclid: lead.gclid,
          submittedAt: lead.submittedAt,
        }),
        1500,
        "buyer lead control write",
      ),
    ]);

    const [, , controlWrite] = sideEffects;
    if (controlWrite?.status === "rejected") {
      console.error("[BUYER LEAD CONTROL ERROR]", {
        message:
          controlWrite.reason instanceof Error
            ? controlWrite.reason.message
            : String(controlWrite.reason || "Unknown buyer/investor lead control failure."),
        submittedAt: lead.submittedAt,
        lead: lead.fullName,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Thank you. We received your buyer/investor profile.",
      controlRecorded: controlWrite?.status !== "rejected",
    });
  } catch (err) {
    console.error("[BUYERS API ERROR]", err);
    return NextResponse.json(
      { error: "Something went wrong. Please call or text us at 509-822-5460." },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", endpoint: "/api/buyers" });
}
