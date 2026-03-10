import { createClient } from '@supabase/supabase-js'

/**
 * Server-side Supabase client for lead persistence.
 *
 * Uses service role key (server only — never exposed to browser).
 * Both env vars are required; if either is missing, getSupabaseAdmin()
 * returns null and the caller should log and continue without persistence.
 */

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

export function getSupabaseAdmin() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return null
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
