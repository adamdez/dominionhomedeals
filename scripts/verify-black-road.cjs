const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const photoCount = new Set(
  Array.from(
    fs
      .readFileSync(
        path.join(
          __dirname,
          "../src/components/off-market/black-road/tour-data.ts",
        ),
        "utf8",
      )
      .matchAll(/photo\(\s*(\d+)/g),
  ).map((match) => match[1]),
).size;
const base = process.env.TOUR_BASE_URL || "http://localhost:3127";
const proof = process.env.TOUR_PROOF_DIR || "/tmp/black-road-web-proof";
fs.mkdirSync(proof, { recursive: true });
(async () => {
  const browser = await chromium.launch({
    headless: true,
    channel: process.env.TOUR_BROWSER_CHANNEL || "chrome",
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`${base}/off-market/11211-e-black-rd`, {
    waitUntil: "networkidle",
  });
  await page.screenshot({ path: path.join(proof, "desktop-opening.png") });
  assert.match(await page.title(), /11211 E Black Rd/);
  await page.getByRole("button", { name: "Step inside", exact: true }).click();
  await page
    .getByRole("heading", { name: "An entrance with a choice" })
    .waitFor();
  const before = await page
    .locator("#walkthrough img")
    .first()
    .getAttribute("src");
  await page.getByRole("button", { name: "Next photo", exact: true }).click();
  assert.notEqual(
    await page.locator("#walkthrough img").first().getAttribute("src"),
    before,
  );
  await page
    .locator("#walkthrough")
    .getByRole("button", { name: /Primary suite/ })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Explore The corner nook", exact: true })
    .click();
  assert.match(
    await page.locator("#walkthrough").innerText(),
    /RIGHT side of the upper landing/,
  );
  const nook = await page
    .getByRole("button", { name: "Explore The corner nook", exact: true })
    .boundingBox();
  const primary = await page
    .getByRole("button", { name: "Explore The primary retreat", exact: true })
    .boundingBox();
  assert(
    nook.x > primary.x + primary.width / 2,
    "Nook must be to the right of the primary bedroom",
  );
  await page.waitForFunction(() => {
    const im = document.querySelector("#tour-viewer img");
    return im && im.complete && im.naturalWidth > 0;
  });
  await page
    .locator("#walkthrough")
    .screenshot({ path: path.join(proof, "desktop-tour.png") });
  await page
    .getByRole("button", { name: "Expand room photo", exact: true })
    .click();
  assert(await page.locator("dialog").isVisible());
  await page.keyboard.press("ArrowRight");
  await page.screenshot({ path: path.join(proof, "fullscreen-photo.png") });
  await page.keyboard.press("Escape");
  assert(!(await page.locator("dialog").isVisible()));
  for (const level of [
    "01.*The setting",
    "02.*Main living",
    "03.*Bedroom landing",
    "04.*Primary suite",
    "05.*Family room",
    "06.*Basement",
  ]) {
    await page.getByRole("button", { name: new RegExp(level) }).click();
    assert.equal(
      (await page
        .locator('#walkthrough button[aria-pressed="true"]')
        .count()) >= 2,
      true,
    );
  }
  await page.getByRole("button", { name: /02.*Main living/ }).click();
  const garage = await page
    .getByRole("button", { name: "Explore The attached garage", exact: true })
    .boundingBox();
  const living = await page
    .getByRole("button", { name: "Explore The living room", exact: true })
    .boundingBox();
  assert(
    garage.y < living.y && Math.abs(garage.x - living.x) < 2,
    "Garage behind living room",
  );
  await page
    .getByRole("button", { name: "Explore The kitchen", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: /View photo 2: View from the kitchen toward pantry/,
    })
    .click();
  assert.match(
    await page.locator("#tour-viewer img").first().getAttribute("src"),
    /7732/,
  );
  assert.match(
    await page.locator("#walkthrough").innerText(),
    /pantry shelving and the adjoining passage/,
  );
  await page.getByRole("button", { name: /01.*The setting/ }).click();
  const grounds = await page
    .getByRole("button", {
      name: "Explore 12.8 acres in Chattaroy",
      exact: true,
    })
    .boundingBox();
  const outbuildings = await page
    .getByRole("button", {
      name: "Explore Space for the practical side of life",
      exact: true,
    })
    .boundingBox();
  assert(outbuildings.x < grounds.x, "Outbuildings left and grounds right");
  await page
    .getByRole("button", {
      name: `View all ${photoCount} photographs`,
      exact: true,
    })
    .click();
  assert.equal(
    await page.locator('#gallery button[aria-label^="Open photo:"]').count(),
    photoCount,
  );
  await page
    .getByRole("button", { name: "Primary suite", exact: true })
    .click();
  assert(
    (await page.locator('#gallery button[aria-label^="Open photo:"]').count()) >
      0,
  );
  await page
    .locator('#gallery button[aria-label^="Open photo:"]')
    .first()
    .click();
  assert(await page.locator("dialog").isVisible());
  await page
    .getByRole("button", { name: "Close photo viewer", exact: true })
    .click();
  await page.goto(`${base}/off-market/11211-e-black-rd#room-nook`, {
    waitUntil: "networkidle",
  });
  await page
    .getByRole("heading", { name: "The corner nook", exact: true })
    .waitFor();
  assert.match(await page.locator("#walkthrough").innerText(), /RIGHT side/);
  for (const width of [390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(`${base}/off-market/11211-e-black-rd`, {
      waitUntil: "networkidle",
    });
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `No page overflow at ${width}`,
    );
    await page.screenshot({ path: path.join(proof, `opening-${width}.png`) });
    await page
      .getByRole("button", { name: "Step inside", exact: true })
      .click();
    await page
      .locator("#walkthrough")
      .getByRole("button", { name: /Primary suite/ })
      .first()
      .click();
    await page
      .getByRole("button", { name: "Explore The corner nook", exact: true })
      .click();
    await page.waitForFunction(() => {
      const im = document.querySelector("#tour-viewer img");
      return im && im.complete && im.naturalWidth > 0;
    });
    await page
      .locator("#walkthrough")
      .screenshot({ path: path.join(proof, `tour-${width}.png`) });
  }
  await page.goto(`${base}/off-market/11211-e-black-rd`, {
    waitUntil: "networkidle",
  });
  let inquiry = null;
  await page.route("**/api/leads", async (route) => {
    inquiry = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true }),
    });
  });
  await page.locator("#om-name").fill("Website Test");
  await page.locator("#om-email").fill("website-test@example.invalid");
  await page.locator("#om-phone").fill("5095550100");
  await page
    .locator("#om-message")
    .fill("Local intercepted form verification only.");
  await page.locator('input[name="tcpaConsent"]').check();
  await page
    .getByRole("button", { name: "Request deal details", exact: true })
    .click();
  await page.waitForFunction(() =>
    document.body.innerText.includes("We received your inquiry"),
  );
  assert.equal(inquiry.source, "off-market-11211-e-black-rd");
  assert.equal(inquiry.landingPage, "/off-market/11211-e-black-rd");
  assert.equal(inquiry.address, "11211 E Black Rd");
  assert.equal(inquiry.smsOptIn, false);
  await page.goto(`${base}/off-market`, { waitUntil: "networkidle" });
  assert.equal(
    await page.locator('a[href="/off-market/11211-e-black-rd"]').count(),
    1,
  );
  assert.equal(
    await page.locator('a[href="/off-market/6722-s-plymouth-rd"]').count(),
    1,
  );
  assert.deepEqual(errors, []);
  await browser.close();
  console.log(
    "PASS Black Road room navigation, nook on right, six levels, expanded photo gallery, fullscreen, Escape, deep links, phone/tablet overflow and both hub listings. Inquiry request verified with browser interception. No external inquiry sent.",
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
