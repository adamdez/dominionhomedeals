import { normalizeMetaSellerFunnelEvent, type MetaSellerFunnelEvent } from './meta-seller-funnel-events';
import { randomUUID } from 'node:crypto';

export const SCREENING_PAGE_REVISION = 'screening_20261029_v2';
export const SCREENING_QA_REVISION = SCREENING_PAGE_REVISION + '_qa';
const QUESTIONS = new Set(['area','property','land','connection','listing','condition','reason','timeline','tradeoff','contact']);
const FIELDS = new Set(['full_name','phone','email','address','contact_permission','contact_invalid']);
const BROWSER_EVENTS = new Set(['landing_arrived','form_viewed','form_started','gate_answered','gate_exited','field_focused','validation_failed','submit_attempted','submit_failed','cta_clicked']);
const FAILURES = new Set(['request_failed','response_unconfirmed','http_400','http_409','http_422','http_429','http_500','http_503']);
const SERVER_DETAILS = new Set(['server_attempt','address_check_unavailable','address_not_accepted','screening_incomplete','version_mismatch','internal_check_stopped']);
type Input = Record<string, unknown>;
export interface ScreeningProgressContext {
  visitId:string;
  internalQa:boolean;
  userAgent:string;
  attribution:Record<string,string>;
}
export function screeningRequestContext(value:unknown, options:{blocked:boolean;userAgent:string}):ScreeningProgressContext|null {
  if(options.blocked||!value||typeof value!=='object'||Array.isArray(value))return null;
  const body=value as Input, journey=body.screeningJourney as Input|undefined;
  if(!journey||journey.revision!==SCREENING_PAGE_REVISION||journey.privacyAllowed!==true||typeof body.funnelVisitId!=='string'||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.funnelVisitId))return null;
  const internalQa=body.internalQa===true;
  return {visitId:body.funnelVisitId,internalQa,userAgent:options.userAgent,attribution:screeningAttribution(body.adAttribution,internalQa,options.userAgent)};
}
export function screeningServerEvent(context:ScreeningProgressContext,eventType:'submit_attempted'|'submit_failed',detail:string):MetaSellerFunnelEvent|null {
  return normalizeScreeningProgress({...context,eventId:randomUUID(),eventType,detail,occurredAt:new Date().toISOString()}, {blocked:false,server:true,userAgent:context.userAgent});
}
export function progressDevice(userAgent: string): string {
  if (/iPad|Android(?!.*Mobile)/i.test(userAgent)) return 'tablet';
  if (/iPhone|iPod/i.test(userAgent)) return 'ios_phone';
  if (/Android.*Mobile/i.test(userAgent)) return 'android_phone';
  return /Mozilla/i.test(userAgent) ? 'desktop' : 'unknown';
}
export function screeningAttribution(input: unknown, qa: boolean, userAgent = ''): Record<string,string> {
  const raw = input && typeof input === 'object' && !Array.isArray(input) ? input as Input : {};
  const out: Record<string,string> = {landing_revision:qa?SCREENING_QA_REVISION:SCREENING_PAGE_REVISION,device_class:progressDevice(userAgent)};
  for (const key of ['ad_id','adset_id','campaign_id','creative_id']) {
    if (typeof raw[key]==='string' && /^\d{5,30}$/.test(raw[key])) out[key]=raw[key];
  }
  for (const key of ['utm_source','utm_medium','utm_campaign','utm_content','utm_term']) {
    if (typeof raw[key]==='string' && /^[a-zA-Z0-9_.-]{1,160}$/.test(raw[key])) out[key]=raw[key];
  }
  return out;
}
export function normalizeScreeningProgress(value: unknown, options: {blocked:boolean; userAgent?:string; server?:boolean}): MetaSellerFunnelEvent | null {
  if(options.blocked || !value || typeof value!=='object' || Array.isArray(value)) return null;
  const raw=value as Input;
  const qa=raw.internalQa===true;
  const attribution=raw.attribution && typeof raw.attribution==='object' && !Array.isArray(raw.attribution) ? raw.attribution as Input : {};
  if(attribution.landing_revision !== (qa?SCREENING_QA_REVISION:SCREENING_PAGE_REVISION)) return null;
  const type=String(raw.eventType||''),detail=String(raw.detail||'');
  if(options.server){
    if(!['submit_attempted','submit_failed'].includes(type)||!SERVER_DETAILS.has(detail))return null;
  }else{
    if(!BROWSER_EVENTS.has(type))return null;
    const allowed = type==='landing_arrived' ? detail==='screen' :
      ['form_viewed','gate_answered','gate_exited'].includes(type) ? QUESTIONS.has(detail) :
      type==='form_started' ? ['questions','contact'].includes(detail) :
      ['field_focused','validation_failed'].includes(type) ? FIELDS.has(detail) :
      type==='submit_attempted' ? detail==='contact' :
      type==='submit_failed' ? FAILURES.has(detail) :
      type==='cta_clicked' ? detail==='phone_link' : false;
    if(!allowed)return null;
  }
  const stages:Record<string,string>={area:'service_area',property:'property_type',land:'property_type',connection:'authority',listing:'listing_status',condition:'condition',timeline:'timeline',tradeoff:'price_tradeoff',contact:'contact'};
  const stage = options.server || ['field_focused','validation_failed','submit_attempted','submit_failed'].includes(type) || detail==='contact'
    ? 'contact' : stages[detail] || null;
  return normalizeMetaSellerFunnelEvent({...raw,variant:'direct',stage,leadReceiptId:null,attribution:screeningAttribution(attribution,qa,options.userAgent)});
}
