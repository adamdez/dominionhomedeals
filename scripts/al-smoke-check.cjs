#!/usr/bin/env node

const DEFAULT_BASE_URL = process.env.AL_SMOKE_BASE_URL || "https://al.dominionhomedeals.com";
const DEFAULT_COOKIE = process.env.AL_SMOKE_COOKIE || "";
const LOCAL_BRIDGE_URL = process.env.AL_LOCAL_BRIDGE_URL || "http://127.0.0.1:3141";

function fail(message) {
  console.error(message);
  process.exit(1);
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  return { response, data, text };
}

async function readSse(url, body, cookie) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    return { ok: false, status: response.status, text: await response.text() };
  }

  const raw = await response.text();
  const events = raw
    .split("\n\n")
    .filter((line) => line.startsWith("data: "))
    .map((line) => line.slice(6))
    .filter((payload) => payload !== "[DONE]");

  const parsed = events.map((payload) => {
    try {
      return JSON.parse(payload);
    } catch {
      return { raw: payload };
    }
  });

  return { ok: true, raw, parsed };
}

async function main() {
  const output = {
    baseUrl: DEFAULT_BASE_URL,
    checks: [],
  };

  const health = await fetchJson(`${DEFAULT_BASE_URL}/api/al/health`);
  if (!(health.response.ok || health.response.status === 207) || !health.data?.runtimeTruth) {
    fail(`Hosted health failed: HTTP ${health.response.status} ${health.text}`);
  }
  output.checks.push({
    name: "hosted_health",
    ok: true,
    detail: health.data.runtimeTruth.summary,
  });

  const runtimeTruth = health.data.runtimeTruth;
  const chairmanLane = runtimeTruth.lanes.find((lane) => lane.id === "chairman_reasoning");
  const delegationLane = runtimeTruth.lanes.find((lane) => lane.id === "ceo_delegation");
  if (!chairmanLane || chairmanLane.status === "blocked") {
    fail("Hosted chairman reasoning lane is blocked.");
  }
  if (!delegationLane || delegationLane.status === "blocked") {
    fail("Hosted CEO delegation lane is blocked.");
  }

  output.checks.push({
    name: "hosted_runtime_truth",
    ok: true,
    detail: runtimeTruth.lanes.map((lane) => ({
      id: lane.id,
      status: lane.status,
      primaryMode: lane.primaryMode,
    })),
  });

  if (DEFAULT_COOKIE) {
    const blockedBrowserPrompt = await readSse(
      `${DEFAULT_BASE_URL}/api/al/chat`,
      {
        message:
          "Design advertising signs for the 2001 Astro van for WrenchReady and add to cart for review.",
        history: [],
        bridgeConnected: false,
        bridgeCapabilities: {
          browser_automation: false,
          vendor_site_access: false,
          design_mockup: false,
          screenshot_capture: false,
          cart_preparation: false,
          review_checkpoint: false,
        },
      },
      DEFAULT_COOKIE,
    );

    if (!blockedBrowserPrompt.ok) {
      fail(`Blocked browser-commerce smoke failed: HTTP ${blockedBrowserPrompt.status}`);
    }

    const blockedBrowserText = blockedBrowserPrompt.parsed
      .map((entry) => (typeof entry.t === "string" ? entry.t : ""))
      .join("\n");

    if (
      !blockedBrowserText.includes("Vendor/design lane blocked") &&
      !blockedBrowserText.includes("missing")
    ) {
      fail("Blocked browser-commerce smoke did not return a precise blocker.");
    }

    output.checks.push({
      name: "blocked_browser_commerce_smoke",
      ok: true,
      detail: blockedBrowserText,
    });

    const blockedWebsitePrompt = await readSse(
      `${DEFAULT_BASE_URL}/api/al/chat`,
      {
        message:
          "What tools are needed to finish the WrenchReady website update? Simon's face is in these photos C:\\Users\\adamd\\Desktop\\Simon\\simon. Use AI as needed to make photos, GIFs, and short videos for the website.",
        history: [],
        bridgeConnected: false,
        bridgeCapabilities: {
          media_generation: false,
          media_runway: false,
          cowork_execution: false,
          browser_automation: false,
          screenshot_capture: false,
        },
      },
      DEFAULT_COOKIE,
    );

    if (!blockedWebsitePrompt.ok) {
      fail(`Blocked website-production smoke failed: HTTP ${blockedWebsitePrompt.status}`);
    }

    const blockedWebsiteText = blockedWebsitePrompt.parsed
      .map((entry) => (typeof entry.t === "string" ? entry.t : ""))
      .join("\n");

    if (
      !blockedWebsiteText.includes("Website production lane blocked") &&
      !blockedWebsiteText.includes("media lane access")
    ) {
      fail("Blocked website-production smoke did not return a precise blocker.");
    }

    output.checks.push({
      name: "blocked_website_media_smoke",
      ok: true,
      detail: blockedWebsiteText,
    });
  } else {
    output.checks.push({
      name: "chat_smoke",
      ok: false,
      detail: "Skipped: AL_SMOKE_COOKIE not provided.",
    });
  }

  try {
    const bridge = await fetchJson(`${LOCAL_BRIDGE_URL}/health`);
    if (bridge.response.ok && bridge.data?.ok) {
      output.checks.push({
        name: "local_bridge_health",
        ok: true,
        detail: {
          media_generation: bridge.data.capabilities?.media_generation ?? false,
          browser_automation: bridge.data.capabilities?.browser_automation ?? false,
          cowork_execution: bridge.data.capabilities?.cowork_execution ?? false,
        },
      });
    } else {
      output.checks.push({
        name: "local_bridge_health",
        ok: false,
        detail: `HTTP ${bridge.response.status}`,
      });
    }
  } catch (error) {
    output.checks.push({
      name: "local_bridge_health",
      ok: false,
      detail: error instanceof Error ? error.message : "Unknown local bridge error.",
    });
  }

  console.log(JSON.stringify(output, null, 2));
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : "Unknown smoke test failure.");
});
