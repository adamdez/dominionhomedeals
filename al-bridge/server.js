// Al Boreland Local Bridge — Secure Obsidian vault access
// Zero dependencies, pure Node.js

const http = require("http");
const fs = require("fs").promises;
const fsSync = require("fs");
const path = require("path");
const { URL } = require("url");
const { spawn } = require("child_process");
const crypto = require("crypto");
const {
  resolveBrowserVendorReviewFile,
  resolveBrowserVendorReviewJobDir,
  readBrowserVendorReviewManifest,
  inspectBrowserVendorCartReviewStack,
  resumeBrowserVendorCartReview,
  runBrowserVendorCartReview,
} = require("./browser-vendor-cart-review");
const {
  inspectBrandMediaStack,
  runBrandMediaProduction,
  resolveBrandMediaJobDir,
  resolveBrandMediaArtifact,
} = require("./media-brand-assets");

/* ── Load .env ──────────────────────────────────────────────── */
const envFile = path.join(__dirname, ".env");
if (fsSync.existsSync(envFile)) {
  for (const line of fsSync.readFileSync(envFile, "utf-8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 1) continue;
    const k = t.slice(0, eq).trim();
    const v = t.slice(eq + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  }
}

/* ── Config ─────────────────────────────────────────────────── */
const PORT = parseInt(process.env.BRIDGE_PORT || "3141", 10);
const VAULT = (process.env.VAULT_PATH || "").replace(/[\\/]+$/, "");
const TOKEN = (process.env.BRIDGE_TOKEN || "").trim();
const REMOTE_BRIDGE_API_BASE = (process.env.REMOTE_BRIDGE_API_BASE || "https://al.dominionhomedeals.com").trim().replace(/\/+$/, "");
const REMOTE_BRIDGE_SECRET =
  (process.env.AL_REMOTE_BRIDGE_SECRET || process.env.REMOTE_BRIDGE_SHARED_SECRET || "").trim();
const ENABLE_REMOTE_BRIDGE_RELAY =
  String(process.env.ENABLE_REMOTE_BRIDGE_RELAY || "").trim().toLowerCase() === "true";
const REMOTE_BRIDGE_CLIENT_ID =
  (process.env.REMOTE_BRIDGE_CLIENT_ID || `${require("os").hostname()}-desktop-bridge`).trim();

const homeDir = process.env.USERPROFILE || process.env.HOME || "";
const CREW_ROOT_DEFAULT = homeDir
  ? path.join(homeDir, "Desktop", "al boreland-crew")
  : "";
const CREW_ROOT_ENV = (process.env.CREW_PROJECT_ROOT || "").trim().replace(/^["']|["']$/g, "");
const CREW_ROOT = CREW_ROOT_ENV ? path.resolve(CREW_ROOT_ENV) : CREW_ROOT_DEFAULT;

const MAX_CONCURRENT_CREWS = 2;
const CREW_TIMEOUT_MS = 15 * 60 * 1000;
const MAX_CREW_OUTPUT = 500 * 1024;
const CODEX_TIMEOUT_MS = 12 * 60 * 1000;
const COWORK_HEALTH_PROBE_TTL_MS = 10 * 60 * 1000;

/** Maps *_crew.py filename → argv for `python main.py <argv>` */
const CREW_FILE_TO_CMD = {
  "tax_scout_crew.py": "tax-scout",
  "wrenchready_audit_crew.py": "wrenchready",
};

function crewProjectOk() {
  if (!CREW_ROOT || !fsSync.existsSync(CREW_ROOT)) return false;
  return fsSync.existsSync(path.join(CREW_ROOT, "main.py"));
}

function discoverCrewFiles() {
  const dir = path.join(CREW_ROOT, "crews");
  if (!fsSync.existsSync(dir)) return [];
  return fsSync
    .readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith("_crew.py"));
}

function fileToCrewId(file) {
  if (CREW_FILE_TO_CMD[file]) return CREW_FILE_TO_CMD[file];
  const base = file.replace(/_crew\.py$/i, "");
  return base.replace(/_/g, "-");
}

const crewRuns = new Map();
let coworkHealthCache = {
  checkedAt: 0,
  ok: null,
  status: "unchecked",
  detail: "Cowork execute lane has not been probed yet.",
};

const ORIGINS = new Set([
  "https://dominionhomedeals.com",
  "https://www.dominionhomedeals.com",
  "https://al.dominionhomedeals.com",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
]);

const TEXT_EXT = new Set([
  ".md", ".txt", ".json", ".canvas", ".yaml", ".yml", ".css", ".csv",
]);

const IMAGE_EXT = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp",
]);

const PDF_EXT = new Set([".pdf"]);

const SAFE_EXT = new Set([...TEXT_EXT, ...IMAGE_EXT]);

const IMAGE_MIME = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB for images

const MAX_SIZE = 1024 * 1024; // 1 MB

/* ── Path safety ────────────────────────────────────────────── */
function resolveSafe(rel) {
  if (!rel || typeof rel !== "string") return null;
  const norm = path.normalize(rel).replace(/\\/g, "/");
  if (norm.startsWith("..") || path.isAbsolute(norm)) return null;
  const full = path.resolve(VAULT, norm);
  if (!full.startsWith(path.resolve(VAULT))) return null;
  return full;
}

function hasSafeExt(p) {
  return SAFE_EXT.has(path.extname(p).toLowerCase());
}

function isWithinRoot(full, root) {
  const rel = path.relative(root, full);
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

function resolveBridgePath(input, { mustExist = true } = {}) {
  if (!input || typeof input !== "string") return null;
  const raw = input.trim().replace(/^["']|["']$/g, "");
  if (!raw) return null;

  const root = path.resolve(VAULT);
  const full = path.isAbsolute(raw) ? path.resolve(raw) : path.resolve(root, raw);
  if (!isWithinRoot(full, root)) return null;
  if (mustExist && !fsSync.existsSync(full)) return null;
  return full;
}

function pythonCommand() {
  return process.platform === "win32"
    ? { cmd: "python", baseArgs: [] }
    : { cmd: "python3", baseArgs: [] };
}

function trimRouteNoise(value) {
  let decoded = String(value || "");
  try {
    decoded = decodeURIComponent(decoded);
  } catch {}
  return decoded.replace(/[`'"\\)\]\s]+$/g, "");
}

function inputString(value) {
  return typeof value === "string" ? value : "";
}

function getCodexCandidates() {
  const candidates = [];
  if (process.env.CODEX_CLI_PATH?.trim()) {
    candidates.push(process.env.CODEX_CLI_PATH.trim().replace(/^["']|["']$/g, ""));
  }
  if (homeDir) {
    candidates.push(path.join(homeDir, "AppData", "Local", "Programs", "1Code", "resources", "bin", "codex.exe"));
    candidates.push(path.join(homeDir, "AppData", "Roaming", "npm", "codex.cmd"));
    candidates.push(path.join(
      homeDir,
      "AppData",
      "Local",
      "Microsoft",
      "WindowsApps",
      "OpenAI.Codex_26.325.3894.0_x64__2p2nqsd0c76g0",
      "app",
      "resources",
      "codex.exe",
    ));
  }
  return candidates.filter(Boolean);
}

function resolveCodexBinary() {
  for (const candidate of getCodexCandidates()) {
    if (fsSync.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

function inspectCodexStack() {
  const binary = resolveCodexBinary();
  const authPath = homeDir ? path.join(homeDir, ".codex", "auth.json") : null;
  const configPath = homeDir ? path.join(homeDir, ".codex", "config.toml") : null;
  return {
    available: Boolean(binary),
    details: {
      binary_path: binary,
      auth_configured: Boolean(authPath && fsSync.existsSync(authPath)),
      config_present: Boolean(configPath && fsSync.existsSync(configPath)),
    },
  };
}

function codexWorkspaceMap() {
  const root = path.resolve(VAULT);
  return {
    "al-boreland-vault": path.join(root, "al-boreland-vault"),
    al: path.join(root, "al"),
    dominionhomedeals: path.join(root, "dominionhomedeals"),
    sentinel: path.join(root, "Sentinel"),
    "wrenchreadymobile-com": path.join(root, "Simon", "wrenchreadymobile.com"),
  };
}

function resolveCodexWorkspace(name) {
  if (!name || typeof name !== "string") return null;
  const workspace = codexWorkspaceMap()[name.trim().toLowerCase()];
  if (!workspace || !fsSync.existsSync(workspace)) return null;
  return workspace;
}

/* ── HTTP helpers ───────────────────────────────────────────── */
function cors(origin) {
  const allowed = ORIGINS.has(origin);
  const headers = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin, Access-Control-Request-Private-Network",
  };
  if (allowed) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Private-Network"] = "true";
  }
  return headers;
}

function json(res, code, data, origin) {
  res.writeHead(code, { ...cors(origin), "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

function html(res, code, markup, origin) {
  res.writeHead(code, { ...cors(origin), "Content-Type": "text/html; charset=utf-8" });
  res.end(markup);
}

function readBody(req) {
  return new Promise((ok, fail) => {
    let d = "";
    req.on("data", (c) => {
      d += c;
      if (d.length > MAX_SIZE + 4096) fail(new Error("Body too large"));
    });
    req.on("end", () => ok(d));
    req.on("error", fail);
  });
}

function remoteRelayConfigured() {
  return ENABLE_REMOTE_BRIDGE_RELAY && Boolean(REMOTE_BRIDGE_API_BASE && REMOTE_BRIDGE_SECRET);
}

function bridgeAuthHeaders() {
  return TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {};
}

async function callLocalBridge(pathname, options = {}) {
  const response = await fetch(`http://127.0.0.1:${PORT}${pathname}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...bridgeAuthHeaders(),
    },
  });
  const data = await response.json().catch(() => null);
  return { response, data };
}

async function runRemoteBridgeRequest(request) {
  const input = request && typeof request.input === "object" && request.input
    ? request.input
    : {};
  switch (request.name) {
    case "vault_list": {
      const { response, data } = await callLocalBridge(
        `/list?path=${encodeURIComponent(inputString(input.path))}`,
      );
      if (!response.ok) return `Error: ${data?.error || response.status}`;
      return (data.entries || []).map((entry) => `[${entry.type}] ${entry.name}`).join("\n") || "Empty folder.";
    }
    case "vault_read": {
      const { response, data } = await callLocalBridge(
        `/read?path=${encodeURIComponent(inputString(input.path))}`,
      );
      return response.ok ? data.content : `Error: ${data?.error || response.status}`;
    }
    case "vault_read_image": {
      const { response, data } = await callLocalBridge(
        `/read-image?path=${encodeURIComponent(inputString(input.path))}`,
      );
      if (!response.ok) return `Error: ${data?.error || response.status}`;
      return {
        type: "image",
        base64: data.base64,
        mimeType: data.mimeType || "image/png",
        path: data.path || inputString(input.path),
      };
    }
    case "crew_list": {
      const { response, data } = await callLocalBridge("/crew/list");
      if (!response.ok) return `Error: ${data?.error || response.status}`;
      let out = "";
      if (data.error) out += `Setup: ${data.error}\n\n`;
      const crews = data.crews || [];
      out += crews.length ? crews.map((crew) => `- ${crew.id} (${crew.file})`).join("\n") : "No crews discovered.";
      const runs = data.activeRuns || [];
      if (runs.length) out += `\n\nActive runs:\n${runs.map((run) => `- ${run.crew} (${run.id})`).join("\n")}`;
      if (data.crewRoot) out += `\n\nProject: ${data.crewRoot}`;
      return out.trim();
    }
    case "crew_run": {
      const { response, data } = await callLocalBridge("/crew/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ crew: inputString(input.crew) }),
      });
      return response.ok ? JSON.stringify(data, null, 2) : `Error: ${data?.error || response.status}`;
    }
    case "crew_status": {
      const { response, data } = await callLocalBridge(
        `/crew/status?id=${encodeURIComponent(inputString(input.run_id))}`,
      );
      return response.ok ? JSON.stringify(data, null, 2) : `Error: ${data?.error || response.status}`;
    }
    case "deep_research": {
      const { response, data } = await callLocalBridge("/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: inputString(input.task) }),
      });
      return response.ok ? data.result || JSON.stringify(data) : `Error: ${data?.error || response.status}`;
    }
    case "cowork_task": {
      const { response, data } = await callLocalBridge("/cowork", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: inputString(input.task),
          domain: inputString(input.domain) || "dominionhomedeals",
          authority_zone: 1,
        }),
      });
      if (!response.ok) return `Error: ${data?.error || response.status}`;
      const elapsed = data.elapsed ? ` (${data.elapsed}s)` : "";
      const session = data.session_id ? ` · session ${data.session_id}` : "";
      return `✓ Done${elapsed}${session}\n\n${data.result || JSON.stringify(data)}`;
    }
    case "codex_task": {
      const { response, data } = await callLocalBridge("/codex/exec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input || {}),
      });
      return JSON.stringify(
        data || {
          ok: false,
          status: "codex_bridge_request_failed",
          operator_message: `Codex task failed with HTTP ${response.status}.`,
        },
      );
    }
    case "local_pdf_merge": {
      const { response, data } = await callLocalBridge("/pdf/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input || {}),
      });
      return JSON.stringify(
        data || {
          ok: false,
          status: "pdf_merge_bridge_request_failed",
          operator_message: `Local PDF merge failed with HTTP ${response.status}.`,
        },
      );
    }
    case "browser_vendor_cart_review": {
      const { response, data } = await callLocalBridge("/browser/vendor-cart-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input || {}),
      });
      return JSON.stringify(
        data || {
          ok: false,
          status: "bridge_request_failed",
          operator_message: `Vendor/design lane failed with HTTP ${response.status}.`,
        },
      );
    }
    case "media_production": {
      const { response, data } = await callLocalBridge("/media/brand-assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input || {}),
      });
      return JSON.stringify(
        data || {
          ok: false,
          status: "media_bridge_request_failed",
          operator_message: `Media production lane failed with HTTP ${response.status}.`,
        },
      );
    }
    default:
      return `Unknown bridge tool: ${request.name}`;
  }
}

let remoteRelayBusy = false;
let lastRemoteHeartbeatSentAt = 0;

async function buildBridgeStatusSnapshot() {
  const executor = await readExecutorHealth();
  const hasAsk = Boolean(executor.endpoints["POST /ask"]);
  const hasExecute = Boolean(executor.endpoints["POST /execute"]);
  const coworkProbe =
    executor.online && hasExecute
      ? await probeCoworkExecutionHealth()
      : {
          ok: false,
          status: "executor_unavailable",
          detail: "Executor is offline or missing POST /execute.",
        };
  const browserVendorStack = inspectBrowserVendorCartReviewStack();
  const brandMediaStack = inspectBrandMediaStack();
  const codexStack = inspectCodexStack();

  return {
    executor,
    coworkProbe,
    capabilities: {
      executor_online: executor.online,
      deep_research: executor.online && hasAsk,
      cowork_execution: executor.online && hasExecute && coworkProbe.ok === true,
      browser_automation: browserVendorStack.details.browser_automation,
      vendor_site_access: browserVendorStack.details.vendor_site_access,
      design_mockup: browserVendorStack.details.design_mockup,
      screenshot_capture: browserVendorStack.details.screenshot_capture,
      cart_preparation: browserVendorStack.details.cart_preparation,
      review_checkpoint: browserVendorStack.details.review_checkpoint,
      media_generation: brandMediaStack.live,
      media_runway: brandMediaStack.details.runway_api_key,
      media_gif_export: brandMediaStack.details.ffmpeg_available,
      local_pdf_merge: true,
      codex_execution: codexStack.available,
      remote_bridge_relay: remoteRelayConfigured(),
    },
    browserVendorCartReview: {
      live: browserVendorStack.live,
      missingAccess: browserVendorStack.missingAccess,
      details: browserVendorStack.details,
    },
    brandMediaProduction: {
      live: brandMediaStack.live,
      missingAccess: brandMediaStack.missingAccess,
      details: brandMediaStack.details,
    },
    codexTaskExecution: {
      live: codexStack.available,
      missingAccess: codexStack.available ? [] : ["local_codex_cli"],
      details: codexStack.details,
    },
    remoteBridgeRelay: {
      live: remoteRelayConfigured(),
      missingAccess: remoteRelayConfigured() ? [] : ["AL_REMOTE_BRIDGE_SECRET", "ENABLE_REMOTE_BRIDGE_RELAY"],
      details: {
        api_base: REMOTE_BRIDGE_API_BASE || null,
        client_id: REMOTE_BRIDGE_CLIENT_ID,
      },
    },
  };
}

async function maybeSendRemoteBridgeHeartbeat(force = false) {
  if (!remoteRelayConfigured()) return;
  const now = Date.now();
  if (!force && now - lastRemoteHeartbeatSentAt < 60000) return;

  const snapshot = await buildBridgeStatusSnapshot();
  const response = await fetch(`${REMOTE_BRIDGE_API_BASE}/api/al/remote-bridge/heartbeat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-al-remote-bridge-secret": REMOTE_BRIDGE_SECRET,
    },
    body: JSON.stringify({
      clientId: REMOTE_BRIDGE_CLIENT_ID,
      relayApiBase: REMOTE_BRIDGE_API_BASE,
      bridgeAuthRequired: Boolean(TOKEN),
      capabilities: snapshot.capabilities,
      coworkProbe: snapshot.coworkProbe,
    }),
  });

  if (response.ok) {
    lastRemoteHeartbeatSentAt = now;
  }
}

async function processRemoteBridgeRelayQueue() {
  if (!remoteRelayConfigured() || remoteRelayBusy) return;
  remoteRelayBusy = true;
  try {
    await maybeSendRemoteBridgeHeartbeat();
    const pollResponse = await fetch(`${REMOTE_BRIDGE_API_BASE}/api/al/remote-bridge/poll`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-al-remote-bridge-secret": REMOTE_BRIDGE_SECRET,
      },
      body: JSON.stringify({ clientId: REMOTE_BRIDGE_CLIENT_ID }),
    });

    const pollPayload = await pollResponse.json().catch(() => null);
    if (!pollResponse.ok || !pollPayload?.ok || !pollPayload.bundle) {
      return;
    }

    const bundle = pollPayload.bundle;
    const requests = Array.isArray(bundle.requests) ? bundle.requests : [];
    const results = [];
    let hasError = false;
    let errorMessage = null;

    for (const request of requests) {
      try {
        const result = await runRemoteBridgeRequest(request);
        results.push({ id: request.id, name: request.name, result });
      } catch (err) {
        hasError = true;
        errorMessage = err instanceof Error ? err.message : "Unknown remote bridge request error.";
        results.push({
          id: request.id,
          name: request.name,
          result: `Bridge connection failed: ${errorMessage}`,
        });
      }
    }

    await fetch(`${REMOTE_BRIDGE_API_BASE}/api/al/remote-bridge/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-al-remote-bridge-secret": REMOTE_BRIDGE_SECRET,
      },
      body: JSON.stringify({
        jobId: bundle.jobId,
        clientId: REMOTE_BRIDGE_CLIENT_ID,
        isError: hasError,
        errorMessage,
        results,
      }),
    });
  } catch {
    // Stay quiet here; the hosted AL proof surface should tell the truth about relay availability.
  } finally {
    remoteRelayBusy = false;
  }
}

/* ── Routes ─────────────────────────────────────────────────── */
async function readExecutorHealth() {
  try {
    const response = await fetch("http://127.0.0.1:3456/health", {
      signal: AbortSignal.timeout(2500),
    });

    if (!response.ok) {
      return {
        online: false,
        status: `HTTP ${response.status}`,
        version: null,
        endpoints: {},
      };
    }

    const data = await response.json();
    return {
      online: true,
      status: typeof data.status === "string" ? data.status : "online",
      version: typeof data.version === "string" ? data.version : null,
      endpoints:
        data && typeof data.endpoints === "object" && data.endpoints
          ? data.endpoints
          : {},
    };
  } catch (err) {
    return {
      online: false,
      status: err instanceof Error ? err.message : "executor unreachable",
      version: null,
      endpoints: {},
    };
  }
}

async function probeCoworkExecutionHealth(force = false) {
  const now = Date.now();
  if (!force && coworkHealthCache.ok !== null && now - coworkHealthCache.checkedAt < COWORK_HEALTH_PROBE_TTL_MS) {
    return coworkHealthCache;
  }

  try {
    const execRes = await fetch("http://127.0.0.1:3456/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        task: "Do not write files or change anything. Return exactly: OK",
        domain: "dominionhomedeals",
        authority_zone: 1,
        secret: process.env.EXECUTOR_SECRET || "sentinel-ceo-2026",
      }),
      signal: AbortSignal.timeout(20000),
    });
    const data = await execRes.json().catch(() => null);
    const raw =
      data && typeof data === "object"
        ? String(data.output || data.result || data.error || "")
        : "";
    const normalized = raw.toLowerCase();
    const authFailure =
      normalized.includes("invalid api key") ||
      normalized.includes("fix external api key");
    const creditFailure =
      normalized.includes("credit balance is too low") ||
      normalized.includes("insufficient credits");
    const failed =
      !execRes.ok ||
      authFailure ||
      creditFailure ||
      normalized.includes('"success":false') ||
      normalized.includes("executor error");

    coworkHealthCache = failed
      ? {
          checkedAt: now,
          ok: false,
          status: authFailure
            ? "auth_invalid"
            : creditFailure
              ? "credit_blocked"
              : `probe_failed_http_${execRes.status}`,
          detail:
            raw ||
            `Cowork execute probe failed with HTTP ${execRes.status}.`,
        }
      : {
          checkedAt: now,
          ok: true,
          status: "ready",
          detail: raw || "Cowork execute probe succeeded.",
        };
  } catch (err) {
    coworkHealthCache = {
      checkedAt: now,
      ok: false,
      status: "probe_error",
      detail: err instanceof Error ? err.message : "Unknown cowork probe error.",
    };
  }

  return coworkHealthCache;
}

async function handleHealth(res, o) {
  const snapshot = await buildBridgeStatusSnapshot();
  json(res, 200, {
    ok: true,
    vault: VAULT,
    crewProject: crewProjectOk(),
    crewRoot: CREW_ROOT || null,
    executor: snapshot.executor,
    coworkProbe: snapshot.coworkProbe,
    capabilities: snapshot.capabilities,
    browserVendorCartReview: snapshot.browserVendorCartReview,
    brandMediaProduction: snapshot.brandMediaProduction,
    codexTaskExecution: snapshot.codexTaskExecution,
    remoteBridgeRelay: snapshot.remoteBridgeRelay,
  }, o);
}

async function handleList(res, o, url) {
  const rel = url.searchParams.get("path") || ".";
  const full = resolveSafe(rel);
  if (!full) return json(res, 400, { error: "Invalid path" }, o);

  try {
    const ents = await fs.readdir(full, { withFileTypes: true });
    json(
      res,
      200,
      {
        path: rel,
        entries: ents
          .filter((e) => !e.name.startsWith("."))
          .map((e) => ({
            name: e.name,
            type: e.isDirectory() ? "folder" : "file",
          })),
      },
      o
    );
  } catch {
    json(res, 404, { error: "Folder not found" }, o);
  }
}

async function handleRead(res, o, url) {
  const rel = url.searchParams.get("path") || "";
  const full = resolveSafe(rel);
  if (!full) return json(res, 400, { error: "Invalid path" }, o);
  if (!hasSafeExt(full))
    return json(res, 403, { error: "File type not allowed" }, o);

  try {
    const s = await fs.stat(full);
    if (s.size > MAX_SIZE)
      return json(res, 413, { error: "File too large (>1 MB)" }, o);
    const content = await fs.readFile(full, "utf-8");
    json(res, 200, { path: rel, content, size: s.size }, o);
  } catch {
    json(res, 404, { error: "File not found" }, o);
  }
}

async function handleWrite(req, res, o) {
  const { path: rel, content } = JSON.parse(await readBody(req));
  if (!rel || typeof content !== "string")
    return json(res, 400, { error: "Missing path or content" }, o);
  if (content.length > MAX_SIZE)
    return json(res, 413, { error: "Content too large (>1 MB)" }, o);

  const full = resolveSafe(rel);
  if (!full) return json(res, 400, { error: "Invalid path" }, o);
  if (!hasSafeExt(full))
    return json(res, 403, { error: "File type not allowed" }, o);

  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, content, "utf-8");
  json(res, 200, { ok: true, path: rel }, o);
}

async function handleReadImage(res, o, url) {
  const rel = url.searchParams.get("path") || "";
  const full = resolveSafe(rel);
  if (!full) return json(res, 400, { error: "Invalid path" }, o);
  const ext = path.extname(full).toLowerCase();
  if (!IMAGE_EXT.has(ext))
    return json(res, 403, { error: "Not an image file" }, o);

  try {
    const s = await fs.stat(full);
    if (s.size > MAX_IMAGE_SIZE)
      return json(res, 413, { error: "Image too large (>5 MB)" }, o);
    const buf = await fs.readFile(full);
    const base64 = buf.toString("base64");
    const mimeType = IMAGE_MIME[ext] || "image/png";
    json(res, 200, { path: rel, base64, mimeType, size: s.size }, o);
  } catch {
    json(res, 404, { error: "Image not found" }, o);
  }
}

async function handleMkdir(req, res, o) {
  const { path: rel } = JSON.parse(await readBody(req));
  if (!rel) return json(res, 400, { error: "Missing path" }, o);

  const full = resolveSafe(rel);
  if (!full) return json(res, 400, { error: "Invalid path" }, o);

  await fs.mkdir(full, { recursive: true });
  json(res, 200, { ok: true, path: rel }, o);
}

function findPythonExe() {
  const win = path.join(CREW_ROOT, ".venv", "Scripts", "python.exe");
  const unix = path.join(CREW_ROOT, ".venv", "bin", "python");
  if (fsSync.existsSync(win)) return win;
  if (fsSync.existsSync(unix)) return unix;
  return process.platform === "win32" ? "python" : "python3";
}

function listCrewsPayload() {
  if (!crewProjectOk()) {
    return {
      crews: [],
      activeRuns: [],
      crewRoot: CREW_ROOT || null,
      error: "CREW_PROJECT_ROOT missing or invalid (need main.py and crews/)",
    };
  }
  const files = discoverCrewFiles();
  const crews = files.map((file) => ({
    id: fileToCrewId(file),
    file,
  }));
  if (files.includes("tax_scout_crew.py") && files.includes("wrenchready_audit_crew.py")) {
    crews.push({ id: "both", file: "(both)", synthetic: true });
  }
  const activeRuns = [];
  for (const [id, r] of crewRuns) {
    if (r.status === "running")
      activeRuns.push({ id, crew: r.crew, startedAt: r.startedAt });
  }
  return { crews, activeRuns, crewRoot: CREW_ROOT };
}

async function handleCrewList(res, o) {
  json(res, 200, listCrewsPayload(), o);
}

async function handleCrewRun(req, res, o) {
  if (!crewProjectOk())
    return json(res, 503, { error: "CrewAI project not configured on this machine" }, o);

  let body;
  try {
    body = JSON.parse(await readBody(req));
  } catch {
    return json(res, 400, { error: "Invalid JSON" }, o);
  }
  const crewId = (body.crew || "").trim().toLowerCase();
  if (!crewId) return json(res, 400, { error: "Missing crew" }, o);

  const files = discoverCrewFiles();
  const known = files.map((f) => fileToCrewId(f));
  const allowBoth =
    files.includes("tax_scout_crew.py") && files.includes("wrenchready_audit_crew.py");
  const valid = allowBoth ? [...known, "both"] : known;
  if (!valid.includes(crewId))
    return json(res, 400, { error: `Unknown crew: ${crewId}. Valid: ${valid.join(", ") || "(none)"}` }, o);

  let running = 0;
  for (const r of crewRuns.values()) if (r.status === "running") running++;
  if (running >= MAX_CONCURRENT_CREWS)
    return json(res, 429, { error: "Too many concurrent crew runs (max 2)" }, o);

  const id = crypto.randomUUID();
  const run = {
    id,
    crew: crewId,
    status: "running",
    output: "",
    error: "",
    startedAt: Date.now(),
    finishedAt: null,
    exitCode: null,
  };
  crewRuns.set(id, run);

  const py = findPythonExe();
  const mainPy = path.join(CREW_ROOT, "main.py");
  let outBuf = "";
  let errBuf = "";

  const child = spawn(py, [mainPy, crewId], {
    cwd: CREW_ROOT,
    windowsHide: true,
    env: { ...process.env },
  });

  const appendOut = (chunk, isErr) => {
    const s = chunk.toString();
    if (isErr) errBuf += s;
    else outBuf += s;
    const total = outBuf.length + errBuf.length;
    if (total > MAX_CREW_OUTPUT) {
      try {
        child.kill("SIGTERM");
      } catch { /* ignore */ }
    }
  };

  child.stdout.on("data", (d) => appendOut(d, false));
  child.stderr.on("data", (d) => appendOut(d, true));

  const timer = setTimeout(() => {
    if (run.status !== "running") return;
    try {
      child.kill("SIGTERM");
    } catch { /* ignore */ }
    run.status = "timeout";
    run.output = (outBuf + "\n" + errBuf).slice(0, MAX_CREW_OUTPUT);
    run.error = "Timed out after 15 minutes";
    run.finishedAt = Date.now();
  }, CREW_TIMEOUT_MS);

  child.on("error", (err) => {
    clearTimeout(timer);
    if (run.status !== "running") return;
    run.status = "failed";
    run.error = err.message || "spawn failed";
    run.output = (outBuf + errBuf).slice(0, MAX_CREW_OUTPUT);
    run.finishedAt = Date.now();
  });

  child.on("close", (code) => {
    clearTimeout(timer);
    if (run.status !== "running") return;
    run.exitCode = code;
    run.output = (outBuf + (errBuf ? "\n" + errBuf : "")).slice(0, MAX_CREW_OUTPUT);
    run.status = code === 0 ? "completed" : "failed";
    if (code !== 0) run.error = `Exit code ${code}`;
    run.finishedAt = Date.now();
  });

  json(res, 200, { id, crew: crewId, status: "running" }, o);
}

async function handleCrewStatus(res, o, url) {
  const id = url.searchParams.get("id") || "";
  if (!id) return json(res, 400, { error: "Missing id" }, o);
  const run = crewRuns.get(id);
  if (!run) return json(res, 404, { error: "Run not found" }, o);
  json(
    res,
    200,
    {
      id: run.id,
      crew: run.crew,
      status: run.status,
      output: run.output,
      error: run.error || null,
      exitCode: run.exitCode,
      startedAt: run.startedAt,
      finishedAt: run.finishedAt,
    },
    o
  );
}

async function handleLocalPdfMerge(req, res, o) {
  let body;
  try {
    body = JSON.parse(await readBody(req));
  } catch {
    return json(res, 400, { error: "Invalid JSON body." }, o);
  }

  const sourcePaths = Array.isArray(body.source_paths)
    ? body.source_paths.filter((value) => typeof value === "string" && value.trim())
    : [];
  if (sourcePaths.length === 0) {
    return json(res, 400, { error: "source_paths must contain at least one PDF path." }, o);
  }

  const resolvedSources = [];
  for (const sourcePath of sourcePaths) {
    const resolved = resolveBridgePath(sourcePath, { mustExist: true });
    if (!resolved) {
      return json(
        res,
        400,
        { error: `Source path is invalid or outside the bridge root: ${sourcePath}` },
        o,
      );
    }
    if (!PDF_EXT.has(path.extname(resolved).toLowerCase())) {
      return json(res, 400, { error: `Source is not a PDF: ${sourcePath}` }, o);
    }
    resolvedSources.push(resolved);
  }

  const outputInput =
    typeof body.output_path === "string" && body.output_path.trim()
      ? body.output_path
      : path.join("al-output", `merged-${Date.now()}.pdf`);
  const resolvedOutput = resolveBridgePath(outputInput, { mustExist: false });
  if (!resolvedOutput) {
    return json(
      res,
      400,
      { error: `Output path is invalid or outside the bridge root: ${outputInput}` },
      o,
    );
  }
  if (!PDF_EXT.has(path.extname(resolvedOutput).toLowerCase())) {
    return json(res, 400, { error: "Output path must end with .pdf" }, o);
  }

  await fs.mkdir(path.dirname(resolvedOutput), { recursive: true });

  const mergeScript = [
    "import json, sys",
    "from pypdf import PdfReader, PdfWriter",
    "output_path = sys.argv[1]",
    "source_paths = sys.argv[2:]",
    "writer = PdfWriter()",
    "page_count = 0",
    "for source_path in source_paths:",
    "    reader = PdfReader(source_path)",
    "    for page in reader.pages:",
    "        writer.add_page(page)",
    "        page_count += 1",
    "with open(output_path, 'wb') as handle:",
    "    writer.write(handle)",
    "print(json.dumps({",
    "    'ok': True,",
    "    'output_path': output_path,",
    "    'source_count': len(source_paths),",
    "    'page_count': page_count,",
    "}))",
  ].join("\n");

  const { cmd, baseArgs } = pythonCommand();
  const stdoutChunks = [];
  const stderrChunks = [];

  try {
    await new Promise((resolve, reject) => {
      const child = spawn(cmd, [...baseArgs, "-c", mergeScript, resolvedOutput, ...resolvedSources], {
        windowsHide: true,
        env: { ...process.env },
      });

      child.stdout.on("data", (chunk) => stdoutChunks.push(chunk.toString()));
      child.stderr.on("data", (chunk) => stderrChunks.push(chunk.toString()));
      child.on("error", reject);
      child.on("close", (code) => {
        if (code === 0) {
          resolve();
          return;
        }
        reject(new Error(stderrChunks.join("").trim() || `PDF merge exited with code ${code}`));
      });
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown PDF merge error.";
    return json(
      res,
      500,
      {
        ok: false,
        status: "local_pdf_merge_failed",
        error: message,
        operator_message:
          "Local PDF merge failed before completion. Verify Python + pypdf are available on this machine and retry.",
        next_action:
          "Keep this on the local bridge lane. Do not reroute a plain PDF merge to the legacy local executor.",
      },
      o,
    );
  }

  const stdout = stdoutChunks.join("").trim();
  const lastLine = stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(-1)[0];

  let parsed = null;
  try {
    parsed = lastLine ? JSON.parse(lastLine) : null;
  } catch {
    parsed = null;
  }

  return json(
    res,
    200,
    {
      ok: true,
      status: "local_pdf_merge_completed",
      output_path: resolvedOutput,
      output_relative_path: path.relative(path.resolve(VAULT), resolvedOutput).replace(/\\/g, "/"),
      source_paths: resolvedSources,
      source_count: parsed?.source_count ?? resolvedSources.length,
      page_count: parsed?.page_count ?? null,
      operator_message: "Local PDF merge completed on Dez's machine without external model credits.",
    },
    o,
  );
}

async function handleCodexTask(req, res, o) {
  let body;
  try {
    body = JSON.parse(await readBody(req));
  } catch {
    return json(res, 400, { error: "Invalid JSON body." }, o);
  }

  const task = typeof body.task === "string" ? body.task.trim() : "";
  if (!task) {
    return json(res, 400, { error: "Missing task." }, o);
  }

  const codexBinary = resolveCodexBinary();
  if (!codexBinary) {
    return json(
      res,
      503,
      {
        ok: false,
        status: "codex_task_unavailable",
        error: "Local Codex CLI binary not found.",
        operator_message:
          "Codex is not available on this machine yet. Keep this on OpenAI/Cursor or install a working Codex CLI path for the local lane.",
      },
      o,
    );
  }

  const explicitCwd =
    typeof body.cwd === "string" && body.cwd.trim()
      ? resolveBridgePath(body.cwd, { mustExist: true })
      : null;
  const workspace =
    typeof body.workspace === "string" && body.workspace.trim()
      ? resolveCodexWorkspace(body.workspace)
      : null;
  const resolvedCwd = explicitCwd || workspace || path.join(path.resolve(VAULT), "dominionhomedeals");

  if (!resolvedCwd || !fsSync.existsSync(resolvedCwd)) {
    return json(
      res,
      400,
      {
        error:
          "Unable to resolve a valid Codex working directory. Provide cwd or a known workspace such as dominionhomedeals, wrenchreadymobile-com, al-boreland-vault, al, or sentinel.",
      },
      o,
    );
  }

  const sandbox =
    body.sandbox === "read-only" || body.sandbox === "danger-full-access"
      ? body.sandbox
      : "workspace-write";

  const additionalWritablePaths = Array.isArray(body.additional_writable_paths)
    ? body.additional_writable_paths
        .filter((value) => typeof value === "string" && value.trim())
        .map((value) => resolveBridgePath(value, { mustExist: true }))
        .filter(Boolean)
    : [];

  const runId = `codex-${Date.now()}-${crypto.randomUUID()}`;
  const runDir = path.join(path.resolve(VAULT), "al-output", "codex-runs", runId);
  const outputFile = path.join(runDir, "last-message.txt");
  await fs.mkdir(runDir, { recursive: true });

  const args = [
    "exec",
    "-C",
    resolvedCwd,
    "--sandbox",
    sandbox,
    "--skip-git-repo-check",
    "--ephemeral",
    "-o",
    outputFile,
  ];
  for (const writablePath of additionalWritablePaths) {
    args.push("--add-dir", writablePath);
  }
  args.push(task);

  const stdoutChunks = [];
  const stderrChunks = [];

  try {
    await new Promise((resolve, reject) => {
      const child = spawn(codexBinary, args, {
        windowsHide: true,
        env: {
          ...process.env,
          CODEX_HOME: process.env.CODEX_HOME || (homeDir ? path.join(homeDir, ".codex") : undefined),
        },
      });

      child.stdout.on("data", (chunk) => stdoutChunks.push(chunk.toString()));
      child.stderr.on("data", (chunk) => stderrChunks.push(chunk.toString()));
      child.on("error", reject);
      child.on("close", (code) => {
        if (code === 0) {
          resolve();
          return;
        }
        reject(
          new Error(
            stderrChunks.join("").trim() ||
              stdoutChunks.join("").trim() ||
              `Codex task exited with code ${code}`,
          ),
        );
      });
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown Codex task error.";
    return json(
      res,
      500,
      {
        ok: false,
        status: "codex_task_failed",
        error: message,
        task,
        cwd: resolvedCwd,
        operator_message:
          "Codex task failed before producing a usable result. Keep the work on the OpenAI-native lane, inspect the local Codex CLI state, and retry with a tighter task if needed.",
      },
      o,
    );
  }

  const stdout = stdoutChunks.join("").trim();
  const stderr = stderrChunks.join("").trim();
  const sessionMatch = [stdout, stderr].filter(Boolean).join("\n").match(/session id:\s*([^\s]+)/i);
  const result = fsSync.existsSync(outputFile)
    ? fsSync.readFileSync(outputFile, "utf8").trim()
    : "";

  return json(
    res,
    200,
    {
      ok: true,
      status: "codex_task_completed",
      task,
      cwd: resolvedCwd,
      workspace: typeof body.workspace === "string" ? body.workspace : null,
      sandbox,
      additional_writable_paths: additionalWritablePaths,
      codex_binary: codexBinary,
      session_id: sessionMatch ? sessionMatch[1] : null,
      output_path: outputFile,
      result: result || stdout || "Codex completed without a final message.",
      stderr: stderr || null,
      operator_message:
        "Codex completed the delegated task locally on Dez's machine using the OpenAI-native execution lane.",
    },
    o,
  );
}

/* ── Server ─────────────────────────────────────────────────── */
const server = http.createServer(async (req, res) => {
  const o = req.headers.origin || "";
  const u = new URL(req.url, `http://127.0.0.1:${PORT}`);

  if (req.method === "OPTIONS") {
    res.writeHead(204, cors(o));
    return res.end();
  }

  /* ── Research proxy — forwards to AL executor /ask (OpenAI-first reasoning + web search) ── */
  async function handleResearch(req, res, o) {
    const body = JSON.parse(await readBody(req));
    const task = (body.task || "").trim();
    if (!task) return json(res, 400, { error: "Missing task" }, o);
    try {
      const execRes = await fetch("http://127.0.0.1:3456/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: task, secret: process.env.EXECUTOR_SECRET || 'sentinel-ceo-2026' }),
        signal: AbortSignal.timeout(280000),
      });
      const data = await execRes.json();
      if (!execRes.ok) return json(res, execRes.status, { error: data.error || "Executor error" }, o);
      return json(res, 200, { result: data.answer || data.result || JSON.stringify(data) }, o);
    } catch (err) {
      return json(res, 502, { error: `Executor unreachable: ${err.message}` }, o);
    }
  }

  /* ── Cowork proxy — forwards to AL executor /execute (Claude Agent SDK, full tools) ── */
  function codexWorkspaceForCoworkDomain(domain) {
    const normalized = String(domain || "").trim().toLowerCase();
    if (
      normalized.includes("wrench") ||
      normalized.includes("simon") ||
      normalized.includes("wrench-ready")
    ) {
      return "wrenchreadymobile-com";
    }
    if (normalized.includes("sentinel")) return "sentinel";
    if (normalized === "al" || normalized.includes("al-boreland")) return "al";
    if (normalized.includes("vault")) return "al-boreland-vault";
    return "dominionhomedeals";
  }

  async function runCodexFallbackForCowork({ task, domain }) {
    const workspace = codexWorkspaceForCoworkDomain(domain);
    const codexRes = await fetch(`http://127.0.0.1:${PORT}/codex/exec`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        task,
        workspace,
        sandbox: "workspace-write",
      }),
      signal: AbortSignal.timeout(280000),
    });
    const codexData = await codexRes.json().catch(() => null);
    const codexMessage =
      typeof codexData?.result === "string"
        ? codexData.result
        : typeof codexData?.operator_message === "string"
          ? codexData.operator_message
          : codexData
            ? JSON.stringify(codexData)
            : `Codex task failed with HTTP ${codexRes.status}.`;

    if (codexRes.ok && codexData?.ok !== false) {
      return {
        statusCode: 200,
        payload: {
          result:
            `Claude cowork backup was unavailable. AL rerouted this coding task to the OpenAI-native Codex lane (${workspace}) so work could keep moving.\n\n${codexMessage}`,
          session_id: codexData?.session_id || null,
          elapsed: null,
          domain,
          fallback_lane: "codex_task",
          fallback_workspace: workspace,
        },
      };
    }

    return {
      statusCode: codexRes.status || 500,
      payload: {
        error:
          `Claude cowork backup was unavailable, and the OpenAI-native Codex fallback (${workspace}) also failed.\n\n${codexMessage}`,
      },
    };
  }

  async function handleCowork(req, res, o) {
    const body = JSON.parse(await readBody(req));
    const task = (body.task || "").trim();
    const domain = (body.domain || "dominionhomedeals").trim();
    const zone = body.authority_zone ?? 1;
    if (!task) return json(res, 400, { error: "Missing task" }, o);
    try {
      const execRes = await fetch("http://127.0.0.1:3456/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task,
          domain,
          authority_zone: zone,
          secret: process.env.EXECUTOR_SECRET || "sentinel-ceo-2026",
        }),
        signal: AbortSignal.timeout(280000),
      });
      const data = await execRes.json();
      if (!execRes.ok) {
        const error = data.error || "Executor error";
        const normalized = String(error).toLowerCase();
        if (normalized.includes("invalid api key") || normalized.includes("fix external api key")) {
          coworkHealthCache = {
            checkedAt: Date.now(),
            ok: false,
            status: "auth_invalid",
            detail: String(error),
          };
        } else if (normalized.includes("credit balance is too low") || normalized.includes("insufficient credits")) {
          coworkHealthCache = {
            checkedAt: Date.now(),
            ok: false,
            status: "credit_blocked",
            detail: String(error),
          };
        }
        if (
          normalized.includes("invalid api key") ||
          normalized.includes("fix external api key") ||
          normalized.includes("credit balance is too low") ||
          normalized.includes("insufficient credits")
        ) {
          const fallback = await runCodexFallbackForCowork({ task, domain });
          return json(res, fallback.statusCode, fallback.payload, o);
        }
        return json(res, execRes.status, { error }, o);
      }
      const resultText = String(data.output || data.result || JSON.stringify(data));
      const normalizedResult = resultText.toLowerCase();
      if (
        normalizedResult.includes("invalid api key") ||
        normalizedResult.includes("fix external api key") ||
        normalizedResult.includes("credit balance is too low") ||
        normalizedResult.includes("insufficient credits") ||
        normalizedResult.includes('"success":false')
      ) {
        coworkHealthCache = {
          checkedAt: Date.now(),
          ok: false,
          status:
            normalizedResult.includes("credit balance is too low") ||
            normalizedResult.includes("insufficient credits")
              ? "credit_blocked"
              : "auth_invalid",
          detail: resultText,
        };
        const fallback = await runCodexFallbackForCowork({ task, domain });
        return json(res, fallback.statusCode, fallback.payload, o);
      }
      coworkHealthCache = {
        checkedAt: Date.now(),
        ok: true,
        status: "ready",
        detail: "Cowork execution succeeded.",
      };
      return json(res, 200, {
        result: resultText,
        session_id: data.session_id || null,
        elapsed: data.elapsed_seconds || null,
        domain: data.domain || domain,
      }, o);
    } catch (err) {
      return json(res, 502, { error: `Executor unreachable: ${err.message}` }, o);
    }
  }

  /* ── Local PDF merge — merges existing PDFs without external model credits ── */
  async function handlePdfMerge(req, res, o) {
    return handleLocalPdfMerge(req, res, o);
  }

  async function handleCodexExec(req, res, o) {
    return handleCodexTask(req, res, o);
  }

  async function handleBrowserVendorCartReview(req, res, o) {
    let body = {};
    try {
      body = JSON.parse(await readBody(req));
    } catch {
      return json(res, 400, { error: "Invalid JSON body." }, o);
    }

    try {
      const result = await runBrowserVendorCartReview(body);
      return json(res, result.ok ? 200 : 503, result, o);
    } catch (err) {
      return json(
        res,
        500,
        {
          ok: false,
          status: "failed_bridge_execution",
          lane_id: "wrenchready-branding-commerce",
          preferred_execution_path: "bridge:browser_vendor_cart_review",
          missing_access: [],
          error: err instanceof Error ? err.message : "Unknown browser vendor cart review error.",
          operator_message:
            err instanceof Error
              ? `Vendor/design lane failed during browser execution: ${err.message}`
              : "Vendor/design lane failed during browser execution.",
          next_action:
            "Inspect the local browser bridge worker, retry the vendor review flow, and confirm the browser/session stack before claiming this lane is live.",
        },
        o,
      );
    }
  }

  async function handleBrowserVendorReviewPage(res, o, jobId) {
    const reviewFile = resolveBrowserVendorReviewFile(jobId, "review.html");
    if (!reviewFile || !fsSync.existsSync(reviewFile)) {
      return html(
        res,
        404,
        "<!doctype html><title>Review page missing</title><p>Review page not found for this browser vendor job.</p>",
        o,
      );
    }

    const markup = await fs.readFile(reviewFile, "utf8");
    return html(res, 200, markup, o);
  }

  async function handleBrowserVendorReviewArtifact(res, o, jobId, fileName) {
    const full = resolveBrowserVendorReviewFile(jobId, fileName);
    if (!full || !fsSync.existsSync(full)) {
      return json(res, 404, { error: "Artifact not found" }, o);
    }

    const ext = path.extname(full).toLowerCase();
    const contentType =
      ext === ".html"
        ? "text/html; charset=utf-8"
        : ext === ".json"
          ? "application/json; charset=utf-8"
          : IMAGE_MIME[ext] || "application/octet-stream";
    const body = await fs.readFile(full);
    res.writeHead(200, { ...cors(o), "Content-Type": contentType });
    return res.end(body);
  }

  async function handleBrowserVendorReviewResume(res, o, jobId, target) {
    try {
      const launch = await resumeBrowserVendorCartReview(jobId, target);
      const manifest = await readBrowserVendorReviewManifest(jobId).catch(() => null);
      return html(
        res,
        200,
        `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Cart Session Opened</title>
    <style>
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #eef6fb; color: #10243b; font-family: Arial, Helvetica, sans-serif; }
      main { width: min(640px, calc(100vw - 32px)); background: #fff; border: 1px solid #d7e4ee; border-radius: 22px; padding: 28px; box-shadow: 0 18px 50px rgba(16, 36, 59, 0.08); }
      h1 { margin: 0 0 12px; font-size: 32px; }
      p { margin: 0 0 12px; line-height: 1.6; color: #55748f; }
      a { color: #1262a7; font-weight: 700; }
    </style>
  </head>
  <body>
    <main>
      <h1>${target === "proof" ? "Proof Opened" : "Cart Session Opened"}</h1>
      <p>${launch.note}</p>
      <p>The browser opened at <strong>${launch.launched_url}</strong>.</p>
      ${
        manifest?.public_links?.review_page_url
          ? `<p><a href="${manifest.public_links.review_page_url}">Return to review page</a></p>`
          : ""
      }
    </main>
  </body>
</html>`,
        o,
      );
    } catch (err) {
      return html(
        res,
        500,
        `<!doctype html><title>Resume failed</title><p>${err instanceof Error ? err.message : "Could not resume the browser vendor review session."}</p>`,
        o,
      );
    }
  }

  async function handleBrandMediaProduction(req, res, o) {
    let body = {};
    try {
      body = JSON.parse(await readBody(req));
    } catch {
      return json(res, 400, { error: "Invalid JSON body." }, o);
    }

    try {
      const result = await runBrandMediaProduction(body);
      return json(res, result.ok ? 200 : 503, result, o);
    } catch (err) {
      return json(
        res,
        500,
        {
          ok: false,
          status: "failed_media_bridge_execution",
          lane_id: "wrenchready-brand-media",
          preferred_execution_path: "bridge:media_production",
          missing_access: [],
          error: err instanceof Error ? err.message : "Unknown media bridge error.",
          operator_message:
            err instanceof Error
              ? `Media production lane failed: ${err.message}`
              : "Media production lane failed.",
          next_action:
            "Inspect local bridge media worker, confirm RUNWAY_API_KEY + source photo path, then rerun media_production.",
        },
        o,
      );
    }
  }

  async function handleBrandMediaReviewPage(res, o, jobId) {
    const full = resolveBrandMediaArtifact(jobId, "review.html");
    if (!full || !fsSync.existsSync(full)) {
      return html(
        res,
        404,
        "<!doctype html><title>Review page missing</title><p>Brand media review page not found for this job.</p>",
        o,
      );
    }

    const markup = await fs.readFile(full, "utf8");
    return html(res, 200, markup, o);
  }

  function resolveBrandMediaOutputRoot() {
    const probe = resolveBrandMediaJobDir("probe");
    return probe ? path.dirname(probe) : null;
  }

  function listBrandMediaJobs() {
    const root = resolveBrandMediaOutputRoot();
    if (!root || !fsSync.existsSync(root)) return [];
    return fsSync
      .readdirSync(root, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => {
        const jobId = entry.name;
        const reviewFile = path.join(root, jobId, "review.html");
        const manifestFile = path.join(root, jobId, "review-manifest.json");
        const stat = fsSync.statSync(path.join(root, jobId));
        let summary = "";
        try {
          if (fsSync.existsSync(manifestFile)) {
            const parsed = JSON.parse(fsSync.readFileSync(manifestFile, "utf8"));
            summary =
              parsed?.result?.summary ||
              parsed?.result?.operator_message ||
              parsed?.result?.status ||
              "";
          }
        } catch {}
        return {
          jobId,
          createdAt: stat.mtimeMs,
          reviewExists: fsSync.existsSync(reviewFile),
          summary,
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  async function handleBrandMediaLatestReviewPage(res, o) {
    const latest = listBrandMediaJobs().find((job) => job.reviewExists);
    if (!latest) {
      return html(
        res,
        404,
        "<!doctype html><title>No brand media reviews</title><p>No brand media review jobs were found yet.</p>",
        o,
      );
    }
    return handleBrandMediaReviewPage(res, o, latest.jobId);
  }

  async function handleBrandMediaReviewIndex(res, o) {
    const jobs = listBrandMediaJobs().slice(0, 20);
    const items = jobs.length
      ? jobs
          .map((job) => {
            const reviewUrl = `/media/brand-assets/job/${encodeURIComponent(job.jobId)}/review`;
            return `<li style="margin:0 0 16px;">
  <div><a href="${reviewUrl}">${job.jobId}</a></div>
  <div style="color:#55748f;font-size:14px;">${new Date(job.createdAt).toLocaleString()}</div>
  <div style="color:#10243b;">${job.summary || "Review package ready."}</div>
</li>`;
          })
          .join("")
      : "<li>No brand media review jobs found yet.</li>";

    return html(
      res,
      200,
      `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Brand Media Reviews</title>
    <style>
      body { margin: 0; background: #f3f8fd; color: #10243b; font-family: Arial, Helvetica, sans-serif; }
      main { width: min(900px, calc(100vw - 36px)); margin: 24px auto; background: #fff; border: 1px solid #d9e7f3; border-radius: 18px; padding: 24px; box-shadow: 0 14px 40px rgba(16, 36, 59, 0.08); }
      h1 { margin-top: 0; }
      a { color: #1468b0; font-weight: 700; text-decoration: none; }
      a:hover { text-decoration: underline; }
    </style>
  </head>
  <body>
    <main>
      <h1>Local Brand Media Reviews</h1>
      <p><a href="/media/brand-assets/latest/review">Open latest review</a></p>
      <ul>${items}</ul>
    </main>
  </body>
</html>`,
      o,
    );
  }

  async function handleBrandMediaArtifact(res, o, jobId, fileName) {
    const full = resolveBrandMediaArtifact(jobId, fileName);
    if (!full || !fsSync.existsSync(full)) {
      return json(res, 404, { error: "Artifact not found" }, o);
    }

    const ext = path.extname(full).toLowerCase();
    const contentType =
      ext === ".html"
        ? "text/html; charset=utf-8"
        : ext === ".json"
          ? "application/json; charset=utf-8"
          : ext === ".gif"
            ? "image/gif"
            : ext === ".mp4"
              ? "video/mp4"
              : ext === ".png"
                ? "image/png"
                : ext === ".jpg" || ext === ".jpeg"
                  ? "image/jpeg"
                  : "application/octet-stream";
    const body = await fs.readFile(full);
    res.writeHead(200, { ...cors(o), "Content-Type": contentType });
    return res.end(body);
  }

  const providedToken = ((req.headers.authorization || "").match(/^Bearer\s+(.+)$/i)?.[1] || u.searchParams.get("token") || "").trim();
  if (TOKEN && providedToken !== TOKEN)
    return json(res, 401, { error: "Unauthorized" }, o);

  try {
    const p = trimRouteNoise(u.pathname);
    const reviewPageMatch = p.match(/^\/browser\/vendor-cart-review\/job\/([^/]+)\/review$/);
    const reviewArtifactMatch = p.match(/^\/browser\/vendor-cart-review\/job\/([^/]+)\/artifact\/([^/]+)$/);
    const reviewResumeMatch = p.match(/^\/browser\/vendor-cart-review\/job\/([^/]+)\/resume\/([^/]+)$/);
    const brandMediaReviewPageMatch = p.match(/^\/media\/brand-assets\/job\/([^/]+)\/review$/);
    const brandMediaArtifactMatch = p.match(/^\/media\/brand-assets\/job\/([^/]+)\/artifact\/([^/]+)$/);
    if (p === "/health" && req.method === "GET") return handleHealth(res, o);
    if (p === "/list" && req.method === "GET")
      return handleList(res, o, u);
    if (p === "/read" && req.method === "GET")
      return handleRead(res, o, u);
    if (p === "/read-image" && req.method === "GET")
      return handleReadImage(res, o, u);
    if (p === "/write" && req.method === "POST")
      return handleWrite(req, res, o);
    if (p === "/mkdir" && req.method === "POST")
      return handleMkdir(req, res, o);
    if (p === "/crew/list" && req.method === "GET")
      return handleCrewList(res, o);
    if (p === "/crew/run" && req.method === "POST")
      return handleCrewRun(req, res, o);
    if (p === "/crew/status" && req.method === "GET")
      return handleCrewStatus(res, o, u);
    if (p === "/research" && req.method === "POST")
      return handleResearch(req, res, o);
    if (p === "/cowork" && req.method === "POST")
      return handleCowork(req, res, o);
    if (p === "/codex/exec" && req.method === "POST")
      return handleCodexExec(req, res, o);
    if (p === "/pdf/merge" && req.method === "POST")
      return handlePdfMerge(req, res, o);
    if (p === "/browser/vendor-cart-review" && req.method === "POST")
      return handleBrowserVendorCartReview(req, res, o);
    if (p === "/media/brand-assets" && req.method === "POST")
      return handleBrandMediaProduction(req, res, o);
    if (p === "/media/brand-assets/reviews" && req.method === "GET")
      return handleBrandMediaReviewIndex(res, o);
    if (p === "/media/brand-assets/latest/review" && req.method === "GET")
      return handleBrandMediaLatestReviewPage(res, o);
    if (reviewPageMatch && req.method === "GET")
      return handleBrowserVendorReviewPage(res, o, decodeURIComponent(reviewPageMatch[1]));
    if (reviewArtifactMatch && req.method === "GET")
      return handleBrowserVendorReviewArtifact(
        res,
        o,
        decodeURIComponent(reviewArtifactMatch[1]),
        decodeURIComponent(reviewArtifactMatch[2]),
      );
    if (reviewResumeMatch && req.method === "GET")
      return handleBrowserVendorReviewResume(
        res,
        o,
        decodeURIComponent(reviewResumeMatch[1]),
        decodeURIComponent(reviewResumeMatch[2]),
      );
    if (brandMediaReviewPageMatch && req.method === "GET")
      return handleBrandMediaReviewPage(res, o, decodeURIComponent(brandMediaReviewPageMatch[1]));
    if (brandMediaArtifactMatch && req.method === "GET")
      return handleBrandMediaArtifact(
        res,
        o,
        decodeURIComponent(brandMediaArtifactMatch[1]),
        decodeURIComponent(brandMediaArtifactMatch[2]),
      );
    json(res, 404, { error: "Not found" }, o);
  } catch (err) {
    json(res, 500, { error: err.message || "Internal error" }, o);
  }
});

/* ── Startup ────────────────────────────────────────────────── */
if (!VAULT || !fsSync.existsSync(VAULT)) {
  console.error("\n  ERROR: VAULT_PATH is not set or does not exist.");
  console.error("  Create al-bridge/.env with:\n");
  console.error("    VAULT_PATH=C:\\Users\\adamd\\path\\to\\ObsidianVault\n");
  process.exit(1);
}

server.listen(PORT, "127.0.0.1", () => {
  console.log("");
  console.log("  Al Boreland Local Bridge");
  console.log("  ========================");
  console.log(`  Port:  http://127.0.0.1:${PORT}`);
  console.log(`  Vault: ${VAULT}`);
  console.log(
    `  Crew:  ${crewProjectOk() ? CREW_ROOT : "not found — set CREW_PROJECT_ROOT"}`
  );
  console.log(`  Auth:  ${TOKEN ? "token required" : "open (set BRIDGE_TOKEN to secure)"}`);
  console.log(`  Relay: ${remoteRelayConfigured() ? `polling ${REMOTE_BRIDGE_API_BASE}` : "disabled"}`);
  console.log("  Ready.");
  console.log("");

  if (remoteRelayConfigured()) {
    maybeSendRemoteBridgeHeartbeat(true).catch(() => {});
    processRemoteBridgeRelayQueue().catch(() => {});
    setInterval(() => {
      processRemoteBridgeRelayQueue().catch(() => {});
    }, 3000);
  }
});
