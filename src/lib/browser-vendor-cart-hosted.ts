import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Stagehand } from "@browserbasehq/stagehand";
import type { ReviewArtifactUploadInput } from "@/lib/al-review";

export const HOSTED_BROWSER_EXECUTION_PATH =
  "hosted:browserbase_stagehand_browser_vendor_cart_review";
export const LOCAL_BROWSER_EXECUTION_PATH = "bridge:browser_vendor_cart_review";

const DEFAULT_STAGEHAND_MODEL =
  process.env.STAGEHAND_MODEL_NAME?.trim() || "openai/gpt-4o-mini";
const DEFAULT_WRENCHREADY_LOGO_URL =
  process.env.WRENCHREADY_LOGO_URL?.trim() ||
  "https://wrenchreadymobile.com/wr-logo-full.png";

const WRENCHREADY_BRAND = {
  name: "WrenchReady",
  phone: "(509) 309-0617",
  website: "wrenchreadymobile.com",
  logoUrl: DEFAULT_WRENCHREADY_LOGO_URL,
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
      "Strong template library and custom upload path, but cart automation is not implemented yet in the hosted browser worker.",
  },
  {
    id: "carstickers",
    vendor: "CarStickers",
    url: "https://www.carstickers.com/products/magnets/custom-car-door-magnets/setup/contractor-magnet-template/",
    cartAutomatable: false,
    notes:
      "Contractor-focused template flow with good vehicle-fit copy. Pricing stays deeper in the editor flow.",
  },
] as const;

export interface HostedBrowserAvailability {
  available: boolean;
  runtimeStatus:
    | "hosted-browser-live"
    | "hosted-browser-blocked"
    | "hosted-browser-misconfigured";
  missingAccess: string[];
  details: {
    browserbase_api_key: boolean;
    browserbase_project_id: boolean;
    openai_api_key: boolean;
    wrenchready_logo_url: string;
    stagehand_model: string;
  };
}

export interface HostedBrowserVendorCartInput {
  task: string;
  business_id: "wrenchready";
  owner: string;
  lane_id: string;
  vehicle: string;
  preferred_size: string;
  quantity: number;
  review_checkpoint_required: boolean;
}

export interface HostedBrowserVendorCartResult {
  ok: boolean;
  status: string;
  task_class: "browser_commerce_design";
  lane_id: string;
  business_id: "wrenchready";
  preferred_execution_path: string;
  selected_execution_path: string;
  review_checkpoint_required: boolean;
  summary: string;
  next_action: string;
  vendor_options: Array<Record<string, unknown>>;
  design_candidates: Array<Record<string, unknown>>;
  chosen_design: Record<string, unknown> | null;
  chosen_option: Record<string, unknown> | null;
  artifacts: Record<string, unknown> | null;
  cart_url: string | null;
  proof_url: string | null;
  review_page_url: string | null;
  resume_cart_url: string | null;
  resume_proof_url: string | null;
  review_state: string;
  link_support: Record<string, unknown>;
  review_surface: Record<string, unknown> | null;
  missing_access?: string[];
  operator_message?: string;
  hosted_session_id?: string | null;
  hosted_session_url?: string | null;
  hosted_debugger_url?: string | null;
  hosted_debugger_fullscreen_url?: string | null;
}

export interface HostedBrowserVendorCartExecution {
  browserResult: HostedBrowserVendorCartResult;
  artifacts: Record<string, ReviewArtifactUploadInput | undefined>;
}

function readEnvSecret(key: string): string {
  const value = process.env[key]?.trim() || "";
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1).trim();
  }
  return value;
}

function collapseWhitespace(value: string): string {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(value: string, max = 240): string {
  const text = collapseWhitespace(value);
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(0, max - 1)).trimEnd()}...`;
}

function slugify(value: string): string {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function extractPriceSnippets(text: string): string[] {
  const matches =
    text.match(/\$\d{1,3}(?:,\d{3})?(?:\.\d{2})?(?:\s*ea\.)?/g) || [];
  return [...new Set(matches.map((match) => collapseWhitespace(match)))].slice(0, 6);
}

function extractSizeOptions(text: string): string[] {
  const sizeMatches =
    text.match(/\b\d{1,2}(?:ft)?\s*"?\s*x\s*\d{1,2}(?:ft)?\s*"?(?:\b|$)/gi) ||
    [];
  return [...new Set(sizeMatches.map((match) => collapseWhitespace(match)))].slice(0, 12);
}

function extractMaterialSignals(text: string): string[] {
  const patterns = [
    /\b0\.030\s+Magnet(?:ic)?\b/gi,
    /\b0\.045\s+Magnet(?:ic)?\b/gi,
    /\b30\s*mil\b/gi,
    /\bPVC-free\b/gi,
    /\bgloss laminate\b/gi,
    /\bfade-resistant\b/gi,
  ];

  const values: string[] = [];
  for (const pattern of patterns) {
    const matches = text.match(pattern) || [];
    for (const match of matches) {
      values.push(collapseWhitespace(match));
    }
  }

  return [...new Set(values)];
}

function extractLine(text: string, phrase: string): string | null {
  const lines = String(text || "").split(/\r?\n/);
  const found = lines.find((line) => line.toLowerCase().includes(phrase.toLowerCase()));
  return found ? collapseWhitespace(found) : null;
}

function bufferToDataUrl(buffer: Buffer, contentType = "image/png"): string {
  return `data:${contentType};base64,${buffer.toString("base64")}`;
}

function markupToDataUrl(markup: string): string {
  return `data:text/html;base64,${Buffer.from(markup, "utf8").toString("base64")}`;
}

function escapeXPathLiteral(value: string): string {
  if (!value.includes("'")) {
    return `'${value}'`;
  }
  if (!value.includes('"')) {
    return `"${value}"`;
  }
  return `concat('${value.split("'").join(`',"'",'`)}')`;
}

function textTargetSelectors(label: string): string[] {
  const literal = escapeXPathLiteral(collapseWhitespace(label));
  return [
    `xpath=//button[normalize-space(.)=${literal}]`,
    `xpath=//a[normalize-space(.)=${literal}]`,
    `xpath=//*[@role='button' and normalize-space(.)=${literal}]`,
    `xpath=//*[normalize-space(.)=${literal}]`,
    `xpath=//*[contains(normalize-space(.), ${literal})]`,
  ];
}

async function fetchLogoDataUri(): Promise<string> {
  const response = await fetch(WRENCHREADY_BRAND.logoUrl, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `WrenchReady logo asset could not be fetched from ${WRENCHREADY_BRAND.logoUrl} (HTTP ${response.status}).`,
    );
  }

  const contentType = response.headers.get("content-type") || "image/png";
  const arrayBuffer = await response.arrayBuffer();
  return bufferToDataUrl(Buffer.from(arrayBuffer), contentType);
}

function buildVariantDefinitions() {
  return [
    {
      id: "logo-left-service-ladder",
      title: "Logo Left / Service Ladder",
      headline: "MOBILE AUTO REPAIR",
      subline: "Brakes - Batteries - Diagnostics - Maintenance",
      footer: `${WRENCHREADY_BRAND.phone}  -  ${WRENCHREADY_BRAND.website}`,
      accent: "Protect your time. We come to you.",
      ribbon: "Best legibility at distance",
    },
    {
      id: "phone-forward-cta",
      title: "Phone Forward / Fast CTA",
      headline: "CALL OR TEXT",
      subline: WRENCHREADY_BRAND.phone,
      footer: WRENCHREADY_BRAND.website.toUpperCase(),
      accent: "Mobile service for Spokane drivers",
      ribbon: "Best direct-response callout",
    },
    {
      id: "trust-first-home-work",
      title: "Trust First / Home + Work",
      headline: "HOME - WORK - DRIVEWAY",
      subline: "High-trust mobile service across Spokane",
      footer: "Brakes - Batteries - Diagnostics",
      accent: WRENCHREADY_BRAND.phone,
      ribbon: "Best trust-positioning layout",
    },
    {
      id: "service-stack",
      title: "Service Stack / Dense Info",
      headline: "BRAKES  |  BATTERIES  |  DIAGNOSTICS",
      subline: "Mobile maintenance without the shop drop-off",
      footer: `${WRENCHREADY_BRAND.phone}  -  ${WRENCHREADY_BRAND.website}`,
      accent: "Ask about pre-purchase inspections",
      ribbon: "Best service-detail layout",
    },
  ];
}

function buildVariantMarkup(
  variant: ReturnType<typeof buildVariantDefinitions>[number],
  logoDataUri: string,
): string {
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

async function withTempDir<T>(
  prefix: string,
  fn: (dir: string) => Promise<T>,
): Promise<T> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  try {
    return await fn(dir);
  } finally {
    await fs.rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

async function dismissCommonOverlays(page: any): Promise<void> {
  await page
    .evaluate(() => {
      const selectors = [
        "#attentive_overlay",
        "#attentive_creative",
        'iframe[title*="Sign Up via Text"]',
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
    if (await clickControlByText(page, name)) {
      try {
        await page.waitForTimeout(350);
      } catch {
        // Ignore overlay differences across vendors.
      }
    }
  }
}

async function clickControlByText(page: any, label: string): Promise<boolean> {
  for (const selector of textTargetSelectors(label)) {
    const target = page.locator(selector);
    const count = Math.min(await target.count(), 6);
    for (let index = 0; index < count; index += 1) {
      const candidate = target.nth(index);
      try {
        const visible = await candidate.isVisible().catch(() => true);
        if (!visible) {
          continue;
        }
        await candidate.click();
        return true;
      } catch {
        // Keep trying matching nodes; many cookie/banner controls are detached or hidden.
      }
    }
  }

  return false;
}

function chooseBestVendor(vendorOptions: Array<Record<string, unknown>>) {
  const buildASign = vendorOptions.find((option) => option.vendor === "BuildASign");
  if (buildASign) {
    return {
      vendor: "BuildASign",
      reason:
        'BuildASign is the best fit because 24" x 18" sizing is available and the hosted browser flow can drive the run into a real cart review state before checkout.',
    };
  }

  const fallback = vendorOptions[0];
  return fallback
    ? {
        vendor: String(fallback.vendor || "Vendor"),
        reason: "This was the strongest reachable vendor path during hosted browser verification.",
      }
    : null;
}

function parseCartText(text: string) {
  const sizeMatch =
    (text.match(/\b\d{1,2}"\s*x\s*\d{1,2}"\b/g) || []).find((value) =>
      value.includes('24" x 18"'),
    ) ||
    (text.match(/\b\d{1,2}"\s*x\s*\d{1,2}"\b/g) || [])[0] ||
    null;
  const materialMatch =
    text.match(/\b0\.0(?:30|45)\s+Magnet(?:ic)?\b/i)?.[0] ||
    extractLine(text, "0.045 Magnet") ||
    extractLine(text, "0.030 Magnet") ||
    null;

  return {
    product: extractLine(text, "Magnetic Car Signs") || "Magnetic Car Signs",
    size: sizeMatch,
    material: materialMatch,
    itemPrice:
      (extractLine(text, "Item Price") ||
        text.match(/Item Price\s*\$[0-9.]+/i)?.[0] ||
        "")
        .replace(/^Item Price\s*/i, "")
        .trim() || null,
    total:
      text.match(/Total:\s*\$[0-9.,]+/i)?.[0].replace(/^Total:\s*/i, "").trim() ||
      null,
    cartTotal:
      text.match(/Cart Total\s*\$[0-9.,]+/i)?.[0].replace(/^Cart Total\s*/i, "").trim() ||
      null,
  };
}

async function getPrimaryPage(stagehand: InstanceType<typeof Stagehand>): Promise<any> {
  const context = stagehand.context as any;
  const pages = typeof context.pages === "function" ? context.pages() : [];
  if (Array.isArray(pages) && pages.length > 0) {
    return pages[0];
  }
  return context.newPage();
}

async function createAdditionalPage(stagehand: InstanceType<typeof Stagehand>): Promise<any> {
  const context = stagehand.context as any;
  if (typeof context.newPage === "function") {
    return context.newPage();
  }
  return getPrimaryPage(stagehand);
}

async function buildDesignCandidates(
  stagehand: InstanceType<typeof Stagehand>,
  tempDir: string,
) {
  const logoDataUri = await fetchLogoDataUri();
  const variants = buildVariantDefinitions();
  const page = await createAdditionalPage(stagehand);
  const output: Array<Record<string, unknown>> = [];

  for (const variant of variants) {
    const stem = slugify(variant.id);
    const htmlPath = path.join(tempDir, `${stem}.html`);
    const pngPath = path.join(tempDir, `${stem}.png`);
    const markup = buildVariantMarkup(variant, logoDataUri);
    await fs.writeFile(htmlPath, markup, "utf8");
    await page.setViewportSize(1500, 920, { deviceScaleFactor: 1 });
    await page.goto(markupToDataUrl(markup), {
      waitUntil: "domcontentloaded",
      timeoutMs: 30000,
    });
    await page.waitForTimeout(250);
    const previewBuffer = Buffer.from(
      await page.screenshot({
        fullPage: true,
        path: pngPath,
      }),
    );

    output.push({
      id: variant.id,
      title: variant.title,
      upload_path: pngPath,
      notes: variant.ribbon,
      preview_data_url: bufferToDataUrl(previewBuffer),
    });
  }

  await page.close().catch(() => {});

  return {
    candidates: output,
    chosen: output[0] || null,
  };
}

async function captureVendorOption(
  stagehand: InstanceType<typeof Stagehand>,
  vendor: (typeof VENDOR_CONFIGS)[number],
) {
  const page = await createAdditionalPage(stagehand);
  try {
    await page.goto(vendor.url, { waitUntil: "domcontentloaded", timeoutMs: 45000 });
    await page.waitForTimeout(2500);
    await dismissCommonOverlays(page);

    if (vendor.id === "buildasign") {
      const selector = "#product_attribute_61580";
      if (await page.locator(selector).count()) {
        await page.locator(selector).selectOption(['24" x 18"']);
        await page.waitForTimeout(1500);
      }
    }

    const text = collapseWhitespace(await page.evaluate(() => document.body?.innerText || ""));

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
      excerpt: truncate(text, 700),
    };
  } finally {
    await page.close().catch(() => {});
  }
}

async function runBuildASignCartFlow(
  stagehand: InstanceType<typeof Stagehand>,
  chosenDesign: Record<string, unknown>,
): Promise<{
  productUrl: string;
  editorUrl: string;
  reviewUrl: string;
  materialUrl: string;
  cartUrl: string;
  reviewScreenshotDataUrl: string;
  cartScreenshotDataUrl: string;
  cartSummary: ReturnType<typeof parseCartText>;
}> {
  const page = await getPrimaryPage(stagehand);
  try {
    await page.goto("https://www.buildasign.com/magnetic-signs", {
      waitUntil: "domcontentloaded",
      timeoutMs: 45000,
    });
    await page.waitForTimeout(2500);
    await dismissCommonOverlays(page);

    if (await page.locator("#product_attribute_61580").count()) {
      await page.locator("#product_attribute_61580").selectOption(['24" x 18"']);
      await page.waitForTimeout(1800);
    }
    const productUrl = page.url();

    await dismissCommonOverlays(page);
    if (!(await clickControlByText(page, "Create Your Design Online"))) {
      throw new Error("BuildASign did not expose a clickable 'Create Your Design Online' control.");
    }
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(6000);
    await dismissCommonOverlays(page);
    await page.waitForSelector("xpath=//*[contains(normalize-space(.), 'Add Images')]", {
      timeout: 30000,
      state: "visible",
    });

    if (!(await clickControlByText(page, "Add Images"))) {
      throw new Error("BuildASign editor loaded without an accessible 'Add Images' control.");
    }
    await page.waitForTimeout(1000);
    await page
      .locator('input[type="file"]#imageupload')
      .setInputFiles(String(chosenDesign.upload_path || ""));
    await page.waitForTimeout(8000);
    const editorUrl = page.url();

    await clickControlByText(page, "Continue >");
    await page.waitForTimeout(5000);
    await dismissCommonOverlays(page);

    const reviewUrl = page.url();
    const reviewScreenshotDataUrl = bufferToDataUrl(
      Buffer.from(await page.screenshot({ fullPage: true })),
    );

    await clickControlByText(page, "Next");
    await page.waitForTimeout(2500);

    const thickerMagnet = page.locator(
      "xpath=//*[contains(normalize-space(.), '0.045 Magnetic')]",
    );
    if (await thickerMagnet.count()) {
      try {
        await thickerMagnet.first().click();
        await page.waitForTimeout(1200);
      } catch {
        // Leave the default material if the upsell selector shifts.
      }
    }

    const materialUrl = page.url();

    await clickControlByText(page, "Continue To Checkout");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(5000);

    const cartText = collapseWhitespace(await page.evaluate(() => document.body?.innerText || ""));
    const cartScreenshotDataUrl = bufferToDataUrl(
      Buffer.from(await page.screenshot({ fullPage: true })),
    );

    return {
      productUrl,
      editorUrl,
      reviewUrl,
      materialUrl,
      cartUrl: page.url(),
      reviewScreenshotDataUrl,
      cartScreenshotDataUrl,
      cartSummary: parseCartText(cartText),
    };
  } finally {
    await page.close().catch(() => {});
  }
}

async function fetchBrowserbaseDebugUrls(
  sessionId: string | undefined,
  apiKey: string,
): Promise<{
  sessionUrl: string | null;
  debuggerUrl: string | null;
  debuggerFullscreenUrl: string | null;
}> {
  if (!sessionId) {
    return {
      sessionUrl: null,
      debuggerUrl: null,
      debuggerFullscreenUrl: null,
    };
  }

  try {
    const response = await fetch(
      `https://api.browserbase.com/v1/sessions/${encodeURIComponent(sessionId)}/debug`,
      {
        headers: {
          "X-BB-API-Key": apiKey,
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return {
        sessionUrl: `https://www.browserbase.com/sessions/${sessionId}`,
        debuggerUrl: null,
        debuggerFullscreenUrl: null,
      };
    }

    const payload = (await response.json()) as {
      debuggerUrl?: string;
      debuggerFullscreenUrl?: string;
    };

    return {
      sessionUrl: `https://www.browserbase.com/sessions/${sessionId}`,
      debuggerUrl: payload.debuggerUrl || null,
      debuggerFullscreenUrl: payload.debuggerFullscreenUrl || null,
    };
  } catch {
    return {
      sessionUrl: `https://www.browserbase.com/sessions/${sessionId}`,
      debuggerUrl: null,
      debuggerFullscreenUrl: null,
    };
  }
}

function buildHostedReviewSurface(result: {
  sessionId: string | null;
  sessionUrl: string | null;
  debuggerUrl: string | null;
  debuggerFullscreenUrl: string | null;
}) {
  return {
    mode: "hosted_browserbase_review",
    hosted_session_id: result.sessionId,
    hosted_session_url: result.sessionUrl,
    hosted_debugger_url: result.debuggerUrl,
    hosted_debugger_fullscreen_url: result.debuggerFullscreenUrl,
  };
}

export function inspectHostedBrowserVendorCartReviewStack(): HostedBrowserAvailability {
  const browserbaseApiKey = readEnvSecret("BROWSERBASE_API_KEY");
  const browserbaseProjectId = readEnvSecret("BROWSERBASE_PROJECT_ID");
  const openAiKey = readEnvSecret("OPENAI_API_KEY");
  const missingAccess: string[] = [];

  if (!browserbaseApiKey) {
    missingAccess.push("BROWSERBASE_API_KEY");
  }
  if (!browserbaseProjectId) {
    missingAccess.push("BROWSERBASE_PROJECT_ID");
  }
  if (!openAiKey) {
    missingAccess.push("OPENAI_API_KEY for Stagehand model access");
  }

  return {
    available: missingAccess.length === 0,
    runtimeStatus:
      missingAccess.length === 0
        ? "hosted-browser-live"
        : missingAccess.length < 3
          ? "hosted-browser-misconfigured"
          : "hosted-browser-blocked",
    missingAccess,
    details: {
      browserbase_api_key: Boolean(browserbaseApiKey),
      browserbase_project_id: Boolean(browserbaseProjectId),
      openai_api_key: Boolean(openAiKey),
      wrenchready_logo_url: WRENCHREADY_BRAND.logoUrl,
      stagehand_model: DEFAULT_STAGEHAND_MODEL,
    },
  };
}

export async function runHostedBrowserVendorCartReview(
  input: HostedBrowserVendorCartInput,
): Promise<HostedBrowserVendorCartExecution> {
  const availability = inspectHostedBrowserVendorCartReviewStack();
  if (!availability.available) {
    throw new Error(
      `Hosted Browserbase/Stagehand lane is not configured. Missing: ${availability.missingAccess.join(", ")}.`,
    );
  }

  const browserbaseApiKey = readEnvSecret("BROWSERBASE_API_KEY");
  const browserbaseProjectId = readEnvSecret("BROWSERBASE_PROJECT_ID");
  const openAiKey = readEnvSecret("OPENAI_API_KEY");

  return withTempDir("al-browserbase-stagehand-", async (tempDir) => {
    const stagehand = new Stagehand({
      env: "BROWSERBASE",
      apiKey: browserbaseApiKey,
      projectId: browserbaseProjectId,
      model: {
        provider: "openai",
        modelName: DEFAULT_STAGEHAND_MODEL,
        apiKey: openAiKey,
      },
      browserbaseSessionCreateParams: {
        projectId: browserbaseProjectId,
        keepAlive: true,
        browserSettings: {
          blockAds: true,
          recordSession: true,
          solveCaptchas: true,
          viewport: {
            width: 1440,
            height: 1080,
          },
        },
      },
      disablePino: true,
      verbose: 0,
    });

    await stagehand.init();

    try {
      const designBundle = await buildDesignCandidates(stagehand, tempDir);
      const vendorOptions: Array<Record<string, unknown>> = [];

      for (const vendor of VENDOR_CONFIGS) {
        try {
          vendorOptions.push(await captureVendorOption(stagehand, vendor));
        } catch (error) {
          vendorOptions.push({
            vendor: vendor.vendor,
            url: vendor.url,
            price_signals: [],
            size_signals: [],
            material_signals: [],
            install_fit_note: "Vendor page inspection failed during this hosted run.",
            cart_automation: vendor.cartAutomatable,
            notes:
              error instanceof Error
                ? `Inspection failed: ${error.message}`
                : "Inspection failed.",
            excerpt: null,
          });
        }
      }

      const chosenVendor = chooseBestVendor(vendorOptions);
      if (!chosenVendor || chosenVendor.vendor !== "BuildASign") {
        return {
          browserResult: {
            ok: false,
            status: "blocked_vendor_cart_path",
            task_class: "browser_commerce_design",
            lane_id: input.lane_id,
            business_id: "wrenchready",
            preferred_execution_path: HOSTED_BROWSER_EXECUTION_PATH,
            selected_execution_path: HOSTED_BROWSER_EXECUTION_PATH,
            review_checkpoint_required: true,
            missing_access: ["cart automation path for a custom vehicle-sign vendor"],
            operator_message:
              "Hosted browser execution reached research and mockups, but no cart-capable vendor path passed verification in this run.",
            summary:
              "Hosted browser execution did not reach a cart-capable vendor path in this run.",
            next_action:
              "Keep BuildASign as the preferred vendor path or add a second cart-capable hosted automation before retrying.",
            vendor_options: vendorOptions,
            design_candidates: designBundle.candidates,
            chosen_design: designBundle.chosen,
            chosen_option: null,
            artifacts: null,
            cart_url: null,
            proof_url: null,
            review_page_url: null,
            resume_cart_url: null,
            resume_proof_url: null,
            review_state: "blocked_vendor_session",
            review_surface: null,
            link_support: {},
          },
          artifacts: {},
        };
      }

      const cartFlow = await runBuildASignCartFlow(stagehand, designBundle.chosen || {});
      const sessionId =
        stagehand.browserbaseSessionID ||
        (stagehand as unknown as { browserbaseSessionId?: string }).browserbaseSessionId ||
        null;
      const debugUrls = await fetchBrowserbaseDebugUrls(sessionId || undefined, browserbaseApiKey);
      const chosenDesign = designBundle.chosen || null;
      const chosenOption = {
        vendor: chosenVendor.vendor,
        why_best: chosenVendor.reason,
        dimensions: cartFlow.cartSummary.size || input.preferred_size || '24" x 18"',
        material: cartFlow.cartSummary.material || "0.045 Magnet",
        estimated_total:
          cartFlow.cartSummary.cartTotal || cartFlow.cartSummary.total || "Pending",
        cart_url: cartFlow.cartUrl,
        cart_status: "added_to_cart_waiting_review",
      };

      return {
        browserResult: {
          ok: true,
          status: "cart_ready_for_review",
          task_class: "browser_commerce_design",
          lane_id: input.lane_id,
          business_id: "wrenchready",
          preferred_execution_path: HOSTED_BROWSER_EXECUTION_PATH,
          selected_execution_path: HOSTED_BROWSER_EXECUTION_PATH,
          review_checkpoint_required: true,
          summary:
            `Hosted browser cart prepared for review with ${chosenVendor.vendor}. ` +
            `Best option: ${chosenOption.dimensions} ${chosenOption.material} with estimated total ${chosenOption.estimated_total}. ` +
            "Stopped before purchase as required.",
          next_action:
            "Open the hosted review page, inspect the proof and screenshots, and approve checkout readiness or request changes. Use the Browserbase session link only if you need the live hosted session.",
          vendor_options: vendorOptions,
          design_candidates: designBundle.candidates,
          chosen_design: chosenDesign,
          chosen_option: chosenOption,
          artifacts: {
            design_review: "hosted-browserbase-review",
            cart_review: "hosted-browserbase-cart",
          },
          cart_url: cartFlow.cartUrl,
          proof_url: cartFlow.reviewUrl,
          review_page_url: null,
          resume_cart_url: null,
          resume_proof_url: null,
          review_state: "cart_ready_for_review",
          review_surface: buildHostedReviewSurface({
            sessionId,
            sessionUrl: debugUrls.sessionUrl,
            debuggerUrl: debugUrls.debuggerUrl,
            debuggerFullscreenUrl: debugUrls.debuggerFullscreenUrl,
          }),
          link_support: {
            stable_cart_url_available: false,
            stable_proof_url_available: Boolean(cartFlow.reviewUrl),
            cart_url_usable_cross_session: false,
            proof_url_usable_cross_session: Boolean(cartFlow.reviewUrl),
            cart_url_note:
              "BuildASign uses a session-bound cart. Use the hosted Browserbase session link for replay or inspection; do not treat the cart URL as a shareable cross-session cart.",
            hosted_session_inspector_available: Boolean(
              debugUrls.debuggerUrl || debugUrls.sessionUrl,
            ),
          },
          hosted_session_id: sessionId,
          hosted_session_url: debugUrls.sessionUrl,
          hosted_debugger_url: debugUrls.debuggerUrl,
          hosted_debugger_fullscreen_url: debugUrls.debuggerFullscreenUrl,
        },
        artifacts: {
          chosen_design_preview:
            chosenDesign && typeof chosenDesign.preview_data_url === "string"
              ? {
                  dataUrl: String(chosenDesign.preview_data_url),
                  contentType: "image/png",
                  fileName: "chosen-design-preview.png",
                }
              : undefined,
          design_review_image: {
            dataUrl: cartFlow.reviewScreenshotDataUrl,
            contentType: "image/png",
            fileName: "buildasign-review.png",
          },
          cart_review_image: {
            dataUrl: cartFlow.cartScreenshotDataUrl,
            contentType: "image/png",
            fileName: "buildasign-cart.png",
          },
        },
      };
    } finally {
      await stagehand.close().catch(() => {});
    }
  });
}
