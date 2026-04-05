import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET() {
  const results: Record<string, { ok: boolean; detail: string }> = {};

  // 1. Supabase — al_memories
  try {
    const sb = getServiceClient();
    if (!sb) throw new Error("No service client (missing env vars)");
    const { count, error } = await sb.from("al_memories").select("*", { count: "exact", head: true });
    if (error) throw new Error(error.message);
    results.supabase_memories = { ok: true, detail: `${count} memories` };
  } catch (e) {
    results.supabase_memories = { ok: false, detail: String(e) };
  }

  // 2. Supabase — vault_documents
  try {
    const sb = getServiceClient();
    if (!sb) throw new Error("No service client");
    const { count, error } = await sb.from("vault_documents").select("*", { count: "exact", head: true });
    if (error) throw new Error(error.message);
    results.supabase_vault = { ok: true, detail: `${count} vault docs` };
  } catch (e) {
    results.supabase_vault = { ok: false, detail: String(e) };
  }

  // 3. Bridge — localhost:3141 (local machine only — always "skipped" from Vercel)
  results.bridge = { ok: true, detail: "Check locally: curl http://127.0.0.1:3141/health" };

  // 4. n8n webhook reachable
  try {
    const url = process.env.N8N_WEBHOOK_URL;
    if (!url) throw new Error("N8N_WEBHOOK_URL not set");
    // HEAD check — n8n returns 404 on HEAD but that confirms it's reachable
    const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(5000) });
    results.n8n = { ok: res.status < 500, detail: `HTTP ${res.status}` };
  } catch (e) {
    results.n8n = { ok: false, detail: String(e) };
  }

  const allOk = Object.values(results).every((r) => r.ok);

  return NextResponse.json({ ok: allOk, checks: results }, { status: allOk ? 200 : 207 });
}
