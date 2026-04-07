#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("node:fs");
const path = require("node:path");
const { createClient } = require("@supabase/supabase-js");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing env file: ${filePath}`);
  }

  const env = {};
  const raw = fs.readFileSync(filePath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1).trim();
    }
    env[key] = value;
  }
  return env;
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const root = path.resolve(__dirname, "..");
  const envPath = path.join(root, ".env.local");
  const env = loadEnvFile(envPath);

  const supabaseUrl = (env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const serviceKey = (env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  const delegateSecret = (env.AL_DELEGATE_SECRET || "").trim();
  const token = delegateSecret || serviceKey;

  if (!supabaseUrl || !serviceKey || !token) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or AL_DELEGATE_SECRET in .env.local.",
    );
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const createdAt = new Date().toISOString();
  const smokeTask = `SMOKE TEST: delegate_to_ceo auth + dispatch validation @ ${createdAt}`;
  const dispatchMetadata = {
    review_required: true,
    business_id: "wrenchready",
    owner: "WrenchReady CEO",
    change_under_review: "delegate_to_ceo smoke dispatch validation",
    intended_business_outcome: "Confirm delegation lane can execute authenticated CEO tasks.",
    primary_metric: "delegate_success_rate",
    expected_direction: "increase",
    minimum_meaningful_delta: 1,
    source_type: "tool_call",
    source_tool: "delegate_to_ceo_smoke",
    runtime_ref_hint: `smoke:${createdAt}`,
  };

  const { data: insertedJob, error: insertError } = await supabase
    .from("al_jobs")
    .insert({
      job_type: "delegate_to_ceo",
      ceo_id: "wrenchready",
      ceo_name: "WrenchReady Mobile CEO",
      task: smokeTask,
      context: JSON.stringify({
        smoke_test: true,
        dispatch_metadata: dispatchMetadata,
      }),
      status: "pending",
      triggered_by: "ops_smoke_test",
    })
    .select("id")
    .single();

  if (insertError || !insertedJob) {
    throw new Error(`Failed to create smoke job row: ${insertError?.message || "unknown error"}`);
  }

  const functionUrl = `${supabaseUrl.replace(/\/$/, "")}/functions/v1/al-delegate`;
  const response = await fetch(functionUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      job_id: insertedJob.id,
      ceo_id: "wrenchready",
      task: smokeTask,
      context: JSON.stringify({
        smoke_test: true,
        dispatch_metadata: dispatchMetadata,
      }),
    }),
  });

  const responseText = await response.text().catch(() => "");
  let parsed = null;
  try {
    parsed = responseText ? JSON.parse(responseText) : null;
  } catch {
    parsed = null;
  }

  if (!response.ok) {
    console.log(
      JSON.stringify(
        {
          success: false,
          step: "edge_function_dispatch",
          status: response.status,
          body_preview: responseText.slice(0, 300),
          smoke_job_id: insertedJob.id,
        },
        null,
        2,
      ),
    );
    process.exitCode = 1;
    return;
  }

  await sleep(3000);

  const { data: finalJob, error: finalError } = await supabase
    .from("al_jobs")
    .select("id, status, error_msg, completed_at")
    .eq("id", insertedJob.id)
    .single();

  if (finalError || !finalJob) {
    throw new Error(`Failed to fetch smoke job final state: ${finalError?.message || "unknown error"}`);
  }

  const success = finalJob.status === "done" || finalJob.status === "running";
  console.log(
    JSON.stringify(
      {
        success,
        smoke_job_id: insertedJob.id,
        dispatch_status: response.status,
        dispatch_payload: parsed,
        final_status: finalJob.status,
        final_error: finalJob.error_msg || null,
        final_completed_at: finalJob.completed_at || null,
      },
      null,
      2,
    ),
  );

  if (!success) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
