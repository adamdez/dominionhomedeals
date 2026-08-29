'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');

const repo = path.resolve(__dirname, '..');
const req = createRequire(path.join(process.env.DOMINION_TEST_DEPENDENCY_ROOT || repo, 'package.json'));
const ts = req('typescript');
const React = req('react');
const { renderToStaticMarkup } = req('react-dom/server');

function compile(source, filename) {
  const result = ts.transpileModule(source, {
    fileName: filename,
    reportDiagnostics: true,
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  });
  assert.equal((result.diagnostics || []).filter(d => d.category === ts.DiagnosticCategory.Error).length, 0, 'TSX parses');
  return result.outputText;
}
const constantsModule = { exports: {} };
new vm.Script('(function(exports,module){' + compile(fs.readFileSync(path.join(repo, 'src/lib/constants.ts'), 'utf8'), 'constants.ts') + '})')
  .runInNewContext({})(constantsModule.exports, constantsModule);

function makeHarness(source, config = {}) {
  const slots = [];
  const requests = [];
  const events = [];
  const redirects = [];
  const storageReads = [];
  const generatedIds = [];
  const responseQueue = [];
  let cursor = 0;
  let dirty = true;
  let pendingEffects = [];
  let tree;
  let focuses = 0;
  let now = Date.parse('2026-08-28T00:00:00.000Z');
  let trackingThrows = false;
  let cryptoThrows = false;
  const props = config.props || {};
  const location = {
    pathname: config.pathname || '/sell/options',
    search: config.search || '',
    assign: url => redirects.push(url),
  };
  class TestDate extends Date {
    constructor(...args) { super(...(args.length ? args : [now])); if (!args.length) now += 1000; }
  }
  const hooks = {
    ...React,
    useState(initial) {
      const index = cursor++;
      if (!slots[index]) slots[index] = {kind: 'state', value: typeof initial === 'function' ? initial() : initial};
      return [slots[index].value, next => {
        slots[index].value = typeof next === 'function' ? next(slots[index].value) : next;
        dirty = true;
      }];
    },
    useRef(initial) {
      const index = cursor++;
      if (!slots[index]) slots[index] = {kind: 'ref', value: {current: initial}};
      return slots[index].value;
    },
    useEffect(callback, deps) {
      const index = cursor++;
      const old = slots[index];
      const changed = !old || !deps || !old.deps || deps.length !== old.deps.length || deps.some((v, i) => !Object.is(v, old.deps[i]));
      slots[index] = {kind: 'effect', deps};
      if (changed) pendingEffects.push(callback);
    },
  };
  const sandbox = {
    URLSearchParams,
    Date: TestDate,
    window: {location},
    localStorage: {
      getItem(key) {
        storageReads.push(key);
        if (config.storageThrows) throw new Error('Storage denied');
        return config.storage?.[key] ?? null;
      },
      setItem() { throw new Error('Unexpected localStorage write'); },
    },
    crypto: {
      randomUUID() {
        if (cryptoThrows) throw new Error('Secure ID unavailable');
        const id = crypto.randomUUID();
        generatedIds.push(id);
        return id;
      },
    },
    fetch: async (url, init) => {
      assert.equal(url, '/api/leads', 'only fixture endpoint');
      assert.equal(init.method, 'POST', 'fixture method');
      requests.push({url, ...init, payload: JSON.parse(init.body)});
      assert(responseQueue.length, 'every request must have an explicit no-network response fixture');
      return await responseQueue.shift()();
    },
  };
  const module = {exports: {}};
  const safeRequire = spec => {
    if (spec === 'react') return hooks;
    if (spec === 'react/jsx-runtime') return req(spec);
    if (spec === 'next/link') return {__esModule: true, default: ({children, ...rest}) => React.createElement('a', rest, children)};
    if (spec === '@/lib/constants') return constantsModule.exports;
    if (spec === '@/lib/tracking') return {
      trackFormStep: (...args) => events.push({kind: 'step', args}),
      trackLeadFormSubmission: data => {
        events.push({kind: 'generate_lead', data});
        if (trackingThrows) throw new Error('Tracking fixture failed');
      },
      trackOpenAILeadCreated: data => events.push({kind: 'openai_lead_created', data}),
    };
    if (spec === '@/lib/seller-funnel-tracking') return {
      getSellerFunnelVisitId: () => 'aaaaaaaa-1234-4234-8234-123456789012',
      isInternalQaSession: () => false,
      readOpenAIBrowserReference: () => '',
      readSellerAttribution: () => ({}),
      trackSellerFunnelEvent: (...args) => events.push({kind: 'funnel', args}),
    };
    throw new Error('Unapproved import: ' + spec);
  };
  new vm.Script('(function(exports,require,module){' + compile(source, 'LeadForm.tsx') + '})')
    .runInNewContext(sandbox)(module.exports, safeRequire, module);
  function visit(node, callback) {
    if (node === null || node === undefined || typeof node === 'boolean') return;
    if (Array.isArray(node)) { node.forEach(n => visit(n, callback)); return; }
    if (typeof node !== 'object') return;
    if (typeof node.type === 'function') { visit(node.type(node.props), callback); return; }
    callback(node);
    visit(node.props?.children, callback);
  }
  function render() {
    for (let pass = 0; pass < 10; pass++) {
      cursor = 0;
      pendingEffects = [];
      dirty = false;
      tree = module.exports.LeadForm(props);
      visit(tree, node => {
        if (node.props?.ref && typeof node.props.ref === 'object') {
          node.props.ref.current = {focus: () => { focuses++; }};
        }
      });
      pendingEffects.forEach(effect => effect());
      if (!dirty) return tree;
    }
    throw new Error('Hook render did not settle');
  }
  function all(predicate) {
    const found = [];
    visit(tree, node => { if (predicate(node)) found.push(node); });
    return found;
  }
  function one(predicate) {
    const found = all(predicate);
    assert.equal(found.length, 1, 'one matching fixture element');
    return found[0];
  }
  function input(id, value) {
    const node = one(n => n.props?.id === id || n.props?.name === id);
    node.props.onChange({target: {value, checked: Boolean(value)}});
    render();
  }
  function textOf(node) {
    if (node === null || node === undefined || typeof node === 'boolean') return '';
    if (Array.isArray(node)) return node.map(textOf).join('');
    if (typeof node === 'object') return textOf(node.props?.children);
    return String(node);
  }
  function clickText(text) {
    const node = one(n => n.type === 'button' && textOf(n) === text);
    node.props.onClick();
    render();
  }
  function submitHandler() { return one(n => n.type === 'form').props.onSubmit; }
  async function submit() {
    await submitHandler()({preventDefault() {}});
    render();
  }
  function queueJson(data, ok = true) { responseQueue.push(async () => ({ok, json: async () => data})); }
  function queueFailure(kind) {
    responseQueue.push(async () => {
      if (kind === 'network') throw new Error('Network fixture failed');
      return {ok: true, json: async () => { throw new Error('JSON fixture failed'); }};
    });
  }
  function queueDeferred() {
    let resolve;
    const promise = new Promise(r => { resolve = r; });
    responseQueue.push(() => promise);
    return data => resolve({ok: true, json: async () => data});
  }
  render();
  return {
    render, all, one, input, clickText, submit, submitHandler, queueJson, queueFailure, queueDeferred,
    html: () => renderToStaticMarkup(tree),
    text: () => textOf(tree),
    formData: () => structuredClone(slots.find(s => s?.kind === 'state' && s.value && typeof s.value === 'object' && Object.hasOwn(s.value, 'address')).value),
    status: () => all(n => n.props?.role === 'status'),
    alerts: () => all(n => n.props?.role === 'alert'),
    submitDisabled: () => one(n => n.type === 'button' && n.props?.type === 'submit').props.disabled,
    requests, events, redirects, storageReads, generatedIds,
    get focuses() { return focuses; },
    setSearch: value => { location.search = value; },
    setTrackingThrows: value => { trackingThrows = value; },
    setCryptoThrows: value => { cryptoThrows = value; },
  };
}




// The shared hook harness above runs the real form's handlers without browser,
// network, credentials, analytics, or CRM. The server-page checks below also
// render the actual source and its components, not a separate mock page.
const {execFileSync} = require('node:child_process');
const baselineRef = '95928f57861553075c50d2f884b7ba2db8488afa';
let assertions = 0;
const checks = [];
function equal(actual, expected, label) { assert.equal(actual, expected, label); assertions++; }
function check(value, label) { assert.ok(value, label); assertions++; }
function same(actual, expected, label) {
  assert.deepEqual(JSON.parse(JSON.stringify(actual)), JSON.parse(JSON.stringify(expected)), label);
  assertions++;
}
function read(file) { return fs.readFileSync(path.join(repo, file), 'utf8'); }
function atBaseline(file) {
  return execFileSync('git', ['show', baselineRef + ':' + file], {cwd:repo, encoding:'utf8'});
}
const moduleCache = new Map();
let capturedForms = [];
const sourceHashes = {};
function loadActual(file, source = read(file), capture = false) {
  sourceHashes[file] = crypto.createHash('sha256').update(source).digest('hex');
  const mod = {exports:{}};
  function actualRequire(spec) {
    if (spec === 'react' || spec === 'react/jsx-runtime' || spec === 'clsx' || spec === 'tailwind-merge') return req(spec);
    if (spec === 'next/link') return {__esModule:true, default:({children, ...rest}) => React.createElement('a', rest, children)};
    if (spec === '@/lib/constants') return constantsModule.exports;
    if (spec === '@/lib/tracking') return {
      trackFormStep() { throw new Error('Unexpected SSR analytics'); },
      trackLeadFormSubmission() { throw new Error('Unexpected SSR analytics'); },
      trackOpenAILeadCreated() { throw new Error('Unexpected SSR analytics'); },
    };
    if (spec.startsWith('@/')) {
      const file = 'src/' + spec.slice(2) + (spec.startsWith('@/components/') ? '.tsx' : '.ts');
      if (!moduleCache.has(file)) moduleCache.set(file, loadActual(file));
      const loaded = moduleCache.get(file);
      if (capture && spec === '@/components/forms/LeadForm') return {LeadForm(props) {
        capturedForms.push({...props});
        return React.createElement(loaded.LeadForm, props);
      }};
      return loaded;
    }
    throw new Error('Blocked unexpected import: ' + spec);
  }
  new vm.Script('(function(exports,require,module){' + compile(source, file) + '})').runInNewContext({
    URLSearchParams, console, process:{env:{}},
    fetch() { throw new Error('No network allowed in landing verification'); },
  })(mod.exports, actualRequire, mod);
  return mod.exports;
}
function decode(value) {
  return value.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#x27;|&#39;/g,"'")
    .replace(/&lt;/g,'<').replace(/&gt;/g,'>');
}
function textOfHtml(html) { return decode(html.replace(/<[^>]+>/g,' ')).replace(/\s+/g,' ').trim(); }
function paragraphs(html) { return Array.from(html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g), m => textOfHtml(m[1])); }
const config = loadActual('src/lib/seller-options-landing.ts');
moduleCache.set('src/lib/seller-options-landing.ts', config);
const page = loadActual('src/app/sell/options/page.tsx', read('src/app/sell/options/page.tsx'), true);
const baselinePage = loadActual('src/app/sell/options/page.tsx', atBaseline('src/app/sell/options/page.tsx'), true);
sourceHashes['src/app/sell/options/page.tsx'] = crypto.createHash('sha256').update(read('src/app/sell/options/page.tsx')).digest('hex');
async function render(params, before = false) {
  capturedForms = [];
  const tree = await (before ? baselinePage : page).default({searchParams:Promise.resolve(params)});
  const html = renderToStaticMarkup(tree);
  const forms = capturedForms.map(props => ({...props}));
  return {html, text:textOfHtml(html), forms};
}
const expected = [
  {key:'urgent_fast_sale', lane:'urgent', headline:'Need to sell soon?', action:'Talk About My Timeline', firstPath:'Direct as-is offer'},
  {key:'urgent_timeline', lane:'urgent', headline:'Sell without repairing first?', action:'Discuss Selling As-Is', firstPath:'Direct as-is offer'},
  {key:'options_net_tradeoffs', lane:'options', headline:'Compare ways to sell your house', action:'Compare My Selling Options', firstPath:'List as-is with an agent'},
  {key:'options_real_problem', lane:'options', headline:'Need help deciding how to sell?', action:'Talk Through My Situation', firstPath:'List as-is with an agent'},
];
const formSource = read('src/components/forms/LeadForm.tsx');
const leadEvents = h => h.events.filter(event => event.kind === 'generate_lead');
const accepted = extra => ({success:true, accepted:true, controlRecorded:true, receiptId:'synthetic-landing-receipt', duplicate:false, ...extra});
async function details(h, role) {
  for (const [name, value] of [['address',"123 Synthetic St, Coeur d'Alene, ID 83814"], ['fullName','Synthetic Reviewer'], ['phone','2025550100']]) {
    h.input(name,value); await h.submit();
  }
  if (role) h.input('sellerAuthority',role);
}
const report = {
  scope:'Actual-source selector and server rendering plus real LeadForm handlers in an isolated hook harness; synthetic responses only.',
  realNetworkCalls:0, credentialsRead:0, productionWrites:0, baselineRef,
};
(async () => {
  for (const file of [
    'src/lib/constants.ts', 'src/components/sell/SellStickyBar.tsx',
    'src/components/seo/BreadcrumbJsonLd.tsx',
  ]) equal(read(file), atBaseline(file), file + ': protected identity/legal source unchanged');
  checks.push('Protected public identity, legal constants, sticky phone, and breadcrumb sources unchanged; real form handlers are verified below');
  same(page.metadata, baselinePage.metadata, 'Canonical and public metadata unchanged');
  check(!/^[\s;]*['"]use client['"]/.test(read('src/app/sell/options/page.tsx')), 'Page remains server-rendered');

  const baseline = await render({}, true);
  const baselineParagraphs = paragraphs(baseline.html);
  const legal = baselineParagraphs.filter(p => [
    "No obligation to accept an offer.", "Dominion Homes is a home-buying and wholesale business",
    "We may purchase directly or assign", "This page is a starting point, not legal",
  ].some(start => p.startsWith(start)));
  equal(legal.length,4,'Four existing role/assignment/advice/no-obligation disclosures identified');
  const baselineTable = baseline.html.match(/<table\b[\s\S]*?<\/table>/)[0];
  const renderedVariants = [];
  for (const item of expected) {
    const params = {utm_source:'chatgpt', utm_medium:'cpc', utm_term:item.lane, utm_content:item.key};
    const selected = config.getSellerOptionsLanding(params);
    equal(selected.key,item.key,'Exact ad content maps to intended variant');
    equal(selected.lane,item.lane,'Exact ad maps to intended intent lane');
    equal(selected.headline,item.headline,'Ad headline mapping pinned');
    equal(selected.actionLabel,item.action,'Ad CTA mapping pinned');
    equal(config.getSellerOptionsLanding({...params,utm_term:item.lane === 'urgent' ? 'options' : 'urgent'}).key,item.key,
      'Exact ad content takes precedence over conflicting lane fallback');
    equal(config.getSellerOptionsLanding({utm_content:'  ' + item.key.toUpperCase() + '  '}).key,item.key,
      'Case/whitespace normalization does not lose known mapping');
    const result = await render(params);
    const h1s = Array.from(result.html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g), m=>textOfHtml(m[1]));
    same(h1s,[item.headline],'Exactly one actual server-rendered intended H1');
    check(result.html.includes('data-seller-landing="' + item.key + '"'),'Variant identification is server-rendered');
    check(result.html.includes('data-intent-lane="' + item.lane + '"'),'Lane identification is server-rendered');
    check(result.text.includes(selected.introduction),'Tailored introduction actually rendered');
    check(result.text.includes(selected.focusTitle) && result.text.includes(selected.focusCopy),'Tailored focus block actually rendered');
    check(result.text.includes(selected.prioritiesHeading),'Tailored priorities heading actually rendered');
    equal(selected.priorities.length,3,'Each ad has three specific priorities');
    for (const priority of selected.priorities) {
      check(result.text.includes(priority.title) && result.text.includes(priority.copy),'Actual specific priority rendered');
    }
    equal(result.forms.length,1,'One actual LeadForm per variant');
    same(result.forms[0],{
      intro:selected.formIntro, addressLabel:"What's the address of the house?",
      submitLabel:selected.actionLabel, submissionFlow:'seller_options_v1', requirePropertyState:true,
    },'Actual form retains receipt/authority/state flow with variant-specific labels');
    check(Object.values(result.forms[0]).every(value => ['string','boolean'].includes(typeof value)),'Server-to-client props serializable');
    check(result.html.includes('href="#get-options"') && result.text.includes(selected.actionLabel),'Primary CTA targets actual form');
    check(result.text.includes(selected.stickyLabel),'Actual mobile sticky CTA label matches variant');
    check(result.text.includes(constantsModule.exports.SMS_CTA_DISCLOSURE),'Existing consent disclosure actually rendered');
    check(result.html.includes('href="/privacy#sms-terms"') && result.html.includes('href="/terms"'),'Consent policy links retained');
    check(result.html.includes('href="tel:' + constantsModule.exports.SITE.phone.replace(/\D/g,'') + '"'),'Existing public phone action retained');
    check(Array.from(result.html.matchAll(/<a\b[^>]*href="tel:[^"]*"[^>]*>([\s\S]*?)<\/a>/g), m=>textOfHtml(m[1]))
      .every(label=>label === 'Call ' + constantsModule.exports.SITE.phone), 'Telephone links correctly promise calling, not texting');
    for (const disclosure of legal) check(paragraphs(result.html).includes(disclosure),'Existing legal/trust disclosure byte-equivalent after rendering');
    equal(result.html.match(/<table\b[\s\S]*?<\/table>/)[0],baselineTable,'Full honest net comparison table unchanged');
    check(!/\binvestor\b/i.test(result.text),'No investor wording introduced');
    const articles = Array.from(result.html.matchAll(/<article\b[\s\S]*?<\/article>/g), m=>textOfHtml(m[0]));
    equal(articles.length,4,'All four alternative selling paths retained');
    check(articles[0].includes(item.firstPath),'Path order matches intent without removing alternatives');
    for (const pathName of ['List as-is with an agent','Repair and list','Direct as-is offer','A different closing arrangement']) {
      check(articles.some(a=>a.includes(pathName)),'Alternative ' + pathName + ' remains visible');
    }
    renderedVariants.push({item,selected,...result});
  }
  for (const field of ['headline','introduction','focusTitle','focusCopy','formIntro','actionLabel','stickyLabel','prioritiesHeading']) {
    equal(new Set(renderedVariants.map(v=>v.selected[field])).size,4,field + ': four distinct tailored values');
  }
  equal(new Set(renderedVariants.map(v=>JSON.stringify(v.selected.priorities))).size,4,'Four distinct priority sets');
  checks.push('Four exact UTM mappings render distinct H1/introduction/focus/form CTA/priorities with correct lane and path order');

  for (const [params,key] of [
    [{},'general'], [{utm_term:'urgent'},'urgent_fast_sale'], [{utm_term:'options'},'options_real_problem'],
    [{utm_content:'unknown',utm_term:' UrGeNt '},'urgent_fast_sale'],
    [{utm_content:['urgent_fast_sale'],utm_term:'options'},'options_real_problem'],
    [{utm_content:'unknown',utm_term:['urgent']},'general'],
    [{utm_content:'unknown',utm_term:'other'},'general'],
    [Object.assign(Object.create(null),{utm_content:'urgent_timeline'}),'urgent_timeline'],
  ]) {
    equal(config.getSellerOptionsLanding(params).key,key,'Known lane/general fallback deterministic');
    check((await render(params)).html.includes('data-seller-landing="' + key + '"'),'Fallback is reflected in actual server HTML');
  }
  const attack = '<script id="synthetic-injection">not-a-real-script</script>';
  for (const value of [
    undefined,null,true,12,[],['urgent_fast_sale'],['urgent_fast_sale','options_real_problem'],
    {},{toString(){throw new Error('Unexpected coercion');}},'__proto__','constructor','prototype',
    'toString','valueOf','__defineGetter__',attack,'unknown','x'.repeat(10000),
  ]) {
    equal(config.getSellerOptionsLanding({utm_content:value}).key,'general','Unknown/array/prototype/nonstring content safely falls back');
    equal(config.getSellerOptionsLanding({utm_term:value}).key,'general','Unknown/array/prototype/nonstring lane safely falls back');
    const result = await render({utm_content:value,utm_term:value});
    check(!result.html.includes('synthetic-injection'),'Untrusted query content is never reflected as HTML');
  }
  equal(config.getSellerOptionsLanding(JSON.parse('{"utm_content":"__proto__","__proto__":{"polluted":true}}')).key,'general','Prototype-like JSON key cannot select a prototype object');
  equal({}.polluted,undefined,'Prototype unchanged by parameter selection');
  checks.push('Unknown, duplicate-array, prototype-like, nonstring and injection values select fixed public copy safely');

  for (const {item,selected,forms} of renderedVariants) {
    const oppref = '  current+click/&=雪  ';
    const search = '?' + new URLSearchParams({
      utm_source:'chatgpt',utm_medium:'cpc',utm_campaign:'synthetic_review_only',
      utm_term:item.lane,utm_content:item.key,oppref,
    }).toString();
    const setup = () => makeHarness(formSource,{
      props:forms[0],pathname:'/sell/options',search,
      storage:{oppref:'stale-ref',gclid:'stale-click'},storageThrows:true,
    });
    const h = setup();
    check(h.text().includes(selected.formIntro),'Actual client form displays tailored introduction');
    await details(h);
    equal(h.submitDisabled(),true,'Actual client still requires explicit seller authority');
    await h.submit();
    equal(h.requests.length,0,'No request without authority');
    h.input('sellerAuthority','buyer');
    equal(h.submitDisabled(),true,'Unrelated role cannot submit');
    h.input('sellerAuthority',item.lane === 'urgent' ? 'owner' : 'authorized_representative');
    equal(h.submitDisabled(),false,'Recognized role accepts optional-empty details');
    equal(h.one(node=>node.props?.id === 'smsConsent').props.checked,false,'SMS opt-in remains unchecked');
    check(textOfHtml(h.html()).includes(constantsModule.exports.SMS_CONSENT_TEXT),'Actual final-step opt-in wording unchanged');
    check(h.text().includes(selected.actionLabel),'Actual final submit CTA matches ad');
    const staleHandler = h.submitHandler();
    h.queueJson(accepted());
    await h.submit();
    equal(h.requests.length,1,'One synthetic request');
    const payload = h.requests[0].payload;
    equal(payload.submissionFlow,'seller_options_v1','Actual client uses protected receipt flow');
    equal(payload.state,'ID','Property state evidence retained');
    equal(payload.sellerAuthority,item.lane === 'urgent' ? 'owner' : 'authorized_representative','Actual authority preserved');
    equal(payload.utmContent,item.key,'Exact ad ID retained in actual request');
    equal(payload.utmTerm,item.lane,'Lane UTM retained in actual request');
    equal(payload.utmSource,'chatgpt','Source attribution retained');
    equal(payload.utmMedium,'cpc','Paid-medium attribution retained');
    equal(payload.utmCampaign,'synthetic_review_only','Campaign attribution retained');
    equal(payload.oppref,oppref,'Opaque click reference retained byte-for-byte');
    equal(payload.landingPage,'/sell/options' + search,'Exact full landing URL retained');
    equal(payload.sms_consent,false,'No default SMS consent');
    equal(payload.tcpaConsent,false,'No new blanket call/SMS consent');
    equal(payload.sms_consent_timestamp,null,'No fabricated opt-in timestamp');
    check(/^[0-9a-f-]{36}$/.test(payload.submissionId),'Secure submission UUID still sent');
    same(h.storageReads,[],'No stale click storage used');
    equal(h.status().length,1,'Durable receipt rendered inline');
    equal(leadEvents(h).length,1,'Only one accepted inquiry tracking event');
    equal(h.redirects.length,0,'No generic Google thank-you redirect');
    check(h.text().includes('not an offer or a confirmed sale'),'Receipt makes no lead-quality/sale promise');
    await staleHandler({preventDefault(){}});
    h.render();
    equal(h.requests.length,1,'Stale handler cannot create duplicate after receipt');

    const retry = setup();
    await details(retry,'owner');
    retry.queueJson({success:true});
    await retry.submit();
    equal(retry.status().length,0,'Generic HTTP success is not a saved receipt');
    equal(leadEvents(retry).length,0,'Unconfirmed submission never counted as accepted');
    equal(retry.alerts().length,1,'Unconfirmed submission visibly reports error');
    const firstBody = retry.requests[0].body;
    retry.queueJson(accepted({duplicate:true}));
    await retry.submit();
    equal(retry.requests[1].body,firstBody,'Identical retry preserves exact UUID/body');
    equal(retry.status().length,1,'Duplicate durable receipt rendered');
    equal(leadEvents(retry).length,0,'Duplicate never creates new inquiry event');
    equal(retry.redirects.length,0,'Duplicate remains on tailored page');
  }
  checks.push('Each variant preserves actual form authority, consent, UUID, receipt, raw attribution, duplicate protection and tracking boundaries');
  execFileSync('git',['diff','--check'],{cwd:repo});
  report.result='PASS';
})().catch(error=>{
  report.result='FAIL';report.error=String(error.stack||error);process.exitCode=1;
}).finally(()=>{
  report.assertions=assertions;
  report.checks=checks;
  report.actualSourceSha256=sourceHashes;
  report.limitations=[
    'No live inquiry/email/CRM/analytics requests; hooks and HTTP responses are isolated test doubles.',
    'Visual browser QA is a separate final check.',
    'Buyer, price, closing, lead quality, and ad matching are not guaranteed by these checks.',
  ];
  console.log(JSON.stringify(report,null,2));
});
