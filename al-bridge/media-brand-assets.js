const fs = require("fs");
const fsp = require("fs").promises;
const path = require("path");
const crypto = require("crypto");
const { spawnSync } = require("child_process");

const homeDir = process.env.USERPROFILE || process.env.HOME || "";
const OUTPUT_ROOT = (
  process.env.BRAND_MEDIA_OUTPUT_ROOT ||
  path.join(__dirname, "output", "brand-media")
).replace(/^["']|["']$/g, "");
const BRIDGE_PUBLIC_BASE_URL = (
  process.env.BRIDGE_PUBLIC_BASE_URL ||
  `http://127.0.0.1:${process.env.BRIDGE_PORT || "3141"}`
).replace(/\/+$/, "");
const BRIDGE_TOKEN = (process.env.BRIDGE_TOKEN || "").trim();
const DEFAULT_SOURCE_DIR = (
  process.env.SIMON_MEDIA_SOURCE_DIR ||
  (homeDir ? path.join(homeDir, "Desktop", "Simon", "simon") : "")
).replace(/^["']|["']$/g, "");
const RUNWAY_API_BASE = (
  process.env.RUNWAY_API_BASE_URL ||
  "https://api.dev.runwayml.com/v1"
).replace(/\/+$/, "");
const RUNWAY_API_VERSION = (process.env.RUNWAY_API_VERSION || "2024-11-06").trim();
const RUNWAY_VIDEO_MODEL = (process.env.RUNWAY_MODEL_VIDEO || "gen4_turbo").trim();
const RUNWAY_VIDEO_DURATION = Number(process.env.RUNWAY_VIDEO_DURATION_SECONDS || 10);
const RUNWAY_VIDEO_RATIO = (process.env.RUNWAY_VIDEO_RATIO || "1280:720").trim();
const FFMPEG_PATH_ENV = String(process.env.FFMPEG_PATH || "").trim().replace(/^["']|["']$/g, "");

const IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".heic",
  ".heif",
]);

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function collapseWhitespace(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(value, max = 180) {
  const text = collapseWhitespace(value);
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(0, max - 1)).trimEnd()}...`;
}

function safeSegment(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

function hasFfmpeg() {
  const command = resolveFfmpegBinary();
  if (!command) return false;
  const result = spawnSync(command, ["-version"], {
    encoding: "utf8",
    shell: false,
    timeout: 5000,
  });
  return result.status === 0;
}

function resolveFfmpegBinary() {
  if (FFMPEG_PATH_ENV && fs.existsSync(FFMPEG_PATH_ENV)) {
    return FFMPEG_PATH_ENV;
  }

  if (process.platform === "win32") {
    const localAppData = process.env.LOCALAPPDATA || "";
    if (localAppData) {
      const wingetRoot = path.join(localAppData, "Microsoft", "WinGet", "Packages");
      if (fs.existsSync(wingetRoot)) {
        try {
          const packageDirs = fs.readdirSync(wingetRoot);
          for (const dir of packageDirs) {
            if (!dir.toLowerCase().includes("ffmpeg")) continue;
            const candidate = path.join(wingetRoot, dir);
            const children = fs.readdirSync(candidate);
            for (const child of children) {
              const exe = path.join(candidate, child, "bin", "ffmpeg.exe");
              if (fs.existsSync(exe)) return exe;
            }
            const directExe = path.join(candidate, "ffmpeg.exe");
            if (fs.existsSync(directExe)) return directExe;
          }
        } catch {
          // Ignore and fall through to PATH lookup.
        }
      }
    }

    return "ffmpeg.exe";
  }

  return "ffmpeg";
}

function listImages(sourceDir) {
  if (!sourceDir || !fs.existsSync(sourceDir)) return [];
  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => ({
      name: entry.name,
      fullPath: path.join(sourceDir, entry.name),
      ext: path.extname(entry.name).toLowerCase(),
    }))
    .filter((entry) => IMAGE_EXTENSIONS.has(entry.ext))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function scoreImage(entry) {
  const extScore =
    entry.ext === ".jpg" || entry.ext === ".jpeg"
      ? 0
      : entry.ext === ".png"
        ? 1
        : entry.ext === ".webp"
          ? 2
          : 3;
  const name = entry.name.toLowerCase();
  const heroBoost = name.includes("8642") ? -2 : name.includes("8640") ? -1 : 0;
  return extScore + heroBoost;
}

function pickSourceImages(images, count = 4) {
  return images
    .slice()
    .sort((a, b) => scoreImage(a) - scoreImage(b))
    .slice(0, count);
}

function mimeForExtension(ext) {
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".heic" || ext === ".heif") return "image/heic";
  return "image/jpeg";
}

async function toDataUrl(fullPath, ext) {
  const raw = await fsp.readFile(fullPath);
  const mime = mimeForExtension(ext);
  return `data:${mime};base64,${raw.toString("base64")}`;
}

function clampVariationCount(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 3;
  return Math.max(2, Math.min(4, Math.round(num)));
}

function buildPromptPack(input = {}) {
  const assetGoal = truncate(input.assetGoal || "", 220);
  const creativeDirection = truncate(input.creativeDirection || "", 140);
  const styleGuardrails = truncate(input.styleGuardrails || "", 220);
  const variationCount = clampVariationCount(input.variationCount);

  const directionHint = creativeDirection
    ? `Creative direction: ${creativeDirection}.`
    : "Creative direction: bold, trustworthy, conversion-focused automotive service brand.";
  const goalHint = assetGoal ? `Asset goal: ${assetGoal}.` : "";
  const styleHint = styleGuardrails
    ? `Style guardrails: ${styleGuardrails}.`
    : "Style guardrails: realistic human likeness, brand-safe styling, and no deceptive fabrication.";
  const sharedHints = [goalHint, directionHint, styleHint].filter(Boolean).join(" ");

  const stillPromptPool = [
    `Photoreal website hero portrait of the same adult male mechanic from the source image, clean garage backdrop, strong side lighting, authentic expression. ${sharedHints}`,
    `Action-styled still image of the same adult male mechanic working near an engine bay, motion energy, sharp focus on face, mobile service context. ${sharedHints}`,
    `Website section portrait of the same adult male mechanic with a service van softly blurred in the background, premium and trustworthy look. ${sharedHints}`,
    `Editorial-style lifestyle still of the same adult male mechanic preparing tools beside the service vehicle, cinematic but realistic. ${sharedHints}`,
  ];

  return {
    still_prompts: stillPromptPool.slice(0, variationCount),
    motion_prompt:
      `Create a 10-second realistic motion clip from the source portrait: subtle head turn, confident expression, gentle camera push-in, automotive service environment. ${sharedHints}`,
    usage_notes: [
      "Keep likeness faithful to source photo while exploring distinct creative directions.",
      "Use for WrenchReady website hero and about sections.",
      "Checkout and publishing remain human-gated in AL workflows.",
    ],
  };
}

function buildPublicJobUrl(jobId, suffix = "") {
  const base = `${BRIDGE_PUBLIC_BASE_URL}/media/brand-assets/job/${encodeURIComponent(jobId)}${suffix}`;
  if (!BRIDGE_TOKEN) return base;
  return `${base}${base.includes("?") ? "&" : "?"}token=${encodeURIComponent(BRIDGE_TOKEN)}`;
}

function buildArtifactUrl(jobId, fileName) {
  return buildPublicJobUrl(jobId, `/artifact/${encodeURIComponent(fileName)}`);
}

async function copySelectedSourceArtifacts(jobId, jobDir, sourceImages) {
  const copied = [];

  for (let index = 0; index < sourceImages.length; index += 1) {
    const source = sourceImages[index];
    if (!source?.path || !fs.existsSync(source.path)) continue;

    const ext = source.ext || path.extname(source.name || source.path).toLowerCase() || ".jpg";
    const fileName = `source-${String(index + 1).padStart(2, "0")}${ext}`;
    const destinationPath = path.join(jobDir, fileName);
    await fsp.copyFile(source.path, destinationPath);
    copied.push({
      label: `Open source photo ${index + 1}`,
      url: buildArtifactUrl(jobId, fileName),
      file_name: fileName,
      original_name: source.name,
      original_path: source.path,
    });
  }

  return copied;
}

function resolveJobDir(jobId) {
  if (!jobId || !/^[a-z0-9._-]+$/i.test(jobId)) return null;
  return path.join(OUTPUT_ROOT, jobId);
}

function resolveJobArtifact(jobId, fileName) {
  if (!fileName || !/^[a-z0-9._-]+$/i.test(fileName)) return null;
  const jobDir = resolveJobDir(jobId);
  if (!jobDir) return null;
  const full = path.join(jobDir, fileName);
  if (!full.startsWith(jobDir)) return null;
  return full;
}

function inspectBrandMediaStack(input = {}) {
  const sourceDir = String(input.sourceDir || DEFAULT_SOURCE_DIR || "").replace(/^["']|["']$/g, "");
  const runwayApiKey = String(process.env.RUNWAY_API_KEY || "").trim();
  const sourceExists = Boolean(sourceDir) && fs.existsSync(sourceDir);
  const allImages = sourceExists ? listImages(sourceDir) : [];
  const selected = pickSourceImages(allImages, 4);
  const ffmpegAvailable = hasFfmpeg();
  const missingAccess = [];

  if (!sourceExists) missingAccess.push("source photo directory");
  if (selected.length === 0) missingAccess.push("usable source photos (.jpg/.jpeg/.png/.webp/.heic)");
  if (!runwayApiKey) missingAccess.push("RUNWAY_API_KEY");

  return {
    live: missingAccess.length === 0,
    missingAccess,
    details: {
      source_dir: sourceDir,
      source_dir_exists: sourceExists,
      source_image_count: allImages.length,
      selected_image_count: selected.length,
      runway_api_key: Boolean(runwayApiKey),
      runway_video_model: RUNWAY_VIDEO_MODEL,
      ffmpeg_available: ffmpegAvailable,
      selected_images: selected.map((entry) => ({
        name: entry.name,
        path: entry.fullPath,
        ext: entry.ext,
      })),
    },
  };
}

function extractRunwayTaskId(payload) {
  if (!payload || typeof payload !== "object") return null;
  return (
    payload.id ||
    payload.task_id ||
    (payload.data && (payload.data.id || payload.data.task_id)) ||
    null
  );
}

function extractRunwayStatus(payload) {
  if (!payload || typeof payload !== "object") return "";
  return String(
    payload.status ||
      payload.state ||
      (payload.data && (payload.data.status || payload.data.state)) ||
      "",
  ).toLowerCase();
}

function extractRunwayOutputUrl(payload) {
  if (!payload || typeof payload !== "object") return null;
  const candidates = [
    payload.output_url,
    payload.video_url,
    payload.url,
    payload.output && payload.output[0] && payload.output[0].url,
    payload.output && payload.output[0],
    payload.data && payload.data.output && payload.data.output[0] && payload.data.output[0].url,
    payload.data && payload.data.video_url,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && /^https?:\/\//i.test(candidate)) {
      return candidate;
    }
  }
  return null;
}

function extractRunwayError(payload) {
  if (!payload || typeof payload !== "object") return null;
  const direct = payload.error || payload.message || payload.detail;
  if (typeof direct === "string" && direct.trim()) {
    return direct.trim();
  }
  if (payload.error && typeof payload.error === "object") {
    const nested =
      payload.error.message ||
      payload.error.detail ||
      payload.error.code;
    if (typeof nested === "string" && nested.trim()) return nested.trim();
  }
  return null;
}

async function createRunwayImageToVideoTask(options) {
  const response = await fetch(`${RUNWAY_API_BASE}/image_to_video`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
      "Content-Type": "application/json",
      "X-Runway-Version": RUNWAY_API_VERSION,
    },
    body: JSON.stringify({
      model: options.model,
      promptText: options.prompt,
      promptImage: options.sourceDataUrl,
      ratio: options.ratio,
      duration: options.duration,
    }),
    signal: AbortSignal.timeout(45_000),
  });

  const rawText = await response.text();
  let payload = {};
  try {
    payload = rawText ? JSON.parse(rawText) : {};
  } catch {
    payload = { raw: rawText };
  }

  if (!response.ok) {
    const detail = extractRunwayError(payload) || truncate(rawText, 240);
    throw new Error(`Runway image_to_video request failed (HTTP ${response.status}): ${detail}`);
  }

  const taskId = extractRunwayTaskId(payload);
  if (!taskId) {
    throw new Error("Runway did not return a task id for image_to_video.");
  }

  return {
    taskId: String(taskId),
    payload,
  };
}

async function pollRunwayTask(taskId, apiKey) {
  let lastPayload = null;
  for (let attempt = 0; attempt < 36; attempt += 1) {
    const response = await fetch(`${RUNWAY_API_BASE}/tasks/${encodeURIComponent(taskId)}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "X-Runway-Version": RUNWAY_API_VERSION,
      },
      signal: AbortSignal.timeout(30_000),
    });

    const rawText = await response.text();
    let payload = {};
    try {
      payload = rawText ? JSON.parse(rawText) : {};
    } catch {
      payload = { raw: rawText };
    }
    lastPayload = payload;

    if (!response.ok) {
      const detail = extractRunwayError(payload) || truncate(rawText, 240);
      throw new Error(`Runway task polling failed (HTTP ${response.status}): ${detail}`);
    }

    const status = extractRunwayStatus(payload);
    if (status === "succeeded" || status === "completed" || status === "complete") {
      return payload;
    }
    if (status === "failed" || status === "error" || status === "cancelled") {
      const detail = extractRunwayError(payload) || "unknown runway task failure";
      throw new Error(`Runway task ${taskId} failed: ${detail}`);
    }

    await wait(5_000);
  }

  throw new Error(
    `Runway task ${taskId} did not finish within polling window. Last status: ${extractRunwayStatus(lastPayload) || "unknown"}.`,
  );
}

async function downloadFile(url, destinationPath) {
  const response = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (!response.ok) {
    throw new Error(`Could not download media output (HTTP ${response.status}).`);
  }
  const arrayBuffer = await response.arrayBuffer();
  await fsp.writeFile(destinationPath, Buffer.from(arrayBuffer));
}

function exportGif(videoPath, gifPath) {
  const command = resolveFfmpegBinary();
  if (!command) {
    return { ok: false, reason: "ffmpeg_not_available" };
  }
  const result = spawnSync(
    command,
    ["-y", "-i", videoPath, "-vf", "fps=10,scale=960:-1:flags=lanczos", "-loop", "0", gifPath],
    {
      encoding: "utf8",
      shell: false,
      timeout: 120_000,
    },
  );

  if (result.status === 0 && fs.existsSync(gifPath)) {
    return { ok: true };
  }

  return {
    ok: false,
    reason: truncate(result.stderr || result.stdout || "ffmpeg failed", 220),
  };
}

function buildReviewHtml(input) {
  const sourceList = input.sourceImages
    .map((item) => {
      const supportsInlinePreview = [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(
        String(item.ext || "").toLowerCase(),
      );
      const preview = item.url && supportsInlinePreview
        ? `<div><a href="${item.url}"><img src="${item.url}" alt="${item.name || "Source photo"}" style="max-width:220px;border-radius:12px;border:1px solid #d9e7f3;" /></a></div>`
        : "";
      const link = item.url ? `<div><a href="${item.url}">Open source photo</a></div>` : "";
      return `<li>${preview}${link}<code>${item.path}</code></li>`;
    })
    .join("");
  const mediaList = input.generatedAssets
    .map((asset) => `<li><a href="${asset.url}">${asset.label}</a></li>`)
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>WrenchReady Brand Media Review</title>
    <style>
      body { margin: 0; background: #f3f8fd; color: #10243b; font-family: Arial, Helvetica, sans-serif; }
      main { width: min(900px, calc(100vw - 36px)); margin: 24px auto; background: #fff; border: 1px solid #d9e7f3; border-radius: 18px; padding: 24px; box-shadow: 0 14px 40px rgba(16, 36, 59, 0.08); }
      h1 { margin-top: 0; font-size: 30px; }
      h2 { margin-top: 26px; font-size: 20px; }
      code { background: #eef5fb; padding: 2px 6px; border-radius: 8px; }
      ul { margin: 8px 0 0; padding-left: 20px; line-height: 1.5; }
      .status { padding: 10px 14px; border-radius: 12px; background: #ecf8ef; border: 1px solid #b8e2c1; color: #1c6b35; font-weight: 700; }
      .warn { background: #fff4e8; border: 1px solid #f4c898; color: #8a4d10; }
      a { color: #1468b0; font-weight: 700; text-decoration: none; }
      a:hover { text-decoration: underline; }
      .small { color: #55738e; font-size: 14px; }
    </style>
  </head>
  <body>
    <main>
      <h1>WrenchReady Brand Media Review</h1>
      <p class="status ${input.ok ? "" : "warn"}">${input.statusLabel}</p>
      <p class="small">${input.summary}</p>

      <h2>Source Photos Used</h2>
      <ul>${sourceList || "<li>No source photos selected.</li>"}</ul>

      <h2>Generated Assets</h2>
      <ul>${mediaList || "<li>No generated assets available yet.</li>"}</ul>

      <h2>Next Action</h2>
      <p>${input.nextAction}</p>
    </main>
  </body>
</html>`;
}

async function runBrandMediaProduction(input = {}) {
  const sourceDir = String(input.source_dir || DEFAULT_SOURCE_DIR || "").replace(/^["']|["']$/g, "");
  const stack = inspectBrandMediaStack({ sourceDir });
  const creativeInput = {
    assetGoal: String(input.asset_goal || "").trim(),
    creativeDirection: String(input.creative_direction || "").trim(),
    styleGuardrails: String(input.style_guardrails || "").trim(),
    variationCount: input.variation_count,
  };
  const promptPack = buildPromptPack(creativeInput);
  const jobId = `brand-media-${Date.now()}-${safeSegment(crypto.randomBytes(3).toString("hex"))}`;
  const jobDir = path.join(OUTPUT_ROOT, jobId);
  await fsp.mkdir(jobDir, { recursive: true });

  const sourceImages = stack.details.selected_images || [];
  const generatedAssets = [];
  const manifest = {
    job_id: jobId,
    created_at: new Date().toISOString(),
    source_dir: sourceDir,
    source_images: sourceImages,
    creative_input: creativeInput,
    prompt_pack: promptPack,
    runway: {
      api_base: RUNWAY_API_BASE,
      api_version: RUNWAY_API_VERSION,
      video_model: RUNWAY_VIDEO_MODEL,
      duration_seconds: RUNWAY_VIDEO_DURATION,
      ratio: RUNWAY_VIDEO_RATIO,
    },
    generated_assets: {},
  };

  const sourcePreviewAssets = await copySelectedSourceArtifacts(jobId, jobDir, sourceImages);
  manifest.generated_assets.source_previews = sourcePreviewAssets.map((asset) => ({
    file_name: asset.file_name,
    original_name: asset.original_name,
    original_path: asset.original_path,
  }));
  const reviewSourceImages = sourceImages.map((source, index) => ({
    ...source,
    url: sourcePreviewAssets[index]?.url || null,
  }));

  if (!stack.live) {
    const result = {
      ok: false,
      status: "blocked_missing_media_generation_access",
      lane_id: "wrenchready-brand-media",
      preferred_execution_path: "bridge:media_production",
      missing_access: stack.missingAccess,
      summary:
        "Media production lane is not fully configured. Source photos were inspected and prompts are prepared, but AI rendering cannot run yet.",
      next_action:
        "Set RUNWAY_API_KEY in al-bridge/.env and keep SIMON_MEDIA_SOURCE_DIR pointed at C:\\Users\\adamd\\Desktop\\Simon\\simon, then rerun media_production.",
      prompt_pack: promptPack,
      source_images: reviewSourceImages,
      review_page_url: buildPublicJobUrl(jobId, "/review"),
      artifacts: {
        source_preview_urls: sourcePreviewAssets.map((asset) => asset.url),
        poster_url: sourcePreviewAssets[0]?.url || null,
      },
      operator_message:
        `Media production blocked. Missing: ${stack.missingAccess.join(", ") || "unknown"}. ` +
        "This lane needs source photos and RUNWAY_API_KEY for 10-second hosted generation.",
    };

    const reviewHtml = buildReviewHtml({
      ok: false,
      statusLabel: "Blocked - configuration missing",
      summary: result.operator_message,
        sourceImages: reviewSourceImages,
        generatedAssets,
        nextAction: result.next_action,
      });

    await fsp.writeFile(path.join(jobDir, "review.html"), reviewHtml, "utf8");
    await fsp.writeFile(path.join(jobDir, "review-manifest.json"), JSON.stringify({ ...manifest, result }, null, 2), "utf8");
    return result;
  }

  const runwayApiKey = String(process.env.RUNWAY_API_KEY || "").trim();
  const leadImage = sourceImages.find((img) => img.ext !== ".heic" && img.ext !== ".heif") || sourceImages[0];

  if (!leadImage) {
    const result = {
      ok: false,
      status: "blocked_no_usable_source_image",
      lane_id: "wrenchready-brand-media",
      preferred_execution_path: "bridge:media_production",
      missing_access: ["usable_source_images"],
      summary: "No usable source image found for media generation.",
      next_action:
        "Add at least one .jpg/.jpeg/.png/.webp portrait of Simon in C:\\Users\\adamd\\Desktop\\Simon\\simon and rerun media_production.",
      prompt_pack: promptPack,
      source_images: reviewSourceImages,
      review_page_url: buildPublicJobUrl(jobId, "/review"),
      artifacts: {
        source_preview_urls: sourcePreviewAssets.map((asset) => asset.url),
        poster_url: sourcePreviewAssets[0]?.url || null,
      },
      operator_message: "Media production blocked: source photos were not usable for generation.",
    };
    await fsp.writeFile(path.join(jobDir, "review-manifest.json"), JSON.stringify({ ...manifest, result }, null, 2), "utf8");
    return result;
  }

  try {
    const sourceDataUrl = await toDataUrl(leadImage.path, leadImage.ext);
    const createTask = await createRunwayImageToVideoTask({
      apiKey: runwayApiKey,
      model: RUNWAY_VIDEO_MODEL,
      prompt: promptPack.motion_prompt,
      sourceDataUrl,
      ratio: RUNWAY_VIDEO_RATIO,
      duration: RUNWAY_VIDEO_DURATION,
    });
    const taskPayload = await pollRunwayTask(createTask.taskId, runwayApiKey);
    const outputUrl = extractRunwayOutputUrl(taskPayload);
    if (!outputUrl) {
      throw new Error("Runway task completed without a downloadable output URL.");
    }

    const videoFileName = "simon-hero-10s.mp4";
    const videoPath = path.join(jobDir, videoFileName);
    await downloadFile(outputUrl, videoPath);
    generatedAssets.push({
      label: "Open 10s video",
      url: buildArtifactUrl(jobId, videoFileName),
    });

    const gifFileName = "simon-hero-loop.gif";
    const gifPath = path.join(jobDir, gifFileName);
    const gifExport = exportGif(videoPath, gifPath);
    if (gifExport.ok) {
      generatedAssets.push({
        label: "Open GIF preview",
        url: buildArtifactUrl(jobId, gifFileName),
      });
    }

    manifest.generated_assets.video = {
      file_name: videoFileName,
      source_url: outputUrl,
      task_id: createTask.taskId,
    };
    manifest.generated_assets.gif = gifExport.ok
      ? { file_name: gifFileName }
      : { status: "not_generated", reason: gifExport.reason };
    const gifReady = gifExport.ok;
    const gifStatusNote = gifReady
      ? "GIF preview was generated."
      : "GIF export is not available on this bridge runtime (ffmpeg missing).";

    const result = {
      ok: true,
      status: "media_ready_for_review",
      lane_id: "wrenchready-brand-media",
      preferred_execution_path: "bridge:media_production",
      selected_execution_path: "bridge:media_production",
      summary:
        `Generated a 10-second Simon hero motion clip for WrenchReady review. ${gifStatusNote} Source photo selection and prompt pack were stored with this run.`,
      next_action:
        gifReady
          ? "Open the review page, approve the clip/GIF or request style changes, then apply approved assets to wrenchreadymobile.com."
          : "Open the review page, approve the clip or request style changes. Install ffmpeg if you want local GIF export from the generated clip.",
      prompt_pack: promptPack,
      source_images: reviewSourceImages,
      review_page_url: buildPublicJobUrl(jobId, "/review"),
      artifacts: {
        video_url: buildArtifactUrl(jobId, videoFileName),
        gif_url: gifExport.ok ? buildArtifactUrl(jobId, gifFileName) : null,
        source_preview_urls: sourcePreviewAssets.map((asset) => asset.url),
        poster_url: sourcePreviewAssets[0]?.url || null,
      },
      operator_message:
        gifReady
          ? "Brand media package prepared. Review the generated clip and GIF before publishing to production."
          : "Brand media package prepared. Review the generated clip before publishing; GIF export is unavailable on this machine until ffmpeg is installed.",
    };

    const reviewHtml = buildReviewHtml({
      ok: true,
      statusLabel: "Ready for review",
      summary: result.summary,
        sourceImages: reviewSourceImages,
        generatedAssets,
        nextAction: result.next_action,
      });

    await fsp.writeFile(path.join(jobDir, "review.html"), reviewHtml, "utf8");
    await fsp.writeFile(path.join(jobDir, "review-manifest.json"), JSON.stringify({ ...manifest, result }, null, 2), "utf8");
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown media generation error.";
      const result = {
        ok: true,
        status: "media_partial_ready_for_review",
        lane_id: "wrenchready-brand-media",
        preferred_execution_path: "bridge:media_production",
        selected_execution_path: "bridge:media_production",
        missing_access: [],
        summary:
          "Runway rendering failed, but a source-photo fallback review package is ready so website work can continue with real Simon imagery while AI rendering is retried.",
        next_action:
          "Open the review page, choose whether to proceed with the source-photo fallback for the website now, and separately retry Runway after checking quota, permissions, or model settings.",
        prompt_pack: promptPack,
        source_images: reviewSourceImages,
        review_page_url: buildPublicJobUrl(jobId, "/review"),
        artifacts: {
          source_preview_urls: sourcePreviewAssets.map((asset) => asset.url),
          poster_url: sourcePreviewAssets[0]?.url || null,
          video_url: null,
          gif_url: null,
        },
        generation_error: message,
        operator_message:
          `Runway generation failed: ${message}. ` +
          "Fallback ready: selected Simon source photos are packaged for review and can be used for website work now.",
      };

      const reviewHtml = buildReviewHtml({
        ok: true,
        statusLabel: "Partial review package ready",
        summary: result.operator_message,
        sourceImages: reviewSourceImages,
        generatedAssets,
        nextAction: result.next_action,
      });

    await fsp.writeFile(path.join(jobDir, "review.html"), reviewHtml, "utf8");
    await fsp.writeFile(path.join(jobDir, "review-manifest.json"), JSON.stringify({ ...manifest, result }, null, 2), "utf8");
    return result;
  }
}

module.exports = {
  inspectBrandMediaStack,
  runBrandMediaProduction,
  resolveBrandMediaJobDir: resolveJobDir,
  resolveBrandMediaArtifact: resolveJobArtifact,
};
