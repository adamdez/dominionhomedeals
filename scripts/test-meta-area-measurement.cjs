// Real submission handler and Meta modules; all storage and network isolated.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const root=path.resolve(__dirname,'..');
function load(file,mocks={},globals={}){
 const module={exports:{}}; const code=ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(code,{module,exports:module.exports,Date,URL,URLSearchParams,Request,Response,AbortSignal,setTimeout,clearTimeout,crypto:require('node:crypto').webcrypto,console:{log(){},error(){}},process:{env:{}},fetch:()=>{throw Error('Unexpected network');},require:n=>{if(n in mocks)return mocks[n];if(n==='@/lib/seller-screening-server')return require(path.join(root,'src/lib/seller-screening-server.ts'));if(n.startsWith('node:'))return require(n);throw Error('Unexpected dependency '+n);},...globals});return module.exports;
}
function harness(){
 const receipts=new Map(),saved=[],crm=[],meta=[];
 const env={META_ADS_MEASUREMENT_MODE:'production',META_ADS_PIXEL_ID:'1234567890',META_ADS_CONVERSIONS_ACCESS_TOKEN:'unit-test-only',META_GRAPH_API_VERSION:'v25.0',VERCEL_ENV:'production',LAZARUS_OPTIONS_INTAKE_URL:'https://crm.example.test/intake',LAZARUS_OPTIONS_INTAKE_CREATE_LEAD_KEY:'unit-test-only'};
 const policy=load('src/lib/meta-measurement-policy.ts');
 const constants={SITE:{url:'https://www.dominionhomedeals.com',phone:'509-555-0100'}};
 const transport=async(url,options)=>{
  if(url==='https://crm.example.test/intake'){crm.push(JSON.parse(options.body));const id='fixture-'+crm.length;return Response.json({ppcLeadId:id,lead:{id}});}
  if(url==='https://graph.facebook.com/v25.0/1234567890/events'){meta.push(JSON.parse(options.body));return Response.json({events_received:1});}
  throw Error('Unexpected transport destination');
 };
 const conversions=load('src/server/meta-ads-conversions.ts',{'server-only':{},'@/lib/constants':constants,'@/lib/meta-measurement-policy':policy},{process:{env},fetch:transport});
 const qualifier=load('src/lib/meta-seller-qualifier.ts');
 class Conflict extends Error{}
 const storage={DOMINION_OPTIONS_FLOW:'seller_options_v1',DominionOptionsSubmissionConflictError:Conflict,
  isDominionOptionsSubmissionId:v=>typeof v==='string'&&/^[0-9a-f-]{36}$/.test(v),
  dominionOptionsDeliveryStatus:()=> 'delivered',
  recordDominionOptionsLeadSubmission:async(input,id,metadata)=>{
   if(receipts.has(id))return{...receipts.get(id),duplicate:true};
   const receipt={duplicate:false,record:{id:'saved-'+id,optionsReceipt:{...metadata}}};receipts.set(id,receipt);saved.push({input,metadata});return receipt;
  },recordDominionOptionsDelivery:async(receipt,delivery,conversion,metaConversion)=>{receipt.record.optionsReceipt.delivery=delivery;receipt.record.optionsReceipt.metaConversion=metaConversion;},
  recordDominionLeadSubmission:async()=>{throw Error('Legacy storage must not run');}};
 const route=load('src/app/api/leads/route.ts',{
  'next/server':{NextResponse:{json:Response.json}},'@/lib/constants':constants,'@/lib/dominion-leads':storage,
  '@/lib/mailchimp':{},'@/server/openai-ads-conversions':{},'@/lib/seller-measurement-policy':{isSellerMeasurementQa:b=>b.internalQa===true},
  '@/server/meta-ads-conversions':conversions,'@/server/meta-seller-feedback-context':{buildMetaFeedbackContext:()=>undefined,withdrawMetaFeedbackPermission:async()=>true},
  '@/lib/meta-measurement-policy':policy,'@/lib/seller-funnel-events':{},'@/lib/meta-seller-qualifier':qualifier,'@/lib/meta-seller-funnel-events':{}
 },{process:{env},fetch:transport});
 const payload={submissionFlow:'seller_options_v1',submissionId:'00000000-0000-4000-8000-000000000001',qualificationVersion:'meta_seller_followup_v2',serviceArea:'spokane_county_wa',metaVariant:'direct',address:'100 Example Street',firstName:'Fixture',phone:'5095550100',contactConsent:true,metaMeasurement:{consent:true,consentVersion:'meta_measurement_v2'}};
 return{saved,crm,meta,receipts,submit:async(change={})=>{const body={...payload,...change};const response=await route.POST(new Request('https://www.dominionhomedeals.com/api/leads',{method:'POST',headers:{host:'www.dominionhomedeals.com','x-forwarded-for':'192.0.2.1','user-agent':'Fixture browser'},body:JSON.stringify(body)}));return{status:response.status,body:await response.json()};}};
}
test('explicit outside area remains saved and delivered to CRM, but no Meta Lead on either channel',async()=>{
 const h=harness(),r=await h.submit({serviceArea:'outside_service_area'});
 assert.equal(r.status,200);assert.equal(r.body.accepted,true);assert.equal(h.saved.length,1);assert.equal(h.crm.length,1);assert.equal(h.meta.length,0);assert.equal(r.body.metaBrowserEligible,false);
 assert.equal(h.saved[0].metadata.metaConversion.referenceId,'outside_service_area');
 assert.equal([...h.receipts.values()][0].record.optionsReceipt.metaConversion.status,'skipped');
});
test('local-area request reports one server Lead and permits browser with same event ID, without leaking area or seller details',async()=>{
 const h=harness(),r=await h.submit();assert.equal(r.status,200);assert.equal(h.crm.length,1);assert.equal(h.meta.length,1);assert.equal(r.body.metaBrowserEligible,true);assert.equal(h.meta[0].data[0].event_id,r.body.metaEventId);
 const outgoing=JSON.stringify(h.meta);for(const privateValue of ['Example Street','5095550100','spokane_county_wa','leadEligible','serviceArea'])assert.equal(outgoing.includes(privateValue),false);
 assert.deepEqual(Object.keys(h.meta[0].data[0].user_data).sort(),['client_ip_address','client_user_agent']);
});
test('both accepted counties keep unsure or long-term sellers eligible; no ready-now-only filter',async()=>{
 for(const serviceArea of ['spokane_county_wa','kootenai_county_id']){const h=harness(),r=await h.submit({serviceArea,timeline:'more_than_60_days'});assert.equal(r.status,200);assert.equal(h.meta.length,1);assert.equal(r.body.metaBrowserEligible,true);}
});
test('duplicates and transport retries reuse receipt without repeating CRM or Meta reporting',async()=>{
 for(const serviceArea of ['spokane_county_wa','outside_service_area']){const h=harness();const first=await h.submit({serviceArea}),retry=await h.submit({serviceArea});assert.equal(retry.body.receiptId,first.body.receiptId);assert.equal(retry.body.duplicate,true);assert.equal(retry.body.metaBrowserEligible,false);assert.equal(h.saved.length,1);assert.equal(h.crm.length,1);assert.equal(h.meta.length,serviceArea==='spokane_county_wa'?1:0);}
});
test('opt-out and QA still save the inquiry but never report a production Meta Lead',async()=>{
 for(const change of [{metaMeasurement:{consent:false}},{internalQa:true},{metaMeasurement:{consent:true,consentVersion:'meta_measurement_v2',optedOut:true}}]){const h=harness(),r=await h.submit(change);assert.equal(r.status,200);assert.equal(h.crm.length,1);assert.equal(h.meta.length,0);assert.equal(r.body.metaBrowserEligible,false);}
});
test('forged area fails validation before storing, delivering or reporting',async()=>{
 const h=harness(),r=await h.submit({serviceArea:'forged'});assert.equal(r.status,400);assert.equal(h.saved.length,0);assert.equal(h.crm.length,0);assert.equal(h.meta.length,0);
});
test('outside area plus no consent preserves the privacy skip reason and still never reports',async()=>{
 for(const metaMeasurement of [{consent:false},{consent:true,consentVersion:'meta_measurement_v2',optedOut:true},{consent:true,consentVersion:'meta_measurement_v2',globalPrivacyControl:true}]){
  const h=harness(),r=await h.submit({serviceArea:'outside_service_area',metaMeasurement});
  assert.equal(r.status,200);assert.equal(h.crm.length,1);assert.equal(h.meta.length,0);assert.equal(r.body.metaBrowserEligible,false);assert.equal(h.saved[0].metadata.metaConversion.referenceId,'privacy_blocked');
 }
});
test('retired strict version is screened; a missing or invalid version cannot send outside-area Meta Lead',async()=>{
 const old=harness(),r=await old.submit({qualificationVersion:'meta_distressed_seller_v1',serviceArea:'outside_service_area'});assert.equal(r.status,200);assert.equal(old.meta.length,0);assert.equal(r.body.metaBrowserEligible,false);
 for(const qualificationVersion of ['', 'forged']){const h=harness(),r=await h.submit({qualificationVersion,serviceArea:'outside_service_area'});assert.equal(r.status>=400,true);assert.equal(h.meta.length,0);assert.equal(h.saved.length,0);}
});
test('real durable receipt logic rejects changed area on the same ID and preserves the first decision',async()=>{
 for(const firstArea of ['spokane_county_wa','outside_service_area']){
  let savedRow=null,inserts=0;
  const db={from:()=>({
   insert:payload=>({select:()=>({single:async()=>{inserts++;if(savedRow)return{error:{code:'23505'}};savedRow={id:1,content:payload.content,created_at:new Date().toISOString(),updated_at:new Date().toISOString()};return{data:savedRow};}})}),
   select:()=>({eq:()=>({maybeSingle:async()=>({data:savedRow})})})
  })};
  const real=load('src/lib/dominion-leads.ts',{'@/lib/dominion-supabase':{getDominionServiceClient:()=>db}});
  const input={firstName:'Fixture',lastName:'Owner',phone:'5095550100',address:'100 Example Street',sellerAuthority:'owner',source:'meta_ads',submittedAt:new Date().toISOString()};
  const metadata=area=>({internalQa:false,metaSellerAssessment:{serviceArea:area},metaConversion:{status:area==='outside_service_area'?'skipped':'pending',referenceId:area==='outside_service_area'?'outside_service_area':undefined,measurementMode:'disabled',eventId:'dh_lead_fixture'}});
  const id='00000000-0000-4000-8000-000000000001',first=await real.recordDominionOptionsLeadSubmission(input,id,metadata(firstArea));
  const other=firstArea==='spokane_county_wa'?'outside_service_area':'spokane_county_wa';
  await assert.rejects(real.recordDominionOptionsLeadSubmission(input,id,metadata(other)),real.DominionOptionsSubmissionConflictError);
  const duplicate=await real.recordDominionOptionsLeadSubmission(input,id,metadata(firstArea));assert.equal(duplicate.duplicate,true);assert.equal(duplicate.record.optionsReceipt.metaConversion.status,first.record.optionsReceipt.metaConversion.status);assert.equal(inserts,3);
 }
});
