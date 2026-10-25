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
  vm.runInNewContext(source, {
    exports: module.exports,
    module,
    require(name) {
      if (name in mocks) return mocks[name];
      if (name === '@/lib/seller-screening-server') return require(path.join(root, 'src/lib/seller-screening-server.ts'));
      if (name.startsWith('node:')) return require(name);
      throw new Error(`Unexpected dependency: ${name}`);
    },
    console: { log() {}, error() {} },
    Date,
    ...globals,
  }, { filename: file });
  return module.exports;
}

const qualifier = load('src/lib/meta-seller-qualifier.ts');
const landing = load('src/lib/meta-seller-landing.ts');

test('campaign message links select matching landing copy without reflecting arbitrary URL text', () => {
  for (const [content, variant] of [
    ['dh_repair_v1', 'repairs'], ['dh_inherited_v1', 'estate'], ['dh_direct_v1', 'direct'],
  ]) {
    assert.equal(landing.resolveMetaSellerVariant({ utm_content: content }), variant);
    assert.ok(landing.META_SELLER_LANDINGS[variant].headline);
  }
  assert.equal(landing.resolveMetaSellerVariant({ variant: 'estate' }), 'estate');
  assert.equal(landing.resolveMetaSellerVariant({ utm_content: '<script>private text</script>' }), 'repairs');
  assert.equal(landing.resolveMetaSellerVariant({ utm_content: ['dh_direct_v1', 'dh_inherited_v1'] }), 'repairs');
});

const passing = {
  qualificationVersion: 'meta_seller_followup_v2',
  serviceArea: 'spokane_county_wa',
  timeline: 'within_30_days',
  sellerAuthority: 'owner',
  propertyType: 'site_built',
  listingStatus: 'not_listed',
  offerReadiness: 'wants_offer_now',
  priceTradeoff: 'accepts_below_repaired_retail',
  condition: 'repairs_needed',
  sellerReason: 'repairs',
  bestTimeToSpeak: 'afternoon',
  contactConsent: true,
};

test('the exact high-intent seller profile passes and produces a bounded CRM summary', () => {
  const result = qualifier.validateMetaSellerQualification(passing);
  assert.equal(result.ok, true);
  const summary = qualifier.metaSellerQualificationSummary(result.value);
  assert.equal(summary.length <= 240, true);
  assert.match(summary, /tier=ready_now/);
  assert.match(summary, /timing=within_30_days/);
});

test('uncertain and slower sellers are accepted and sorted, while invalid input and missing consent fail', () => {
  for (const [field, value, tier] of [
    ['timeline', 'more_than_60_days', 'nurture'],
    ['sellerAuthority', 'heir_without_authority', 'probate_help'],
    ['propertyType', 'manufactured_without_land', 'outside_buy_box'],
    ['listingStatus', 'listed', 'needs_review'],
    ['offerReadiness', 'value_only', 'nurture'],
    ['priceTradeoff', 'requires_retail', 'nurture'],
  ]) {
    const result = qualifier.validateMetaSellerQualification({ ...passing, [field]: value });
    assert.equal(result.ok, true, field);
    assert.equal(qualifier.metaSellerFollowUpTier(result.value), tier);
  }
  for (const change of [{ qualificationVersion: 'unknown' }, { timeline: 'forged' }, { contactConsent: false }]) {
    assert.equal(qualifier.validateMetaSellerQualification({ ...passing, ...change }).ok, false);
  }
});

test('minimal contact-only context stays unqualified and goes to clarification', () => {
  const result = qualifier.validateMetaSellerQualification({ ...passing,
    timeline: 'unsure', sellerAuthority: 'unsure', propertyType: 'unsure',
    listingStatus: 'unsure', offerReadiness: 'unsure', priceTradeoff: 'unsure', condition: 'unsure',
    bestTimeToSpeak: 'anytime', sellerReason: 'prefer_not_to_say',
  });
  assert.equal(result.ok, true);
  assert.equal(qualifier.metaSellerFollowUpTier(result.value), 'needs_review');
});

test('condition does not favor damaged homes over clean motivated sellers', () => {
  for (const condition of ['move_in_ready', 'normal_wear', 'repairs_needed', 'major_work']) {
    assert.equal(qualifier.validateMetaSellerQualification({ ...passing, condition }).ok, true);
  }
});

test('first-party event normalization discards contact and seller-answer fields', () => {
  const events = load('src/lib/meta-seller-funnel-events.ts', {
    'server-only': {},
    '@/lib/dominion-supabase': { getDominionServiceClient: () => null },
  });
  const normalized = events.normalizeMetaSellerFunnelEvent({
    eventId: '00000000-0000-4000-8000-000000000001',
    visitId: '00000000-0000-4000-8000-000000000002',
    eventType: 'gate_exited',
    occurredAt: new Date().toISOString(),
    stage: 'offer_readiness',
    detail: 'curiosity',
    variant: 'repairs',
    phone: '2025550100',
    propertyAddress: '123 Private Street',
    sellerReason: 'private reason',
    attribution: {
      utm_source: 'meta',
      campaign_id: 'campaign-1',
      fbclid: 'not-approved-here',
      phone: '2025550100',
    },
  });
  assert.ok(normalized);
  assert.deepEqual(JSON.parse(JSON.stringify(normalized.attribution)), {
    utm_source: 'meta',
    campaign_id: 'campaign-1',
  });
  assert.equal('phone' in normalized, false);
  assert.equal('propertyAddress' in normalized, false);
  assert.equal('sellerReason' in normalized, false);
});

test('the lead API invokes server qualification and keeps Meta requests out of the OpenAI conversion path', () => {
  const route = fs.readFileSync(path.join(root, 'src/app/api/leads/route.ts'), 'utf8');
  assert.match(route, /validateMetaSellerQualification\(body\)/);
  assert.match(route, /isStrictMetaFlow\s*\? Promise\.resolve\(\{ status: 'skipped'/);
  assert.match(route, /!isStrictMetaFlow &&/);
});

function strictRouteHarness({ duplicate = false, withdrawal = true, screeningLookup } = {}) {
  const recorded = [];
  const assessments = [];
  const metaEvents = [];
  let openAiCalls = 0;
  let withdrawals = 0;
  const api = load('src/app/api/leads/route.ts', {
    ...(screeningLookup ? { '@/lib/seller-screening-server': {
      ...require(path.join(root,'src/lib/seller-screening-server.ts')),
      validateScreening: input => require(path.join(root,'src/lib/seller-screening-server.ts')).validateScreening(input,screeningLookup),
    } } : {}),
    'next/server': { NextResponse: { json: (data, init) => Response.json(data, init) } },
    '@/lib/constants': { SITE: { url: 'https://example.test', phone: '509-822-5460' } },
    '@/lib/mailchimp': { syncSellerLeadToMailchimp: async () => ({ status: 'skipped' }) },
    '@/lib/seller-measurement-policy': { isSellerMeasurementQa: () => false },
    '@/lib/meta-measurement-policy': { META_MEASUREMENT_CONSENT_VERSION: 'meta_measurement_v1', hasMetaMeasurementPermission: () => false },
    '@/server/meta-seller-feedback-context': { buildMetaFeedbackContext: () => undefined, withdrawMetaFeedbackPermission: async () => { withdrawals++;return withdrawal; } },
    '@/server/meta-ads-conversions': {
      metaMeasurementConfig: input => ({ skipped: { status: 'skipped', measurementMode: 'disabled',
        eventId: `dh_lead_${input.submissionId}` } }),
      reportMetaLead: async input => ({ status: 'skipped', measurementMode: 'disabled', eventId: `dh_lead_${input.submissionId}` }),
    },
    '@/lib/dominion-leads': {
      DOMINION_OPTIONS_FLOW: 'seller_options_v1',
      DominionOptionsSubmissionConflictError: class extends Error {},
      isDominionOptionsSubmissionId: value => typeof value === 'string' && value.length === 36,
      dominionOptionsDeliveryStatus: () => 'needs_review',
      recordDominionLeadSubmission: async () => null,
      recordDominionOptionsDelivery: async () => undefined,
      recordDominionOptionsLeadSubmission: async (input,id,measurement) => {
        recorded.push(input);
        assessments.push(measurement?.metaSellerAssessment);
        return {
          duplicate,
          record: {
            id: 42,
            optionsReceipt: { delivery: {}, measurementClass: 'unmarked' },
          },
        };
      },
    },
    '@/lib/seller-funnel-events': {
      normalizeSellerFunnelEvent: event => event,
      recordSellerFunnelEvent: async () => ({ duplicate: false }),
    },
    '@/lib/meta-seller-qualifier': qualifier,
    '@/lib/meta-seller-funnel-events': {
      normalizeMetaSellerFunnelEvent: event => event,
      recordMetaSellerFunnelEvent: async event => { metaEvents.push(event); return { duplicate: false }; },
    },
    '@/server/openai-ads-conversions': {
      reportOpenAILeadCreated: async () => { openAiCalls += 1; return { status: 'provider_accepted', measurementMode: 'production' }; },
    },
  }, {
    process: { env: {} },
    Response,
    Headers,
    URL,
    AbortSignal,
    setTimeout,
    clearTimeout,
    fetch: () => { throw new Error('Unexpected network'); },
    crypto: require('node:crypto').webcrypto,
  });
  const base = {
    ...passing,
    address: '123 Main St, Spokane, WA 99205',
    city: 'Spokane County',
    state: 'WA',
    zip: '99205',
    firstName: 'Test',
    lastName: 'Seller',
    phone: '5095550100',
    email: '',
    source: 'meta_website',
    landingPage: '/sell/offer-check?variant=repairs',
    submissionFlow: 'seller_options_v1',
    submissionId: '00000000-0000-4000-8000-000000000011',
    funnelVisitId: '00000000-0000-4000-8000-000000000012',
    metaVariant: 'repairs',
    adAttribution: { utm_source: 'meta', campaign_id: 'campaign-1' },
  };
  return {
    recorded,
    assessments,
    metaEvents,
    get openAiCalls() { return openAiCalls; },
    get withdrawals() { return withdrawals; },
    async post(changes = {}) {
      const response = await api.POST({
        headers: new Headers(),
        json: async () => ({ ...base, ...changes }),
      });
      return { status: response.status, data: await response.json() };
    },
  };
}

test('a value-only request is saved for nurture rather than thrown away', async () => {
  const harness = strictRouteHarness();
  const result = await harness.post({ offerReadiness: 'value_only' });
  assert.equal(result.status, 200);
  assert.equal(result.data.accepted, true);
  assert.equal(harness.recorded.length, 1);
  assert.match(harness.recorded[0].primaryConstraint, /tier=nurture/);
  assert.equal(harness.openAiCalls, 0);
});

test('heirs, listed homes and outside-area requests retain contact and a review category', async () => {
  for (const change of [{ sellerAuthority: 'heir_without_authority' }, { listingStatus: 'listed' },
    { serviceArea: 'outside_service_area', state: '', city: '' }]) {
    const harness = strictRouteHarness();
    assert.equal((await harness.post(change)).status, 200);
    assert.equal(harness.recorded.length, 1);
  }
});

test('a passing strict request is durably accepted without reporting an OpenAI conversion', async () => {
  const harness = strictRouteHarness();
  const result = await harness.post();
  assert.equal(result.status, 200);
  assert.equal(result.data.accepted, true);
  assert.equal(result.data.openaiBrowserEligible, false);
  assert.equal(harness.recorded.length, 1);
  assert.match(harness.recorded[0].primaryConstraint, /tier=ready_now/);
  assert.match(harness.recorded[0].primaryConstraint, /timing=within_30_days/);
  assert.equal(harness.openAiCalls, 0);
  assert.equal(harness.metaEvents.some(event => event.eventType === 'lead_accepted'), true);
});

test('the direct-offer request retains its message identity through acceptance and rejects unknown variants', async () => {
  const harness = strictRouteHarness();
  const result = await harness.post({ metaVariant: 'direct', landingPage: '/sell/offer-check?utm_content=dh_direct_v1' });
  assert.equal(result.status, 200);
  assert.equal(result.data.accepted, true);
  assert.equal(harness.metaEvents.find(event => event.eventType === 'lead_accepted').variant, 'direct');
  const invalid = strictRouteHarness();
  assert.equal((await invalid.post({ metaVariant: 'unrecognized' })).status, 400);
  assert.equal(invalid.recorded.length, 0);
});


test('contact-first API defaults omitted optional answers and accepts the known retired form version', async () => {
  const result = qualifier.validateMetaSellerQualification({ qualificationVersion: passing.qualificationVersion,
    serviceArea: 'spokane_county_wa', contactConsent: true });
  assert.equal(result.ok, true);
  assert.equal(qualifier.metaSellerFollowUpTier(result.value), 'needs_review');
  const harness = strictRouteHarness();
  assert.equal((await harness.post({ timeline: undefined, sellerAuthority: undefined, propertyType: undefined,
    listingStatus: undefined, offerReadiness: undefined, priceTradeoff: undefined, condition: undefined,
    bestTimeToSpeak: '', sellerReason: '', state: 'ID' })).status, 200);
  assert.equal(harness.recorded[0].state, 'WA', 'Chosen service area wins over forged state');
  assert.equal(harness.recorded[0].sellerAuthority, 'unsure');
  assert.match(harness.recorded[0].primaryConstraint, /Clarify the property/);
  assert.equal((await strictRouteHarness().post({ qualificationVersion: 'meta_distressed_seller_v1' })).status, 200);
});

test('transport retries reuse the inquiry ID while honoring the latest measurement choice', () => {
  const submission = load('src/lib/meta-seller-submission.ts', {}, { crypto: require('node:crypto').webcrypto });
  const input = { name: 'Synthetic', address: 'Synthetic House', metaMeasurement: { consent: true, fbc: 'first' },
    sms_consent_timestamp: 'first-time' };
  const first = submission.prepareMetaSellerSubmission(null, input);
  const retry = submission.prepareMetaSellerSubmission(first, { ...input,
    metaMeasurement: { consent: false, fbc: 'changed' }, sms_consent_timestamp: 'later-time' });
  assert.equal(retry.submissionId, first.submissionId);
  assert.equal(JSON.parse(retry.body).metaMeasurement.consent, false);
  const otherProperty = submission.prepareMetaSellerSubmission(retry, { ...input, address: 'Different House' });
  assert.notEqual(otherProperty.submissionId, first.submissionId);
});
test('a saved inquiry retry that withdraws measurement also revokes future outcome permission',async()=>{
  const h=strictRouteHarness({duplicate:true});
  const r=await h.post({metaPrivacyToken:'a'.repeat(64),metaMeasurement:{consent:false,consentVersion:'meta_measurement_v2'}});
  assert.equal(r.status,200);assert.equal(r.data.duplicate,true);assert.equal(h.withdrawals,1);assert.equal(h.metaEvents.length,0);
});
test('a failed retry privacy update never claims it was saved and retains the existing inquiry identity',async()=>{
  const h=strictRouteHarness({duplicate:true,withdrawal:false});
  const r=await h.post({metaPrivacyToken:'a'.repeat(64),metaMeasurement:{consent:false,consentVersion:'meta_measurement_v2'}});
  assert.equal(r.status,503);assert.equal(r.data.accepted,true);assert.equal(r.data.receiptId,'42');assert.equal(r.data.metaPrivacyUpdateRequired,true);assert.equal(h.metaEvents.length,0);
});

test('direct mid-project inquiry keeps originating ad and copy label in the durable intake record', async () => {
 const h = strictRouteHarness();
 const r = await h.post({metaVariant:'direct',utmContent:'dh_mid_project_v1',adAttribution:{utm_source:'meta',utm_campaign:'dh_spokane_pilot_01',utm_content:'dh_mid_project_v1',ad_id:'120250398636990073',adset_id:'120250285330660073',campaign_id:'120250237581430073'}});
 assert.equal(r.status,200);assert.equal(r.data.accepted,true);
 assert.equal(h.recorded[0].adAttribution.ad_id,'120250398636990073');
 assert.equal(h.recorded[0].adAttribution.utm_content,'dh_mid_project_v1');
 assert.equal(h.metaEvents.find(e=>e.eventType==='lead_accepted').variant,'direct');
});
test('intake preserves the country code on a direct request rather than cutting the callback number',async()=>{
 const h=strictRouteHarness();const r=await h.post({phone:'+1 (202) 555-0147'});
 assert.equal(r.status,200);assert.equal(h.recorded[0].phone,'12025550147');
});

test('the actual screening API saves exact answers and human-unverified authority with the original ad',async()=>{
  const answers={area:'inside',property:'house',connection:'estate',listing:'expired',condition:'some',reason:'moving',timeline:'within_60',tradeoff:'yes'};
  const screeningLookup=async()=>Response.json({result:{addressMatches:[{
    matchedAddress:'808 W SPOKANE FALLS BLVD, SPOKANE, WA, 99201',coordinates:{x:-117.426,y:47.661},
    addressComponents:{state:'WA',city:'SPOKANE',zip:'99201'},geographies:{Counties:[{STATE:'53',COUNTY:'063'}]},
  }]}});
  const h=strictRouteHarness({screeningLookup});
  const r=await h.post({screeningVersion:'dominion-screening-live-v1',screeningAnswers:answers,
    screeningContact:{name:'QA Test',phone:'5095550128',street:'808 W Spokane Falls Blvd',city:'Spokane',state:'WA',zip:'99201',email:'',contactConsent:true,smsConsent:false},
    adAttribution:{utm_source:'meta',ad_id:'120250428203840073',campaign_id:'120250428143350073'}});
  assert.equal(r.status,200);assert.equal(r.data.accepted,true);
  assert.equal(h.recorded[0].timeline,'within_60_days');assert.equal(h.recorded[0].sellerAuthority,'unsure');
  assert.equal(h.recorded[0].adAttribution.ad_id,'120250428203840073');
  assert.equal(h.assessments[0].humanQualified,false);assert.equal(h.assessments[0].tier,'needs_review');
  assert.equal(h.assessments[0].listingStatus,'expired');
  assert.deepEqual(JSON.parse(JSON.stringify(h.assessments[0].screeningAnswers)),answers);
  assert.match(h.recorded[0].primaryConstraint,/needs_review/);assert.equal(h.openAiCalls,0);
  for(const privateValue of ['estate','expired','within_60','moving','screeningAnswers'])assert.equal(JSON.stringify(h.metaEvents).includes(privateValue),false);
});
