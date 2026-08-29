const baseUrl = (process.env.VERIFY_BASE_URL || "http://localhost:3109").replace(/\/$/, "");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function get(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const text = await response.text();
  return { response, text };
}

function parseJsonLd(html, path) {
  const scripts = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  assert(scripts.length > 0, `${path}: no JSON-LD found`);
  for (const script of scripts) {
    JSON.parse(script[1]);
  }
  return scripts.length;
}

const crawlerTokens = [
  "Googlebot",
  "OAI-SearchBot",
  "OAI-AdsBot",
  "Claude-User",
  "Claude-SearchBot",
  "Perplexity-User",
  "PerplexityBot",
  "Applebot",
  "CCBot",
];

const { response: robotsResponse, text: robots } = await get("/robots.txt");
assert(robotsResponse.status === 200, `robots.txt: expected 200, got ${robotsResponse.status}`);
for (const token of crawlerTokens) {
  assert(robots.includes(`User-Agent: ${token}`), `robots.txt: missing ${token}`);
}
assert(robots.includes(`${baseUrl.startsWith("http://localhost") ? "https://www.dominionhomedeals.com" : baseUrl}/sitemap.xml`), "robots.txt: missing production sitemap");

const { response: sitemapResponse, text: sitemap } = await get("/sitemap.xml");
assert(sitemapResponse.status === 200, `sitemap.xml: expected 200, got ${sitemapResponse.status}`);
for (const path of [
  "/llms.txt",
  "/llms-full.txt",
  "/sell/as-is",
  "/sell-house-probate-spokane",
  "/sell-house-with-back-taxes-spokane",
  "/neighborhoods/spokane-valley",
  "/stories",
]) {
  assert(sitemap.includes(`https://www.dominionhomedeals.com${path}`), `sitemap.xml: missing ${path}`);
}

const pages = [
  { path: "/", canonical: "https://www.dominionhomedeals.com", marker: "A local buyer you can verify" },
  { path: "/sell-my-house-fast-spokane", canonical: "https://www.dominionhomedeals.com/sell-my-house-fast-spokane", marker: "How a Fast Direct House Sale Works in Spokane" },
  { path: "/cash-home-buyers-spokane", canonical: "https://www.dominionhomedeals.com/cash-home-buyers-spokane", marker: "How to Compare Cash Home Buyers in Spokane" },
  { path: "/sell-my-house-fast-coeur-d-alene", canonical: "https://www.dominionhomedeals.com/sell-my-house-fast-coeur-d-alene", marker: "Coeur d&#x27;Alene" },
  { path: "/neighborhoods/spokane-valley", canonical: "https://www.dominionhomedeals.com/neighborhoods/spokane-valley", marker: "Direct answer" },
  { path: "/stories", canonical: "https://www.dominionhomedeals.com/stories", marker: "educational examples" },
];

let jsonLdCount = 0;
for (const page of pages) {
  const { response, text } = await get(page.path, {
    headers: { "User-Agent": "OAI-SearchBot" },
  });
  assert(response.status === 200, `${page.path}: expected 200, got ${response.status}`);
  assert(text.includes(page.canonical), `${page.path}: missing canonical URL`);
  assert(text.toLowerCase().includes(page.marker.toLowerCase()), `${page.path}: missing rendered marker ${page.marker}`);
  jsonLdCount += parseJsonLd(text, page.path);
}

for (const path of ["/llms.txt", "/llms-full.txt"]) {
  const { response, text } = await get(path, {
    headers: { "User-Agent": "Claude-SearchBot" },
  });
  assert(response.status === 200, `${path}: expected 200, got ${response.status}`);
  assert(response.headers.get("x-robots-tag") === "index, follow", `${path}: missing X-Robots-Tag`);
  assert(response.headers.get("link")?.includes("rel=\"sitemap\""), `${path}: missing sitemap Link header`);
  assert(text.includes("Canonical answer ownership") || text.includes("Search and answer-engine page ownership"), `${path}: missing page-ownership map`);
}

console.log(`PASS search-discovery runtime verification: ${pages.length} HTML pages, ${jsonLdCount} JSON-LD blocks, robots, sitemap, and AI discovery files.`);
