import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let dominionClient: SupabaseClient | null = null;

/**
 * Dominion-only operational storage.
 *
 * Never fall back to the site's legacy/general Supabase variables: those point
 * at a non-Dominion project in the current deployment.
 */
export function getDominionServiceClient(): SupabaseClient | null {
  const url = process.env.DOMINION_SUPABASE_URL?.trim();
  const key = process.env.DOMINION_SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;

  if (!dominionClient) {
    dominionClient = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  return dominionClient;
}
