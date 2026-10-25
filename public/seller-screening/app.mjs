import {privacyBlocked,measurementChoice,rememberReceipt,openMeasuredReceipt} from './measurement.mjs';
import {FLOW_VERSION,QUESTIONS,STOPS,DEFAULT_ORDER,routeFor,evaluate,applyAnswer,canVisit,moveQuestion,validateContact,crmAdmission} from './flow.mjs';

let receipt=null,attempt=null,measurementConsent=false,submitting=false;
const query=new URLSearchParams(location.search);
const qa=query.get('internal_qa')==='1';
const attribution=Object.fromEntries(['utm_source','utm_medium','utm_campaign','utm_content','utm_term','campaign_id','adset_id','ad_id','creative_id'].map(k=>[k,query.get(k)||'']).filter(([,v])=>v&&v.length<=500));
const visitId=crypto.randomUUID();
const screen=document.getElementById('screen');
const back=document.getElementById('back');
const progressWrap=document.getElementById('progress-wrap');
const progress=document.getElementById('progress');
const progressFill=document.getElementById('progress-fill');
const stepLabel=document.getElementById('step-label');
const stepCount=document.getElementById('step-count');
const reviewPanel=document.getElementById('review-panel');
const reviewToggle=document.getElementById('review-toggle');
const orderList=document.getElementById('order-list');
const labels={area:'Map and service area',property:'Property type',connection:'Connection to the property',listing:'Listing status',condition:'Property condition',reason:'Reason for selling',timeline:'Timing',tradeoff:'Cash-offer tradeoff',contact:'Contact details'};
let answers={},contact={},reasonDetail='',order=[...DEFAULT_ORDER],current='area',reasonSelection='';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const byId=id=>document.getElementById(id);

function saveHistory(id,replace=false){
  history[replace?'replaceState':'pushState']({step:id},'',`#${id}`);
}
function focusScreen(){
  const heading=byId('question-title');
  if(heading){heading.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});}
}
function reset(replace=false){answers={};contact={};reasonDetail='';reasonSelection='';receipt=null;attempt=null;measurementConsent=false;show('area',{replace});}
function show(id,{replace=false,fromHistory=false}={}){
  const gate=evaluate(answers,order);
  if(id==='not-a-fit' && gate.kind!=='rejected') id=gate.step;
  else if(id==='complete' && !receipt) id=gate.step;
  else if(!['complete','not-a-fit'].includes(id)&&!canVisit(id,answers,order)) id=gate.step;
  current=id;
  if(!fromHistory) saveHistory(id,replace);
  else if(history.state?.step!==id || location.hash!==`#${id}`) saveHistory(id,true);
  progressWrap.hidden=['complete','not-a-fit'].includes(id);
  const route=routeFor(answers,order),at=route.indexOf(id);
  back.hidden=id==='area'||id==='complete';
  if(at>=0){
    stepLabel.textContent=QUESTIONS[id].category;
    stepCount.textContent=`${at+1} of ${route.length}`;
    const percent=Math.round(at/(route.length-1)*100);
    progress.setAttribute('aria-valuenow',String(percent));
    progress.setAttribute('aria-valuetext',`Question ${at+1} of ${route.length}`);
    progressFill.style.width=`${percent}%`;
  }
  if(id==='not-a-fit') renderStop(gate);
  else if(id==='complete') renderComplete();
  else if(id==='contact') renderContact();
  else renderQuestion(id);
  document.title=`${id==='not-a-fit'?'Your selling options':id==='complete'?'Request received':QUESTIONS[id].category} | Dominion Homes`;
  focusScreen();
}
function renderQuestion(id){
  const q=QUESTIONS[id],selected=id==='reason'?(reasonSelection||answers[id]):answers[id];
  screen.innerHTML=`<h1 id="question-title" class="focus-heading" tabindex="-1">${esc(q.title)}</h1>${q.intro?`<p class="intro">${esc(q.intro)}</p>`:''}
  ${q.map?`<div class="map-frame"><img src="/seller-screening/assets/service-area-reference.png" width="1005" height="1566" alt="Red-circle service-area reference covering Spokane, Airway Heights, Cheney, Deer Park, Post Falls and Coeur d'Alene. Athol, Newport and Sandpoint are outside."></div><p class="map-caption">Spokane County and nearby Kootenai County. The map is a guide; we also check the property address.</p>`:''}
  <form id="question-form"><fieldset aria-labelledby="question-title"><legend class="sr-only">Choose one answer</legend><div class="choice-list ${q.map?'area-choices':''}">${q.options.map(o=>{
    let label=o.label,detail=o.detail;
    if(q.map){label=o.value==='inside'?'Yes':'No';detail=o.value==='inside'?'The property is inside.':'The property is outside.';}
    return `<label class="choice"><input type="radio" name="answer" value="${o.value}" ${selected===o.value?'checked':''}><span class="choice-mark" aria-hidden="true"></span><span><span class="choice-label">${esc(label)}</span>${detail?`<span class="choice-detail">${esc(detail)}</span>`:''}</span><span class="choice-arrow" aria-hidden="true">›</span></label>`;
  }).join('')}</div></fieldset>
  ${q.optionalDetail?`<label class="field reason-detail" for="reason-detail">Anything else you'd like us to know? <span class="optional">Optional</span><textarea id="reason-detail" name="detail" maxlength="1000">${esc(reasonDetail)}</textarea></label>`:''}
  <div class="question-actions"><button id="continue" class="primary-button" type="submit" ${selected?'':'disabled'}>Continue <span aria-hidden="true">→</span></button></div></form>`;
  const form=byId('question-form');
  let submitted=false;
  form.addEventListener('change',()=>{byId('continue').disabled=!form.elements.answer.value;});
  byId('reason-detail')?.addEventListener('input',e=>{reasonDetail=e.target.value;});
  form.addEventListener('submit',event=>{
    event.preventDefault();
    if(submitted) return;
    const value=form.elements.answer.value;
    if(!value) return;
    submitted=true;
    const changed=answers[id]!==value;
    answers=applyAnswer(answers,id,value,order);
    if(changed){contact={};if(id!=='reason'){reasonSelection='';if(!answers.reason)reasonDetail='';}}
    if(id==='reason')reasonSelection=value;
    const gate=evaluate(answers,order);
    if(gate.kind==='rejected')show('not-a-fit');
    else{
      const route=routeFor(answers,order);show(route[route.indexOf(id)+1]);
    }
  });
}
function renderStop(gate){
  const stop=STOPS[gate.reason];
  screen.innerHTML=`<section class="outcome"><p class="outcome-kicker">Your selling options</p><h1 id="question-title" class="focus-heading" tabindex="-1">${esc(stop.title)}</h1><p class="intro">${esc(stop.body)}</p><p><a href="tel:5098225460">Call 509-822-5460</a> if you would like to discuss the property.</p><div class="outcome-actions"><button type="button" class="primary-button" id="change-answer">Change my answer</button><button type="button" class="secondary-button" id="restart">Start again</button></div><p class="outcome-note">Your contact details have not been requested or sent.</p></section>`;
  byId('change-answer').addEventListener('click',()=>{if(history.state?.step==='not-a-fit')history.back();else show(gate.step,{replace:true});});
  byId('restart').addEventListener('click',()=>reset());
}
function field(id,label,options={}){
  const error=options.error;const tag=options.select?'select':'input';
  const attrs=`id="${id}" name="${id}" ${error?`aria-invalid="true" aria-describedby="${id}-error"`:''}`;
  let control;
  if(tag==='select')control=`<select ${attrs} autocomplete="off"><option value="">Choose state</option>${[['WA','Washington'],['ID','Idaho']].map(([v,l])=>`<option value="${v}" ${contact[id]===v?'selected':''}>${l}</option>`).join('')}</select>`;
  else control=`<input ${attrs} type="${options.type||'text'}" value="${esc(contact[id])}" autocomplete="${options.autocomplete||'off'}" ${options.inputmode?`inputmode="${options.inputmode}"`:''} maxlength="${options.max||120}" ${options.placeholder?`placeholder="${esc(options.placeholder)}"`:''}>`;
  return `<label class="field ${options.full?'full':''}" for="${id}">${label}${control}${error?`<span class="form-error" id="${id}-error">${esc(error)}</span>`:''}</label>`;
}
function readContact(form){
  const data=new FormData(form);return Object.fromEntries(['name','phone','street','city','state','zip','email'].map(k=>[k,String(data.get(k)||'')]).concat([['contactConsent',data.has('contactConsent')],['smsConsent',data.has('smsConsent')]]));
}
function renderContact(errors={}){
  const q=QUESTIONS.contact;
  screen.innerHTML=`<h1 id="question-title" class="focus-heading" tabindex="-1">${esc(q.title)}</h1><p class="intro">${esc(q.intro)}</p>${Object.keys(errors).length?'<p class="error-summary" role="alert">Please check the highlighted fields.</p>':''}
  <form id="contact-form" novalidate><div class="fields">
  ${field('name','Your name',{full:true,error:errors.name,autocomplete:'name'})}
  ${field('phone','Callback phone',{type:'tel',inputmode:'tel',error:errors.phone,max:25,autocomplete:'tel'})}
  ${field('email','Email <span class="optional">Optional</span>',{type:'email',error:errors.email,max:254,autocomplete:'email'})}
  ${field('street','Property street address',{full:true,error:errors.street})}
  ${field('city','Property city',{error:errors.city})}
  ${field('state','Property state',{select:true,error:errors.state})}
  ${field('zip','Property ZIP code',{inputmode:'numeric',max:10,error:errors.zip})}
  </div><label class="consent"><input type="checkbox" id="contactConsent" name="contactConsent" ${contact.contactConsent?'checked':''} ${errors.contactConsent?'aria-invalid="true" aria-describedby="contactConsent-error"':''}><span>I want Dominion Homes to contact me by phone or email about this property and possible sale.</span></label>
  ${errors.contactConsent?`<p class="form-error" id="contactConsent-error">${esc(errors.contactConsent)}</p>`:''}
  <label class="consent"><input type="checkbox" id="smsConsent" name="smsConsent" ${contact.smsConsent?'checked':''}><span>I agree to receive recurring marketing and informational text messages from Dominion Homes, operated by Dominion Group LLC, about my property inquiry, including cash offer follow-ups, appointment scheduling, and transaction status updates, at the phone number provided. Messages may be sent using automated technology. Consent is not required to receive an offer. Message frequency varies, up to 10 msgs/month. Message and data rates may apply. Reply STOP to opt out or HELP for help. We do not sell, rent, or share mobile information or SMS opt-in consent with third parties or affiliates for marketing or promotional purposes. <span class="optional">Optional</span></span></label>
  <label class="consent"><input type="checkbox" id="measurementConsent" ${measurementConsent&&!privacyBlocked()?'checked':''} ${privacyBlocked()?'disabled':''}><span>Optional. Allow Meta to measure this request and later steps such as a seller conversation or completed sale. We use browser and device information. Your contact details and property answers are not shared with Meta. This does not affect your offer request. <a href="/privacy#meta-measurement">How measurement works</a>. ${privacyBlocked()?'Your browser privacy choice blocks this measurement.':''}</span></label><label class="trap" aria-hidden="true">Leave blank<input name="honeypot" tabindex="-1" autocomplete="off"></label><p class="privacy-copy">Text updates and ad measurement are optional. <a href="/privacy#sms-terms">Privacy Policy</a> · <a href="/terms">Terms</a></p><p id="submit-error" class="form-error" role="alert"></p>
  <button class="primary-button submit" type="submit">Request my cash offer</button></form>`;
  const form=byId('contact-form');
  form.addEventListener('input',()=>{contact=readContact(form);});
  form.addEventListener('change',()=>{contact=readContact(form);});
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    if(submitting)return;
    const gate=evaluate(answers,order);
    if(gate.kind!=='ready_for_contact'){show(gate.kind==='rejected'?'not-a-fit':gate.step);return;}
    const result=validateContact(readContact(form));contact=result.value;
    if(!result.ok){renderContact(result.errors);byId('contact-form').querySelector('[aria-invalid="true"]')?.focus();return;}
    measurementConsent=byId('measurementConsent').checked;
    const now=new Date().toISOString();
    const input={screeningVersion:FLOW_VERSION,screeningAnswers:answers,screeningContact:contact,reasonDetail,
      submissionFlow:'seller_options_v1',funnelVisitId:visitId,internalQa:qa,
      landingPage:location.pathname,adAttribution:attribution,
      utmSource:attribution.utm_source||'',utmMedium:attribution.utm_medium||'',utmCampaign:attribution.utm_campaign||'',utmContent:attribution.utm_content||'dh_screening_v1',
      honeypot:form.elements.honeypot.value,metaMeasurement:measurementChoice(measurementConsent,qa),
      sms_consent_timestamp:contact.smsConsent?now:null,smsOptInTimestamp:contact.smsConsent?now:null};
    const identity={...input};delete identity.metaMeasurement;delete identity.sms_consent_timestamp;delete identity.smsOptInTimestamp;
    const fingerprint=JSON.stringify(identity);
    if(!attempt||attempt.fingerprint!==fingerprint){const bytes=crypto.getRandomValues(new Uint8Array(32));attempt={fingerprint,submissionId:crypto.randomUUID(),privacyToken:Array.from(bytes,v=>v.toString(16).padStart(2,'0')).join('')};}
    const payload={...input,submissionId:attempt.submissionId,metaPrivacyToken:attempt.privacyToken};
    const button=form.querySelector('[type=submit]');submitting=true;button.disabled=true;back.disabled=true;button.textContent='Checking your property and sending…';byId('submit-error').textContent='';
    try{
      const response=await fetch('/api/leads',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      const data=await response.json();
      if(!response.ok||data.accepted!==true||data.controlRecorded!==true||!data.receiptId){byId('submit-error').textContent=data.error||'We could not confirm receipt. Please retry or call 509-822-5460.';return;}
      receipt=data;rememberReceipt(attempt.submissionId,attempt.privacyToken,measurementConsent);show('complete');openMeasuredReceipt(data,measurementConsent,qa);
    }catch{byId('submit-error').textContent='We could not confirm receipt. Please retry or call 509-822-5460.';}
    finally{submitting=false;back.disabled=false;button.disabled=false;button.textContent='Request my cash offer';}
  });
}
function renderComplete(){
  if(!receipt)return;
  screen.innerHTML=`<section class="outcome" role="status"><p class="outcome-kicker">Property inquiry received</p><h1 id="question-title" class="focus-heading" tabindex="-1">Dominion has your property details.</h1><p class="intro">${receipt.duplicate?'This request was already recorded.':'Your request was recorded.'} A team member will review it and contact you. This receipt is not a property offer or a promise to buy.</p><p>Reference: ${esc(receipt.receiptId)}</p><a class="primary-button" href="tel:5098225460">Call 509-822-5460</a></section>`;
}
function renderOrder(){
  orderList.innerHTML=order.map((id,index)=>`<li><span class="order-main"><span class="order-number">${index+1}.</span><span>${esc(labels[id])}${id==='property'?'<span class="order-sub">Manufactured → land question → continue or stop</span>':''}${id==='area'||id==='contact'?'<span class="order-sub">Position fixed</span>':''}</span></span><span class="order-actions"><button type="button" data-move="${id}" data-direction="-1" aria-label="Move ${esc(labels[id])} up" ${index<=1||index===order.length-1?'disabled':''}>↑</button><button type="button" data-move="${id}" data-direction="1" aria-label="Move ${esc(labels[id])} down" ${index===0||index>=order.length-2?'disabled':''}>↓</button></span></li>`).join('');
  orderList.querySelectorAll('[data-move]').forEach(button=>button.addEventListener('click',()=>{
    order=moveQuestion(order,button.dataset.move,Number(button.dataset.direction));renderOrder();reset(true);
    const newButton=orderList.querySelector(`[data-move="${button.dataset.move}"][data-direction="${button.dataset.direction}"]`);
    (newButton?.disabled?orderList.querySelector(`[data-move="${button.dataset.move}"]:not(:disabled)`):newButton)?.focus();
    byId('order-announcement').textContent=`${labels[button.dataset.move]} moved to position ${order.indexOf(button.dataset.move)+1}. The preview restarted.`;
  }));
}
function setReview(open){reviewPanel.hidden=!open;reviewToggle.setAttribute('aria-expanded',String(open));reviewToggle.textContent=open?'Close page review':'Review page order';if(open)renderOrder();}
reviewToggle.addEventListener('click',()=>setReview(reviewPanel.hidden));
byId('restore-order').addEventListener('click',()=>{order=[...DEFAULT_ORDER];renderOrder();reset(true);byId('order-announcement').textContent='Original order restored. The preview restarted.';byId('restore-order').focus();});
back.addEventListener('click',()=>{
  if(current==='contact'&&byId('contact-form'))contact=readContact(byId('contact-form'));
  if(submitting)return;
  const gate=evaluate(answers,order);
  if(history.state?.step===current){history.back();return;}
  if(current==='not-a-fit'){show(gate.step,{replace:true});return;}
  const route=routeFor(answers,order),at=route.indexOf(current);if(at>0)show(route[at-1],{replace:true});
});
window.addEventListener('popstate',event=>show(event.state?.step||'area',{fromHistory:true}));
// Deliberately ignore incoming deep links on reload: there are no saved answers.
renderOrder();show('area',{replace:true});
