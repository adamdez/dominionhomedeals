import test from 'node:test';
import assert from 'node:assert/strict';
import {validateScreening,matchInsideBuyingArea,milesFromBuyingCenter,SCREENING_VERSION} from '../src/lib/seller-screening-server.ts';
import {evaluate} from '../public/seller-screening/flow.mjs';
import {validateMetaSellerQualification,metaSellerFollowUpTier} from '../src/lib/meta-seller-qualifier.ts';

const contact={name:'QA Test',phone:'5095550128',street:'808 W Spokane Falls Blvd',city:'Spokane',state:'WA',zip:'99201',email:'',contactConsent:true,smsConsent:false};
const answers={area:'inside',property:'house',connection:'owner',listing:'not_listed',condition:'some',reason:'moving',timeline:'asap',tradeoff:'yes'};
const match={matchedAddress:'808 W SPOKANE FALLS BLVD, SPOKANE, WA, 99201',coordinates:{x:-117.426,y:47.661},addressComponents:{state:'WA',city:'SPOKANE',zip:'99201'},geographies:{Counties:[{STATE:'53',COUNTY:'063'}]}};
const input=(a=answers,c=contact)=>({screeningVersion:SCREENING_VERSION,screeningAnswers:a,screeningContact:c});
const lookup=(matches=[match])=>async()=>Response.json({result:{addressMatches:matches}});

test('a complete in-area request maps to the existing intake without inventing text or measurement consent',async()=>{
  const result=await validateScreening(input(),lookup());assert.equal(result.ok,true);
  assert.equal(result.fields.city,'SPOKANE');assert.equal(result.fields.serviceArea,'spokane_buying_area_wa');
  assert.equal(result.fields.sms_consent,false);assert.equal(result.fields.contactConsent,true);
  assert.equal('metaMeasurement' in result.fields,false);
});
test('a temporary gateway error retries the exact original lookup once before continuing',async()=>{
  const calls=[];
  const r=await validateScreening(input(),async(url,options)=>{calls.push(String(url));assert.equal(options.cache,'no-store');assert.ok(options.signal);return calls.length===1?new Response('unavailable',{status:502}):Response.json({result:{addressMatches:[match]}});});
  assert.equal(r.ok,true);assert.equal(calls.length,2);assert.equal(calls[0],calls[1]);
  const u=new URL(calls[0]);assert.equal(u.pathname,'/geocoder/geographies/address');assert.equal(u.searchParams.get('street'),contact.street);assert.equal(u.searchParams.get('layers'),null);
});
test('a transient connection error can recover on the second lookup',async()=>{
  let calls=0;const r=await validateScreening(input(),async()=>{if(++calls===1)throw new Error('network',{cause:{code:'ECONNRESET'}});return Response.json({result:{addressMatches:[match]}});});
  assert.equal(r.ok,true);assert.equal(calls,2);
});
test('repeated outages stop after two lookups and log no seller values',async()=>{
  const logged=[],oldError=console.error,oldWarn=console.warn;console.error=(...v)=>logged.push(v);console.warn=(...v)=>logged.push(v);
  let calls=0;
  try{const r=await validateScreening(input(),async()=>{calls++;return new Response('unavailable',{status:502});});assert.equal(r.ok,false);assert.equal(r.status,503);}finally{console.error=oldError;console.warn=oldWarn;}
  assert.equal(calls,2);assert.equal(logged.length,2);assert.equal(logged[0][1].attempt,1);assert.equal(logged[1][1].attempt,2);
  for(const line of logged)for(const secret of [contact.street,contact.city,contact.zip,contact.phone,'geocoding.geo.census.gov'])assert.equal(JSON.stringify(line).includes(secret),false);
});
test('no-match, multiple matches, outside area and HTTP400 are never retried',async()=>{
  for(const response of [()=>Response.json({result:{addressMatches:[]}}),()=>Response.json({result:{addressMatches:[match,match]}}),()=>Response.json({result:{addressMatches:[{...match,coordinates:{x:-122.33,y:47.60},geographies:{Counties:[{STATE:'53',COUNTY:'033'}]}}]}}),()=>new Response('invalid',{status:400}),()=>new Response('rate limit',{status:429})]){
    let calls=0;const r=await validateScreening(input(),async()=>{calls++;return response();});assert.equal(r.ok,false);assert.equal(calls,1);
  }
});
test('invalid provider JSON can recover, but never become an accepted no-match result',async()=>{
  let calls=0;const r=await validateScreening(input(),async()=>++calls===1?new Response('invalid JSON',{status:200}):Response.json({result:{addressMatches:[match]}}));assert.equal(r.ok,true);assert.equal(calls,2);
  let missing=0;const bad=await validateScreening(input(),async()=>{missing++;return Response.json({result:{}});});assert.equal(bad.status,503);assert.equal(missing,2);
});
test('all transient gateway statuses can recover and non-ok response bodies are cancelled',async()=>{
  for(const status of [500,502,503,504]){
    let calls=0,cancelled=false;
    const r=await validateScreening(input(),async()=>{if(++calls>1)return Response.json({result:{addressMatches:[match]}});return {ok:false,status,body:{cancel:async()=>{cancelled=true;}}};});
    assert.equal(r.ok,true);assert.equal(calls,2);assert.equal(cancelled,true);
  }
});
test('timeouts use independent signals and safe correlated logs',async()=>{
  const signals=[],logged=[],oldWarn=console.warn;console.warn=(...v)=>logged.push(v);
  try{
    const r=await validateScreening(input(),async(url,options)=>{signals.push(options.signal);if(signals.length===1)throw new DOMException('private address','TimeoutError');return Response.json({result:{addressMatches:[match]}});});assert.equal(r.ok,true);
  }finally{console.warn=oldWarn;}
  assert.notEqual(signals[0],signals[1]);assert.equal(logged[0][1].timeout,true);assert.match(logged[0][1].request_id,/^[0-9a-f-]{36}$/);assert.equal(JSON.stringify(logged).includes('private address'),false);
});
test('malformed match entries remain unavailable after the bounded retry',async()=>{
  let calls=0;const r=await validateScreening(input(),async()=>{calls++;return Response.json({result:{addressMatches:[null]}});});assert.equal(r.status,503);assert.equal(calls,2);
});
test('each stop and missing earlier answer prevents even an address lookup',async()=>{
  let calls=0;const fetcher=async()=>{calls++;throw Error('must not fetch');};
  for(const [key,value] of [['area','outside'],['property','other'],['connection','uninvolved'],['listing','listed'],['timeline','browsing'],['tradeoff','retail'],['condition',undefined]]){
    const result=await validateScreening(input({...answers,[key]:value}),fetcher);assert.equal(result.ok,false,key);
  }
  assert.equal(calls,0);
});
test('manufactured homes require owned land; stale land answers do not admit rented lots',async()=>{
  assert.equal((await validateScreening(input({...answers,property:'manufactured',land:'rented'}),lookup())).ok,false);
  const good=await validateScreening(input({...answers,property:'manufactured',land:'owned'}),lookup());
  assert.equal(good.ok,true);assert.equal(good.fields.propertyType,'manufactured_with_owned_land');
});
test('longer timelines continue and map to follow-up over time',async()=>{
  assert.equal(evaluate({...answers,timeline:'later'}).kind,'ready_for_contact');
  const r=await validateScreening(input({...answers,timeline:'later'}),lookup());assert.equal(r.ok,true);assert.equal(r.fields.timeline,'more_than_60_days');
});
test('within sixty days and an expired listing retain the exact meaning without inventing a narrower date',async()=>{
  const r=await validateScreening(input({...answers,timeline:'within_60',listing:'expired'}),lookup());
  assert.equal(r.ok,true);assert.equal(r.fields.timeline,'within_60_days');assert.equal(r.fields.listingStatus,'expired');
  assert.equal(r.answers.timeline,'within_60');assert.equal(r.answers.listing,'expired');
  assert.match(r.fields.message,/Within the next 60 days/);assert.match(r.fields.message,/listing has ended/);
  const q=validateMetaSellerQualification(r.fields);assert.equal(q.ok,true);assert.equal(metaSellerFollowUpTier(q.value),'ready_now');
});
test('estate assistance stays unverified and original answers survive without forged or irrelevant fields',async()=>{
  const r=await validateScreening(input({...answers,connection:'estate',land:'owned',fake:'authorized'}),lookup());
  assert.equal(r.ok,true);assert.equal(r.fields.sellerAuthority,'unsure');assert.equal(r.answers.connection,'estate');
  assert.equal('fake' in r.answers,false);assert.equal('land' in r.answers,false);
  assert.match(r.fields.message,/Authority to sell has not been verified/);
  const q=validateMetaSellerQualification(r.fields);assert.equal(q.ok,true);assert.equal(metaSellerFollowUpTier(q.value),'needs_review');
});
test('a claimed inside answer cannot override independent geography, county, state or ZIP',async()=>{
  for(const bad of [
    {...match,coordinates:{x:-117.35,y:48.28}},
    {...match,geographies:{Counties:[{STATE:'53',COUNTY:'065'}]}},
    {...match,addressComponents:{...match.addressComponents,state:'ID'}},
    {...match,addressComponents:{...match.addressComponents,zip:'99299'}},
    {...match,coordinates:{x:NaN,y:47.6}},
  ])assert.equal((await validateScreening(input(),lookup([bad]))).ok,false);
  assert.equal(matchInsideBuyingArea([match,match],contact),null);
});
test('no match and lookup outages return a truthful retry or call path, without acceptance',async()=>{
  assert.equal((await validateScreening(input(),lookup([]))).status,422);
  const result=await validateScreening(input(),async()=>{throw Error('network');});assert.equal(result.status,503);assert.equal(result.ok,false);
  assert.match(result.error,/509-822-5460/);
});
test('contact permission and a numbered street address are required before lookup',async()=>{
  let called=false;const f=async()=>{called=true;return Response.json({});};
  for(const c of [{...contact,contactConsent:false},{...contact,street:'Spokane'},{...contact,name:''}])assert.equal((await validateScreening(input(answers,c),f)).ok,false);
  assert.equal(called,false);
});
test('the map-derived circle retains all five owner-named cities and excludes distant examples',()=>{
  for(const [name,lat,lon] of [['Spokane',47.6588,-117.426],['Airway Heights',47.6446,-117.5933],['Cheney',47.4874,-117.5758],['Coeur dAlene',47.6777,-116.7805],['Deer Park',47.9543,-117.4769]])assert.ok(milesFromBuyingCenter(lat,lon)<30,name);
  for(const [name,lat,lon] of [['Athol',47.9482,-116.708],['Newport',48.181,-117.043],['Sandpoint',48.2766,-116.5532]])assert.ok(milesFromBuyingCenter(lat,lon)>30,name);
});
