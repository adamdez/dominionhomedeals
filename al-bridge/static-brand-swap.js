const fs = require("fs");
const fsp = require("fs").promises;
const path = require("path");
const crypto = require("crypto");
const { spawnSync } = require("child_process");

const homeDir = process.env.USERPROFILE || process.env.HOME || "";
const OUTPUT_ROOT = (
  process.env.STATIC_BRAND_SWAP_OUTPUT_ROOT ||
  path.join(__dirname, "output", "static-brand-swap")
).replace(/^["']|["']$/g, "");
const BRIDGE_PUBLIC_BASE_URL = (
  process.env.BRIDGE_PUBLIC_BASE_URL ||
  `http://127.0.0.1:${process.env.BRIDGE_PORT || "3141"}`
).replace(/\/+$/, "");
const BRIDGE_TOKEN = (process.env.BRIDGE_TOKEN || "").trim();

const DEFAULT_SOURCE_IMAGE_PATH = (
  process.env.WRENCHREADY_HERO_SOURCE_PATH ||
  path.join(homeDir, "Desktop", "Simon", "wrenchreadymobile.com", "public", "hero-main-original.png")
).replace(/^["']|["']$/g, "");
const DEFAULT_LOGO_PATH = (
  process.env.WRENCHREADY_LOGO_TRANSPARENT_PATH ||
  path.join(homeDir, "Desktop", "Simon", "Graphics", "03-hd-raster", "wr-logo-full-transparent@2048w.png")
).replace(/^["']|["']$/g, "");

const PRESET_CONFIG = {
  wrenchready_hero_main: {
    title: "WrenchReady Hero Logo Swap Proof",
    summary:
      "Prepare one static review proof from the current WrenchReady hero image with the real WrenchReady logo applied to the hat, shirt, and truck before any production swap.",
    sourceImagePath: DEFAULT_SOURCE_IMAGE_PATH,
    logoPath: DEFAULT_LOGO_PATH,
    placements: [
      {
        target: "hat",
        x: 925,
        y: 138,
        width: 170,
        height: 70,
        patch: { color: [15, 23, 32, 126] },
      },
      {
        target: "shirt",
        x: 1068,
        y: 535,
        width: 165,
        height: 68,
        patch: { color: [16, 24, 34, 116] },
      },
      {
        target: "truck",
        x: 494,
        y: 694,
        width: 250,
        height: 112,
        patch: { color: [248, 248, 246, 205] },
      },
    ],
  },
};

function trimString(value) {
  return String(value || "").trim();
}

function safeSegment(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

function truncate(value, max = 180) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(0, max - 1)).trimEnd()}...`;
}

function buildPublicJobUrl(jobId, suffix = "") {
  const base = `${BRIDGE_PUBLIC_BASE_URL}/image/static-brand-swap/job/${encodeURIComponent(jobId)}${suffix}`;
  if (!BRIDGE_TOKEN) return base;
  return `${base}${base.includes("?") ? "&" : "?"}token=${encodeURIComponent(BRIDGE_TOKEN)}`;
}

function buildArtifactUrl(jobId, fileName) {
  return buildPublicJobUrl(jobId, `/artifact/${encodeURIComponent(fileName)}`);
}

function buildLatestReviewUrl() {
  const base = `${BRIDGE_PUBLIC_BASE_URL}/image/static-brand-swap/latest/review`;
  if (!BRIDGE_TOKEN) return base;
  return `${base}${base.includes("?") ? "&" : "?"}token=${encodeURIComponent(BRIDGE_TOKEN)}`;
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

function pythonCommand() {
  return process.platform === "win32" ? "python" : "python3";
}

function probePythonPillow() {
  try {
    const result = spawnSync(
      pythonCommand(),
      ["-c", "from PIL import Image; print('PIL_OK')"],
      {
        encoding: "utf8",
        timeout: 8000,
        windowsHide: true,
      },
    );

    return {
      pythonAvailable: result.status === 0 || !/not found|not recognized/i.test(String(result.stderr || "")),
      pillowAvailable: result.status === 0 && /PIL_OK/.test(String(result.stdout || "")),
      detail:
        result.status === 0
          ? "Python + Pillow are available."
          : truncate(result.stderr || result.stdout || "Python/Pillow check failed."),
    };
  } catch (error) {
    return {
      pythonAvailable: false,
      pillowAvailable: false,
      detail: error instanceof Error ? error.message : "Python/Pillow check failed.",
    };
  }
}

function resolvePresetConfig(input = {}) {
  const presetId = trimString(input.preset || "wrenchready_hero_main").toLowerCase();
  const preset = PRESET_CONFIG[presetId] || PRESET_CONFIG.wrenchready_hero_main;
  return {
    presetId,
    preset,
    sourceImagePath: trimString(input.source_image_path || preset.sourceImagePath),
    logoPath: trimString(input.logo_path || preset.logoPath),
  };
}

function inspectStaticBrandSwapStack(input = {}) {
  const { presetId, sourceImagePath, logoPath } = resolvePresetConfig(input);
  const pythonStatus = probePythonPillow();
  const missingAccess = [];

  if (!PRESET_CONFIG[presetId]) {
    missingAccess.push("supported preset");
  }
  if (!sourceImagePath || !fs.existsSync(sourceImagePath)) {
    missingAccess.push("source hero image");
  }
  if (!logoPath || !fs.existsSync(logoPath)) {
    missingAccess.push("transparent logo asset");
  }
  if (!pythonStatus.pythonAvailable) {
    missingAccess.push("python runtime");
  }
  if (!pythonStatus.pillowAvailable) {
    missingAccess.push("Pillow image library");
  }

  return {
    live: missingAccess.length === 0,
    missingAccess,
    details: {
      preset: presetId,
      source_image_path: sourceImagePath,
      source_image_exists: Boolean(sourceImagePath && fs.existsSync(sourceImagePath)),
      logo_path: logoPath,
      logo_exists: Boolean(logoPath && fs.existsSync(logoPath)),
      python_available: pythonStatus.pythonAvailable,
      pillow_available: pythonStatus.pillowAvailable,
      python_detail: pythonStatus.detail,
    },
  };
}

function renderReviewHtml(input) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${input.title}</title>
    <style>
      body { margin: 0; background: #f3f8fd; color: #10243b; font-family: Arial, Helvetica, sans-serif; }
      main { width: min(1080px, calc(100vw - 32px)); margin: 24px auto; background: #fff; border: 1px solid #d9e7f3; border-radius: 20px; padding: 24px; box-shadow: 0 16px 42px rgba(16, 36, 59, 0.08); }
      h1 { margin-top: 0; font-size: 32px; }
      h2 { margin: 0 0 10px; font-size: 19px; }
      p { line-height: 1.6; color: #4d6880; }
      .status { display: inline-flex; align-items: center; padding: 10px 14px; border-radius: 999px; font-weight: 700; border: 1px solid #b8e2c1; background: #ecf8ef; color: #1c6b35; }
      .warn { border-color: #f4c898; background: #fff4e8; color: #8a4d10; }
      .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; margin-top: 20px; }
      .card { border: 1px solid #d9e7f3; border-radius: 18px; padding: 18px; background: #fbfdff; }
      .image-wrap { margin-top: 14px; border-radius: 14px; overflow: hidden; border: 1px solid #d9e7f3; background: #f4f8fb; }
      .image-wrap img { display: block; width: 100%; height: auto; }
      ul { margin: 10px 0 0; padding-left: 18px; color: #4d6880; }
      a { color: #1468b0; font-weight: 700; text-decoration: none; }
      a:hover { text-decoration: underline; }
      code { display: block; margin-top: 8px; padding: 8px 10px; border-radius: 10px; background: #eef5fb; color: #274762; font-size: 12px; overflow-wrap: anywhere; }
    </style>
  </head>
  <body>
    <main>
      <h1>${input.title}</h1>
      <div class="status ${input.ok ? "" : "warn"}">${input.statusLabel}</div>
      <p>${input.summary}</p>
      <div class="grid">
        <section class="card">
          <h2>Before</h2>
          <p>Current hero image from the live WrenchReady website source.</p>
          <div class="image-wrap"><img src="${input.beforeUrl}" alt="Current hero image" /></div>
          <p><a href="${input.beforeUrl}">Open original hero image</a></p>
        </section>
        <section class="card">
          <h2>After</h2>
          <p>Static proof with the WrenchReady logo applied to hat, shirt, and truck for review.</p>
          <div class="image-wrap"><img src="${input.afterUrl}" alt="Updated hero proof" /></div>
          <p><a href="${input.afterUrl}">Open proof image</a></p>
        </section>
      </div>
      <div class="grid">
        <section class="card">
          <h2>Placements</h2>
          <ul>${input.placements
            .map((item) => `<li><strong>${item.target}</strong>: ${item.width}x${item.height} at (${item.x}, ${item.y})</li>`)
            .join("")}</ul>
        </section>
        <section class="card">
          <h2>Assets</h2>
          <p><a href="${input.logoUrl}">Open transparent logo asset</a></p>
          <code>${input.sourceImagePath}</code>
          <code>${input.logoPath}</code>
        </section>
      </div>
      <section class="card" style="margin-top:20px;">
        <h2>Next action</h2>
        <p>${input.nextAction}</p>
      </section>
    </main>
  </body>
</html>`;
}

function runPythonComposite({ sourceImagePath, logoPath, outputPath, placements }) {
  const pythonScript = `
import json
import sys
from PIL import Image

source_path, logo_path, output_path, placements_raw = sys.argv[1:5]
placements = json.loads(placements_raw)

base = Image.open(source_path).convert("RGBA")
logo = Image.open(logo_path).convert("RGBA")

for placement in placements:
    x = int(placement["x"])
    y = int(placement["y"])
    width = int(placement["width"])
    height = int(placement["height"])
    patch = placement.get("patch")
    if patch:
        color = tuple(patch.get("color", [255, 255, 255, 0]))
        overlay = Image.new("RGBA", (width, height), color)
        base.alpha_composite(overlay, (x, y))
    resized = logo.resize((width, height))
    base.alpha_composite(resized, (x, y))

base.save(output_path)
print(output_path)
`;

  const result = spawnSync(
    pythonCommand(),
    ["-", sourceImagePath, logoPath, outputPath, JSON.stringify(placements)],
    {
      input: pythonScript,
      encoding: "utf8",
      timeout: 25_000,
      windowsHide: true,
    },
  );

  if (result.status !== 0 || !fs.existsSync(outputPath)) {
    throw new Error(
      truncate(result.stderr || result.stdout || "Static brand swap composite failed."),
    );
  }
}

async function runStaticBrandSwap(input = {}) {
  const { presetId, preset, sourceImagePath, logoPath } = resolvePresetConfig(input);
  const stack = inspectStaticBrandSwapStack({ preset: presetId, source_image_path: sourceImagePath, logo_path: logoPath });
  const jobId = `static-brand-swap-${Date.now()}-${safeSegment(crypto.randomBytes(3).toString("hex"))}`;
  const jobDir = path.join(OUTPUT_ROOT, jobId);
  await fsp.mkdir(jobDir, { recursive: true });

  const beforeFileName = "before-hero.png";
  const afterFileName = "after-hero-proof.png";
  const logoFileName = `logo${path.extname(logoPath || ".png").toLowerCase() || ".png"}`;
  const beforePath = path.join(jobDir, beforeFileName);
  const afterPath = path.join(jobDir, afterFileName);
  const copiedLogoPath = path.join(jobDir, logoFileName);

  const beforeUrl = buildArtifactUrl(jobId, beforeFileName);
  const afterUrl = buildArtifactUrl(jobId, afterFileName);
  const logoUrl = buildArtifactUrl(jobId, logoFileName);
  const reviewPageUrl = buildPublicJobUrl(jobId, "/review");

  const manifest = {
    job_id: jobId,
    created_at: new Date().toISOString(),
    lane_id: "wrenchready-static-brand-swap",
    preset: presetId,
    source_image_path: sourceImagePath,
    logo_path: logoPath,
    placements: preset.placements,
  };

  if (sourceImagePath && fs.existsSync(sourceImagePath)) {
    await fsp.copyFile(sourceImagePath, beforePath);
  }
  if (logoPath && fs.existsSync(logoPath)) {
    await fsp.copyFile(logoPath, copiedLogoPath);
  }

  if (!stack.live) {
    const result = {
      ok: false,
      status: "blocked_missing_static_brand_swap_access",
      lane_id: "wrenchready-static-brand-swap",
      preferred_execution_path: "bridge:static_brand_swap",
      selected_execution_path: "blocked:static_brand_swap",
      missing_access: stack.missingAccess,
      summary:
        "Static brand swap could not run yet because a required local edit dependency is missing.",
      next_action:
        "Restore the missing source image, transparent logo asset, or Pillow image support, then rerun the static brand swap proof.",
      review_page_url: reviewPageUrl,
      latest_review_url: buildLatestReviewUrl(),
      artifacts: {
        before_url: fs.existsSync(beforePath) ? beforeUrl : null,
        after_url: null,
        logo_url: fs.existsSync(copiedLogoPath) ? logoUrl : null,
      },
      operator_message:
        `Static brand swap blocked. Missing: ${stack.missingAccess.join(", ") || "unknown"}.`,
      preset: presetId,
      placements: preset.placements,
      error: stack.details.python_detail,
    };

    const reviewHtml = renderReviewHtml({
      ok: false,
      title: preset.title,
      statusLabel: "Blocked - setup missing",
      summary: result.operator_message,
      beforeUrl: fs.existsSync(beforePath) ? beforeUrl : "",
      afterUrl: fs.existsSync(beforePath) ? beforeUrl : "",
      logoUrl: fs.existsSync(copiedLogoPath) ? logoUrl : "#",
      sourceImagePath,
      logoPath,
      placements: preset.placements,
      nextAction: result.next_action,
    });
    await fsp.writeFile(path.join(jobDir, "review.html"), reviewHtml, "utf8");
    await fsp.writeFile(path.join(jobDir, "review-manifest.json"), JSON.stringify({ ...manifest, result }, null, 2), "utf8");
    return result;
  }

  try {
    runPythonComposite({
      sourceImagePath,
      logoPath,
      outputPath: afterPath,
      placements: preset.placements,
    });

    const result = {
      ok: true,
      status: "static_brand_swap_ready_for_review",
      lane_id: "wrenchready-static-brand-swap",
      preferred_execution_path: "bridge:static_brand_swap",
      selected_execution_path: "bridge:static_brand_swap",
      summary: preset.summary,
      next_action:
        "Open the review page, confirm the hat, shirt, and truck logo placements, then swap the approved proof into the WrenchReady hero image.",
      review_page_url: reviewPageUrl,
      latest_review_url: buildLatestReviewUrl(),
      artifacts: {
        before_url: beforeUrl,
        after_url: afterUrl,
        logo_url: logoUrl,
      },
      operator_message:
        "Static logo-swap proof is ready. Review the updated hero image before replacing production.",
      preset: presetId,
      placements: preset.placements,
      business_id: trimString(input.business_id || "wrenchready"),
      owner: trimString(input.owner || "Tom"),
    };

    const reviewHtml = renderReviewHtml({
      ok: true,
      title: preset.title,
      statusLabel: "Ready for review",
      summary: result.summary,
      beforeUrl,
      afterUrl,
      logoUrl,
      sourceImagePath,
      logoPath,
      placements: preset.placements,
      nextAction: result.next_action,
    });

    await fsp.writeFile(path.join(jobDir, "review.html"), reviewHtml, "utf8");
    await fsp.writeFile(path.join(jobDir, "review-manifest.json"), JSON.stringify({ ...manifest, result }, null, 2), "utf8");
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown static brand swap error.";
    const result = {
      ok: false,
      status: "failed_static_brand_swap",
      lane_id: "wrenchready-static-brand-swap",
      preferred_execution_path: "bridge:static_brand_swap",
      selected_execution_path: "bridge:static_brand_swap",
      summary:
        "Static logo replacement started but failed before the proof image was written.",
      next_action:
        "Inspect the local static brand swap worker, verify Pillow can open both image files, and rerun the proof.",
      review_page_url: reviewPageUrl,
      latest_review_url: buildLatestReviewUrl(),
      artifacts: {
        before_url: fs.existsSync(beforePath) ? beforeUrl : null,
        after_url: null,
        logo_url: fs.existsSync(copiedLogoPath) ? logoUrl : null,
      },
      operator_message: `Static brand swap failed: ${message}`,
      preset: presetId,
      placements: preset.placements,
      error: message,
    };

    const reviewHtml = renderReviewHtml({
      ok: false,
      title: preset.title,
      statusLabel: "Execution failed",
      summary: result.operator_message,
      beforeUrl: fs.existsSync(beforePath) ? beforeUrl : "",
      afterUrl: fs.existsSync(beforePath) ? beforeUrl : "",
      logoUrl: fs.existsSync(copiedLogoPath) ? logoUrl : "#",
      sourceImagePath,
      logoPath,
      placements: preset.placements,
      nextAction: result.next_action,
    });
    await fsp.writeFile(path.join(jobDir, "review.html"), reviewHtml, "utf8");
    await fsp.writeFile(path.join(jobDir, "review-manifest.json"), JSON.stringify({ ...manifest, result }, null, 2), "utf8");
    return result;
  }
}

module.exports = {
  inspectStaticBrandSwapStack,
  runStaticBrandSwap,
  resolveStaticBrandSwapJobDir: resolveJobDir,
  resolveStaticBrandSwapArtifact: resolveJobArtifact,
};
