import test from 'node:test';
import assert from 'node:assert/strict';
import {validateScreening,matchInsideBuyingArea,milesFromBuyingCenter,SCREENING_VERSION} from '../src/lib/seller-screening-server.ts';
import {evaluate} from '../public/seller-screening/flow.mjs';

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
