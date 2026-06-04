#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ACTIVE_GOOGLE_ADS_ID = "AW-18000301728";
const LEAD_FORM_LABEL = "LJHYCOnlx4QcEKCdm4dD";
const CALL_LABEL = "10-DCJvTz4UcEKCdm4dD";
const OLD_GOOGLE_ADS_IDS = ["AW-17989282213", "AW-18000167888"];

function readText(root, relativePath) {
  try {
    return fs.readFileSync(path.join(root, relativePath), "utf8");
  } catch {
    return "";
  }
}

function check(name, ok, detail) {
  return { name, ok, detail };
}

function parseArgs(argv) {
  const args = {
    format: "markdown",
    output: "",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--json") {
      args.format = "json";
      continue;
    }
    if (arg === "--markdown") {
      args.format = "markdown";
      continue;
    }
    if (arg.startsWith("--") && index + 1 < argv.length) {
      const key = arg.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      args[key] = argv[index + 1];
      index += 1;
    }
  }

  return args;
}

function buildSnapshot(root) {
  const tracking = readText(root, "src/lib/tracking.ts");
  const analytics = readText(root, "src/app/analytics.tsx");
  const thankYou = readText(root, "src/app/sell/thank-you/page.tsx");
  const leadsRoute = readText(root, "src/app/api/leads/route.ts");
  const envExample = readText(root, ".env.example");
  const lazarusDoc = readText(root, "docs/lazarus-intake-forwarding.md");
  const inspectedPublicTrackingText = [tracking, analytics, thankYou].join("\n");
  const oldAdsMatches = OLD_GOOGLE_ADS_IDS.filter((id) => inspectedPublicTrackingText.includes(id));

  const checks = [
    check(
      "active_google_ads_id",
      tracking.includes(ACTIVE_GOOGLE_ADS_ID) && analytics.includes("GOOGLE_ADS_CONVERSION_ID"),
      `Expected active Ads ID ${ACTIVE_GOOGLE_ADS_ID} in tracking constants and analytics config.`,
    ),
    check(
      "lead_form_conversion_label",
      tracking.includes(LEAD_FORM_LABEL) && thankYou.includes("GOOGLE_ADS_LEAD_FORM_LABEL"),
      `Expected lead form conversion label ${LEAD_FORM_LABEL} to flow through thank-you conversion code.`,
    ),
    check(
      "call_conversion_label",
      tracking.includes(CALL_LABEL) && analytics.includes("GOOGLE_ADS_CALL_LABEL"),
      `Expected call conversion label ${CALL_LABEL} to flow through click conversion code.`,
    ),
    check(
      "old_ads_ids_absent_from_active_tracking",
      oldAdsMatches.length === 0,
      oldAdsMatches.length
        ? `Old Ads IDs still found in active tracking files: ${oldAdsMatches.join(", ")}.`
        : "No old Ads IDs found in active tracking files.",
    ),
    check(
      "lazarus_forwarder_present",
      leadsRoute.includes("forwardToLazarus") &&
        leadsRoute.includes("LAZARUS_INTAKE_URL") &&
        leadsRoute.includes("LAZARUS_INTAKE_CREATE_LEAD_KEY"),
      "Lead route contains env-gated Lazarus create-only forwarding function.",
    ),
    check(
      "lazarus_forwarder_create_only_shape",
      leadsRoute.includes("'x-lazarus-intake-key'") &&
        leadsRoute.includes("Dominion website seller form") &&
        leadsRoute.includes("withTimeout(forwardToLazarus(lead), 1500"),
      "Forwarder uses the narrow intake key, source label, and a short timeout so website response is not blocked.",
    ),
    check(
      "lazarus_env_documented",
      envExample.includes("LAZARUS_INTAKE_URL") &&
        envExample.includes("LAZARUS_INTAKE_CREATE_LEAD_KEY") &&
        lazarusDoc.includes("Lazarus Intake Forwarding"),
      "Env example and docs describe Lazarus intake activation.",
    ),
  ];

  return {
    generatedAt: new Date().toISOString(),
    inspectedFiles: [
      "src/lib/tracking.ts",
      "src/app/analytics.tsx",
      "src/app/sell/thank-you/page.tsx",
      "src/app/api/leads/route.ts",
      ".env.example",
      "docs/lazarus-intake-forwarding.md",
    ],
    summary: {
      ok: checks.every((item) => item.ok),
      checksPassed: checks.filter((item) => item.ok).length,
      checksTotal: checks.length,
    },
    checks,
    nextSafestAction:
      "Review the draft PR, then activate Lazarus env and run one approved live form test only after Adam approves production lead-routing activation.",
    externalActionRule:
      "This proof is read-only. It does not submit forms, call Lazarus, change tracking, deploy, update production env, or change phone/10DLC.",
  };
}

function formatMarkdown(snapshot) {
  return [
    "# Dominion Routing Proof",
    "",
    `Generated: ${snapshot.generatedAt}`,
    "",
    "## Summary",
    "",
    `- checks: ${snapshot.summary.checksPassed}/${snapshot.summary.checksTotal}`,
    `- overall: ${snapshot.summary.ok ? "ready-for-review" : "needs-review"}`,
    "",
    "## Checks",
    "",
    ...snapshot.checks.map((item) => `- ${item.ok ? "OK" : "CHECK"} ${item.name}: ${item.detail}`),
    "",
    "## Inspected Files",
    "",
    ...snapshot.inspectedFiles.map((file) => `- ${file}`),
    "",
    "## Next Safest Action",
    "",
    snapshot.nextSafestAction,
    "",
    snapshot.externalActionRule,
    "",
  ].join("\n");
}

const args = parseArgs(process.argv.slice(2));
const snapshot = buildSnapshot(process.cwd());
const output = args.format === "json" ? `${JSON.stringify(snapshot, null, 2)}\n` : formatMarkdown(snapshot);

if (args.output) {
  fs.writeFileSync(args.output, output, "utf8");
} else {
  process.stdout.write(output);
}
