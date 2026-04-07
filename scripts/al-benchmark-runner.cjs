#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const BENCHMARK_SET_PATH = path.join(ROOT, "benchmarks", "al-benchmark-set.json");
const REGISTRY_PATH = path.join(ROOT, "benchmarks", "al-benchmark-registry.json");
const DEFAULT_RESULTS_DIR = path.join(
  "C:\\Users\\adamd\\Desktop\\al-boreland-vault",
  "05-Health-Checks",
  "benchmarks",
);
const DEFAULT_API_URL =
  process.env.AL_BENCHMARK_API_URL || "http://127.0.0.1:3000/api/al/chat";
const DEFAULT_COOKIE =
  process.env.AL_BENCHMARK_COOKIE || "al_session=al_authenticated_v1";
const DEFAULT_TIMEOUT_MS = Number(process.env.AL_BENCHMARK_TIMEOUT_MS || 120000);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function timestampForFile(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, "-");
}

function parseArgs(argv) {
  const [, , command = "run", ...rest] = argv;
  const options = {};
  for (let i = 0; i < rest.length; i += 1) {
    const token = rest[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = rest[i + 1];
    if (!next || next.startsWith("--")) {
      options[key] = true;
      continue;
    }
    options[key] = next;
    i += 1;
  }
  return { command, options };
}

function safeJsonParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function parseSse(raw) {
  const events = [];
  const lines = raw.split(/\r?\n/);
  for (const line of lines) {
    if (!line.startsWith("data: ")) continue;
    const payload = line.slice(6).trim();
    if (!payload || payload === "[DONE]") continue;
    const parsed = safeJsonParse(payload);
    if (parsed) events.push(parsed);
  }
  return events;
}

function collectText(events) {
  return events
    .map((event) => (typeof event.t === "string" ? event.t : ""))
    .filter(Boolean)
    .join("");
}

function firstVaultAction(events) {
  return events.find((event) => event && typeof event === "object" && event.vault_action);
}

function hasJobDispatchEvent(events) {
  return events.some(
    (event) =>
      event &&
      typeof event === "object" &&
      "job_dispatched" in event &&
      event.job_dispatched,
  );
}

function collectAccountabilityJobIds(vaultActionEvent) {
  const requests = vaultActionEvent?.vault_action?.requests;
  if (!Array.isArray(requests)) return [];
  return requests
    .map((request) =>
      typeof request?.accountabilityJobId === "number" ? request.accountabilityJobId : null,
    )
    .filter((value) => typeof value === "number");
}

function matcherPasses(matcher, parsed) {
  const text = parsed.searchText;
  const vaultActionRequests = parsed.vaultActionRequests;

  switch (matcher.type) {
    case "vault_action_request_name":
      return vaultActionRequests.some((request) => request?.name === matcher.value);
    case "event_job_dispatched":
      return parsed.jobDispatched === true;
    case "text_includes_all":
      return matcher.values.every((value) => text.includes(value));
    case "text_includes_any":
      return matcher.values.some((value) => text.includes(value));
    default:
      return false;
  }
}

function scoreCase(caseDef, parsed) {
  const haystack = parsed.searchText;
  const routeExpectation = caseDef.expectations?.route;
  const blockerExpectation = caseDef.expectations?.blocker;
  const approvalExpectation = caseDef.expectations?.approvalBoundary;
  const durableExpectation = caseDef.expectations?.durableRecord;

  const routeCorrectness = routeExpectation?.anyOf
    ? routeExpectation.anyOf.some((matcher) => matcherPasses(matcher, parsed))
    : true;

  const blockerPrecision = blockerExpectation?.allText
    ? blockerExpectation.allText.every((value) => haystack.includes(value))
    : true;

  const approvalBoundaryCorrectness =
    (approvalExpectation?.allText
      ? approvalExpectation.allText.every((value) => haystack.includes(value))
      : true) &&
    (approvalExpectation?.noneText
      ? approvalExpectation.noneText.every((value) => !haystack.includes(value))
      : true);

  const durableRecordSignal =
    durableExpectation?.requiresAccountabilityJobId
      ? parsed.accountabilityJobIds.length > 0
      : durableExpectation?.allowJobDispatchEvent
        ? parsed.accountabilityJobIds.length > 0 || parsed.jobDispatched
        : true;

  const taskSuccess =
    routeCorrectness &&
    blockerPrecision &&
    approvalBoundaryCorrectness &&
    durableRecordSignal;

  const metrics = {
    task_success: Number(taskSuccess),
    route_correctness: Number(routeCorrectness),
    blocker_precision: Number(blockerPrecision),
    approval_boundary_correctness: Number(approvalBoundaryCorrectness),
    durable_record_signal: Number(durableRecordSignal),
  };

  const failureClasses = [];
  if (!routeCorrectness) failureClasses.push("wrong_route");
  if (!blockerPrecision) failureClasses.push("vague_blocker");
  if (!approvalBoundaryCorrectness) failureClasses.push("approval_boundary_missed");
  if (!durableRecordSignal) failureClasses.push("missing_durable_record_signal");

  return {
    pass: taskSuccess,
    metrics,
    failureClasses,
  };
}

async function runCase(caseDef, apiUrl, cookie, timeoutMs) {
  const body = {
    message: caseDef.prompt,
    history: [],
    bridgeConnected: caseDef.request?.bridgeConnected ?? false,
    bridgeCapabilities: caseDef.request?.bridgeCapabilities || {},
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const raw = await response.text();
    const events = parseSse(raw);
    const vaultActionEvent = firstVaultAction(events);
    const vaultActionRequests = Array.isArray(vaultActionEvent?.vault_action?.requests)
      ? vaultActionEvent.vault_action.requests
      : [];
    const parsed = {
      status: response.status,
      ok: response.ok,
      raw,
      events,
      text: collectText(events),
      vaultActionRequests,
      searchText: `${collectText(events)}\n${JSON.stringify(vaultActionRequests)}`,
      accountabilityJobIds: collectAccountabilityJobIds(vaultActionEvent),
      jobDispatched: hasJobDispatchEvent(events),
    };

    const scored = scoreCase(caseDef, parsed);

    return {
      id: caseDef.id,
      business: caseDef.business,
      category: caseDef.category,
      description: caseDef.description,
      prompt: caseDef.prompt,
      status: response.status,
      ok: response.ok,
      pass: scored.pass,
      metrics: scored.metrics,
      failure_classes: scored.failureClasses,
      text: parsed.text,
      vault_action_requests: vaultActionRequests,
      accountability_job_ids: parsed.accountabilityJobIds,
      job_dispatched: parsed.jobDispatched,
      raw_sse: raw,
    };
  } catch (error) {
    return {
      id: caseDef.id,
      business: caseDef.business,
      category: caseDef.category,
      description: caseDef.description,
      prompt: caseDef.prompt,
      status: 0,
      ok: false,
      pass: false,
      metrics: {
        task_success: 0,
        route_correctness: 0,
        blocker_precision: 0,
        approval_boundary_correctness: 0,
        durable_record_signal: 0,
      },
      failure_classes: ["runner_error"],
      text: error instanceof Error ? error.message : String(error),
      vault_action_requests: [],
      accountability_job_ids: [],
      job_dispatched: false,
      raw_sse: "",
    };
  } finally {
    clearTimeout(timeout);
  }
}

function aggregateResults(cases) {
  const totals = {
    task_success: 0,
    route_correctness: 0,
    blocker_precision: 0,
    approval_boundary_correctness: 0,
    durable_record_signal: 0,
  };
  const failureCounts = {};

  for (const result of cases) {
    for (const [metric, value] of Object.entries(result.metrics)) {
      totals[metric] += Number(value || 0);
    }
    for (const failure of result.failure_classes || []) {
      failureCounts[failure] = (failureCounts[failure] || 0) + 1;
    }
  }

  return {
    totals,
    case_count: cases.length,
    pass_count: cases.filter((result) => result.pass).length,
    failure_counts: failureCounts,
  };
}

function buildRunSummary(run) {
  const lines = [];
  lines.push(`# AL Benchmark Run`);
  lines.push("");
  lines.push(`- Variant: ${run.variant.label}`);
  lines.push(`- Config id: ${run.variant.id}`);
  lines.push(`- API: ${run.api_url}`);
  lines.push(`- Benchmark set: ${run.benchmark_set_version}`);
  lines.push(`- Run id: ${run.run_id}`);
  lines.push(`- Cases passed: ${run.aggregate.pass_count}/${run.aggregate.case_count}`);
  lines.push("");
  lines.push(`## Scorecard`);
  lines.push("");
  for (const [metric, value] of Object.entries(run.aggregate.totals)) {
    lines.push(`- ${metric}: ${value}/${run.aggregate.case_count}`);
  }
  lines.push("");
  lines.push(`## Cases`);
  lines.push("");
  for (const result of run.results) {
    lines.push(`- ${result.id}: ${result.pass ? "PASS" : "FAIL"} | route=${result.metrics.route_correctness} blocker=${result.metrics.blocker_precision} approval=${result.metrics.approval_boundary_correctness} durable=${result.metrics.durable_record_signal}`);
    if (result.failure_classes.length > 0) {
      lines.push(`  failures: ${result.failure_classes.join(", ")}`);
    }
  }
  lines.push("");
  lines.push(`## Failure Counts`);
  lines.push("");
  const failureEntries = Object.entries(run.aggregate.failure_counts);
  if (failureEntries.length === 0) {
    lines.push(`- none`);
  } else {
    for (const [failure, count] of failureEntries) {
      lines.push(`- ${failure}: ${count}`);
    }
  }
  return `${lines.join("\n")}\n`;
}

function compareRuns(champion, challenger, registry) {
  const criticalMetrics = registry.promotion.critical_metrics || [];
  const caseMap = new Map(champion.results.map((result) => [result.id, result]));
  const regressions = [];
  const improvements = [];

  for (const challengerCase of challenger.results) {
    const championCase = caseMap.get(challengerCase.id);
    if (!championCase) continue;
    if (championCase.pass && !challengerCase.pass) {
      regressions.push(`${challengerCase.id}: pass -> fail`);
    } else if (!championCase.pass && challengerCase.pass) {
      improvements.push(`${challengerCase.id}: fail -> pass`);
    }
  }

  const metricDeltas = {};
  for (const metric of Object.keys(challenger.aggregate.totals)) {
    metricDeltas[metric] =
      Number(challenger.aggregate.totals[metric] || 0) -
      Number(champion.aggregate.totals[metric] || 0);
  }

  const criticalRegression = criticalMetrics.some(
    (metric) => Number(metricDeltas[metric] || 0) < 0,
  ) || regressions.length > 0;
  const totalDelta =
    Number(challenger.aggregate.totals.task_success || 0) -
    Number(champion.aggregate.totals.task_success || 0);
  const promote =
    !criticalRegression &&
    totalDelta >= Number(registry.promotion.minimum_score_delta || 1);

  return {
    champion: {
      id: champion.variant.id,
      label: champion.variant.label,
      run_id: champion.run_id,
    },
    challenger: {
      id: challenger.variant.id,
      label: challenger.variant.label,
      run_id: challenger.run_id,
    },
    metric_deltas: metricDeltas,
    improvements,
    regressions,
    promote,
    recommendation: promote
      ? "Promote challenger: score improved without critical regressions."
      : criticalRegression
        ? "Reject challenger: critical regression detected."
        : "Hold challenger: improvement is not yet meaningful.",
  };
}

function buildCompareSummary(compare) {
  const lines = [];
  lines.push(`# AL Benchmark Comparison`);
  lines.push("");
  lines.push(`- Champion: ${compare.champion.label} (${compare.champion.run_id})`);
  lines.push(`- Challenger: ${compare.challenger.label} (${compare.challenger.run_id})`);
  lines.push(`- Recommendation: ${compare.recommendation}`);
  lines.push("");
  lines.push(`## Metric Deltas`);
  lines.push("");
  for (const [metric, delta] of Object.entries(compare.metric_deltas)) {
    const prefix = delta > 0 ? "+" : "";
    lines.push(`- ${metric}: ${prefix}${delta}`);
  }
  lines.push("");
  lines.push(`## Improvements`);
  lines.push("");
  if (compare.improvements.length === 0) {
    lines.push(`- none`);
  } else {
    for (const item of compare.improvements) lines.push(`- ${item}`);
  }
  lines.push("");
  lines.push(`## Regressions`);
  lines.push("");
  if (compare.regressions.length === 0) {
    lines.push(`- none`);
  } else {
    for (const item of compare.regressions) lines.push(`- ${item}`);
  }
  return `${lines.join("\n")}\n`;
}

async function runBenchmarkSuite(options) {
  const benchmarkSet = readJson(BENCHMARK_SET_PATH);
  const registry = readJson(REGISTRY_PATH);
  const variantId = options.variant || "champion";
  const variant = registry[variantId] || { id: variantId, label: variantId };
  const apiUrl = options.apiUrl || DEFAULT_API_URL;
  const cookie = options.cookie || DEFAULT_COOKIE;
  const timeoutMs = Number(options.timeoutMs || DEFAULT_TIMEOUT_MS);
  const resultsDir = options.resultsDir || DEFAULT_RESULTS_DIR;

  ensureDir(resultsDir);
  const runId = `${timestampForFile()}-${variant.label}`;
  const results = [];

  for (const caseDef of benchmarkSet.cases) {
    // eslint-disable-next-line no-await-in-loop
    results.push(await runCase(caseDef, apiUrl, cookie, timeoutMs));
  }

  const run = {
    run_id: runId,
    benchmark_set_version: benchmarkSet.version,
    variant,
    api_url: apiUrl,
    created_at: new Date().toISOString(),
    aggregate: aggregateResults(results),
    results,
  };

  const jsonPath = path.join(resultsDir, `${runId}.json`);
  const mdPath = path.join(resultsDir, `${runId}.md`);
  fs.writeFileSync(jsonPath, JSON.stringify(run, null, 2));
  fs.writeFileSync(mdPath, buildRunSummary(run));

  console.log(JSON.stringify({ ok: true, run_id: runId, json: jsonPath, markdown: mdPath }, null, 2));
}

function runCompare(options) {
  const registry = readJson(REGISTRY_PATH);
  const championPath = options.champion;
  const challengerPath = options.challenger;
  if (!championPath || !challengerPath) {
    throw new Error("compare requires --champion <file> and --challenger <file>");
  }

  const champion = readJson(championPath);
  const challenger = readJson(challengerPath);
  const compare = compareRuns(champion, challenger, registry);
  const resultsDir = options.resultsDir || DEFAULT_RESULTS_DIR;
  ensureDir(resultsDir);
  const compareId = `${timestampForFile()}-compare-${champion.variant.id}-vs-${challenger.variant.id}`;
  const jsonPath = path.join(resultsDir, `${compareId}.json`);
  const mdPath = path.join(resultsDir, `${compareId}.md`);
  fs.writeFileSync(jsonPath, JSON.stringify(compare, null, 2));
  fs.writeFileSync(mdPath, buildCompareSummary(compare));
  console.log(JSON.stringify({ ok: true, json: jsonPath, markdown: mdPath, compare }, null, 2));
}

async function main() {
  const { command, options } = parseArgs(process.argv);
  if (command === "run") {
    await runBenchmarkSuite({
      variant: options.variant,
      apiUrl: options.apiUrl,
      cookie: options.cookie,
      timeoutMs: options.timeoutMs,
      resultsDir: options.resultsDir,
    });
    return;
  }

  if (command === "compare") {
    runCompare({
      champion: options.champion,
      challenger: options.challenger,
      resultsDir: options.resultsDir,
    });
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
