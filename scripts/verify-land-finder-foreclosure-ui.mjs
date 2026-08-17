#!/usr/bin/env node

import assert from "node:assert/strict";
import { chromium } from "playwright";

const baseUrl = process.env.LAND_FINDER_TEST_URL || "http://localhost:3017";
const password = process.env.LAND_FINDER_TEST_PASSWORD || "dezzy";
const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const apn = "02354.9009";
const screenshots = {
  desktopMap: "/tmp/land-finder-foreclosure-desktop.png",
  desktopEvidence: "/tmp/land-finder-foreclosure-evidence.png",
  mobileFilters: "/tmp/land-finder-foreclosure-mobile.png",
};

const browser = await chromium.launch({ headless: true, executablePath: chromePath });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: "block" });
await context.route("**/api/land-finder/reviews**", (route) => route.fulfill({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify({ reviews: [], savedParcels: { type: "FeatureCollection", features: [] } }),
}));
const page = await context.newPage();
const consoleErrors = [];
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});

try {
  await page.goto(`${baseUrl}/land-finder`, { waitUntil: "domcontentloaded" });
  await page.getByLabel("Password").fill(password);
  const signalsResponsePromise = page.waitForResponse((response) => response.url().includes("/api/land-finder/signals") && response.ok());
  await page.getByRole("button", { name: "Open map" }).click();
  const signalPayload = await (await signalsResponsePromise).json();
  const expectedCount = signalPayload.countyForeclosure.parcelCount;
  assert(expectedCount > 0, "The county foreclosure API returned no parcels.");
  await page.getByRole("button", { name: "Filters" }).waitFor();
  await page.locator(".lf-map canvas").waitFor();

  await page.getByRole("button", { name: "Filters" }).click();
  const foreclosureFilter = page.locator(".lf-signal-filter-grid label").filter({ hasText: "County foreclosure" });
  await foreclosureFilter.getByText(String(expectedCount), { exact: true }).waitFor({ timeout: 20_000 });
  await foreclosureFilter.click();
  await page.getByText(new RegExp(`${expectedCount} county foreclosure parcels on map`)).waitFor();
  await page.waitForTimeout(3_000);
  await page.screenshot({ path: screenshots.desktopMap, fullPage: true });

  const desktopOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert(desktopOverflow <= 1, `Desktop viewport overflowed horizontally by ${desktopOverflow}px.`);

  const search = page.getByLabel("Search by address or parcel number");
  await search.fill(apn);
  await search.press("Enter");
  await page.getByText("County tax foreclosure list", { exact: true }).waitFor({ timeout: 15_000 });
  await page.getByText("$760", { exact: true }).waitFor();
  const evidenceLinks = await page.locator(".lf-signal-links a").evaluateAll((links) => links.map((link) => link.href));
  assert(evidenceLinks.some((href) => href.includes(`ParcelDetail.aspx?Parcel=${apn}`)), "County parcel-detail evidence link was missing.");
  assert(evidenceLinks.some((href) => href.includes("DocumentCenter/View/73241/2026-Foreclosure-List")), "Filed PDF evidence link was missing.");
  await page.screenshot({ path: screenshots.desktopEvidence, fullPage: true });

  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
  await mobileContext.route("**/api/land-finder/reviews**", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ reviews: [], savedParcels: { type: "FeatureCollection", features: [] } }),
  }));
  const mobile = await mobileContext.newPage();
  mobile.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  await mobile.goto(`${baseUrl}/land-finder`, { waitUntil: "domcontentloaded" });
  await mobile.getByLabel("Password").fill(password);
  await mobile.getByRole("button", { name: "Open map" }).click();
  await mobile.getByRole("button", { name: "Filters" }).waitFor();
  await mobile.getByRole("button", { name: "Filters" }).click();
  const mobileFilter = mobile.locator(".lf-signal-filter-grid label").filter({ hasText: "County foreclosure" });
  await mobileFilter.getByText(String(expectedCount), { exact: true }).waitFor({ timeout: 20_000 });
  await mobileFilter.click();
  await mobile.getByText(new RegExp(`${expectedCount} county foreclosure parcels on map`)).waitFor();
  await mobile.waitForTimeout(1_500);
  const mobileOverflow = await mobile.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert(mobileOverflow <= 1, `Mobile viewport overflowed horizontally by ${mobileOverflow}px.`);
  await mobile.screenshot({ path: screenshots.mobileFilters, fullPage: true });
  await mobileContext.close();

  assert.equal(consoleErrors.length, 0, `Browser console errors: ${consoleErrors.join(" | ")}`);
  console.log(JSON.stringify({
    result: "PASS",
    desktopViewport: "1440x900",
    mobileViewport: "390x844",
    filterCountShown: expectedCount,
    mapStatusShown: `${expectedCount} county foreclosure parcels on map`,
    evidenceParcel: apn,
    officialParcelDetailLink: true,
    filedPdfLink: true,
    desktopHorizontalOverflowPx: desktopOverflow,
    mobileHorizontalOverflowPx: mobileOverflow,
    browserConsoleErrors: consoleErrors.length,
    screenshots,
  }, null, 2));
} finally {
  await browser.close();
}
