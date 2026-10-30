import { evaluate, validateContact, DEFAULT_ORDER, FLOW_VERSION, QUESTIONS } from '../../public/seller-screening/flow.mjs'
import { randomUUID } from 'node:crypto'

// Numerical boundary fitted to the approved regional map. Address lookup is
// independent of the browser's answer; a city/ZIP alone never grants admission.
export const SCREENING_AREA = { latitude: 47.63, longitude: -117.25, miles: 30 } as const
export { FLOW_VERSION as SCREENING_VERSION }
type Contact = { name: string; phone: string; street: string; city: string; state: string; zip: string; email: string; contactConsent: boolean; smsConsent: boolean }
type AddressMatch = { matchedAddress: string; coordinates: {x: number; y: number}; addressComponents: { state: string; city: string; zip: string }; geographies?: {Counties?: Array<{STATE: string; COUNTY: string}>} }
type ScreeningInput = { screeningVersion?: unknown; screeningAnswers?: unknown; screeningContact?: unknown; reasonDetail?: unknown }
type ScreeningResult = {ok: false; error: string; status: number} | {ok: true; fields: Record<string, string | boolean>; contact: Contact; answers: Record<string,string>}

export function milesFromBuyingCenter(latitude: number, longitude: number): number {
  const rad = (v: number) => v * Math.PI / 180
  const dlat=rad(latitude-SCREENING_AREA.latitude), dlon=rad(longitude-SCREENING_AREA.longitude)
  const a=Math.sin(dlat/2)**2+Math.cos(rad(latitude))*Math.cos(rad(SCREENING_AREA.latitude))*Math.sin(dlon/2)**2
  return 3958.7613*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))
}

export function matchInsideBuyingArea(matches: AddressMatch[], contact: Contact): AddressMatch | null {
  if (matches.length !== 1) return null
  const m=matches[0], lat=m.coordinates?.y, lon=m.coordinates?.x
  const county=m.geographies?.Counties?.[0]
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || !['WA','ID'].includes(m.addressComponents?.state) ||
      m.addressComponents.state !== contact.state || m.addressComponents.zip !== contact.zip.slice(0,5) ||
      !m.matchedAddress || !m.addressComponents.city || !county ||
      !['53063','16055'].includes(county.STATE+county.COUNTY)) return null
  return milesFromBuyingCenter(lat,lon) <= SCREENING_AREA.miles ? m : null
}

// This retries only the read-only lookup, before any seller record or alert.
// Keep the original provider, address parts, benchmark and qualification rules.
async function addressMatches(url:string,lookup:typeof fetch):Promise<AddressMatch[]> {
  const started=Date.now(),requestId=randomUUID()
  for(let attempt=1;attempt<=2;attempt++) {
    let stage='request',status:number|null=null
    try {
      const response=await lookup(url,{signal:AbortSignal.timeout(12000),cache:'no-store'})
      stage='http_response';status=response.status
      if(!response.ok){await response.body?.cancel().catch(()=>undefined);throw new Error('Address lookup unavailable')}
      stage='json_response'
      const data=await response.json()
      // A valid no-match response, or a valid match that fails the location
      // rules, must not be retried in search of a different answer.
      if(!Array.isArray(data?.result?.addressMatches) || data.result.addressMatches.some((value:unknown)=>!value || typeof value!=='object' || Array.isArray(value)))throw new Error('Address response unavailable')
      return data.result.addressMatches
    } catch(error) {
      // Never retry a 4xx response, including provider rate limits (429).
      const retry=attempt===1 && (status===null || [500,502,503,504].includes(status) || (status===200 && stage==='json_response'))
      const cause=error instanceof Error ? (error.cause as {code?:unknown}|undefined)?.code : undefined
      const detail={request_id:requestId,attempt,stage,status,elapsed_ms:Date.now()-started,
        code:typeof cause==='string' && /^[A-Z0-9_]{1,40}$/.test(cause)?cause:null,
        timeout:error instanceof Error && ['TimeoutError','AbortError'].includes(error.name)}
      if(!retry){console.error('[SCREENING ADDRESS CHECK FAILED]',detail);throw new Error('Address lookup unavailable')}
      console.warn('[SCREENING ADDRESS LOOKUP RETRY]',detail)
      await new Promise(resolve=>setTimeout(resolve,250))
    }
  }
  throw new Error('Address lookup unavailable')
}

export async function validateScreening(input: ScreeningInput, lookup: typeof fetch = fetch): Promise<ScreeningResult> {
  if (input.screeningVersion !== FLOW_VERSION) return {ok:false,error:'Please refresh this form and try again.',status:409}
  if (!input.screeningAnswers || typeof input.screeningAnswers!=='object' || Array.isArray(input.screeningAnswers) ||
      !input.screeningContact || typeof input.screeningContact!=='object' || Array.isArray(input.screeningContact)) {
    return {ok:false,error:'Please complete the property questions.',status:400}
  }
  const answers=input.screeningAnswers as Record<string,string>
  const gate=evaluate(answers,DEFAULT_ORDER)
  if(gate.kind!=='ready_for_contact') return {ok:false,error:'Please review the property questions before requesting an offer.',status:400}
  const checked=validateContact(input.screeningContact)
  if(!checked.ok) return {ok:false,error:'Please check your contact details and property address.',status:400}
  const contact=checked.value as Contact
  if (Object.values(contact).some(v=>typeof v==='string' && v.length>254) ||
      !/^\d+[A-Za-z-]*\s+\S/.test(contact.street)) return {ok:false,error:'Please enter the full street address, including the house number.',status:400}
  const query=new URLSearchParams({street:contact.street,city:contact.city,state:contact.state,zip:contact.zip.slice(0,5),benchmark:'Public_AR_Current',vintage:'Current_Current',format:'json'})
  let matches: AddressMatch[]
  try {
    matches=await addressMatches(`https://geocoding.geo.census.gov/geocoder/geographies/address?${query}`,lookup)
  } catch {
    return {ok:false,error:'The address check is temporarily unavailable. Please try again, or call 509-822-5460.',status:503}
  }
  const match=matchInsideBuyingArea(matches,contact)
  if(!match) {
    const county=matches[0]?.geographies?.Counties?.[0]
    const outside=matches.length===1 && ((county && !['53063','16055'].includes(county.STATE+county.COUNTY)) ||
      (Number.isFinite(matches[0]?.coordinates?.y) && Number.isFinite(matches[0]?.coordinates?.x) &&
      milesFromBuyingCenter(matches[0].coordinates.y,matches[0].coordinates.x)>SCREENING_AREA.miles))
    return {ok:false,error:outside ? 'This property is outside our current buying area. Please check the address or call 509-822-5460 to discuss it.' :
      'We could not confirm this street address. Please check the house number, city and ZIP, or call 509-822-5460.',status:422}
  }
  const names=contact.name.split(/\s+/), firstName=names.shift() || ''
  const reason=typeof input.reasonDetail==='string' ? input.reasonDetail.trim().slice(0,500) : ''
  const selectedAnswers=Object.fromEntries(gate.route.filter((id:string)=>id!=='contact').map((id:string)=>[id,answers[id]])) as Record<string,string>
  const labels: Record<string,string>={area:'Buying area',property:'Property',land:'Land ownership',connection:'Connection',listing:'Listing',condition:'Condition',reason:'Reason',timeline:'Timing',tradeoff:'Cash-offer tradeoff'}
  const summary=Object.entries(selectedAnswers).map(([id,value])=>{
    const question=QUESTIONS[id as Exclude<keyof typeof QUESTIONS,'contact'>]
    return `${labels[id]}: ${question.options.find((choice:{value:string})=>choice.value===value)?.label ?? value}`
  }).join(' ')
  const fields={
    qualificationVersion:'meta_seller_followup_v2', submissionFlow:'seller_options_v1', metaVariant:'direct',
    firstName,lastName:names.join(' '),phone:contact.phone,email:contact.email,
    address:match.matchedAddress,city:match.addressComponents.city,state:contact.state,zip:match.addressComponents.zip,
    serviceArea:contact.state==='WA'?'spokane_buying_area_wa':'north_idaho_buying_area_id',
    propertyType:answers.property==='manufactured'?'manufactured_with_owned_land':'site_built',
    sellerAuthority:answers.connection==='owner'?'owner':answers.connection==='estate'?'unsure':'helper_tenant_agent',
    listingStatus:answers.listing,offerReadiness:'wants_offer_now',
    priceTradeoff:answers.tradeoff==='yes'?'accepts_below_repaired_retail':'unsure',
    condition:({major:'major_work',some:'repairs_needed',minor:'normal_wear',ready:'move_in_ready'} as Record<string,string>)[answers.condition],
    timeline:({asap:'asap',within_60:'within_60_days',later:'more_than_60_days'} as Record<string,string>)[answers.timeline],
    sellerReason:({estate:'inherited_estate',moving:'relocating',rental:'rental',repairs:'repairs'} as Record<string,string>)[answers.reason] || 'other',
    bestTimeToSpeak:'anytime',contactConsent:true,sms_consent:contact.smsConsent,smsOptIn:contact.smsConsent,
    tcpaConsent:false, source:'meta_website',landingPage:'/sell/property-check',
    message:`Self-reported property answers. ${summary}${answers.connection==='estate'?' Authority to sell has not been verified.':''}${reason ? ' Seller note: '+reason : ''}`,
  }
  return {ok:true,fields,contact,answers:selectedAnswers}
}
