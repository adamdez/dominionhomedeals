// src/lib/sentinel.ts
import type { Lead, SentinelResponse } from "@/types";

const SENTINEL_API_URL =
  process.env.NEXT_PUBLIC_SENTINEL_API_URL ||
  "https://dominion-sentinel.vercel.app/api";

export async function submitLeadToSentinel(
  lead: Lead
): Promise<SentinelResponse> {
  try {
    const response = await fetch(`${SENTINEL_API_URL}/leads`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Source": "dominionhomedeals.com",
      },
      body: JSON.stringify(lead),
    });

    if (!response.ok) {
      return { success: false, message: `Sentinel error: ${response.status}` };
    }
    return await response.json();
  } catch {
    queueFailedLead(lead);
    return { success: false, message: "Queued for retry" };
  }
}

function queueFailedLead(lead: Lead): void {
  if (typeof window === "undefined") return;
  try {
    const queue = JSON.parse(localStorage.getItem("dh_lead_queue") || "[]");
    queue.push(lead);
    localStorage.setItem("dh_lead_queue", JSON.stringify(queue));
  } catch { /* storage full */ }
}
