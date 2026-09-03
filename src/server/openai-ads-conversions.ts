import "server-only";
import { SITE } from "@/lib/constants";
import type { DominionDeliveryOutcome } from "@/lib/dominion-leads";
import { openAILeadEventId } from "@/lib/openai-ads-shared";

interface OpenAILeadCreatedInput {
  submissionId: string;
  occurredAt: string;
  oppref?: string | null;
  obref?: string | null;
  internalQa?: boolean;
}

export type OpenAIConversionOutcome = DominionDeliveryOutcome & {
  measurementMode: "production" | "validation" | "qa" | "disabled";
};

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
): Promise<OpenAIConversionOutcome> {
  if (input.internalQa === true) {
    return { status: "skipped", referenceId: "internal_qa", measurementMode: "qa" };
  }
  const pixelId = process.env.OPENAI_ADS_PIXEL_ID?.trim() ||
    process.env.NEXT_PUBLIC_OPENAI_ADS_PIXEL_ID?.trim();
  const apiKey = process.env.OPENAI_ADS_CONVERSIONS_API_KEY?.trim();
  if (!pixelId || !apiKey) return { status: "skipped", referenceId: "not_configured", measurementMode: "disabled" };
  const validateOnly = process.env.OPENAI_ADS_CONVERSIONS_VALIDATE_ONLY === "true";
  const measurementMode = validateOnly ? "validation" : "production";

  let response: Response;
  try {
    response = await fetch(`https://bzr.openai.com/v1/events?pid=${encodeURIComponent(pixelId)}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        validate_only: validateOnly,
        integration_source: "dominion_homes",
        events: [buildOpenAILeadCreatedEvent(input)],
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(4_000),
    });
  } catch {
    // A transport timeout may occur after provider receipt. Do not blindly replay.
    return { status: "outcome_unknown", referenceId: `${measurementMode}_transport_unknown`, measurementMode };
  }

  if (!response.ok) {
    return { status: "failed", referenceId: `${measurementMode}_http_${response.status}`, measurementMode };
  }

  // HTTP acceptance is not attributed conversion or provider processing proof.
  return { status: "provider_accepted", referenceId: `${measurementMode}_http_accepted`, measurementMode };
}
