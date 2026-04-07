#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("node:fs");
const path = require("node:path");

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

async function main() {
  const root = path.resolve(__dirname, "..");
  const envPath = path.join(root, ".env.local");
  const env = loadEnvFile(envPath);

  const supabaseUrl = (env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const serviceKey = (env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  const delegateSecret = (env.AL_DELEGATE_SECRET || "").trim();
  const token = delegateSecret || serviceKey;

  if (!supabaseUrl || !token) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL and AL_DELEGATE_SECRET/SUPABASE_SERVICE_ROLE_KEY in .env.local.",
    );
  }

  const url = `${supabaseUrl.replace(/\/$/, "")}/functions/v1/al-delegate`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({}),
  });
  const body = await response.text().catch(() => "");

  const result = {
    function_url: url,
    used_token_source: delegateSecret ? "AL_DELEGATE_SECRET" : "SUPABASE_SERVICE_ROLE_KEY",
    status: response.status,
    auth_ok: response.status === 400,
    expected_when_auth_ok: 400,
    body_preview: body.slice(0, 240),
  };

  console.log(JSON.stringify(result, null, 2));

  if (!result.auth_ok) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
