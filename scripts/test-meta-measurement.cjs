// Actual modules. Isolated provider/browser/storage. No network or credentials.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
function load(file, mocks = {}, globals = {}) {
  const module = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(source, { exports: module.exports, module, URL, URLSearchParams, Date, Response, AbortSignal,
    console: { error() {} }, process: { env: {} }, fetch: () => { throw new Error('Unexpected network'); },
    require(name) { if (name in mocks) return mocks[name]; if (name.startsWith('node:')) return require(name);
      throw new Error(`Unexpected dependency: ${name}`); }, ...globals }, { filename: file });
  return module.exports;
}
const policy = load('src/lib/meta-measurement-policy.ts');
const sourceUrl = 'https://www.dominionhomedeals.com/sell/offer-check/received';
const input = { submissionId: '00000000-0000-4000-8000-000000000001', occurredAt: '2026-10-14T12:00:00Z',
  host: 'www.dominionhomedeals.com', choice: { consent: true, consentVersion: 'meta_measurement_v1' },
  ip: '192.0.2.4', userAgent: 'Test browser' };
const env = { META_ADS_MEASUREMENT_MODE: 'production', META_ADS_PIXEL_ID: '1234567890',
  META_ADS_CONVERSIONS_ACCESS_TOKEN: 'fake-unit-test-only', META_GRAPH_API_VERSION: 'v25.0', VERCEL_ENV: 'production' };
function server(overrides = {}, transport) {
  return load('src/server/meta-ads-conversions.ts', { 'server-only': {},
    '@/lib/constants': { SITE: { url: 'https://www.dominionhomedeals.com' } },
    '@/lib/meta-measurement-policy': policy,
  }, { process: { env: { ...env, ...overrides } }, ...(transport ? { fetch: transport } : {}) });
}
test('Meta event allowlist has no seller fields or URL query', () => {
  const event = server().buildMetaLeadEvent({ ...input, phone: 'private', email: 'private', address: 'private',
    variant: 'estate', landingPage: '/sell/offer-check?reason=private', choice: { ...input.choice,
      fbp: 'fb.1.1760400000000.12345', fbc: 'arbitrary private text' } });
  assert.equal(event.event_source_url, sourceUrl);
  assert.equal(event.event_name, 'Lead');
  assert.equal(event.event_id, policy.metaLeadEventId(input.submissionId));
  assert.deepEqual(Object.keys(event.user_data).sort(), ['client_ip_address', 'client_user_agent', 'fbp']);
  assert.equal(JSON.stringify(event).includes('private'), false);
  assert.equal('custom_data' in event, false);
});
const click = 'IwAR2F4-dbP0l7Mn1IawQQGCINEz7PYXQvwjNwB_qa2ofrHyiLjcbCRxTDMgk';
test('fresh Meta click formats case-preserved fbc and supersedes a prior click', () => {
  const now = Date.now();
  const expected = `fb.1.${now}.${click}`;
  assert.equal(policy.metaFbcForLanding(`?fbclid=${click}&seller_reason=private`, undefined, now), expected);
  assert.equal(policy.metaFbcForLanding(`?fbclid=${click}`, `fb.1.${now - 1000}.DifferentPreviousClick123`, now), expected);
  const same = `fb.1.${now - 1000}.${click}`;
  assert.equal(policy.metaFbcForLanding(`?fbclid=${click}`, same, now), same);
  const event = server().buildMetaLeadEvent({ ...input, choice: { ...input.choice, fbc: expected } });
  assert.equal(event.user_data.fbc, expected);
  assert.equal(JSON.stringify(event).includes('seller_reason'), false);
});
test('fbc rejects stale malformed future and arbitrary query values', () => {
  const now = Date.now(), good = `fb.1.${now}.${click}`;
  assert.equal(policy.metaFbcForLanding('', good, now), good);
  for (const value of [`fb.1.${now - 91 * 86400000}.${click}`, `fb.1.${now + 120000}.${click}`,
    `fb.9.${now}.${click}`, 'private malformed cookie']) {
    assert.equal(policy.normalizeMetaClickCookie(value, now), undefined);
    assert.equal(policy.metaFbcForLanding('', value, now), undefined);
  }
  for (const query of ['?fbclid=private', '?fbclid=%3Cscript%3E', `?fbclid=${click}&fbclid=${click}`,
    `?fbclid=${'a'.repeat(501)}`, '?fbclid=abc.def.ghi.jklmnopqrstu']) {
    assert.equal(policy.metaFbcForLanding(query, good, now), undefined);
  }
});
test('privacy, QA, wrong hosts, preview deployment and missing config never call provider', async () => {
  for (const altered of [ { internalQa: true }, { globalPrivacyControl: true }, { choice: { consent: false } },
    { choice: { ...input.choice, optedOut: true } }, { choice: { ...input.choice, globalPrivacyControl: true } },
    { host: 'localhost' }, { host: 'example.vercel.app' } ]) {
    assert.equal((await server().reportMetaLead({ ...input, ...altered })).status, 'skipped');
  }
  for (const setting of [{ META_ADS_MEASUREMENT_MODE: 'disabled' }, { VERCEL_ENV: 'preview' },
    { VERCEL_ENV: '' },
    { META_ADS_CONVERSIONS_ACCESS_TOKEN: '' }, { META_GRAPH_API_VERSION: '' }, { META_ADS_TEST_EVENT_CODE: 'test' }]) {
    assert.equal((await server(setting).reportMetaLead(input)).status, 'skipped');
  }
});
test('test mode is explicit and sends test_event_code with identical event ID', async () => {
  let request;
  const api = server({ META_ADS_MEASUREMENT_MODE: 'test', META_ADS_TEST_EVENT_CODE: 'TEST_ONLY' }, async (url, options) => {
    request = { url, options }; return Response.json({ events_received: 1 });
  });
  const result = await api.reportMetaLead(input);
  assert.equal(result.status, 'provider_accepted'); assert.equal(result.measurementMode, 'test');
  const body = JSON.parse(request.options.body);
  assert.equal(body.test_event_code, 'TEST_ONLY'); assert.equal(body.data[0].event_id, result.eventId);
  assert.equal(request.url.includes('fake-unit-test-only'), false);
  assert.equal((await server({ META_ADS_MEASUREMENT_MODE: 'test' }).reportMetaLead(input)).referenceId, 'test_code_missing');
});
test('HTTP acceptance, rejection and timeout remain distinct', async () => {
  assert.equal((await server({}, async () => Response.json({ events_received: 1 })).reportMetaLead(input)).status, 'provider_accepted');
  assert.equal((await server({}, async () => Response.json({ error: 'secret response' }, { status: 400 })).reportMetaLead(input)).status, 'failed');
  assert.equal((await server({}, async () => { throw new Error('secret'); }).reportMetaLead(input)).status, 'outcome_unknown');
  assert.equal((await server({}, async () => Response.json({})).reportMetaLead(input)).status, 'outcome_unknown');
});
function browser({ gpc = false, query = '', referrer = '', qa = false, hostname = 'www.dominionhomedeals.com' } = {}) {
  const storage = new Map(), appended = [], head = [], commands = [];
  const location = { hostname, pathname: '/sell/offer-check/received', search: query, hash: '' };
  const document = { referrer, cookie: '', createElement(tag) { return { tag, click() {}, remove() {} }; },
    body: { appendChild: node => appended.push(node) }, head: { appendChild: node => head.push(node) } };
  const localStorage = { getItem: () => null };
  const globals = { window: { location }, navigator: { globalPrivacyControl: gpc }, document, localStorage,
    sessionStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) } };
  const browserPolicy = load('src/lib/meta-measurement-policy.ts', {}, globals);
  const api = load('src/lib/meta-browser-measurement.ts', { '@/lib/meta-measurement-policy': browserPolicy,
    '@/lib/seller-funnel-tracking': { isInternalQaSession: () => qa } }, globals);
  return { api, globals, storage, appended, head, commands };
}
test('browser clean navigation passes only bounded event ID and strips referrer', () => {
  const h = browser();
  assert.equal(h.api.openMetaMeasuredReceipt(policy.metaLeadEventId(input.submissionId), true), true);
  const value = JSON.parse([...h.storage.values()][0]);
  assert.deepEqual(Object.keys(value).sort(), ['consent', 'consentVersion', 'eventId', 'expiresAt']);
  assert.equal(h.appended[0].referrerPolicy, 'no-referrer');
  assert.equal(h.appended[0].href, '/sell/offer-check/received');
});
test('browser sends one Lead with shared ID and reload cannot repeat', () => {
  const h = browser(); h.api.openMetaMeasuredReceipt(policy.metaLeadEventId(input.submissionId), true);
  assert.equal(h.api.reportMetaBrowserReceipt('1234567890', 'production', 'production'), true);
  const queue = h.globals.window.fbq.queue;
  assert.equal(queue.filter(args => args[2] === 'Lead').length, 1);
  assert.equal(queue.find(args => args[2] === 'Lead')[4].eventID, policy.metaLeadEventId(input.submissionId));
  assert.equal(queue.find(args => args[1] === 'autoConfig')[2], false);
  assert.equal(queue.find(args => args[0] === 'init').length, 2);
  assert.equal(h.api.reportMetaBrowserReceipt('1234567890', 'production', 'production'), false);
  assert.equal(h.head.length, 1);
});
test('browser blocks GPC, QA, queries, referrers, preview, local and test mode', () => {
  for (const settings of [{ gpc: true }, { qa: true }, { query: '?private=value' },
    { referrer: 'https://example.test?private=value' }, { hostname: 'localhost' }]) {
    const h = browser(settings); h.api.openMetaMeasuredReceipt(policy.metaLeadEventId(input.submissionId), true);
    assert.equal(h.api.reportMetaBrowserReceipt('1234567890', 'production', 'production'), false);
    assert.equal(h.head.length, 0);
  }
  for (const [mode, deployment] of [['test', 'production'], ['production', 'preview'], ['production', '']]) {
    const h = browser(); h.api.openMetaMeasuredReceipt(policy.metaLeadEventId(input.submissionId), true);
    assert.equal(h.api.reportMetaBrowserReceipt('1234567890', mode, deployment), false);
  }
});
test('fresh click collection happens only after optional consent and privacy checks', () => {
  const h = browser({ query: `?fbclid=${click}&phone=private` });
  assert.equal(h.api.readMetaMeasurementChoice(false).fbc, undefined);
  const value = h.api.readMetaMeasurementChoice(true);
  assert.match(value.fbc, new RegExp(`^fb\\.1\\.\\d{13}\\.${click}$`));
  assert.equal(JSON.stringify(value).includes('private'), false);
  for (const settings of [{ gpc: true }, { qa: true }, { hostname: 'localhost' }]) {
    const blocked = browser({ ...settings, query: `?fbclid=${click}` });
    assert.equal(blocked.api.readMetaMeasurementChoice(true).fbc, undefined);
  }
  const bad = browser({ query: '?fbclid=%3Cprivate%3E' });
  assert.equal(bad.api.readMetaMeasurementChoice(true).fbc, undefined);
});
test('public telemetry cannot forge the server acceptance milestone', async () => {
  let stored = 0;
  const api = load('src/app/api/meta-seller-funnel-events/route.ts', {
    'next/server': { NextResponse: { json: (data, options) => Response.json(data, options) } },
    '@/lib/constants': { SITE: { url: 'https://www.dominionhomedeals.com' } },
    '@/lib/meta-seller-funnel-events': { normalizeMetaSellerFunnelEvent: value => value,
      metaSellerEventRateLimitKey: value => value, recordMetaSellerFunnelEvent: async () => { stored += 1; return { duplicate: false }; } },
  });
  const response = await api.POST({ headers: new Headers({ origin: 'https://www.dominionhomedeals.com' }),
    json: async () => ({ eventType: 'lead_accepted' }) });
  assert.equal(response.status, 400); assert.equal(stored, 0);
});
