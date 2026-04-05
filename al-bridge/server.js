// Al Boreland Local Bridge — Secure Obsidian vault access
// Zero dependencies, pure Node.js

const http = require("http");
const fs = require("fs").promises;
const fsSync = require("fs");
const path = require("path");
const { URL } = require("url");
const { spawn } = require("child_process");
const crypto = require("crypto");

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
  return {
    "Access-Control-Allow-Origin": ORIGINS.has(origin) ? origin : "",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

function json(res, code, data, origin) {
  res.writeHead(code, { ...cors(origin), "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
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
async function handleHealth(res, o) {
  json(res, 200, {
    ok: true,
    vault: VAULT,
    crewProject: crewProjectOk(),
    crewRoot: CREW_ROOT || null,
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

  /* ── Research proxy — forwards to AL executor (localhost:3456) ── */
  async function handleResearch(req, res, o) {
    const body = JSON.parse(await readBody(req));
    const task = (body.task || "").trim();
    if (!task) return json(res, 400, { error: "Missing task" }, o);
    try {
      const execRes = await fetch("http://127.0.0.1:3456/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: task, secret: process.env.EXECUTOR_SECRET || 'sentinel-ceo-2026' }),
        signal: AbortSignal.timeout(280000), // 280s to stay under Vercel's 300s
      });
      const data = await execRes.json();
      if (!execRes.ok) return json(res, execRes.status, { error: data.error || "Executor error" }, o);
      return json(res, 200, { result: data.answer || data.result || JSON.stringify(data) }, o);
    } catch (err) {
      return json(res, 502, { error: `Executor unreachable: ${err.message}` }, o);
    }
  }

  if (TOKEN && (req.headers.authorization || "") !== `Bearer ${TOKEN}`)
    return json(res, 401, { error: "Unauthorized" }, o);

  try {
    const p = u.pathname;
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
