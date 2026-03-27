import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * POST /api/text-us
 *
 * Receives the "Text Us" form submission and forwards to Sentinel's
 * /api/inbound/sms-thread endpoint, which sends the customer a welcome
 * SMS and creates a thread in the Sentinel SMS tile.
 *
 * Body: { firstName, phone, message?, address?, city?, state? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Basic validation
    const phone = (body.phone ?? "").replace(/\D/g, "");
    if (phone.length < 10) {
      return NextResponse.json({ error: "Please enter a valid phone number" }, { status: 400 });
    }

    const firstName = (body.firstName ?? "").trim();
    if (!firstName) {
      return NextResponse.json({ error: "First name is required" }, { status: 400 });
    }

    // Honeypot check
    if (body.company) {
      // Bot detected — return success silently
      return NextResponse.json({ success: true });
    }

    const sentinelUrl = process.env.SENTINEL_API_URL;
    const sentinelSecret = process.env.SENTINEL_INTAKE_SECRET;

    if (!sentinelUrl || !sentinelSecret) {
      console.error("[text-us] SENTINEL_API_URL or SENTINEL_INTAKE_SECRET not configured");
      return NextResponse.json(
        { error: "Service temporarily unavailable" },
        { status: 503 },
      );
    }

    // Forward to Sentinel
    const sentinelRes = await fetch(`${sentinelUrl}/api/inbound/sms-thread`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-intake-secret": sentinelSecret,
      },
      body: JSON.stringify({
        firstName: firstName,
        phone: phone,
        message: (body.message ?? "").trim().slice(0, 500),
        address: (body.address ?? "").trim(),
        city: (body.city ?? "").trim(),
        state: (body.state ?? "").trim(),
        source: "website_text_form",
      }),
    });

    if (!sentinelRes.ok) {
      const err = await sentinelRes.json().catch(() => ({}));
      console.error("[text-us] Sentinel error:", sentinelRes.status, err);
      return NextResponse.json(
        { error: "Unable to send text right now. Please try calling us instead." },
        { status: 502 },
      );
    }

    const result = await sentinelRes.json();

    // Also forward to the main lead intake so the lead gets created in CRM
    // (fire-and-forget — don't block the response)
    fetch(`${sentinelUrl}/api/inbound/webform`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-intake-secret": sentinelSecret,
      },
      body: JSON.stringify({
        owner_name: firstName,
        phone: phone,
        address: (body.address ?? "").trim(),
        city: (body.city ?? "").trim(),
        state: (body.state ?? "").trim(),
        source_vendor: "dominionhomedeals.com",
        intake_method: "website_text_form",
        raw_source_ref: `text_form_${new Date().toISOString()}`,
        notes: body.message ? `Customer message: ${body.message}` : "Submitted via Text Us form",
        received_at: new Date().toISOString(),
      }),
    }).catch((err) => {
      console.error("[text-us] Lead forward failed (non-blocking):", err);
    });

    return NextResponse.json({
      success: true,
      threadCreated: result.threadCreated ?? true,
    });
  } catch (error) {
    console.error("[text-us] Unexpected error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try calling us at 509-822-5460." },
      { status: 500 },
    );
  }
}
