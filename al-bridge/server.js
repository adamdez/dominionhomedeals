// Al Boreland Local Bridge — Secure Obsidian vault access
// Zero dependencies, pure Node.js

const http = require("http");
const fs = require("fs").promises;
const fsSync = require("fs");
const path = require("path");
const { URL } = require("url");

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

const ORIGINS = new Set([
  "https://dominionhomedeals.com",
  "https://www.dominionhomedeals.com",
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
  json(res, 200, { ok: true, vault: VAULT }, o);
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

/* ── Server ─────────────────────────────────────────────────── */
const server = http.createServer(async (req, res) => {
  const o = req.headers.origin || "";
  const u = new URL(req.url, `http://127.0.0.1:${PORT}`);

  if (req.method === "OPTIONS") {
    res.writeHead(204, cors(o));
    return res.end();
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
  console.log(`  Auth:  ${TOKEN ? "token required" : "open (set BRIDGE_TOKEN to secure)"}`);
  console.log("  Ready.");
  console.log("");
});
