// First-party diagnostics only. Never send answers, contact values or events to Meta.
import {secureUuid} from './flow.mjs?v=screening_20261029_v2';
export const PAGE_REVISION='screening_20261029_v2';
export const QUESTION_STAGE={area:'service_area',property:'property_type',land:'property_type',connection:'authority',listing:'listing_status',condition:'condition',reason:null,timeline:'timeline',tradeoff:'price_tradeoff',contact:'contact'};
export function createProgress({visitId,attribution={},qa=false,blocked,transport=globalThis.fetch}){
  const seen=new Set();
  const safeAttribution=Object.fromEntries(['utm_source','utm_medium','utm_campaign','utm_content','utm_term','ad_id','adset_id','campaign_id','creative_id'].filter(key=>typeof attribution[key]==='string'&&/^[a-zA-Z0-9_.-]{1,160}$/.test(attribution[key])).map(key=>[key,attribution[key]]));
  return function track(eventType,{question=null,detail=question,once=null}={}){
    try{
      if(!visitId||blocked()||typeof transport!=='function')return;
      if(once&&seen.has(once))return;
      if(once)seen.add(once);
      const body={eventId:secureUuid(),visitId,eventType,occurredAt:new Date().toISOString(),stage:QUESTION_STAGE[question]||null,detail,variant:'direct',internalQa:qa,
        attribution:{...safeAttribution,landing_revision:PAGE_REVISION+(qa?'_qa':'')}};
      void Promise.resolve(transport('/api/meta-seller-funnel-events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),keepalive:true})).catch(()=>undefined);
    }catch{/* Diagnostics must never prevent a property request. */}
  };
}
