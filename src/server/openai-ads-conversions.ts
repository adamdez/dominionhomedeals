import "server-only";
import { SITE } from "@/lib/constants";
import type { DominionDeliveryOutcome } from "@/lib/dominion-leads";
import { openAILeadEventId } from "@/lib/openai-ads-shared";

interface OpenAILeadCreatedInput {
  submissionId: string;
  occurredAt: string;
  oppref?: string | null;
  obref?: string | null;
}

export function buildOpenAILeadCreatedEvent(input: OpenAILeadCreatedInput) {
  return {
    id: openAILeadEventId(input.submissionId),
    type: "lead_created",
    timestamp_ms: new Date(input.occurredAt).getTime(),
    ...(typeof input.oppref === "string" && input.oppref.length > 0 ? { oppref: input.oppref } : {}),
    // Use the canonical page only; never forward arbitrary landing-page query values.
    source_url: `${SITE.url}/sell/options`,
    action_source: "web",
    ...(typeof input.obref === "string" && input.obref.length > 0
      ? { user: { obref: input.obref } }
      : {}),
    // Conversion attribution is useful; future user-level personalization is not required.
    opt_out: true,
    data: { type: "customer_action" },
  } as const;
}

export async function reportOpenAILeadCreated(
  input: OpenAILeadCreatedInput,
): Promise<DominionDeliveryOutcome> {
  const pixelId = process.env.OPENAI_ADS_PIXEL_ID?.trim() ||
    process.env.NEXT_PUBLIC_OPENAI_ADS_PIXEL_ID?.trim();
  const apiKey = process.env.OPENAI_ADS_CONVERSIONS_API_KEY?.trim();
  if (!pixelId || !apiKey) return { status: "skipped" };

  const response = await fetch(`https://bzr.openai.com/v1/events?pid=${encodeURIComponent(pixelId)}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      validate_only: process.env.OPENAI_ADS_CONVERSIONS_VALIDATE_ONLY === "true",
      integration_source: "dominion_homes",
      events: [buildOpenAILeadCreatedEvent(input)],
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(4_000),
  });

  if (!response.ok) {
    return { status: "failed", referenceId: `http_${response.status}` };
  }

  return { status: "provider_accepted" };
}
