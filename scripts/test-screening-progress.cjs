const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
function load(file,mocks={}){
 const module={exports:{}};
 const code=ts.transpileModule(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(code,{module,exports:module.exports,Date,require:name=>{if(name in mocks)return mocks[name];if(name.startsWith('node:'))return require(name);throw Error(name);}});
 return module.exports;
}
const meta=load('src/lib/meta-seller-funnel-events.ts',{'server-only':{},'@/lib/dominion-supabase':{}});
const progress=load('src/lib/screening-progress.ts',{'./meta-seller-funnel-events':meta});
const visit='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const base={eventId:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',visitId:visit,eventType:'landing_arrived',detail:'screen',occurredAt:new Date().toISOString(),attribution:{landing_revision:progress.SCREENING_PAGE_REVISION,ad_id:'120250428203840073',utm_content:'dh_move_tether_still_20261025_v2'}};
test('strict progress retains original ad and revision while discarding seller fields and ad macros',()=>{
 const r=progress.normalizeScreeningProgress({...base,phone:'5095550128',address:'Private property',attribution:{...base.attribution,phone:'5095550128',adset_id:'{{adset.id}}',utm_term:'private@example.com'}},{blocked:false,userAgent:'iPhone'});
 assert.equal(r.attribution.ad_id,base.attribution.ad_id);assert.equal(r.attribution.device_class,'ios_phone');
 assert.equal(r.attribution.adset_id,undefined);assert.equal(r.attribution.utm_term,undefined);assert.equal(JSON.stringify(r).includes('509555'),false);assert.equal(JSON.stringify(r).includes('Private property'),false);
});
test('only fixed question and failure identifiers are accepted; client cannot create acceptance',()=>{
 for(const q of ['area','property','land','connection','listing','condition','reason','timeline','tradeoff','contact'])assert.ok(progress.normalizeScreeningProgress({...base,eventType:'gate_answered',detail:q},{blocked:false}),q);
 for(const detail of ['owner_phone_5095550128','private_answer','server_attempt'])assert.equal(progress.normalizeScreeningProgress({...base,eventType:'gate_answered',detail},{blocked:false}),null);
 assert.equal(progress.normalizeScreeningProgress({...base,eventType:'lead_accepted',detail:'server_accepted'},{blocked:false}),null);
 assert.equal(progress.normalizeScreeningProgress({...base,eventType:'submit_failed',detail:'address_check_unavailable'},{blocked:false}),null);
});
test('QA and real records have separate revisions and cannot be accidentally mixed',()=>{
 assert.equal(progress.normalizeScreeningProgress({...base,internalQa:true},{blocked:false}),null);
 assert.equal(progress.normalizeScreeningProgress({...base,attribution:{landing_revision:progress.SCREENING_QA_REVISION}},{blocked:false}),null);
 const qa=progress.normalizeScreeningProgress({...base,internalQa:true,attribution:{...base.attribution,landing_revision:progress.SCREENING_QA_REVISION}},{blocked:false});assert.equal(qa.attribution.landing_revision,progress.SCREENING_QA_REVISION);
});
test('browser privacy and server headers can each prevent diagnostic recording',()=>{
 assert.equal(progress.normalizeScreeningProgress(base,{blocked:true}),null);
 const input={funnelVisitId:visit,screeningJourney:{revision:progress.SCREENING_PAGE_REVISION,privacyAllowed:true},adAttribution:base.attribution};
 assert.equal(progress.screeningRequestContext(input,{blocked:true,userAgent:''}),null);
 assert.equal(progress.screeningRequestContext({...input,screeningJourney:{...input.screeningJourney,privacyAllowed:false}},{blocked:false,userAgent:''}),null);
});
test('server address-failure records preserve source without copying input values',()=>{
 const ctx=progress.screeningRequestContext({funnelVisitId:visit,internalQa:true,screeningJourney:{revision:progress.SCREENING_PAGE_REVISION,privacyAllowed:true},adAttribution:base.attribution,screeningContact:{phone:'5095550128'}},{blocked:false,userAgent:'Android Mobile'});
 const r=progress.screeningServerEvent(ctx,'submit_failed','address_check_unavailable');
 assert.equal(r.attribution.device_class,'android_phone');assert.equal(r.detail,'address_check_unavailable');assert.equal(r.attribution.ad_id,base.attribution.ad_id);assert.equal(r.attribution.landing_revision,progress.SCREENING_QA_REVISION);assert.equal(JSON.stringify(r).includes('509555'),false);
 assert.equal(progress.screeningServerEvent(ctx,'submit_failed','an arbitrary error'),null);
});
async function client(){
 const context=vm.createContext({Date,URLSearchParams,crypto:require('node:crypto').webcrypto});
 const dir=path.join(__dirname,'../public/seller-screening');
 const mods=new Map(['flow.mjs','progress.mjs'].map(name=>[name,new vm.SourceTextModule(fs.readFileSync(path.join(dir,name),'utf8'),{context,identifier:name})]));
 await mods.get('progress.mjs').link(name=>mods.get(name.replace('./','').split('?')[0]));await mods.get('progress.mjs').evaluate();return mods.get('progress.mjs').namespace;
}
test('client honors opt-out mid-visit and deduplicates without sending contact data',async()=>{
 const c=await client(),sent=[];let blocked=true;
 const track=c.createProgress({visitId:visit,qa:false,attribution:{ad_id:base.attribution.ad_id,phone:'5095550128'},blocked:()=>blocked,transport:async(url,options)=>sent.push({url,...options})});
 track('landing_arrived',{detail:'screen',once:'arrival'});assert.equal(sent.length,0);
 blocked=false;track('landing_arrived',{detail:'screen',once:'arrival'});track('landing_arrived',{detail:'screen',once:'arrival'});assert.equal(sent.length,1);
 blocked=true;track('form_viewed',{question:'contact'});assert.equal(sent.length,1);
 assert.equal(sent[0].url,'/api/meta-seller-funnel-events');assert.equal(sent[0].keepalive,true);assert.equal(sent[0].body.includes('509555'),false);
});
test('a failed diagnostics transport does not stop the form',async()=>{
 const c=await client();const track=c.createProgress({visitId:visit,blocked:()=>false,transport:()=>{throw Error('offline')}});
 assert.doesNotThrow(()=>track('landing_arrived',{detail:'screen'}));
});
