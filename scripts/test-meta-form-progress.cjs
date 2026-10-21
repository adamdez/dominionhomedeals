const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript'), path = require('node:path');
function load(file, mocks = {}, globals = {}) {
 const module = { exports: {} };
 const code = ts.transpileModule(fs.readFileSync(path.join(__dirname,'..',file),'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(code, {module,exports:module.exports,Date,URLSearchParams,crypto:require('node:crypto').webcrypto,
  require:name => {if(name in mocks)return mocks[name];if(name.startsWith('node:'))return require(name);throw Error(name)}, ...globals});
 return module.exports;
}
const fields = load('src/lib/meta-seller-form-progress.ts');
test('partial, invalid and unchecked fields do not claim completion; output is always a fixed field name', () => {
 assert.equal(fields.completedMetaField('phone','(202) 555-01',true),null);
 assert.equal(fields.completedMetaField('phone','(202) 555-0100',true),'phone');
 assert.equal(fields.completedMetaField('email','bad',false),null);
 assert.equal(fields.completedMetaField('contact_permission','on',true,false),null);
 assert.equal(fields.completedMetaField('contact_permission','on',true,true),'contact_permission');
 assert.equal(fields.completedMetaField('full_name','Owner Private',true),'full_name');
 assert.equal(fields.completedMetaField('private_seller_answer','Owner Private',true),null);
 assert.equal(fields.completedMetaField('address','100 Example Street',true),'address');
 assert.equal(fields.completedMetaField('service_area','',true),null);
});
test('event transport deduplicates milestones and preserves attribution and fixed revision without seller values', async () => {
 const sent=[],storage=new Map();
 const client=load('src/lib/meta-seller-funnel-tracking.ts',{'@/lib/seller-funnel-tracking':{isInternalQaSession:()=>false,readSellerAttribution:()=>({ad_id:'123',utm_campaign:'campaign'})}}, {
  window:{location:{pathname:'/sell/offer-check'}},sessionStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},fetch:async(url,options)=>{sent.push({url,body:JSON.parse(options.body)});return{ok:true}}});
 for(let i=0;i<2;i++)client.trackMetaSellerFunnelEvent('field_completed',{variant:'direct',stage:'contact',detail:'phone',onceKey:'field:phone'});
 client.trackMetaSellerFunnelEvent('form_ready',{variant:'direct',onceKey:'form_ready'});
 assert.equal(sent.length,2);assert.equal(sent[0].body.visitId,sent[1].body.visitId);
 assert.equal(sent[0].body.attribution.ad_id,'123');assert.equal(sent[0].body.attribution.landing_revision,'offer_form_v2');
 assert.equal(sent[0].body.detail,'phone');assert.equal(JSON.stringify(sent).includes('555'),false);
});
test('internal QA produces no analytics requests', () => {
 const client=load('src/lib/meta-seller-funnel-tracking.ts',{'@/lib/seller-funnel-tracking':{isInternalQaSession:()=>true}}, {window:{},fetch:()=>{throw Error('QA leaked')}});
 assert.equal(client.trackMetaSellerFunnelEvent('form_started',{variant:'direct'}),'');
});
test('server accepts new milestones, strips private fields, rejects free-text field details and retains old milestones', () => {
 const server=load('src/lib/meta-seller-funnel-events.ts',{'server-only':{},'@/lib/dominion-supabase':{}});
 const input={eventId:'00000000-0000-4000-8000-000000000001',visitId:'00000000-0000-4000-8000-000000000002',occurredAt:new Date().toISOString(),variant:'direct',stage:'contact',eventType:'field_completed',detail:'phone',phone:'2025550100',address:'100 Example Street',attribution:{ad_id:'123',landing_revision:'offer_form_v2',phone:'2025550100'}};
 const normalized=server.normalizeMetaSellerFunnelEvent(input);
 assert.ok(normalized);assert.equal(JSON.stringify(normalized).includes('2025550100'),false);assert.equal(JSON.stringify(normalized).includes('Example Street'),false);
 assert.equal(server.normalizeMetaSellerFunnelEvent({...input,detail:'my_private_answer'}),null);
 for(const eventType of ['landing_arrived','form_viewed','form_started','field_focused','form_ready','cta_clicked','submit_attempted','submit_failed','lead_accepted'])assert.ok(server.normalizeMetaSellerFunnelEvent({...input,eventType,detail:null}));
});
