#!/usr/bin/env node
'use strict';

// Executes the actual API + lead helper in isolated VMs. No app imports,
// credentials, browser, production requests, or production writes are allowed.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { createRequire } = require('node:module');
const { execFileSync } = require('node:child_process');
const repo = path.resolve(__dirname, '..');
const fromRepo = createRequire(path.join(process.env.DOMINION_TEST_DEPENDENCY_ROOT || repo, 'package.json'));
const ts = fromRepo('typescript');
const files = ['src/lib/dominion-leads.ts', 'src/app/api/leads/route.ts'];
const source = Object.fromEntries(files.map(file => [file, fs.readFileSync(path.join(repo, file), 'utf8')]));
const compile = text => ts.transpileModule(text, { compilerOptions: {
  target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS,
}}).outputText;
const compiled = Object.fromEntries(files.map(file => [file, compile(source[file])]));
const baselineRef = '95928f57861553075c50d2f884b7ba2db8488afa';
const beforeCompiled = Object.fromEntries(files.map(file => [file, compile(execFileSync('git', ['show', `${baselineRef}:${file}`], { cwd: repo, encoding: 'utf8' }))]));
class FixedDate extends Date { constructor(...args) { super(...(args.length ? args : ['2026-08-28T12:00:00Z'])); } static now() { return Date.parse('2026-08-28T12:00:00Z'); } }
let assertions = 0;
const equal = (actual, expected, label) => { assert.equal(actual, expected, label); assertions++; };
const check = (actual, label) => { assert.ok(actual, label); assertions++; };
const same = (actual, expected, label) => { assert.deepEqual(JSON.parse(JSON.stringify(actual)), JSON.parse(JSON.stringify(expected)), label); assertions++; };
const checks = [];

const base = {
  address: '123 Synthetic <Test> St', city: 'Spokane', state: 'WA', zip: '99201',
  firstName: 'Synthetic', lastName: "O'Example", phone: '2025550100',
  email: 'synthetic@example.invalid', condition: 'Needs work', timeline: 'Exploring',
  primaryConstraint: 'Compare realistic options', source: 'website',
  landingPage: '/sell/options?utm_source=chatgpt&utm_medium=cpc',
  utmSource: 'chatgpt', utmMedium: 'cpc', utmCampaign: 'synthetic_no_send',
  utmTerm: 'options', utmContent: 'comparison&tag', oppref: 'opaque&ref=<value>',
  submissionFlow: 'seller_options_v1', submissionId: 'eeeee001-1234-4234-8234-123456789012',
  sellerAuthority: 'owner', sms_consent: true, sms_consent_timestamp: '2026-08-27T00:00:00Z',
  tcpaConsent: true, tcpaTimestamp: '2026-08-27T00:00:00Z',
};
const allEnv = {
  RESEND_API_KEY: 'synthetic-not-a-credential',
  SENTINEL_API_URL: 'https://synthetic-sentinel.invalid', SENTINEL_INTAKE_SECRET: 'synthetic-only',
  LAZARUS_INTAKE_URL: 'https://synthetic-lazarus.invalid/api/intake/leads',
  LAZARUS_INTAKE_CREATE_LEAD_KEY: 'synthetic-only',
  LAZARUS_OPTIONS_INTAKE_URL: 'https://synthetic-options-lazarus.invalid/api/intake/leads',
  LAZARUS_OPTIONS_INTAKE_CREATE_LEAD_KEY: 'synthetic-options-only',
  MAILCHIMP_API_KEY: 'synthetic-only',
};

function memoryStore(config = {}) {
  const rows = [];
  const stats = { inserts: 0, updates: 0, selects: 0 };
  let nextId = 91000;
  function from(table) {
    check(['al_memories', 'dominion_website_lead_receipts'].includes(table), 'Only baseline or dedicated Dominion table is used');
    const op = { mode: 'select', filters: [] };
    const query = {
      insert(value) { op.mode = 'insert'; op.value = value; return query; },
      update(value) { op.mode = 'update'; op.value = value; return query; },
      select(value) { op.columns = value; return query; },
      eq(key, value) { op.filters.push([key, value]); return query; },
      single: async () => execute(false),
      maybeSingle: async () => execute(true),
    };
    function execute(optional) {
      if (op.mode === 'insert') {
        stats.inserts++;
        if (config.insertFail) return { data: null, error: { code: 'XX000', message: 'synthetic failure' } };
        if ((op.value.submission_id != null && rows.some(row =>
          row.submission_id === op.value.submission_id)) ||
          (op.value.content_hash != null && rows.some(row =>
            row.category === op.value.category && row.content_hash === op.value.content_hash))) {
          return { data: null, error: { code: '23505', message: 'synthetic unique violation' } };
        }
        const row = { id: ++nextId, created_at: '2026-08-27T01:00:00Z', updated_at: '2026-08-27T01:00:00Z', ...op.value };
        rows.push(row);
        if (config.insertCommitThenFail) {
          config.insertCommitThenFail = false;
          return { data: null, error: { code: 'network_unknown' } };
        }
        return { data: { ...row }, error: null };
      }
      if (op.mode === 'update' && config.concurrentOperatorEdit) {
        config.concurrentOperatorEdit = false;
        const content = JSON.parse(rows[0].content);
        content.status = 'working'; content.owner = 'dez';
        rows[0].content = JSON.stringify(content);
      }
      const row = rows.find(item => op.filters.every(([key, value]) => item[key] === value));
      if (op.mode === 'update') {
        stats.updates++;
        if (config.updateFail || !row) return { data: null, error: { code: 'PGRST116' } };
        Object.assign(row, op.value);
      } else {
        stats.selects++;
        if (config.selectFail) return { data: null, error: { code: 'XX000' } };
      }
      return { data: row ? { ...row } : null, error: !row && !optional ? { code: 'PGRST116' } : null };
    }
    return query;
  }
  return { from, rows, stats };
}

function setup(config = {}, sharedStore) {
  const store = sharedStore || memoryStore(config);
  const env = config.env || {};
  const calls = [];
  const logs = [];
  let mailchimpCalls = 0;
  const mailchimpPayloads = [];
  const quietConsole = Object.fromEntries(['log', 'warn', 'error'].map(method =>
    [method, (...args) => logs.push({ method, args })]));
  function moduleContext(requireStub) {
    const exports = {};
    return {
      exports, module: { exports }, require: requireStub,
      process: { env }, console: quietConsole, Date: FixedDate,
      setTimeout: (callback, ms) => setTimeout(callback, Math.min(ms, 20)), clearTimeout,
    };
  }
  const helperContext = moduleContext(name => {
    if (name === '@/lib/supabase') return { getServiceClient: () => config.storageMissing ? null : store };
    if (name === '@/lib/dominion-supabase') return { getDominionServiceClient: () => config.storageMissing ? null : store };
    if (name === 'node:crypto') return crypto;
    throw new Error('Blocked unmocked helper import: ' + name);
  });
  vm.runInNewContext((config.before ? beforeCompiled : compiled)[files[0]] + '\nexports.__test = {rowToDominionLead, dominionLeadToContent};', helperContext);
  const helper = helperContext.exports;
  const routeContext = moduleContext(name => {
    if (name === 'next/server') return { NextResponse: { json: (body, options = {}) => ({ status: options.status || 200, body }) } };
    if (name === '@/lib/constants') return { SITE: { phone: '2025550100' } };
    if (name === '@/lib/dominion-leads') return helper;
    if (name === 'node:crypto') return crypto;
    if (name === '@/server/openai-ads-conversions') return {
      reportOpenAILeadCreated: async () => ({ status: 'skipped' }),
    };
    if (name === '@/lib/seller-funnel-events') return {
      normalizeSellerFunnelEvent: value => value,
      recordSellerFunnelEvent: async () => ({ duplicate: false }),
    };
    if (name === '@/lib/mailchimp') return { syncSellerLeadToMailchimp: async lead => {
      mailchimpCalls++;
      mailchimpPayloads.push(JSON.parse(JSON.stringify(lead)));
      if (config.mailchimpFailure) throw new Error('synthetic failure');
      return { skipped: !env.MAILCHIMP_API_KEY };
    }};
    throw new Error('Blocked unmocked API import: ' + name);
  });
  routeContext.fetch = async (url, options) => {
    check(['https://api.resend.com/emails', 'https://synthetic-sentinel.invalid/api/inbound/webform',
      'https://synthetic-lazarus.invalid/api/intake/leads', 'https://synthetic-options-lazarus.invalid/api/intake/leads'].includes(url), 'mock target allowlist');
    calls.push({ url, options, payload: JSON.parse(options.body) });
    const provider = (url === 'https://api.resend.com/emails' ? config.email : config.lazarus) || config;
    if (provider.providerHang) return new Promise(() => {});
    if (provider.providerThrow) throw new Error('synthetic network interruption');
    return { ok: !provider.providerFailure, status: provider.providerFailure || 200,
      text: async () => 'synthetic provider failure', json: async () => {
        if (provider.jsonThrow) throw new Error('synthetic malformed JSON');
        return Object.hasOwn(provider, 'providerResponse') ? provider.providerResponse :
          ({ id: 'synthetic-provider-id', ppcLeadId: 'ppc-synthetic-record-id', leadId: 'ppc-synthetic-record-id', lead: { id: 'ppc-synthetic-record-id' } });
      } };
  };
  vm.runInNewContext((config.before ? beforeCompiled : compiled)[files[1]] + '\nexports.__test = {sendSmsNotification, forwardToSentinel, forwardToLazarus};', routeContext);
  let requestNumber = 0;
  const post = async payload => routeContext.exports.POST({
    headers: { get: () => `192.0.2.${++requestNumber}` }, json: async () => structuredClone(payload),
  });
  return { post, store, helper, calls, logs, route: routeContext.exports, mailchimpPayloads, mailchimpCalls: () => mailchimpCalls };
}

function saved(response, duplicate) {
  equal(response.status, 200, 'saved response HTTP status');
  equal(response.body.success, true, 'saved success');
  equal(response.body.accepted, true, 'saved accepted');
  equal(response.body.controlRecorded, true, 'real control record');
  equal(response.body.duplicate, duplicate, 'explicit duplicate flag');
  check(typeof response.body.receiptId === 'string' && response.body.receiptId.length > 0, 'string receipt ID');
}
const content = state => JSON.parse(state.store.rows[0].content);

(async () => {
  const legacyPayload = { ...base }; delete legacyPayload.submissionFlow;
  for (const config of [{ storageMissing: true }, { insertFail: true }]) {
    const state = setup(config);
    const response = await state.post(legacyPayload);
    equal(response.body.success, true, 'legacy best-effort success preserved');
    equal(response.body.controlRecorded, !!config.storageMissing, 'legacy controlRecorded keeps exact production-HEAD semantics');
  }
  const legacy = setup();
  equal((await legacy.post(legacyPayload)).body.controlRecorded, true, 'legacy actual control record true');
  equal(legacy.store.rows[0].content_hash, undefined, 'legacy insert has no new idempotency key');
  equal(content(legacy).optionsReceipt, undefined, 'legacy record envelope unchanged');
  checks.push('legacy defaults and controlRecorded exactly match production HEAD, including pre-existing null-storage behavior');

  const legacyEnv = Object.fromEntries(Object.entries(allEnv).filter(([key]) => !key.startsWith('LAZARUS_OPTIONS_')));
  const optionsEnv = Object.fromEntries(Object.entries(allEnv).filter(([key]) => key.startsWith('LAZARUS_OPTIONS_')));
  const envCases = { none: {}, optionsOnly: optionsEnv, legacyOnly: legacyEnv, both: allEnv };
  const legacyVariants = [legacyPayload, { ...legacyPayload, submissionFlow: 'seller_options_V1',
    adAttribution: { utm_content: 'structured only is unchanged', hsa_test: '  old <trim>&value  ' },
    utmContent: '  ' + 'legacy'.repeat(110) + ' & <tag>  ',
    oppref: '  legacy opaque&ref=雪  ' }, { ...legacyPayload,
    gclid: '  <legacy&click>  ', city: '  Test<&>City  ', state: '',
    adAttribution: { gclid:'structured old click', hsa_test:'  raw<&tag>  ', oppref:'  structured-ref  ' },
    primaryConstraint:'ignored on legacy', sellerAuthority:'authorized_representative' }];
  for (const [envName, env] of Object.entries(envCases)) {
    for (const [variantIndex, payload] of legacyVariants.entries()) {
      const old = setup({ before: true, env });
      const current = setup({ env });
      same(await current.post(payload), await old.post(payload), `${envName}/${variantIndex}: legacy API response unchanged`);
      same(current.calls, old.calls, `${envName}/${variantIndex}: legacy destinations, payloads and headers unchanged`);
      equal(current.mailchimpCalls(), old.mailchimpCalls(), `${envName}/${variantIndex}: legacy Mailchimp behavior unchanged`);
      same(current.mailchimpPayloads, old.mailchimpPayloads, `${envName}/${variantIndex}: legacy Mailchimp lead payload unchanged`);
      same(content(current), content(old), `${envName}/${variantIndex}: legacy saved control content unchanged`);
      same(current.helper.__test.rowToDominionLead(current.store.rows[0]),
        old.helper.__test.rowToDominionLead(old.store.rows[0]), `${envName}/${variantIndex}: legacy read model unchanged`);
      check(!current.calls.some(call => call.url.includes('synthetic-options-lazarus')), `${envName}: legacy never uses options destination`);
      check(!current.calls.some(call => call.payload.headers), `${envName}: legacy emails have no options exclusion headers`);
      const currentForward = current.calls.find(call => call.url.includes('lazarus'));
      if (currentForward) {
        equal(currentForward.options.headers['x-lazarus-intake-key'], allEnv.LAZARUS_INTAKE_CREATE_LEAD_KEY,
          `${envName}: legacy uses its original key`);
        equal(currentForward.payload.sourceDetails.intakeMode, undefined, `${envName}: no options provenance added to legacy`);
      }
    }
  }
  checks.push('actual before/after legacy behavior matches across none/options-only/legacy-only/both env matrices, normal and unrecognized flow');

  for (const mutation of [{honeypot:'filled'}, {address:''}, {firstName:''}, {phone:'x'},
    {email:'invalid'}, {phone:42}, {firstName:[]}, {state:'or'}, {sms_consent:false},
    {utmContent:undefined, adAttribution:{utm_content:'structured legacy value', oppref:'ignored-ref'}}]) {
    const old = setup({before:true,env:allEnv});
    const current = setup({env:allEnv});
    same(await current.post({...legacyPayload,...mutation}), await old.post({...legacyPayload,...mutation}), 'legacy validation/spam/fallback response matches HEAD');
    same(current.calls,old.calls,'legacy validation/spam/fallback fanout matches HEAD');
    same(current.mailchimpPayloads,old.mailchimpPayloads,'legacy optional details do not alter Mailchimp payload');
    equal(current.store.rows.length,old.store.rows.length,'legacy validation/spam/fallback durable row count matches HEAD');
    same(current.store.rows.map(row => JSON.parse(row.content)),old.store.rows.map(row => JSON.parse(row.content)),
      'legacy validation/spam/fallback saved lead content matches HEAD across the dedicated storage schema');
  }
  checks.push('production-HEAD legacy validation/spam/error/optional-field contracts also preserved');

  for (const env of [legacyEnv,
    { ...legacyEnv, LAZARUS_OPTIONS_INTAKE_URL: allEnv.LAZARUS_OPTIONS_INTAKE_URL },
    { ...legacyEnv, LAZARUS_OPTIONS_INTAKE_CREATE_LEAD_KEY: allEnv.LAZARUS_OPTIONS_INTAKE_CREATE_LEAD_KEY }]) {
    const state = setup({ env });
    const response = await state.post(base); saved(response, false);
    equal(response.body.deliveryStatus, 'provider_accepted', 'aggregate status acknowledges configured email only, not a skipped CRM');
    equal(content(state).optionsReceipt.delivery.email.status, 'provider_accepted', 'email-only acknowledgement is explicit in per-destination ledger');
    equal(state.calls.length, 1, 'missing options pair sends only ordinary team email');
    equal(state.calls[0].url, 'https://api.resend.com/emails', 'no legacy URL/key fallback');
    equal(content(state).optionsReceipt.delivery.lazarus.status, 'skipped', 'unconfigured dedicated intake recorded skipped');
    equal(state.mailchimpCalls(), 0, 'no legacy Mailchimp fallback');
  }
  const dedicatedOnly = setup({ env: optionsEnv });
  saved(await dedicatedOnly.post(base), false);
  equal(dedicatedOnly.calls.length, 1, 'options pair alone only calls dedicated create-only intake');
  equal(dedicatedOnly.calls[0].url, allEnv.LAZARUS_OPTIONS_INTAKE_URL, 'dedicated URL chosen');
  equal(dedicatedOnly.calls[0].options.headers['x-lazarus-intake-key'], allEnv.LAZARUS_OPTIONS_INTAKE_CREATE_LEAD_KEY,
    'dedicated key chosen');
  checks.push('dedicated configuration is isolated in both directions; incomplete options pair never falls back to legacy');

  const absent = setup({ storageMissing: true, env: allEnv });
  const absentResponse = await absent.post(base);
  equal(absentResponse.status, 503, 'options cannot accept without storage');
  equal(absentResponse.body.accepted, false, 'missing record not accepted');
  equal(absent.calls.length, 0, 'no fanout before durable storage');
  equal(absent.mailchimpCalls(), 0, 'no Mailchimp before durable storage');
  checks.push('missing durable storage blocks options acceptance and all fanout');

  const noDest = setup();
  const noDestResponse = await noDest.post(base); saved(noDestResponse, false);
  equal(noDestResponse.body.deliveryStatus, 'needs_review', 'no destination is not delivery');
  check(Object.values(content(noDest).optionsReceipt.delivery).every(item => item.status === 'skipped'), 'skipped map persisted');
  checks.push('saved without configured destinations remains saved and needs reconciliation');
  const good = setup({ env: allEnv });
  const first = await good.post(base); saved(first, false);
  equal(first.body.deliveryStatus, 'provider_accepted', 'provider acknowledgment only');
  equal(good.calls.length, 2, 'only two approved options HTTP destinations');
  equal(good.mailchimpCalls(), 0, 'no options Mailchimp enrollment');
  equal(content(good).sellerAuthority, 'owner', 'self-reported authority stored');
  equal(content(good).adAttribution.oppref, base.oppref, 'opaque oppref bytes retained');
  equal(content(good).utmContent, base.utmContent, 'raw UTM retained');
  equal(good.store.rows[0].submission_id, base.submissionId, 'dedupe key is the validated submission UUID');
  check(/^[0-9a-f]{64}$/.test(good.store.rows[0].payload_fingerprint), 'immutable payload fingerprint');
  check(Number.isSafeInteger(good.store.rows[0].id) && good.store.rows[0].id > 0, 'normal numeric PK');
  const email = good.calls.find(call => call.payload.html);
  check(email.payload.html.includes('Synthetic &lt;Test&gt;'), 'HTML property escaping');
  check(!email.payload.html.includes('Synthetic <Test>'), 'no property markup injection');
  check(email.payload.html.includes('opaque&amp;ref=&lt;value&gt;'), 'HTML attribution escaping');
  equal(good.calls.filter(call => call.url.includes('sentinel')).length, 0, 'no options Sentinel calls');
  equal(email.payload.headers['X-Dominion-Submission-Flow'], base.submissionFlow, 'server-set email flow marker');
  equal(email.payload.headers['X-Dominion-Submission-Id'], base.submissionId, 'server-set email UUID marker');
  equal(email.payload.from, 'Dominion Homes Leads <leads@dominionhomedeals.com>', 'existing sender unchanged');
  equal(JSON.stringify(email.payload.to), JSON.stringify(['adam@dominionhomedeals.com','logan@dominionhomedeals.com','leads@dominionhomedeals.com']), 'existing email recipients unchanged');
  const lazarus = good.calls.find(call => call.url.includes('lazarus'));
  equal(content(good).optionsReceipt.delivery.lazarus.referenceId, 'ppc-synthetic-record-id',
    'receipt records the exact PPC card ID, not a generic Leads/Files ID');
  equal(content(good).optionsReceipt.delivery.email.referenceId, 'synthetic-provider-id',
    'receipt independently records the provider email message ID');
  equal(lazarus.payload.sourceDetails.oppref, base.oppref, 'Lazarus structured oppref');
  equal(lazarus.payload.sourceDetails.submissionId, base.submissionId, 'Lazarus structured submission ID');
  equal(lazarus.payload.sourceDetails.sellerAuthority, 'owner', 'Lazarus authority self-report');
  equal(lazarus.payload.sourceDetails.intakeMode, 'create_only', 'explicit create-only provenance');
  equal(lazarus.payload.sourceDetails.automatedSellerSms, 'disabled_for_this_intake', 'intake-specific SMS-disabled provenance');
  equal(lazarus.payload.sourceDetails.condition, content(good).condition, 'existing condition forwarded as structured PPC field');
  equal(lazarus.payload.sourceDetails.timeline, content(good).timeline, 'existing timeline forwarded as structured PPC field');
  equal(lazarus.payload.sourceDetails.smsConsent, 'yes', 'explicit existing opt-in forwarded without enrollment');
  equal(lazarus.payload.sourceDetails.smsConsentCapturedAt, base.sms_consent_timestamp, 'existing opt-in timestamp preserved');
  equal(lazarus.payload.sourceDetails.smsConsentIp, content(good).smsConsentIP, 'existing opt-in IP preserved');
  check(Object.values(lazarus.payload.sourceDetails).every(value => typeof value === 'string'), 'receiver sourceDetails contract uses strings only');
  equal(lazarus.options.headers['x-lazarus-intake-key'], allEnv.LAZARUS_OPTIONS_INTAKE_CREATE_LEAD_KEY, 'options never uses legacy secret');
  checks.push('normal saved receipt; raw attribution; safe HTML; options-only email and create-only intake');

  for (const smsConsent of [false, true]) {
    const state = setup({ env: { ...allEnv, LEAD_SMS_RECIPIENTS: 'synthetic@example.invalid' } });
    saved(await state.post({ ...base, sms_consent: smsConsent }), false);
    equal(state.calls.length, 2, 'SMS consent cannot enable unapproved options fanout');
    equal(state.mailchimpCalls(), 0, 'SMS consent cannot enable options Mailchimp');
    const detail = state.calls.find(call => call.url.includes('lazarus')).payload.sourceDetails;
    equal(detail.smsConsent, smsConsent ? 'yes' : 'no', 'structured consent reflects actual submitted opt-in');
    equal(detail.smsConsentCapturedAt, smsConsent ? base.sms_consent_timestamp : undefined,
      'no fabricated opt-in timestamp when consent is false');
    equal(detail.smsConsentIp, smsConsent ? content(state).smsConsentIP : undefined,
      'no opt-in IP when consent is false');
    for (const destination of ['teamSms', 'sentinel', 'mailchimp']) {
      equal(content(state).optionsReceipt.delivery[destination].status, 'skipped', `forbidden ${destination} skipped`);
    }
    equal(await state.route.__test.sendSmsNotification({ ...base, smsConsent }), undefined, 'direct helper defense skips options SMS');
    equal(await state.route.__test.forwardToSentinel(base), undefined, 'direct helper defense skips options Sentinel');
    equal(state.calls.length, 2, 'defensive helper calls cannot send');
  }
  const forgedHeaders = setup({ env: allEnv });
  saved(await forgedHeaders.post({ ...base, submissionId: base.submissionId.toUpperCase(),
    headers: { 'X-Dominion-Submission-Id': 'client-forged' },
    emailHeaders: { 'X-Dominion-Submission-Flow': 'client-forged' } }), false);
  same(forgedHeaders.calls.find(call => call.payload.html).payload.headers, {
    'X-Dominion-Submission-Flow': 'seller_options_v1', 'X-Dominion-Submission-Id': base.submissionId,
  }, 'markers generated by server from validated flow and UUID, not client headers');
  checks.push('SMS consent does not enable texts or enrollment; both direct helper defenses and server-only email markers verified');

  const missingConsent = setup({ env: allEnv });
  const noConsentPayload = { ...base };
  delete noConsentPayload.sms_consent;
  saved(await missingConsent.post(noConsentPayload), false);
  const noConsentDetails = missingConsent.calls.find(call => call.url.includes('lazarus')).payload.sourceDetails;
  equal(noConsentDetails.smsConsent, 'no', 'absent opt-in is never defaulted true');
  equal(noConsentDetails.smsConsentCapturedAt, undefined, 'stale timestamp alone never creates consent');
  equal(noConsentDetails.smsConsentIp, undefined, 'absent opt-in does not invent consent evidence');
  equal(missingConsent.calls.length, 2, 'absent opt-in still permits only existing internal email and PPC intake');

  const referralCases = ['  ' + 'r'.repeat(640) + '+&Ω雪<ref>\t ', ' \t  ',
    'a+b/c==&x=é雪', '  %2B+%26 & value  '];
  for (const oppref of referralCases) {
    const state = setup({ env: allEnv });
    saved(await state.post({ ...base, oppref }), false);
    equal(content(state).adAttribution.oppref, oppref, 'original oppref survives control insert/outcome update');
    const parsedReferral = state.helper.__test.rowToDominionLead(state.store.rows[0]);
    const reserialized = JSON.parse(state.helper.__test.dominionLeadToContent(parsedReferral));
    equal(reserialized.adAttribution.oppref, oppref, 'original oppref survives parser/serializer');
    equal(JSON.parse(state.calls.find(call => call.url.includes('lazarus')).payload.sourceDetails.adAttributionJson).oppref,
      oppref, 'original oppref reaches canonical intake attribution JSON');
    equal(state.calls.find(call => call.url.includes('lazarus')).payload.sourceDetails.oppref,
      oppref, 'original oppref reaches Lazarus structured data');
    saved(await state.post({ ...base, oppref }), true);
    equal((await state.post({ ...base, oppref: oppref + ' ' })).status, 409, 'whitespace change changes immutable referral fingerprint');
  }
  const crowded = setup();
  const extraAttribution = Object.fromEntries(Array.from({ length: 85 }, (_, i) => ['hsa_' + i, 'synthetic']));
  saved(await crowded.post({ ...base, adAttribution: extraAttribution, oppref: referralCases[0] }), false);
  equal(content(crowded).adAttribution.oppref, referralCases[0], 'oppref survives generic attribution entry limit');
  checks.push('exact oppref survives >300 chars, whitespace, plus, ampersand, Unicode, serialization and forwarding');

  const rawValues = { utm_source: '  chatgpt & 雪  ', utm_medium: '  cpc  ',
    utm_campaign: '  campaign ' + 'c'.repeat(650) + '<&>Ω  ',
    utm_term: '  exact phrase  ', utm_content: '  ' + 'content'.repeat(115) + '+&雪  ',
    gclid: '  ' + 'g'.repeat(510) + '+&Ω  ', oppref: referralCases[0],
    gbraid: '  braid+&  ', wbraid: '  web-braid  ', gad_source: '  source  ',
    gad_campaignid: '  12345  ', keyword: '  sell  ', matchtype: '  exact  ',
    adgroup: '  test group  ', searchterm: '  what to do?  ', hsa_test: '  ' + 'h'.repeat(650) + '雪  ' };
  const fieldMapping = { utm_source: 'utmSource', utm_medium: 'utmMedium', utm_campaign: 'utmCampaign',
    utm_term: 'utmTerm', utm_content: 'utmContent', gclid: 'gclid', oppref: 'oppref',
    gbraid: 'gbraid', wbraid: 'wbraid', gad_source: 'gadSource', gad_campaignid: 'gadCampaignId',
    keyword: 'keyword', matchtype: 'matchtype', adgroup: 'adgroup', searchterm: 'searchterm' };
  for (const kind of ['structuredOnly', 'topLevel']) {
    const payload = { ...base, adAttribution: { ...rawValues, unapproved_field: 'must not be included' } };
    for (const field of Object.values(fieldMapping)) delete payload[field];
    if (kind === 'topLevel') for (const [key, field] of Object.entries(fieldMapping)) payload[field] = rawValues[key];
    const state = setup({ env: allEnv });
    saved(await state.post(payload), false);
    same(content(state).adAttribution, rawValues, `${kind}: canonical raw attribution survives storage without trim/truncation`);
    const parsed = state.helper.__test.rowToDominionLead(state.store.rows[0]);
    same(parsed.adAttribution, rawValues, `${kind}: actual read parser retains raw canonical values`);
    same(JSON.parse(state.helper.__test.dominionLeadToContent(parsed)).adAttribution, rawValues,
      `${kind}: actual serializer retains raw canonical values`);
    const forwarded = state.calls.find(call => call.url.includes('lazarus')).payload;
    same(JSON.parse(forwarded.sourceDetails.adAttributionJson), rawValues, `${kind}: receiver JSON preserves exact supported raw map`);
    equal(forwarded.sourceDetails.oppref, rawValues.oppref, `${kind}: flat opaque reference exact`);
    equal(content(state).adAttribution.unapproved_field, undefined, 'unsupported attribution keys excluded');
    const changedPayload = { ...payload, adAttribution: { ...payload.adAttribution, hsa_test: rawValues.hsa_test + ' ' } };
    equal((await state.post(changedPayload)).status, 409, `${kind}: trailing canonical attribution change alters fingerprint`);
    equal(state.calls.length, 2, `${kind}: conflict never resends`);
  }
  checks.push('supported canonical attribution map remains exact across API/store/parser/serializer/receiver JSON; legacy normalization unchanged');

  const second = await good.post(base); saved(second, true);
  equal(second.body.receiptId, first.body.receiptId, 'duplicate same receipt');
  equal(good.calls.length, 2, 'duplicate does not repeat approved forwarders');
  equal(good.mailchimpCalls(), 0, 'duplicate cannot enroll Mailchimp');
  equal(good.store.rows.length, 1, 'single durable record');
  const timestampRetry = await good.post({ ...base, tcpaTimestamp: '2026-08-28T00:00:00Z',
    sms_consent_timestamp: '2026-08-28T00:00:00Z', submissionId: base.submissionId.toUpperCase() });
  saved(timestampRetry, true);
  checks.push('same submission/timestamp-only retry returns same receipt without replay');

  const anotherInstance = setup({ env: allEnv }, good.store);
  saved(await anotherInstance.post(base), true);
  equal(anotherInstance.calls.length, 0, 'dedup works across fresh API instances');
  checks.push('durable-key behavior across fresh isolated API instances');

  const changes = { address: '456 Different Test St', phone: '2025550101', sellerAuthority: 'authorized_representative',
    sms_consent: false, primaryConstraint: 'A different problem', oppref: 'different-opaque-id',
    landingPage: '/sell/options?different', utmTerm: 'urgent', tcpaConsent: false };
  for (const [field, value] of Object.entries(changes)) {
    const response = await anotherInstance.post({ ...base, [field]: value });
    equal(response.status, 409, `same ID changed ${field} conflicts`);
    equal(response.body.accepted, false, 'conflict not acknowledged');
    equal(response.body.receiptId, null, 'conflict no record disclosure');
    check(!JSON.stringify(response).includes(base.phone), 'conflict no stored PII');
  }
  equal(anotherInstance.calls.length, 0, 'conflicts never replay');
  checks.push('immutable seller/contact/consent/attribution conflicts return 409 without PII');

  const race = setup({ env: allEnv });
  const raced = await Promise.all([race.post(base), race.post(base)]);
  equal(raced.filter(item => item.body.duplicate === false).length, 1, 'one race winner');
  equal(raced.filter(item => item.body.duplicate === true).length, 1, 'one race duplicate');
  equal(race.store.rows.length, 1, 'atomic unique-key race produces one row');
  equal(race.calls.length, 2, 'race winner alone forwards to approved destinations');
  equal(race.mailchimpCalls(), 0, 'race never syncs Mailchimp');
  checks.push('concurrent same-ID requests: one durable record and one fanout owner');

  const honey = setup({ env: allEnv });
  const honeyResponse = await honey.post({ ...base, honeypot: 'filled' });
  equal(honeyResponse.body.accepted, false, 'honeypot never accepted');
  equal(honeyResponse.body.controlRecorded, false, 'honeypot never recorded');
  equal(honey.store.rows.length, 0, 'honeypot zero records');
  equal(honey.calls.length, 0, 'honeypot no side effects');
  checks.push('honeypot cannot enter accepted/conversion contract');

  for (const mutation of [{ submissionId: '' }, { submissionId: 'not-a-uuid' }, { sellerAuthority: '' },
    { sellerAuthority: 'buyer' }, { phone: 42 }, { firstName: [] }, { state: '' }, { state: 'OR' }, { address: 'x' }]) {
    const state = setup({ env: allEnv });
    equal((await state.post({ ...base, ...mutation })).status, 400, 'invalid options input rejected');
    equal(state.store.rows.length, 0, 'invalid payload no record');
    equal(state.calls.length, 0, 'invalid payload no fanout');
  }
  const idaho = setup(); saved(await idaho.post({ ...base, state: 'id', city: "Coeur d'Alene" }), false);
  equal(content(idaho).state, 'ID', 'explicit Idaho is preserved, not defaulted to WA');
  checks.push('options runtime types, UUID, authority and state validation; explicit ID preserved');

  for (const config of [{ providerFailure: 503 }, { providerThrow: true }, { providerHang: true }]) {
    const state = setup({ ...config, env: allEnv });
    const response = await state.post(base); saved(response, false);
    equal(response.body.deliveryStatus, 'needs_review', 'delivery problem not silently success');
    const expected = config.providerFailure ? 'failed' : 'outcome_unknown';
    equal(content(state).optionsReceipt.delivery.lazarus.status, expected, 'correct remote outcome uncertainty');
    const count = state.calls.length;
    saved(await state.post(base), true);
    equal(state.calls.length, count, 'delivery failure/ambiguity never auto-replays');
  }
  checks.push('HTTP rejection/network loss/timeouts persist truthful outcomes; saved state is retained');

  for (const providerResponse of [null, {}, { leadId: 12, lead: { id: 12 } },
    { leadId: '', lead: { id: '' } }, { leadId: '   ', lead: { id: '   ' } },
    { leadId: 'synthetic-record-id' }, { leadId: 'synthetic-record-id', lead: {} },
    { leadId: 'synthetic-record-id', lead: { id: 'different-record' } }]) {
    const state = setup({ env: allEnv, providerResponse });
    const response = await state.post(base); saved(response, false);
    equal(response.body.deliveryStatus, 'needs_review', '2xx without exact record acknowledgement needs review');
    equal(content(state).optionsReceipt.delivery.lazarus.status, 'outcome_unknown', 'ambiguous acknowledgement recorded accurately');
    equal(content(state).optionsReceipt.delivery.lazarus.referenceId, undefined, 'unconfirmed record ID not stored as delivered');
    saved(await state.post(base), true);
    equal(state.calls.length, 2, 'ambiguous acknowledgement is not blindly replayed');
    const oldLegacy = setup({ before: true, env: allEnv, providerResponse });
    const newLegacy = setup({ env: allEnv, providerResponse });
    same(await newLegacy.post(legacyPayload), await oldLegacy.post(legacyPayload), 'legacy response parsing behavior untouched');
    same(newLegacy.calls, oldLegacy.calls, 'legacy HTTP fanout unchanged for same malformed acknowledgement');
  }
  checks.push('only explicit matching nonblank receiver ppcLeadId and lead.id confirm options PPC creation; ambiguous 2xx retains receipt and forbids automatic replay');

  const ppcId = 'ppc-12345678-1234-4234-8234-123456789012';
  for (const providerResponse of [
    { ppcLeadId: ppcId, leadId: ppcId, lead: { id: ppcId }, created: true },
    { ppcLeadId: ppcId, leadId: ppcId, lead: { id: ppcId }, created: false },
    { ppcLeadId: ppcId, lead: { id: ppcId } },
  ]) {
    const state = setup({ env: allEnv, lazarus: { providerResponse } });
    saved(await state.post(base), false);
    same(content(state).optionsReceipt.delivery.lazarus,
      { status: 'provider_accepted', referenceId: ppcId }, 'exact PPC response and existing-card replay acknowledged');
    const parsed = state.helper.__test.rowToDominionLead(state.store.rows[0]);
    const roundTrip = JSON.parse(state.helper.__test.dominionLeadToContent(parsed));
    equal(roundTrip.optionsReceipt.delivery.lazarus.referenceId, ppcId, 'PPC reference survives read/write round trip');
    equal(roundTrip.optionsReceipt.delivery.email.referenceId, 'synthetic-provider-id', 'email reference survives read/write round trip');
    saved(await state.post(base), true);
    equal(state.calls.length, 2, 'accepted PPC response never causes duplicate forwarding');
  }
  checks.push('new-card and receiver-idempotent PPC acknowledgments persist exact references and survive serialization');

  for (const providerResponse of [
    { leadId: 'generic-lead-id', lead: { id: 'generic-lead-id' } },
    { ppcLeadId: ppcId, leadId: ppcId, lead: { id: 'different-card-id' } },
    { ppcLeadId: ppcId, leadId: 'generic-lead-id', lead: { id: ppcId } },
    { ppcLeadId: ppcId, leadId: null, lead: { id: ppcId } },
    { ppcLeadId: ppcId }, { ppcLeadId: ppcId, lead: {} },
    { ppcLeadId: '', lead: { id: '' } }, { ppcLeadId: '  ', lead: { id: '  ' } },
    { ppcLeadId: 12, lead: { id: 12 } },
  ]) {
    const state = setup({ env: allEnv, lazarus: { providerResponse } });
    saved(await state.post(base), false);
    same(content(state).optionsReceipt.delivery.lazarus, { status: 'outcome_unknown' },
      'generic lead or conflicting/malformed PPC identity is not success');
    same(content(state).optionsReceipt.delivery.email,
      { status: 'provider_accepted', referenceId: 'synthetic-provider-id' },
      'independent fallback email remains confirmed when PPC acknowledgement is ambiguous');
    saved(await state.post(base), true);
    equal(state.calls.length, 2, 'unknown PPC outcome is never blindly retried');
  }
  checks.push('generic Leads/Files acknowledgment cannot impersonate PPC success; email fallback remains independent');

  for (const provider of [
    { providerResponse: null }, { providerResponse: {} }, { providerResponse: { id: '' } },
    { providerResponse: { id: '  ' } }, { providerResponse: { id: 12 } },
    { jsonThrow: true }, { providerFailure: 503 }, { providerThrow: true }, { providerHang: true },
  ]) {
    for (const channel of ['email', 'lazarus']) {
      const state = setup({ env: allEnv, [channel]: provider });
      saved(await state.post(base), false);
      same(content(state).optionsReceipt.delivery[channel],
        { status: provider.providerFailure ? 'failed' : 'outcome_unknown' },
        `${channel}: missing acknowledgement and provider/network/timeout failures recorded truthfully`);
      const other = channel === 'email' ? 'lazarus' : 'email';
      same(content(state).optionsReceipt.delivery[other], {
        status: 'provider_accepted', referenceId: other === 'email' ? 'synthetic-provider-id' : 'ppc-synthetic-record-id',
      }, `${channel}: failure cannot suppress independent ${other} transport`);
      saved(await state.post(base), true);
      equal(state.calls.length, 2, `${channel}: uncertain/rejected result does not resend on receipt retry`);
    }
  }
  checks.push('independent email/PPC success plus channel-specific 2xx/JSON/rejection/network/timeout failures; zero automatic resend');

  const updateFail = setup({ updateFail: true, env: allEnv });
  const updateResponse = await updateFail.post(base); saved(updateResponse, false);
  equal(updateResponse.body.deliveryStatus, 'needs_review', 'ledger update failure visible');
  equal(content(updateFail).optionsReceipt.delivery.lazarus.status, 'pending', 'initial pending envelope durable');
  for (const destination of ['teamSms', 'sentinel', 'mailchimp']) {
    equal(content(updateFail).optionsReceipt.delivery[destination].status, 'skipped', `initial ${destination} envelope never implies prohibited work pending`);
  }
  const updateRetry = await updateFail.post(base); saved(updateRetry, true);
  equal(updateRetry.body.deliveryStatus, 'pending', 'pending receipt not mislabeled delivered');
  equal(updateFail.calls.length, 2, 'ledger failure duplicate not replayed');
  checks.push('failed outcome write leaves durable pending reconciliation record');

  const uncertainInsert = setup({ insertCommitThenFail: true, env: allEnv });
  equal((await uncertainInsert.post(base)).status, 503, 'unknown insert cannot claim confirmed receipt');
  equal(uncertainInsert.store.rows.length, 1, 'simulated remote commit preserved');
  equal(uncertainInsert.calls.length, 0, 'unacknowledged insert does not fan out');
  const recovered = await uncertainInsert.post(base); saved(recovered, true);
  equal(recovered.body.deliveryStatus, 'pending', 'same-ID retry discovers pending receipt');
  equal(uncertainInsert.calls.length, 0, 'recovery does not invent a second fanout owner');
  checks.push('commit-then-network-loss recovery discovers pending durable inquiry without replay');

  const concurrentEdit = setup({ concurrentOperatorEdit: true, env: allEnv });
  const edited = await concurrentEdit.post(base); saved(edited, false);
  equal(edited.body.deliveryStatus, 'needs_review', 'concurrent operator edit not overwritten');
  equal(content(concurrentEdit).status, 'working', 'operator status preserved');
  equal(content(concurrentEdit).owner, 'dez', 'operator owner preserved');
  check(content(concurrentEdit).optionsReceipt.payloadFingerprint, 'envelope preserved after operator edit');
  const parsed = good.helper.__test.rowToDominionLead(good.store.rows[0]);
  parsed.status = 'working'; parsed.owner = 'logan'; parsed.optionsReceipt.futureMetadata = 'preserve-me';
  const roundTrip = JSON.parse(good.helper.__test.dominionLeadToContent(parsed));
  equal(roundTrip.optionsReceipt.payloadFingerprint, content(good).optionsReceipt.payloadFingerprint, 'fingerprint survives serializer');
  equal(roundTrip.optionsReceipt.futureMetadata, 'preserve-me', 'future envelope fields survive serializer');
  equal(roundTrip.optionsReceipt.delivery.lazarus.status, 'provider_accepted', 'delivery map survives serializer');
  checks.push('CAS protects concurrent operator edits; parser/serializer preserve complete envelope');

  const report = {
    checkedAt: new Date().toISOString(), result: 'PASS', assertions,
    checks: checks.map(name => ({ name, result: 'PASS' })),
    actualSourceSha256: Object.fromEntries(files.map(file => [file, crypto.createHash('sha256').update(source[file]).digest('hex')])),
    ...(process.argv.includes('--include-forward-fixture') ? { syntheticForwardPayload: lazarus.payload } : {}),
    realNetworkCalls: 0, productionWrites: 0, credentialsRead: 0,
    scope: 'Actual API/helper execution against isolated memory store and strict mock transports; timeout scheduling shortened only in test.',
    legacyBaseline: baselineRef,
    schemaEvidence: 'Migration defines a private bigint receipt table with UNIQUE(submission_id). This local rerun makes no live database query or schema change.',
    limitations: ['No live submission/delivery/readback tested.', 'No OpenAI Pixel/CAPI event sent.',
      'Email provider acceptance and message ID are not proof of inbox delivery; verify the provider delivery event separately.',
      'Pending/failed/unknown delivery requires explicit operator reconciliation; no automatic retry worker.',
      'Aggregate provider_accepted can reflect email only when CRM is skipped; release proof requires configured options intake, its per-destination reference, and actual receiver readback.',
      'Owner/representative selection is self-report, not qualification verification.',
      'WA/ID validation is not exact Spokane-CDA service-area validation.'],
  };
  console.log(JSON.stringify(report, null, 2));
})().catch(error => { console.error(error.stack); process.exitCode = 1; });
