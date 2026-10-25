// Same permission version, safe receipt path and privacy controls as the existing form.
export const CONSENT_VERSION='meta_measurement_v2';
export function privacyBlocked(){
  try{return navigator.globalPrivacyControl===true || navigator.doNotTrack==='1' || localStorage.getItem('dominion_meta_opt_out')==='1';}catch{return true;}
}
function cookie(name){
  const raw=document.cookie.split(';').map(x=>x.trim()).find(x=>x.startsWith(name+'='))?.slice(name.length+1);
  return typeof raw==='string'&&/^fb\.[012]\.\d{13}\.[A-Za-z0-9_-]{1,500}$/.test(raw)?raw:undefined;
}
export function measurementChoice(consent,qa){
  const blocked=privacyBlocked(), result={consent:consent===true,consentVersion:CONSENT_VERSION,optedOut:blocked,globalPrivacyControl:navigator.globalPrivacyControl===true};
  if(!consent||blocked||qa||!['www.dominionhomedeals.com','dominionhomedeals.com'].includes(location.hostname))return result;
  const fbp=cookie('_fbp'),clicks=new URLSearchParams(location.search).getAll('fbclid');
  let fbc=cookie('_fbc');
  if(clicks.length===1&&/^[A-Za-z0-9_-]{20,500}$/.test(clicks[0]))fbc=`fb.1.${Date.now()}.${clicks[0]}`;
  if(fbp)result.fbp=fbp;if(fbc)result.fbc=fbc;return result;
}
export function rememberReceipt(submissionId,token,allowed){
  if(!allowed||privacyBlocked())return;
  try{
    const saved=JSON.parse(localStorage.getItem('dominion_meta_feedback_privacy')||'[]');
    const current=Array.isArray(saved)?saved.filter(v=>v.expiresAt>Date.now()&&v.submissionId!==submissionId):[];
    localStorage.setItem('dominion_meta_feedback_privacy',JSON.stringify([...current,{submissionId,token,expiresAt:Date.now()+90*86400000}]));
  }catch{}
}
export function openMeasuredReceipt(data,consent,qa){
  if(!consent||privacyBlocked()||qa||data.duplicate||data.metaBrowserEligible!==true||!/^dh_lead_[0-9a-f-]{36}$/.test(data.metaEventId||''))return;
  try{
    sessionStorage.setItem('dominion_meta_accepted_event',JSON.stringify({eventId:data.metaEventId,consent:true,consentVersion:CONSENT_VERSION,expiresAt:Date.now()+300000}));
    const link=document.createElement('a');link.href='/sell/offer-check/received';link.referrerPolicy='no-referrer';link.rel='noreferrer';document.body.appendChild(link);link.click();link.remove();
  }catch{}
}
