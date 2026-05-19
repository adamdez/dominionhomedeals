import { createHash } from "crypto";

type MailchimpMergeFields = Record<string, string | number | boolean | null | undefined>;

export interface MailchimpContactInput {
  email: string;
  statusIfNew?: "subscribed" | "pending" | "transactional";
  mergeFields?: MailchimpMergeFields;
  tags?: string[];
}

export interface MailchimpSyncResult {
  skipped: boolean;
  email?: string;
  listId?: string;
  reason?: string;
}

function getMailchimpConfig() {
  const apiKey = process.env.MAILCHIMP_API_KEY?.trim();
  const serverPrefix = process.env.MAILCHIMP_SERVER_PREFIX?.trim() || apiKey?.split("-").pop();
  const defaultListId = process.env.MAILCHIMP_AUDIENCE_ID?.trim();
  const sellerListId = process.env.MAILCHIMP_SELLER_AUDIENCE_ID?.trim() || defaultListId;
  const buyerListId = process.env.MAILCHIMP_BUYER_AUDIENCE_ID?.trim() || defaultListId;

  if (!apiKey || !serverPrefix) {
    return null;
  }

  return {
    apiKey,
    serverPrefix,
    defaultListId,
    sellerListId,
    buyerListId,
  };
}

function subscriberHash(email: string): string {
  return createHash("md5").update(email.trim().toLowerCase()).digest("hex");
}

function normalizeMergeFields(fields: MailchimpMergeFields | undefined): Record<string, string> {
  return Object.entries(fields || {}).reduce<Record<string, string>>((acc, [key, value]) => {
    if (value === null || value === undefined || value === "") return acc;
    acc[key.toUpperCase().slice(0, 10)] = String(value).slice(0, 255);
    return acc;
  }, {});
}

function normalizeTags(tags: string[] | undefined): string[] {
  return Array.from(
    new Set(
      (tags || [])
        .map((tag) => tag.trim())
        .filter(Boolean)
        .map((tag) => tag.slice(0, 100)),
    ),
  );
}

function mergeValue(value: unknown): string {
  return value === null || value === undefined ? "" : String(value);
}

async function upsertContact(
  listId: string | undefined,
  input: MailchimpContactInput,
): Promise<MailchimpSyncResult> {
  const config = getMailchimpConfig();
  const email = input.email.trim().toLowerCase();

  if (!config) {
    return { skipped: true, email, reason: "Mailchimp is not configured." };
  }

  if (!listId) {
    return { skipped: true, email, reason: "No Mailchimp audience id is configured." };
  }

  const response = await fetch(
    `https://${config.serverPrefix}.api.mailchimp.com/3.0/lists/${listId}/members/${subscriberHash(email)}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Basic ${Buffer.from(`anystring:${config.apiKey}`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email_address: email,
        status_if_new: input.statusIfNew || "subscribed",
        merge_fields: normalizeMergeFields(input.mergeFields),
        tags: normalizeTags(input.tags),
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Mailchimp sync failed (${response.status}): ${errorText}`);
  }

  return { skipped: false, email, listId };
}

export async function syncSellerLeadToMailchimp(lead: Record<string, unknown>): Promise<MailchimpSyncResult> {
  const config = getMailchimpConfig();
  const email = String(lead.email || "").trim().toLowerCase();

  if (!email) {
    return { skipped: true, reason: "No email provided for seller lead." };
  }

  try {
    return await upsertContact(config?.sellerListId, {
      email,
      mergeFields: {
        FNAME: mergeValue(lead.firstName),
        LNAME: mergeValue(lead.lastName),
      },
      tags: [
        "website-lead",
        "seller-lead",
        String(lead.timeline || ""),
        String(lead.source || ""),
        String(lead.utmCampaign || ""),
      ],
    });
  } catch (error) {
    console.error("[MAILCHIMP] Seller lead sync failed:", error);
    throw error;
  }
}

export async function syncBuyerInvestorLeadToMailchimp(lead: Record<string, unknown>): Promise<MailchimpSyncResult> {
  const config = getMailchimpConfig();

  try {
    return await upsertContact(config?.buyerListId, {
      email: String(lead.email || ""),
      mergeFields: {
        FNAME: String(lead.fullName || "").split(" ")[0],
        LNAME: String(lead.fullName || "").split(" ").slice(1).join(" "),
      },
      tags: [
        "website-lead",
        "buyer-investor",
        String(lead.interestType || ""),
        ...(Array.isArray(lead.buyerStrategies) ? lead.buyerStrategies : []),
        ...(Array.isArray(lead.opportunityInterests) ? lead.opportunityInterests : []),
        String(lead.source || ""),
      ],
    });
  } catch (error) {
    console.error("[MAILCHIMP] Buyer/investor lead sync failed:", error);
    throw error;
  }
}

export async function getMailchimpStatus() {
  const config = getMailchimpConfig();

  if (!config) {
    return {
      configured: false,
      reason: "MAILCHIMP_API_KEY and MAILCHIMP_SERVER_PREFIX are required.",
    };
  }

  return {
    configured: true,
    serverPrefix: config.serverPrefix,
    hasDefaultAudience: Boolean(config.defaultListId),
    hasSellerAudience: Boolean(config.sellerListId),
    hasBuyerAudience: Boolean(config.buyerListId),
  };
}
