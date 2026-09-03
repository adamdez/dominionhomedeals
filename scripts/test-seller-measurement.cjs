// Runs actual TS modules with isolated clocks/transports. No credentials or network.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
function load(file, mocks = {}, globals = {}) {
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(source, { exports, module: { exports }, URL, URLSearchParams, Blob,
    AbortSignal, Response, Headers, crypto: require('node:crypto').webcrypto,
    console: { log() {}, error() {} }, setTimeout, clearTimeout, process: { env: {} },
    fetch: () => { throw new Error('Unexpected network'); },
    require(name) {
      if (name in mocks) return mocks[name];
      if (name.startsWith('node:')) return require(name);
      throw new Error(`Unexpected dependency: ${name}`);
    }, ...globals }, { filename: file });
  return exports;
}
const clockModule = load('src/lib/seller-visibility-clock.ts');
const policy = load('src/lib/seller-measurement-policy.ts');
const shared = load('src/lib/openai-ads-shared.ts');

function journey(initiallyVisible = true) {
  let now = 0, cleanup, observerCallback;
  const events = [], timers = new Map(), win = new Map(), doc = new Map();
  let timerId = 0;
  const document = { visibilityState: initiallyVisible ? 'visible' : 'hidden',
    documentElement: { scrollHeight: 5000 }, body: { scrollHeight: 5000 },
    getElementById: () => ({}), addEventListener: (k, f) => doc.set(k, f),
    removeEventListener: (k) => doc.delete(k) };
  class Observer { constructor(cb) { observerCallback = cb; } observe() {} disconnect() {} }
  const window = { innerHeight: 500, scrollY: 0, IntersectionObserver: Observer,
    addEventListener: (k, f) => win.set(k, f), removeEventListener: (k) => win.delete(k),
    setTimeout: (f, ms) => { timers.set(++timerId, { f, at: now + ms }); return timerId; },
    clearTimeout: (id) => timers.delete(id) };
  const module = load('src/components/analytics/SellerOptionsJourneyTracker.tsx', {
    react: { useEffect: (f) => { cleanup = f(); } },
    '@/lib/seller-funnel-tracking': { trackSellerFunnelEvent: (type, data) => events.push({ type, ...data }) },
    '@/lib/seller-visibility-clock': clockModule,
  }, { window, document, IntersectionObserver: Observer, performance: { now: () => now } });
  module.SellerOptionsJourneyTracker();
  return { events, cleanup,
    advance(ms) { now += ms; for (const [id, t] of [...timers]) if (t.at <= now) { timers.delete(id); t.f(); } },
    visibility(value) { document.visibilityState = value; doc.get('visibilitychange')(); },
    page(type, persisted) { win.get(type)({ persisted }); },
    intersect() { observerCallback([{ isIntersecting: true, intersectionRatio: .5 }]); },
  };
}

test('hidden/visible are not exits and seven seconds excludes background time', () => {
  const j = journey(); j.advance(2000); j.visibility('hidden'); j.advance(30000);
  assert.equal(j.events.some(e => e.type === 'page_exited'), false);
  assert.equal(j.events.some(e => e.type === 'engaged_7s'), false);
  j.visibility('visible'); j.advance(5000);
  const event = j.events.find(e => e.type === 'engaged_7s');
  assert.equal(event.activeVisibleMs, 7000); assert.equal(event.elapsedMs, 37000);
  assert.deepEqual(j.events.filter(e => /^page_(hidden|visible)$/.test(e.type)).map(e => e.type), ['page_hidden', 'page_visible']);
  j.cleanup();
});
test('BFCache restores visible clock and resets per-hide exit deduplication', () => {
  const j = journey(); j.advance(238); j.page('pagehide', true); j.page('pagehide', true);
  j.advance(10000); j.page('pageshow', true); j.advance(1000); j.page('pagehide', false);
  const exits = j.events.filter(e => e.type === 'page_exited');
  assert.equal(exits.length, 2); assert.equal(exits[0].detail, 'pagehide_bfcache');
  assert.equal(exits[1].activeVisibleMs, 1238); assert.equal(exits[1].detail, 'pagehide');
  assert.equal(j.events.filter(e => e.type === 'page_restored').length, 1); j.cleanup();
});
test('form intersecting in a background page is not recorded as viewed', () => {
  const j = journey(false); j.intersect();
  assert.equal(j.events.some(e => e.type === 'form_viewed'), false);
  j.visibility('visible'); assert.equal(j.events.some(e => e.type === 'form_viewed'), true); j.cleanup();
});
test('failed beacon falls back to keepalive fetch with the identical event', () => {
  const store = new Map(), requests = [], beacons = [];
  const tracking = load('src/lib/seller-funnel-tracking.ts', {}, {
    window: { location: { search: '', pathname: '/sell/options', hostname: 'example.test' }, innerWidth: 400 },
    document: { cookie: '', referrer: '' },
    sessionStorage: { getItem: k => store.get(k), setItem: (k, v) => store.set(k, v) },
    localStorage: { getItem: () => null },
    navigator: { userAgent: 'Android', sendBeacon: (url, body) => { beacons.push(body); return false; } },
    fetch: (url, opts) => { requests.push(opts); return Promise.resolve({ ok: true }); },
  });
  tracking.trackSellerFunnelEvent('page_exited', { beacon: true, detail: 'pagehide' });
  assert.equal(beacons.length, 1); assert.equal(requests.length, 1); assert.equal(requests[0].keepalive, true);
  assert.equal(JSON.parse(requests[0].body).detail, 'pagehide');
});
test('only explicit QA markers suppress measurement', () => {
  for (const input of [{ internalQa: true }, { utmSource: 'codex' },
    { adAttribution: { utm_source: 'codex_internal_qa' } }, { landingPage: '/sell/options?internal_qa=1' }])
    assert.equal(policy.isSellerMeasurementQa(input), true);
  assert.equal(policy.isSellerMeasurementQa({ utmSource: 'chatgpt', landingPage: '/sell/options' }), false);
});

function conversion(env = {}, transport = async () => new Response('{}')) {
  return load('src/server/openai-ads-conversions.ts', {
    'server-only': {}, '@/lib/constants': { SITE: { url: 'https://example.test' } },
    '@/lib/openai-ads-shared': shared,
  }, { process: { env: { OPENAI_ADS_PIXEL_ID: 'test', OPENAI_ADS_CONVERSIONS_API_KEY: 'fake', ...env } }, fetch: transport });
}
const lead = { submissionId: '00000000-0000-4000-8000-000000000001', occurredAt: '2026-09-03T12:00:00Z' };
test('QA never calls provider even if a real-looking referral is present', async () => {
  const result = await conversion({}, () => { throw new Error('Must not call'); })
    .reportOpenAILeadCreated({ ...lead, internalQa: true, oppref: 'opaque' });
  assert.equal(result.status, 'skipped'); assert.equal(result.measurementMode, 'qa');
});
test('validation and production transport outcomes are distinct and IDs stable', async () => {
  const bodies = [];
  const send = async (_, opts) => { bodies.push(JSON.parse(opts.body)); return new Response('{}'); };
  const prod = await conversion({}, send).reportOpenAILeadCreated(lead);
  const valid = await conversion({ OPENAI_ADS_CONVERSIONS_VALIDATE_ONLY: 'true' }, send).reportOpenAILeadCreated(lead);
  assert.equal(prod.referenceId, 'production_http_accepted'); assert.equal(valid.referenceId, 'validation_http_accepted');
  assert.equal(bodies[0].validate_only, false); assert.equal(bodies[1].validate_only, true);
  assert.equal(bodies[0].events[0].id, bodies[1].events[0].id);
});
test('provider errors and ambiguous network failures retain mode without raw error contents', async () => {
  const rejected = await conversion({}, async () => new Response('{}', { status: 400 })).reportOpenAILeadCreated(lead);
  assert.equal(rejected.referenceId, 'production_http_400');
  const unknown = await conversion({}, async () => { throw new Error('private transport text'); }).reportOpenAILeadCreated(lead);
  assert.equal(unknown.status, 'outcome_unknown'); assert.equal(unknown.referenceId, 'production_transport_unknown');
});

function routeHarness({ duplicate = false, savedQa = false, validateOnly = false, transportUnknown = false } = {}) {
  const events = [], submissions = [], conversions = [], savedOutcomes = [];
  const api = load('src/app/api/leads/route.ts', {
    'next/server': { NextResponse: { json: (data, init) => Response.json(data, init) } },
    '@/lib/constants': { SITE: { url: 'https://example.test', phone: '555-0100' } },
    '@/lib/mailchimp': { syncSellerLeadToMailchimp: () => { throw new Error('Not permitted'); } },
    '@/lib/seller-measurement-policy': policy,
    '@/lib/dominion-leads': {
      DOMINION_OPTIONS_FLOW: 'seller_options_v1', DominionOptionsSubmissionConflictError: class extends Error {},
      isDominionOptionsSubmissionId: value => typeof value === 'string' && value.length === 36,
      dominionOptionsDeliveryStatus: () => 'needs_review',
      recordDominionOptionsDelivery: async (_, __, outcome) => { savedOutcomes.push(outcome); },
      recordDominionOptionsLeadSubmission: async (input, id, measurement) => {
        submissions.push({ input, measurement });
        return { duplicate, record: { id: 1, optionsReceipt: {
          measurementClass: savedQa || measurement.internalQa ? 'internal_qa' : 'unmarked',
        } } };
      },
    },
    '@/lib/seller-funnel-events': {
      normalizeSellerFunnelEvent: event => event,
      recordSellerFunnelEvent: async event => { events.push(event); return { duplicate: false }; },
    },
    '@/server/openai-ads-conversions': {
      reportOpenAILeadCreated: async input => {
        conversions.push(input);
        if (transportUnknown) return { status: 'outcome_unknown', referenceId: 'production_transport_unknown', measurementMode: 'production' };
        if (input.internalQa) return { status: 'skipped', referenceId: 'internal_qa', measurementMode: 'qa' };
        return { status: 'provider_accepted', referenceId: validateOnly ? 'validation_http_accepted' : 'production_http_accepted',
          measurementMode: validateOnly ? 'validation' : 'production' };
      },
    },
  }, { process: { env: { OPENAI_ADS_CONVERSIONS_VALIDATE_ONLY: String(validateOnly) } } });
  const body = { address: '123 Example Street', state: 'WA', firstName: 'QA', phone: '2025550100',
    sellerAuthority: 'owner', submissionFlow: 'seller_options_v1', submissionId: lead.submissionId,
    funnelVisitId: '00000000-0000-4000-8000-000000000002', utmSource: 'chatgpt' };
  return { events, submissions, conversions, savedOutcomes, async post(changes = {}) {
    const response = await api.POST({ headers: new Headers(), json: async () => ({ ...body, ...changes }) });
    return { status: response.status, data: await response.json() };
  } };
}
test('server QA accepts valid intake but marks receipt and excludes both OpenAI transports', async () => {
  const h = routeHarness(); const r = await h.post({ internalQa: true });
  assert.equal(r.data.accepted, true); assert.equal(r.data.openaiBrowserEligible, false);
  assert.equal(h.submissions[0].measurement.internalQa, true);
  assert.equal(h.conversions[0].internalQa, true);
  assert.equal(h.events.some(e => e.eventType === 'conversion_skipped' && e.detail === 'internal_qa'), true);
  assert.equal(h.events.some(e => e.eventType === 'conversion_reported'), false);
});
test('QA does not bypass required seller validation', async () => {
  const h = routeHarness(); const r = await h.post({ internalQa: true, phone: 'bad' });
  assert.equal(r.status, 400); assert.equal(h.submissions.length, 0); assert.equal(h.conversions.length, 0);
});
test('unmarked duplicate of saved QA receipt cannot enable browser reporting or repeat server delivery', async () => {
  const h = routeHarness({ duplicate: true, savedQa: true }); const r = await h.post();
  assert.equal(r.data.accepted, true); assert.equal(r.data.duplicate, true);
  assert.equal(r.data.openaiBrowserEligible, false); assert.equal(h.conversions.length, 0);
});
test('a duplicate never becomes browser eligible after validation mode turns off', async () => {
  const h = routeHarness({ duplicate: true, validateOnly: false }); const r = await h.post();
  assert.equal(r.data.openaiBrowserEligible, false); assert.equal(h.conversions.length, 0);
});
test('validation-only acceptance is not conversion_reported and blocks production browser event', async () => {
  const h = routeHarness({ validateOnly: true }); const r = await h.post();
  assert.equal(r.data.openaiBrowserEligible, false);
  assert.equal(h.events.some(e => e.eventType === 'conversion_validated'), true);
  assert.equal(h.events.some(e => e.eventType === 'conversion_reported'), false);
  assert.equal(h.savedOutcomes[0].measurementMode, 'validation');
});
test('transport ambiguity is not called a known conversion failure and receipt records it', async () => {
  const h = routeHarness({ transportUnknown: true }); const r = await h.post();
  assert.equal(r.data.accepted, true);
  assert.equal(h.events.some(e => e.eventType === 'conversion_unknown'), true);
  assert.equal(h.events.some(e => e.eventType === 'conversion_failed'), false);
  assert.equal(h.savedOutcomes[0].status, 'outcome_unknown');
});
test('conversion outcome persists even without an anonymous visit', async () => {
  const h = routeHarness({ validateOnly: true }); await h.post({ funnelVisitId: '' });
  assert.equal(h.events.length, 0); assert.equal(h.savedOutcomes[0].measurementMode, 'validation');
});
test('normalizer accepts explicit new lifecycle events and rejects invalid visible duration', () => {
  const normalize = load('src/lib/seller-funnel-events.ts', {
    'server-only': {}, '@/lib/dominion-supabase': { getDominionServiceClient: () => null },
  }).normalizeSellerFunnelEvent;
  const base = { eventId: lead.submissionId, visitId: lead.submissionId, eventType: 'page_hidden',
    pagePath: '/sell/options', occurredAt: new Date().toISOString(), activeVisibleMs: 238 };
  assert.equal(normalize(base).activeVisibleMs, 238);
  assert.equal(normalize({ ...base, activeVisibleMs: -1 }).activeVisibleMs, null);
  assert.equal(normalize({ ...base, eventType: 'conversion_unknown' }).eventType, 'conversion_unknown');
});
