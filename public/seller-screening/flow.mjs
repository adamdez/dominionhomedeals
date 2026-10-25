// The approved questions are separate from their order and their presentation.
export const FLOW_VERSION = 'dominion-screening-live-v1';
export const DEFAULT_ORDER = Object.freeze(['area','property','connection','listing','condition','reason','timeline','tradeoff','contact']);
const option = (value, label, detail, stop) => ({ value, label, detail, ...(stop ? { stop } : {}) });
export const QUESTIONS = Object.freeze({
  area: { title:'Is the property you want to sell inside this red circle?', category:'Where we buy', intro:'Check the location of the property you want to sell.', map:true, options:[
    option('inside','Yes. It is inside the circle.','',null),
    option('outside','No. It is outside the circle.','', 'area')
  ]},
  property: { title:'What type of property are you looking to sell?', category:'Your property', options:[
    option('house','House','A single-family home.'),
    option('multi','Duplex or multi-unit','A residential property with more than one unit.'),
    option('condo','Condo or townhome',''),
    option('manufactured','Mobile or manufactured home','We will ask one more question about the land.'),
    option('other','Land, commercial property, RV or other','', 'property')
  ]},
  land: { title:'Do you own the land the home sits on?', category:'Manufactured homes', intro:'This question applies to mobile and manufactured homes.', parent:'property', options:[
    option('owned','Yes. I own the land.',''),
    option('rented','No. I rent the lot.','', 'land')
  ]},
  connection: { title:"What's your connection to the property?", category:'Your connection', options:[
    option('owner','I own or co-own it.',''),
    option('estate',"I'm handling the sale for an estate or family member.",''),
    option('helper',"I'm helping the owner.",'The owner will take part in the decision.'),
    option('uninvolved',"I rent it or I'm not involved in selling it.",'', 'connection')
  ]},
  listing: { title:'Is the property currently listed for sale with a real estate agent?', category:'Selling your property', options:[
    option('not_listed','No. It is not listed.',''),
    option('expired','It was listed but the listing has ended.',''),
    option('listed','Yes. It is listed now.','', 'listing')
  ]},
  condition: { title:'What condition is the property in?', category:'Your property', intro:'Homes in any of these conditions can continue.', options:[
    option('major','Needs major repairs',''),
    option('some','Needs some repairs',''),
    option('minor','Needs minor updates',''),
    option('ready','Move-in ready','')
  ]},
  reason: { title:"What's the main reason you're considering selling?", category:'Your plans', optionalDetail:true, options:[
    option('estate','Inherited property or estate',''), option('moving','Moving',''),
    option('rental','Rental property',''), option('repairs','Repairs',''),
    option('plans','Changing plans',''), option('deadline','Tax or mortgage deadline',''), option('another','Another reason','')
  ]},
  timeline: { title:'When would you like to sell?', category:'Your timing', options:[
    option('asap','As soon as possible.',''),
    option('within_60','Within the next 60 days.',''),
    option('later','More than 60 days from now.','We can discuss your plans and timing.'),
    option('browsing',"I'm only browsing and don't plan to sell.",'', 'browsing')
  ]},
  tradeoff: { title:'Would you consider a cash offer below full market value?', category:'Your selling options', intro:'In exchange for selling as-is without repairs or showings.', options:[
    option('yes','Yes. I would consider it.',''),
    option('possibly',"Possibly. I'd like to compare a cash offer with listing.",''),
    option('retail','No. I only want full market value.','', 'tradeoff')
  ]},
  contact: { title:'Where can we reach you about the property?', category:'Last step', intro:"We'll review the property and discuss whether an offer makes sense." }
});
export const STOPS = Object.freeze({
  area:{title:"We aren't buying in that area right now.",body:"Thanks for checking. This buying program covers properties inside the red circle."},
  property:{title:"This property doesn't fit this homes program.",body:'This request form is for houses, residential units and manufactured homes with owned land.'},
  land:{title:'This program is for homes with owned land.',body:"We aren't buying manufactured homes on rented lots through this form."},
  connection:{title:'The owner needs to be part of the sale.',body:'This form is for owners and people helping an owner or estate consider a sale.'},
  listing:{title:"This form is for homes that aren't currently listed.",body:"You're welcome to return if the listing ends and you still want to consider a direct cash offer."},
  timeline:{title:"Let's revisit this when the timing fits.",body:"This form is for owners considering a sale within the next 60 days. You're welcome to come back when you're ready."},
  browsing:{title:'Thanks for taking a look.',body:"If you decide you'd like to sell within the next 60 days, you're welcome to come back."},
  tradeoff:{title:'A direct cash sale may not fit your plans.',body:'Listing with an agent may be worth exploring if your priority is full market value.'}
});
export const FOLLOW_UPS = Object.freeze([{id:'land',parent:'property',answer:'manufactured'}]);
export function normalizeOrder(order=DEFAULT_ORDER) {
  if (!Array.isArray(order) || order.length !== DEFAULT_ORDER.length || new Set(order).size !== order.length ||
      order[0] !== 'area' || order.at(-1) !== 'contact' || order.some(id => !DEFAULT_ORDER.includes(id))) throw new Error('Invalid question order. Keep the map first and contact last.');
  return [...order];
}
export function routeFor(answers={},order=DEFAULT_ORDER) {
  return normalizeOrder(order).flatMap(id=>[id,...FOLLOW_UPS.filter(child=>child.parent===id && answers[id]===child.answer).map(child=>child.id)]);
}
export function evaluate(answers={},order=DEFAULT_ORDER) {
  const route=routeFor(answers,order);
  for (const id of route) {
    if (id==='contact') return {kind:'ready_for_contact',step:id,route};
    const choice=QUESTIONS[id].options.find(o=>o.value===answers[id]);
    if (!choice) return {kind:'incomplete',step:id,route};
    if (choice.stop) return {kind:'rejected',step:id,reason:choice.stop,route};
  }
  throw new Error('A valid route must end in contact.');
}
export function applyAnswer(answers,id,value,order=DEFAULT_ORDER) {
  if (!QUESTIONS[id]?.options?.some(o=>o.value===value)) throw new Error('Unknown question or answer.');
  const before=routeFor(answers,order);
  if (!before.includes(id)) throw new Error('This question does not apply to the current route.');
  const gate=evaluate(answers,order);
  if (before.indexOf(id)>before.indexOf(gate.step)) throw new Error('Earlier questions must be answered first.');
  const next={...answers};
  if (next[id]!==value) for (const downstream of before.slice(before.indexOf(id)+1)) delete next[downstream];
  next[id]=value;
  if (next.property!=='manufactured') delete next.land;
  return next;
}
export function canVisit(id,answers,order=DEFAULT_ORDER) {
  const gate=evaluate(answers,order), route=gate.route;
  return route.includes(id) && route.indexOf(id)<=route.indexOf(gate.step);
}
export function moveQuestion(order,id,direction) {
  const next=normalizeOrder(order),at=next.indexOf(id),to=at+direction;
  if (![-1,1].includes(direction) || at<=0 || at>=next.length-1 || to<=0 || to>=next.length-1) return next;
  [next[at],next[to]]=[next[to],next[at]]; return next;
}
export function validateContact(raw={}) {
  const clean=v=>typeof v==='string'?v.trim():'';
  const value={name:clean(raw.name),phone:clean(raw.phone),street:clean(raw.street),city:clean(raw.city),state:clean(raw.state),zip:clean(raw.zip),email:clean(raw.email),contactConsent:raw.contactConsent===true,smsConsent:raw.smsConsent===true};
  const errors={};
  if (value.name.length<2) errors.name='Enter your name.';
  const digits=value.phone.replace(/\D/g,'');
  if (!/^(?:1)?[2-9]\d{2}[2-9]\d{6}$/.test(digits)) errors.phone='Enter a 10-digit US callback number.';
  if (value.street.length<5) errors.street='Enter the property street address.';
  if (!value.city) errors.city='Enter the property city.';
  if (!['WA','ID'].includes(value.state)) errors.state='Choose Washington or Idaho.';
  if (!/^\d{5}(?:-\d{4})?$/.test(value.zip)) errors.zip='Enter a valid ZIP code.';
  if (value.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email)) errors.email='Enter a valid email or leave it blank.';
  if (!value.contactConsent) errors.contactConsent='Confirm we may contact you about this request.';
  return {ok:Object.keys(errors).length===0,value,errors};
}
// This reusable check fails closed until an address service supplies a verified result.
// The UI preview deliberately never supplies that result and never calls a CRM.
export function addressKey(contact={}) {
  return ['street','city','state','zip'].map(k=>String(contact[k]??'').trim().toLowerCase().replace(/[^a-z0-9]/g,'')).join('|');
}
export function crmAdmission(answers,contact,boundary={status:'not_configured'},order=DEFAULT_ORDER) {
  let gate;
  try{gate=evaluate(answers,order);}catch{return {accepted:false,reason:'invalid_order'};}
  if (gate.kind!=='ready_for_contact') return {accepted:false,reason:gate.kind==='rejected'?gate.reason:'incomplete'};
  const result=validateContact(contact);
  if (!result.ok) return {accepted:false,reason:'contact_incomplete'};
  if (boundary?.status!=='verified_inside' || boundary.addressKey!==addressKey(result.value)) return {accepted:false,reason:'address_not_verified_inside'};
  return {accepted:true,reason:'screened',payload:{flowVersion:FLOW_VERSION,order:normalizeOrder(order),answers:Object.fromEntries(gate.route.filter(id=>id!=='contact').map(id=>[id,answers[id]])),contact:result.value}};
}
