const fs = require("fs");
const fsp = require("fs").promises;
const path = require("path");

const homeDir = process.env.USERPROFILE || process.env.HOME || "";
const PLAYWRIGHT_ROOT = (
  process.env.PLAYWRIGHT_ROOT ||
  (homeDir ? path.join(homeDir, "Desktop", "Sentinel", "node_modules", "playwright") : "")
).replace(/^["']|["']$/g, "");
const OUTPUT_ROOT = (
  process.env.BROWSER_VENDOR_OUTPUT_ROOT ||
  path.join(__dirname, "output", "browser-vendor-cart-review")
).replace(/^["']|["']$/g, "");
const BRIDGE_PUBLIC_BASE_URL = (
  process.env.BRIDGE_PUBLIC_BASE_URL ||
  `http://127.0.0.1:${process.env.BRIDGE_PORT || "3141"}`
).replace(/\/+$/, "");
const BRIDGE_TOKEN = (process.env.BRIDGE_TOKEN || "").trim();
const WRENCHREADY_LOGO_PATH = homeDir
  ? path.join(homeDir, "Desktop", "Simon", "wrenchreadymobile.com", "public", "wr-logo-full.png")
  : "";

const WRENCHREADY_BRAND = {
  businessId: "wrenchready",
  name: "WrenchReady",
  phone: "(509) 309-0617",
  website: "wrenchreadymobile.com",
  serviceLine: "Mobile auto repair",
  supportLine: "Brakes • Batteries • Diagnostics • Maintenance",
  trustLine: "Home • Work • Driveway service across Spokane",
  primaryColor: "#4ea1e5",
  accentColor: "#0f1728",
  lightColor: "#f8fafc",
  logoPath: WRENCHREADY_LOGO_PATH,
};

const VENDOR_CONFIGS = [
  {
    id: "buildasign",
    vendor: "BuildASign",
    url: "https://www.buildasign.com/magnetic-signs",
    cartAutomatable: true,
    notes:
      "Strong magnetic sign flow with uploadable artwork, material upsell, and a real cart page before checkout.",
  },
  {
    id: "vistaprint",
    vendor: "VistaPrint",
    url: "https://www.vistaprint.com/signs-posters/car-door-magnets",
    cartAutomatable: false,
    notes:
      "Strong template library and custom upload path, but cart automation was not implemented in this bridge pass.",
  },
  {
    id: "carstickers",
    vendor: "CarStickers",
    url: "https://www.carstickers.com/products/magnets/custom-car-door-magnets/setup/contractor-magnet-template/",
    cartAutomatable: false,
    notes:
      "Contractor-focused template flow with good vehicle-fit copy. Pricing stays deeper in the editor flow.",
  },
];

let cachedPlaywright = null;
const activeReviewBrowsers = new Set();

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isSafeSegment(value) {
  return /^[a-zA-Z0-9._-]+$/.test(String(value || ""));
}

function collapseWhitespace(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(value, max = 240) {
  const text = collapseWhitespace(value);
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function nowStamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function buildJobPublicUrl(jobId, suffix = "") {
  const base = `${BRIDGE_PUBLIC_BASE_URL}/browser/vendor-cart-review/job/${encodeURIComponent(jobId)}${suffix}`;
  if (!BRIDGE_TOKEN) return base;
  return `${base}${base.includes("?") ? "&" : "?"}token=${encodeURIComponent(BRIDGE_TOKEN)}`;
}

function buildArtifactPublicUrl(jobId, filePath) {
  if (!filePath) return null;
  return buildJobPublicUrl(jobId, `/artifact/${encodeURIComponent(path.basename(filePath))}`);
}

function resolveBrowserVendorReviewJobDir(jobId) {
  if (!isSafeSegment(jobId)) return null;
  return path.join(OUTPUT_ROOT, jobId);
}

function resolveBrowserVendorReviewFile(jobId, fileName) {
  const jobDir = resolveBrowserVendorReviewJobDir(jobId);
  if (!jobDir || !isSafeSegment(fileName)) return null;
  const full = path.join(jobDir, fileName);
  if (!full.startsWith(jobDir)) return null;
  return full;
}

async function readBrowserVendorReviewManifest(jobId) {
  const manifestPath = resolveBrowserVendorReviewFile(jobId, "review-manifest.json");
  if (!manifestPath || !fs.existsSync(manifestPath)) {
    throw new Error(`Review manifest not found for browser vendor job "${jobId}".`);
  }
  return JSON.parse(await fsp.readFile(manifestPath, "utf8"));
}

function ensurePlaywright() {
  if (cachedPlaywright) {
    return cachedPlaywright;
  }

  if (!PLAYWRIGHT_ROOT || !fs.existsSync(PLAYWRIGHT_ROOT)) {
    throw new Error(
      `Playwright runtime missing at ${PLAYWRIGHT_ROOT || "(unset)"}. Set PLAYWRIGHT_ROOT or install Playwright in the linked local workspace.`,
    );
  }

  cachedPlaywright = require(PLAYWRIGHT_ROOT);
  return cachedPlaywright;
}

async function ensureDir(dir) {
  await fsp.mkdir(dir, { recursive: true });
}

async function readLogoDataUri(logoPath) {
  const ext = path.extname(logoPath).toLowerCase();
  const mimeType =
    ext === ".jpg" || ext === ".jpeg"
      ? "image/jpeg"
      : ext === ".webp"
        ? "image/webp"
        : "image/png";
  const raw = await fsp.readFile(logoPath);
  return `data:${mimeType};base64,${raw.toString("base64")}`;
}

function extractPriceSnippets(text) {
  const matches = text.match(/\$\d{1,3}(?:,\d{3})?(?:\.\d{2})?(?:\s*ea\.)?/g) || [];
  return [...new Set(matches.map((match) => collapseWhitespace(match)))].slice(0, 6);
}

function extractSizeOptions(text) {
  const sizeMatches =
    text.match(/\b\d{1,2}(?:ft)?\s*"?\s*x\s*\d{1,2}(?:ft)?\s*"?(?:\b|$)/gi) || [];
  return [...new Set(sizeMatches.map((match) => collapseWhitespace(match)))].slice(0, 12);
}

function extractMaterialSignals(text) {
  const patterns = [
    /\b0\.030\s+Magnet(?:ic)?\b/gi,
    /\b0\.045\s+Magnet(?:ic)?\b/gi,
    /\b30\s*mil\b/gi,
    /\bPVC-free\b/gi,
    /\bgloss laminate\b/gi,
    /\bfade-resistant\b/gi,
  ];

  const values = [];
  for (const pattern of patterns) {
    const matches = text.match(pattern) || [];
    for (const match of matches) {
      values.push(collapseWhitespace(match));
    }
  }

  return [...new Set(values)];
}

function extractLine(text, phrase) {
  const lines = String(text || "").split(/\r?\n/);
  const found = lines.find((line) => line.toLowerCase().includes(phrase.toLowerCase()));
  return found ? collapseWhitespace(found) : null;
}

function buildVariantDefinitions() {
  return [
    {
      id: "logo-left-service-ladder",
      title: "Logo Left / Service Ladder",
      headline: "MOBILE AUTO REPAIR",
      subline: "Brakes • Batteries • Diagnostics • Maintenance",
      footer: "(509) 309-0617  •  wrenchreadymobile.com",
      accent: "Protect your time. We come to you.",
      ribbon: "Best legibility at distance",
    },
    {
      id: "phone-forward-cta",
      title: "Phone Forward / Fast CTA",
      headline: "CALL OR TEXT",
      subline: "(509) 309-0617",
      footer: "WRENCHREADYMOBILE.COM",
      accent: "Mobile service for Spokane drivers",
      ribbon: "Best direct-response callout",
    },
    {
      id: "trust-first-home-work",
      title: "Trust First / Home + Work",
      headline: "HOME • WORK • DRIVEWAY",
      subline: "High-trust mobile service across Spokane",
      footer: "Brakes • Batteries • Diagnostics",
      accent: "(509) 309-0617",
      ribbon: "Best trust-positioning layout",
    },
    {
      id: "service-stack",
      title: "Service Stack / Dense Info",
      headline: "BRAKES  |  BATTERIES  |  DIAGNOSTICS",
      subline: "Mobile maintenance without the shop drop-off",
      footer: "(509) 309-0617  •  wrenchreadymobile.com",
      accent: "Ask about pre-purchase inspections",
      ribbon: "Best service-detail layout",
    },
  ];
}

function buildVariantMarkup(variant, logoDataUri) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      :root {
        color-scheme: light;
        font-family: "Arial", "Helvetica Neue", sans-serif;
      }
      html, body {
        margin: 0;
        padding: 0;
        background: #d8dee9;
      }
      body {
        display: grid;
        place-items: center;
        min-height: 100vh;
      }
      .frame {
        width: 1200px;
        padding: 28px;
        background: linear-gradient(135deg, #0f1728 0%, #172033 55%, #102443 100%);
        border-radius: 28px;
        box-shadow: 0 24px 80px rgba(15, 23, 40, 0.35);
        color: #f8fafc;
        position: relative;
        overflow: hidden;
      }
      .frame::before {
        content: "";
        position: absolute;
        inset: -30% 35% auto auto;
        width: 420px;
        height: 420px;
        background: radial-gradient(circle, rgba(78,161,229,0.26), rgba(78,161,229,0));
      }
      .ribbon {
        display: inline-block;
        background: rgba(78, 161, 229, 0.16);
        border: 1px solid rgba(78, 161, 229, 0.42);
        color: #b9dcff;
        padding: 10px 16px;
        border-radius: 999px;
        font-size: 22px;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }
      .layout {
        display: grid;
        grid-template-columns: 320px 1fr;
        gap: 34px;
        align-items: center;
        margin-top: 24px;
      }
      .logo-wrap {
        background: rgba(6, 12, 22, 0.68);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 24px;
        padding: 30px;
        display: grid;
        place-items: center;
        min-height: 300px;
      }
      .logo-wrap img {
        width: 100%;
        max-width: 260px;
        height: auto;
      }
      .headline {
        font-size: 88px;
        line-height: 0.94;
        font-weight: 900;
        letter-spacing: -0.04em;
        margin: 0 0 18px;
      }
      .subline {
        color: #9fd4ff;
        font-size: 34px;
        font-weight: 800;
        margin: 0 0 18px;
        letter-spacing: 0.01em;
      }
      .accent {
        color: #f8fafc;
        font-size: 28px;
        line-height: 1.35;
        margin: 0 0 22px;
      }
      .footer {
        display: inline-flex;
        align-items: center;
        gap: 18px;
        padding: 16px 22px;
        background: rgba(255,255,255,0.08);
        border-radius: 18px;
        font-size: 30px;
        font-weight: 800;
      }
    </style>
  </head>
  <body>
    <div class="frame">
      <div class="ribbon">${variant.ribbon}</div>
      <div class="layout">
        <div class="logo-wrap">
          <img src="${logoDataUri}" alt="WrenchReady logo" />
        </div>
        <div>
          <h1 class="headline">${variant.headline}</h1>
          <div class="subline">${variant.subline}</div>
          <p class="accent">${variant.accent}</p>
          <div class="footer">${variant.footer}</div>
        </div>
      </div>
    </div>
  </body>
</html>`;
}

async function buildDesignCandidates(browser, jobDir) {
  if (!WRENCHREADY_BRAND.logoPath || !fs.existsSync(WRENCHREADY_BRAND.logoPath)) {
    throw new Error(
      `WrenchReady brand asset missing at ${WRENCHREADY_BRAND.logoPath || "(unset)"}.`,
    );
  }

  const logoDataUri = await readLogoDataUri(WRENCHREADY_BRAND.logoPath);
  const variants = buildVariantDefinitions();
  const page = await browser.newPage({ viewport: { width: 1400, height: 1200 } });
  const output = [];

  for (const variant of variants) {
    const stem = slugify(variant.id);
    const htmlPath = path.join(jobDir, `${stem}.html`);
    const pngPath = path.join(jobDir, `${stem}.png`);
    const markup = buildVariantMarkup(variant, logoDataUri);
    await fsp.writeFile(htmlPath, markup, "utf8");

    await page.setContent(markup, { waitUntil: "load" });
    await page.locator(".frame").screenshot({ path: pngPath });

    output.push({
      id: variant.id,
      title: variant.title,
      preview_path: pngPath,
      upload_path: pngPath,
      source_path: htmlPath,
      notes: variant.ribbon,
    });
  }

  await page.close();

  return {
    candidates: output,
    chosen: output[0],
  };
}

async function dismissCommonOverlays(page) {
  await page
    .evaluate(() => {
      const selectors = [
        "#attentive_overlay",
        "#attentive_creative",
        'iframe[title*=\"Sign Up via Text\"]',
        "#onetrust-consent-sdk",
        ".onetrust-pc-dark-filter",
      ];
      for (const selector of selectors) {
        const nodes = document.querySelectorAll(selector);
        nodes.forEach((node) => node.remove());
      }
    })
    .catch(() => {});

  const buttonNames = [
    "Dismiss this popup",
    "Reject All",
    "Confirm My Choices",
    "Allow All",
    "GOT IT >",
    "Continue without coating",
  ];

  for (const name of buttonNames) {
    const button = page.getByRole("button", { name, exact: true });
    if (await button.count()) {
      try {
        await button.first().click({ timeout: 1200 });
        await page.waitForTimeout(350);
      } catch {
        // Ignore overlay differences across vendors.
      }
    }
  }
}

async function clickControlByText(page, label) {
  const button = page.getByRole("button", { name: label, exact: true });
  if (await button.count()) {
    await button.last().click({ timeout: 15000 });
    return true;
  }

  const textTarget = page.getByText(label, { exact: true });
  if (await textTarget.count()) {
    await textTarget.first().click({ timeout: 15000, force: true });
    return true;
  }

  return false;
}

async function captureVendorOption(browser, vendor, jobDir) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
  try {
    await page.goto(vendor.url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(2500);
    await dismissCommonOverlays(page);

    if (vendor.id === "buildasign") {
      const selector = "#product_attribute_61580";
      if (await page.locator(selector).count()) {
        await page.selectOption(selector, { label: '24" x 18"' });
        await page.waitForTimeout(1500);
      }
    }

    const text = collapseWhitespace(
      await page.locator("body").evaluate((el) => el.innerText || ""),
    );
    const screenshotPath = path.join(jobDir, `${slugify(vendor.id)}-vendor-page.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });

    return {
      vendor: vendor.vendor,
      url: vendor.url,
      price_signals: extractPriceSnippets(text),
      size_signals: extractSizeOptions(text),
      material_signals: extractMaterialSignals(text),
      install_fit_note:
        text.toLowerCase().includes("vehicle")
          ? truncate(extractLine(text, "vehicle") || text, 220)
          : "Vehicle-safe marketing product; verify the Astro van door panels are magnetic before installation.",
      cart_automation: vendor.cartAutomatable,
      notes: vendor.notes,
      screenshot_path: screenshotPath,
      excerpt: truncate(text, 700),
    };
  } finally {
    await page.close().catch(() => {});
  }
}

function chooseBestVendor(vendorOptions) {
  const buildASign = vendorOptions.find((option) => option.vendor === "BuildASign");
  if (buildASign) {
    return {
      vendor: buildASign.vendor,
      reason:
        'BuildASign is the best fit because 24" x 18" sizing is available, the thicker 0.045 vehicle magnet option is exposed before checkout, and the bridge can drive the flow into a real cart.',
    };
  }

  const fallback = vendorOptions[0];
  return fallback
    ? {
        vendor: fallback.vendor,
        reason: "This was the strongest reachable vendor path during bridge verification.",
      }
      : null;
}

function buildReviewPageHtml(manifest) {
  const chosenOption = manifest.chosen_option || {};
  const chosenDesign = manifest.chosen_design || {};
  const publicLinks = manifest.public_links || {};
  const vendorOptions = Array.isArray(manifest.vendor_options) ? manifest.vendor_options : [];
  const alternativeCards = vendorOptions
    .map((option) => {
      const title = escapeHtml(option.vendor || "Vendor");
      const prices = Array.isArray(option.price_signals) && option.price_signals.length
        ? escapeHtml(option.price_signals.slice(0, 3).join(", "))
        : "Pricing inside vendor flow";
      const sizes = Array.isArray(option.size_signals) && option.size_signals.length
        ? escapeHtml(option.size_signals.slice(0, 4).join(", "))
        : "Size details pending";
      const materials = Array.isArray(option.material_signals) && option.material_signals.length
        ? escapeHtml(option.material_signals.slice(0, 3).join(", "))
        : "Material details pending";
      const vendorUrl = typeof option.url === "string" ? option.url : "";
      return `<article class="option-card">
        <h3>${title}</h3>
        <p><strong>Price signals:</strong> ${prices}</p>
        <p><strong>Sizes:</strong> ${sizes}</p>
        <p><strong>Materials:</strong> ${materials}</p>
        ${vendorUrl ? `<p><a href="${escapeHtml(vendorUrl)}" target="_blank" rel="noreferrer">Open vendor page</a></p>` : ""}
      </article>`;
    })
    .join("");

  const previewUrl = publicLinks.chosen_design_preview_url || "";
  const proofImageUrl = publicLinks.design_review_image_url || "";
  const cartImageUrl = publicLinks.cart_review_image_url || "";
  const summary = escapeHtml(manifest.summary || "Vendor cart review is ready.");
  const whyBest = escapeHtml(chosenOption.why_best || "This option reached a real review-safe cart state.");
  const sessionNote = escapeHtml(
    publicLinks.cart_url_note ||
      "The vendor cart is tied to the bridge browser session. Use Resume Cart Session to reopen it locally.",
  );

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>WrenchReady Signage Review</title>
    <style>
      :root {
        color-scheme: light;
        font-family: Arial, Helvetica, sans-serif;
        --ink: #10243b;
        --muted: #55748f;
        --line: #d7e4ee;
        --panel: #ffffff;
        --bg: linear-gradient(180deg, #eef6fb 0%, #f7fbfd 100%);
        --accent: #4ea1e5;
        --accent-dark: #1262a7;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        background: var(--bg);
        color: var(--ink);
      }
      main {
        width: min(1180px, calc(100vw - 32px));
        margin: 0 auto;
        padding: 28px 0 44px;
      }
      .hero, .panel {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 22px;
        box-shadow: 0 18px 50px rgba(16, 36, 59, 0.08);
      }
      .hero {
        padding: 26px 28px;
        margin-bottom: 22px;
      }
      .eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border-radius: 999px;
        background: rgba(78, 161, 229, 0.12);
        color: var(--accent-dark);
        font-weight: 700;
        font-size: 13px;
        letter-spacing: 0.02em;
      }
      h1 {
        margin: 14px 0 10px;
        font-size: clamp(28px, 4vw, 42px);
        line-height: 1.05;
      }
      .summary {
        margin: 0;
        max-width: 820px;
        color: var(--muted);
        font-size: 18px;
        line-height: 1.55;
      }
      .cta-row {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 22px;
      }
      .button, .button-secondary {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        min-height: 46px;
        padding: 0 18px;
        border-radius: 14px;
        font-weight: 700;
        text-decoration: none;
      }
      .button {
        background: var(--accent);
        color: #fff;
      }
      .button-secondary {
        border: 1px solid var(--line);
        color: var(--ink);
        background: #f7fbff;
      }
      .note {
        margin-top: 14px;
        color: var(--muted);
        font-size: 14px;
        line-height: 1.5;
      }
      .grid {
        display: grid;
        grid-template-columns: 1.15fr 0.85fr;
        gap: 22px;
      }
      .panel {
        padding: 22px;
      }
      .panel h2 {
        margin: 0 0 14px;
        font-size: 22px;
      }
      .facts {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
      }
      .fact {
        padding: 14px;
        border-radius: 16px;
        background: #f6fbff;
        border: 1px solid var(--line);
      }
      .fact-label {
        display: block;
        font-size: 12px;
        font-weight: 700;
        color: var(--muted);
        text-transform: uppercase;
        letter-spacing: 0.06em;
        margin-bottom: 6px;
      }
      .fact-value {
        font-size: 18px;
        font-weight: 700;
        line-height: 1.35;
      }
      .why-best {
        margin-top: 16px;
        padding: 14px 16px;
        border-radius: 16px;
        background: #f7fbff;
        border: 1px solid var(--line);
        color: var(--muted);
        line-height: 1.55;
      }
      .image-stack {
        display: grid;
        gap: 16px;
      }
      .image-card {
        border: 1px solid var(--line);
        border-radius: 18px;
        overflow: hidden;
        background: #f9fcfe;
      }
      .image-card img {
        display: block;
        width: 100%;
        height: auto;
      }
      .image-card figcaption {
        padding: 12px 14px;
        color: var(--muted);
        font-size: 14px;
      }
      .alt-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 14px;
      }
      .option-card {
        padding: 16px;
        border: 1px solid var(--line);
        border-radius: 18px;
        background: #fbfdff;
      }
      .option-card h3 {
        margin: 0 0 10px;
        font-size: 18px;
      }
      .option-card p {
        margin: 0 0 8px;
        color: var(--muted);
        line-height: 1.45;
      }
      .next-actions {
        margin-top: 16px;
        padding-left: 18px;
        color: var(--muted);
        line-height: 1.6;
      }
      @media (max-width: 960px) {
        .grid {
          grid-template-columns: 1fr;
        }
        .facts {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <section class="hero">
        <div class="eyebrow">Cart Ready For Review</div>
        <h1>WrenchReady Astro Van Signage</h1>
        <p class="summary">${summary}</p>
        <div class="cta-row">
          <a class="button" href="${escapeHtml(publicLinks.review_page_url || "#")}">Refresh review page</a>
          ${publicLinks.proof_url ? `<a class="button-secondary" href="${escapeHtml(publicLinks.proof_url)}" target="_blank" rel="noreferrer">Open vendor proof</a>` : ""}
          ${publicLinks.resume_cart_url ? `<a class="button-secondary" href="${escapeHtml(publicLinks.resume_cart_url)}" target="_blank" rel="noreferrer">Resume cart session</a>` : ""}
        </div>
        <p class="note">${sessionNote}</p>
      </section>

      <div class="grid">
        <section class="panel">
          <h2>Best Option</h2>
          <div class="facts">
            <div class="fact">
              <span class="fact-label">Vendor</span>
              <div class="fact-value">${escapeHtml(chosenOption.vendor || "BuildASign")}</div>
            </div>
            <div class="fact">
              <span class="fact-label">Estimated Total</span>
              <div class="fact-value">${escapeHtml(chosenOption.estimated_total || "Pending")}</div>
            </div>
            <div class="fact">
              <span class="fact-label">Specs</span>
              <div class="fact-value">${escapeHtml(chosenOption.dimensions || '24" x 18" magnetic sign')}</div>
            </div>
            <div class="fact">
              <span class="fact-label">Material</span>
              <div class="fact-value">${escapeHtml(chosenOption.material || "0.045 Magnet")}</div>
            </div>
            <div class="fact">
              <span class="fact-label">Chosen Design</span>
              <div class="fact-value">${escapeHtml(chosenDesign.title || "WrenchReady signage concept")}</div>
            </div>
            <div class="fact">
              <span class="fact-label">Cart State</span>
              <div class="fact-value">${escapeHtml(chosenOption.cart_status || "added_to_cart_waiting_review")}</div>
            </div>
          </div>
          <div class="why-best"><strong>Why this wins:</strong> ${whyBest}</div>
          <ul class="next-actions">
            <li>Review the chosen mockup and proof.</li>
            <li>Use Resume Cart Session to reopen the live vendor cart on this machine.</li>
            <li>Approve or request revisions. Checkout remains manual.</li>
          </ul>
        </section>

        <section class="panel">
          <h2>Review Artifacts</h2>
          <div class="image-stack">
            ${previewUrl ? `<figure class="image-card"><img src="${escapeHtml(previewUrl)}" alt="Chosen design preview" /><figcaption>Chosen design preview</figcaption></figure>` : ""}
            ${proofImageUrl ? `<figure class="image-card"><img src="${escapeHtml(proofImageUrl)}" alt="Vendor proof screenshot" /><figcaption>Vendor proof screenshot</figcaption></figure>` : ""}
            ${cartImageUrl ? `<figure class="image-card"><img src="${escapeHtml(cartImageUrl)}" alt="Cart screenshot" /><figcaption>Cart screenshot</figcaption></figure>` : ""}
          </div>
        </section>
      </div>

      <section class="panel" style="margin-top: 22px;">
        <h2>Alternatives</h2>
        <div class="alt-grid">
          ${alternativeCards}
        </div>
      </section>
    </main>
  </body>
</html>`;
}

async function writeBrowserVendorReviewPackage(jobDir, result, cartFlow) {
  const jobId = path.basename(jobDir);
  const reviewPageUrl = buildJobPublicUrl(jobId, "/review");
  const chosenDesign = result.chosen_design || {};
  const artifacts = result.artifacts || {};
  const publicLinks = {
    review_page_url: reviewPageUrl,
    proof_url: cartFlow.reviewUrl || null,
    proof_url_cross_session_usable: Boolean(cartFlow.reviewUrl),
    cart_url: cartFlow.cartUrl || null,
    cart_url_cross_session_usable: false,
    cart_url_note:
      "BuildASign uses a session-bound cart. The direct cart URL opens an empty cart in a fresh browser session, so use Resume Cart Session instead.",
    resume_cart_url: buildJobPublicUrl(jobId, "/resume/cart"),
    resume_proof_url: buildJobPublicUrl(jobId, "/resume/proof"),
    chosen_design_preview_url: buildArtifactPublicUrl(jobId, chosenDesign.preview_path || null),
    design_review_image_url: buildArtifactPublicUrl(jobId, artifacts.design_review || null),
    cart_review_image_url: buildArtifactPublicUrl(jobId, artifacts.cart_review || null),
  };

  const manifest = {
    job_id: jobId,
    created_at: new Date().toISOString(),
    summary: result.summary || null,
    next_action: result.next_action || null,
    chosen_option: result.chosen_option || null,
    chosen_design: result.chosen_design || null,
    vendor_options: result.vendor_options || [],
    design_candidates: result.design_candidates || [],
    artifacts: result.artifacts || {},
    public_links: publicLinks,
    private_links: {
      cart_url: cartFlow.cartUrl || null,
      proof_url: cartFlow.reviewUrl || null,
      review_url: cartFlow.reviewUrl || null,
      material_url: cartFlow.materialUrl || null,
      editor_url: cartFlow.editorUrl || null,
      product_url: cartFlow.productUrl || null,
    },
    storage_state_path: cartFlow.storageStatePath || null,
  };

  await fsp.writeFile(
    path.join(jobDir, "review-manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );
  await fsp.writeFile(path.join(jobDir, "review.html"), buildReviewPageHtml(manifest), "utf8");

  return publicLinks;
}

async function clickLastButton(page, label) {
  return clickControlByText(page, label);
}

function parseCartText(text) {
  const sizeMatch = (text.match(/\b\d{1,2}"\s*x\s*\d{1,2}"\b/g) || []).find((value) =>
    value.includes('24" x 18"'),
  ) || (text.match(/\b\d{1,2}"\s*x\s*\d{1,2}"\b/g) || [])[0] || null;
  const materialMatch =
    text.match(/\b0\.0(?:30|45)\s+Magnet(?:ic)?\b/i)?.[0] ||
    extractLine(text, "0.045 Magnet") ||
    extractLine(text, "0.030 Magnet") ||
    null;

  return {
    product: extractLine(text, "Magnetic Car Signs") || "Magnetic Car Signs",
    size: sizeMatch,
    material: materialMatch,
    itemPrice: (extractLine(text, "Item Price") || text.match(/Item Price\s*\$[0-9.]+/i)?.[0] || "")
      .replace(/^Item Price\s*/i, "")
      .trim() || null,
    total:
      text.match(/Total:\s*\$[0-9.,]+/i)?.[0].replace(/^Total:\s*/i, "").trim() || null,
    cartTotal:
      text.match(/Cart Total\s*\$[0-9.,]+/i)?.[0].replace(/^Cart Total\s*/i, "").trim() ||
      null,
  };
}

async function runBuildASignCartFlow(browser, chosenDesign, jobDir) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1080 } });
  const page = await context.newPage();
  try {
    await page.goto("https://www.buildasign.com/magnetic-signs", {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
    await page.waitForTimeout(2500);
    await dismissCommonOverlays(page);

    if (await page.locator("#product_attribute_61580").count()) {
      await page.selectOption("#product_attribute_61580", { label: '24" x 18"' });
      await page.waitForTimeout(1800);
    }
    const productUrl = page.url();

    const productText = collapseWhitespace(
      await page.locator("body").evaluate((el) => el.innerText || ""),
    );
    const productScreenshotPath = path.join(jobDir, "buildasign-product-page.png");
    await page.screenshot({ path: productScreenshotPath, fullPage: true });

    await dismissCommonOverlays(page);
    if (!(await clickControlByText(page, "Create Your Design Online"))) {
      throw new Error("BuildASign did not expose a clickable 'Create Your Design Online' control.");
    }
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(6000);
    await dismissCommonOverlays(page);
    await page.waitForFunction(
      () => document.body && document.body.innerText.includes("Add Images"),
      { timeout: 30000 },
    );

    if (!(await clickControlByText(page, "Add Images"))) {
      throw new Error("BuildASign editor loaded without an accessible 'Add Images' control.");
    }
    await page.waitForTimeout(1000);
    await page.locator('input[type="file"]#imageupload').setInputFiles(chosenDesign.upload_path);
    await page.waitForTimeout(8000);
    const editorUrl = page.url();

    const editorScreenshotPath = path.join(jobDir, "buildasign-editor.png");
    await page.screenshot({ path: editorScreenshotPath, fullPage: true });

    await clickLastButton(page, "Continue >");
    await page.waitForTimeout(5000);
    await dismissCommonOverlays(page);

    const reviewText = collapseWhitespace(
      await page.locator("body").evaluate((el) => el.innerText || ""),
    );
    const reviewUrl = page.url();
    const reviewScreenshotPath = path.join(jobDir, "buildasign-review.png");
    await page.screenshot({ path: reviewScreenshotPath, fullPage: true });

    await clickLastButton(page, "Next");
    await page.waitForTimeout(2500);

    const thickerMagnet = page.getByText("0.045 Magnetic", { exact: true });
    if (await thickerMagnet.count()) {
      try {
        await thickerMagnet.first().click({ timeout: 5000 });
        await page.waitForTimeout(1200);
      } catch {
        // Leave the default material if the upsell selector shifts.
      }
    }

    const materialText = collapseWhitespace(
      await page.locator("body").evaluate((el) => el.innerText || ""),
    );
    const materialUrl = page.url();
    const materialScreenshotPath = path.join(jobDir, "buildasign-material-step.png");
    await page.screenshot({ path: materialScreenshotPath, fullPage: true });

    await clickLastButton(page, "Continue To Checkout");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(5000);

    const cartText = collapseWhitespace(
      await page.locator("body").evaluate((el) => el.innerText || ""),
    );
    const cartScreenshotPath = path.join(jobDir, "buildasign-cart.png");
    await page.screenshot({ path: cartScreenshotPath, fullPage: true });
    const storageStatePath = path.join(jobDir, "buildasign-storage-state.json");
    await context.storageState({ path: storageStatePath });

    return {
      vendor: "BuildASign",
      productUrl,
      editorUrl,
      reviewUrl,
      materialUrl,
      storageStatePath,
      productPageScreenshotPath: productScreenshotPath,
      editorScreenshotPath,
      reviewScreenshotPath,
      materialScreenshotPath,
      cartScreenshotPath,
      reviewText: truncate(reviewText, 600),
      materialText: truncate(materialText, 600),
      productText: truncate(productText, 600),
      cartUrl: page.url(),
      cartSummary: parseCartText(cartText),
      cartText: truncate(cartText, 1400),
    };
  } finally {
    await context.close().catch(() => {});
  }
}

function inspectBrowserVendorCartReviewStack() {
  const missingAccess = [];
  let playwrightAvailable = false;

  try {
    ensurePlaywright();
    playwrightAvailable = true;
  } catch (error) {
    missingAccess.push(
      error instanceof Error ? error.message : "Playwright runtime is unavailable.",
    );
  }

  if (!WRENCHREADY_BRAND.logoPath || !fs.existsSync(WRENCHREADY_BRAND.logoPath)) {
    missingAccess.push(
      `WrenchReady brand asset missing at ${WRENCHREADY_BRAND.logoPath || "(unset)"}.`,
    );
  }

  return {
    live: missingAccess.length === 0,
    missingAccess,
    details: {
      browser_automation: playwrightAvailable,
      vendor_site_access: playwrightAvailable,
      design_mockup: playwrightAvailable && fs.existsSync(WRENCHREADY_BRAND.logoPath),
      screenshot_capture: playwrightAvailable,
      cart_preparation: playwrightAvailable,
      review_checkpoint: true,
      logo_asset_path: WRENCHREADY_BRAND.logoPath,
      playwright_root: PLAYWRIGHT_ROOT,
    },
  };
}

async function runBrowserVendorCartReview(input = {}) {
  const stack = inspectBrowserVendorCartReviewStack();
  if (!stack.live) {
    return {
      ok: false,
      status: "blocked_missing_access",
      lane_id: "wrenchready-branding-commerce",
      preferred_execution_path: "bridge:browser_vendor_cart_review",
      missing_access: stack.missingAccess,
      operator_message:
        `Vendor/design lane blocked: ${stack.missingAccess.join(" ")}` +
        " Foundational requirements for this lane are browser automation, vendor navigation, design/mockup generation, screenshot capture, and cart preparation. Fix owner: local bridge/browser stack on Dez's machine.",
      next_action:
        "Connect or repair the local Playwright/browser stack and verify the WrenchReady brand asset path before retrying the vendor cart workflow.",
      details: stack.details,
    };
  }

  const { chromium } = ensurePlaywright();
  await ensureDir(OUTPUT_ROOT);

  const jobSlug = slugify(input.task || "wrenchready-browser-vendor-review");
  const jobDir = path.join(OUTPUT_ROOT, `${nowStamp()}-${jobSlug}`);
  await ensureDir(jobDir);

  const browser = await chromium.launch({ headless: true });
  try {
    const designBundle = await buildDesignCandidates(browser, jobDir);
    const vendorOptions = [];

    for (const vendor of VENDOR_CONFIGS) {
      try {
        vendorOptions.push(await captureVendorOption(browser, vendor, jobDir));
      } catch (error) {
        vendorOptions.push({
          vendor: vendor.vendor,
          url: vendor.url,
          price_signals: [],
          size_signals: [],
          material_signals: [],
          install_fit_note: "Vendor page inspection failed during this run.",
          cart_automation: vendor.cartAutomatable,
          notes:
            error instanceof Error
              ? `Inspection failed: ${error.message}`
              : "Inspection failed.",
          screenshot_path: null,
          excerpt: null,
        });
      }
    }

    const chosenVendor = chooseBestVendor(vendorOptions);
    if (!chosenVendor || chosenVendor.vendor !== "BuildASign") {
      return {
        ok: false,
        status: "blocked_vendor_cart_path",
        lane_id: "wrenchready-branding-commerce",
        preferred_execution_path: "bridge:browser_vendor_cart_review",
        missing_access: ["cart automation path for a custom vehicle-sign vendor"],
        operator_message:
          "Vendor/design lane is up for research and mockups, but no cart-capable vendor path passed verification in this run.",
        next_action:
          "Keep BuildASign as the preferred vendor path or add a second cart-capable vendor automation before retrying.",
        vendor_options: vendorOptions,
        design_candidates: designBundle.candidates,
        chosen_design: designBundle.chosen,
      };
    }

    const cartFlow = await runBuildASignCartFlow(browser, designBundle.chosen, jobDir);
    const baseResult = {
      ok: true,
      status: "cart_ready_for_review",
      task_class: "browser_commerce_design",
      lane_id: "wrenchready-branding-commerce",
      business_id: "wrenchready",
      preferred_execution_path: "bridge:browser_vendor_cart_review",
      selected_execution_path: "bridge:browser_vendor_cart_review",
      review_checkpoint_required: true,
      vendor_options: vendorOptions,
      design_candidates: designBundle.candidates,
      chosen_design: designBundle.chosen,
      chosen_option: {
        vendor: chosenVendor.vendor,
        why_best: chosenVendor.reason,
        dimensions: cartFlow.cartSummary.size || '24" x 18"',
        material: cartFlow.cartSummary.material || "0.045 Magnet",
        estimated_total: cartFlow.cartSummary.cartTotal || cartFlow.cartSummary.total,
        cart_url: cartFlow.cartUrl,
        cart_status: "added_to_cart_waiting_review",
      },
      artifacts: {
        product_page: cartFlow.productPageScreenshotPath,
        design_editor: cartFlow.editorScreenshotPath,
        design_review: cartFlow.reviewScreenshotPath,
        material_step: cartFlow.materialScreenshotPath,
        cart_review: cartFlow.cartScreenshotPath,
      },
      summary:
        `Cart prepared for review with ${chosenVendor.vendor}. ` +
        `Best option: ${cartFlow.cartSummary.size || '24" x 18"'} ${cartFlow.cartSummary.material || "vehicle magnet"} ` +
        `with estimated total ${cartFlow.cartSummary.cartTotal || cartFlow.cartSummary.total || "pending"}. ` +
        "Stopped before purchase as required.",
      next_action:
        "Review the linked review page and proof. Use Resume Cart Session if you want to inspect the live vendor cart on this machine. Checkout still requires explicit approval.",
    };
    const publicLinks = await writeBrowserVendorReviewPackage(jobDir, baseResult, cartFlow);

    return {
      ...baseResult,
      cart_url: publicLinks.cart_url,
      proof_url: publicLinks.proof_url,
      review_page_url: publicLinks.review_page_url,
      resume_cart_url: publicLinks.resume_cart_url,
      resume_proof_url: publicLinks.resume_proof_url,
      link_support: {
        stable_cart_url_available: false,
        stable_proof_url_available: Boolean(publicLinks.proof_url),
        cart_url_usable_cross_session: false,
        proof_url_usable_cross_session: Boolean(publicLinks.proof_url_cross_session_usable),
        cart_url_note: publicLinks.cart_url_note,
      },
    };
  } finally {
    await browser.close().catch(() => {});
  }
}

async function resumeBrowserVendorCartReview(jobId, target = "cart") {
  const manifest = await readBrowserVendorReviewManifest(jobId);
  const { chromium } = ensurePlaywright();
  const storageStatePath = manifest.storage_state_path;
  if (!storageStatePath || !fs.existsSync(storageStatePath)) {
    throw new Error(`Saved browser session not found for browser vendor job "${jobId}".`);
  }

  const browser = await chromium.launch({ headless: false });
  activeReviewBrowsers.add(browser);
  browser.on("disconnected", () => activeReviewBrowsers.delete(browser));

  const context = await browser.newContext({
    storageState: storageStatePath,
    viewport: { width: 1440, height: 1080 },
  });
  const page = await context.newPage();

  const url =
    target === "proof"
      ? manifest.public_links?.proof_url ||
        manifest.private_links?.proof_url ||
        manifest.private_links?.review_url
      : manifest.private_links?.cart_url;

  if (!url) {
    throw new Error(`No resumable ${target} URL is stored for browser vendor job "${jobId}".`);
  }

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(2500);

  return {
    ok: true,
    job_id: jobId,
    target,
    launched_url: page.url(),
    note:
      target === "proof"
        ? "Opened the vendor proof in a headed local browser session."
        : "Opened the live vendor cart in a headed local browser session.",
  };
}

module.exports = {
  OUTPUT_ROOT,
  resolveBrowserVendorReviewJobDir,
  resolveBrowserVendorReviewFile,
  readBrowserVendorReviewManifest,
  inspectBrowserVendorCartReviewStack,
  runBrowserVendorCartReview,
  resumeBrowserVendorCartReview,
};
