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

const homeDir = process.env.USERPROFILE || process.env.HOME || "";
const CREW_ROOT_DEFAULT = homeDir
  ? path.join(homeDir, "Desktop", "al boreland-crew")
  : "";
const CREW_ROOT_ENV = (process.env.CREW_PROJECT_ROOT || "").trim().replace(/^["']|["']$/g, "");
const CREW_ROOT = CREW_ROOT_ENV ? path.resolve(CREW_ROOT_ENV) : CREW_ROOT_DEFAULT;

const MAX_CONCURRENT_CREWS = 2;
const CREW_TIMEOUT_MS = 15 * 60 * 1000;
const MAX_CREW_OUTPUT = 500 * 1024;

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

const ORIGINS = new Set([
  "https://dominionhomedeals.com",
  "https://www.dominionhomedeals.com",
  "https://al.dominionhomedeals.com",
  "http://localhost:3000",
  "http://localhost:3001",
]);

const TEXT_EXT = new Set([
  ".md", ".txt", ".json", ".canvas", ".yaml", ".yml", ".css", ".csv",
]);

const IMAGE_EXT = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp",
]);

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

/* ── HTTP helpers ───────────────────────────────────────────── */
function cors(origin) {
  const allowed = ORIGINS.has(origin);
  return {
    "Access-Control-Allow-Origin": allowed ? origin : "",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    "Access-Control-Allow-Private-Network": allowed ? "true" : "false",
    Vary: "Origin, Access-Control-Request-Private-Network",
  };
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

async function handleHealth(res, o) {
  const executor = await readExecutorHealth();
  const hasAsk = Boolean(executor.endpoints["POST /ask"]);
  const hasExecute = Boolean(executor.endpoints["POST /execute"]);
  const browserVendorStack = inspectBrowserVendorCartReviewStack();
  const brandMediaStack = inspectBrandMediaStack();

  json(res, 200, {
    ok: true,
    vault: VAULT,
    crewProject: crewProjectOk(),
    crewRoot: CREW_ROOT || null,
    executor,
    capabilities: {
      executor_online: executor.online,
      deep_research: executor.online && hasAsk,
      cowork_execution: executor.online && hasExecute,
      browser_automation: browserVendorStack.details.browser_automation,
      vendor_site_access: browserVendorStack.details.vendor_site_access,
      design_mockup: browserVendorStack.details.design_mockup,
      screenshot_capture: browserVendorStack.details.screenshot_capture,
      cart_preparation: browserVendorStack.details.cart_preparation,
      review_checkpoint: browserVendorStack.details.review_checkpoint,
      media_generation: brandMediaStack.live,
      media_runway: brandMediaStack.details.runway_api_key,
      media_gif_export: brandMediaStack.details.ffmpeg_available,
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
      if (!execRes.ok) return json(res, execRes.status, { error: data.error || "Executor error" }, o);
      return json(res, 200, {
        result: data.output || data.result || JSON.stringify(data),
        session_id: data.session_id || null,
        elapsed: data.elapsed_seconds || null,
        domain: data.domain || domain,
      }, o);
    } catch (err) {
      return json(res, 502, { error: `Executor unreachable: ${err.message}` }, o);
    }
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
    const p = u.pathname;
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
    if (p === "/browser/vendor-cart-review" && req.method === "POST")
      return handleBrowserVendorCartReview(req, res, o);
    if (p === "/media/brand-assets" && req.method === "POST")
      return handleBrandMediaProduction(req, res, o);
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
  console.log("  Ready.");
  console.log("");
});
