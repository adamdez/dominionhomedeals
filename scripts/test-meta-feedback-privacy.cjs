const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const root=path.resolve(__dirname,'..');
function load(file,mocks={},globals={}){const module={exports:{}};const code=ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
vm.runInNewContext(code,{module,exports:module.exports,Date,URL,URLSearchParams,Request,Response,AbortSignal,Uint8Array,crypto:require('node:crypto').webcrypto,process:{env:{}},
require:n=>{if(n in mocks)return mocks[n];if(n.startsWith('node:'))return require(n);throw Error('Unexpected dependency '+n);},...globals});return module.exports;}
const policy=load('src/lib/meta-measurement-policy.ts');
const context=load('src/server/meta-seller-feedback-context.ts',{'server-only':{},'@/lib/meta-measurement-policy':policy,'@/lib/dominion-supabase':{getDominionServiceClient:()=>null}});
const token='a'.repeat(64),sid='00000000-0000-4000-8000-000000000001';
function permitted(extra={}){return {token,internalQa:false,globalPrivacyControl:false,choice:{consent:true,consentVersion:'meta_measurement_v2',fbp:`fb.1.${Date.now()}.12345`,fbc:`fb.1.${Date.now()}.abcdefghijklmnopqrstuvwxyz012345`,...extra}};}
test('only new explicit consent creates downstream context; private seller information never enters it',()=>{
  const c=context.buildMetaFeedbackContext({...permitted(),email:'PRIVATE',phone:'PRIVATE'});
  assert(c.consent);assert.equal(c.consentVersion,'meta_measurement_v2');assert.equal(c.tokenHash,require('node:crypto').createHash('sha256').update(token).digest('hex'));
  assert(!JSON.stringify(c).includes('PRIVATE'));assert(!JSON.stringify(c).includes(token));
  assert.equal(context.buildMetaFeedbackContext(permitted({consentVersion:'meta_measurement_v1'})),undefined);
  assert.equal(context.buildMetaFeedbackContext(permitted({consent:false})),undefined);
  assert.equal(context.buildMetaFeedbackContext({...permitted(),internalQa:true}),undefined);
  assert.equal(context.buildMetaFeedbackContext({...permitted(),globalPrivacyControl:true}),undefined);
});
test('privacy capability survives a transport retry without becoming another inquiry',()=>{
  const api=load('src/lib/meta-seller-submission.ts');const first=api.prepareMetaSellerSubmission(null,{name:'Example',metaMeasurement:{consent:true}});
  const second=api.prepareMetaSellerSubmission(first,{name:'Example',metaMeasurement:{consent:false}});
  assert.equal(first.submissionId,second.submissionId);assert.equal(first.privacyToken,second.privacyToken);assert.match(first.privacyToken,/^[a-f0-9]{64}$/);
  assert.equal(JSON.parse(second.body).metaMeasurement.consent,false);
});
test('browser revocation updates the saved receipt without sharing any seller details; failure stays retryable',async()=>{
  const storage=new Map(),calls=[];let fail=false;
  const b=load('src/lib/meta-browser-measurement.ts',{'@/lib/meta-measurement-policy':policy,'@/lib/seller-funnel-tracking':{isInternalQaSession:()=>false}},{
    localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},window:{},
    fetch:async(url,o)=>{calls.push({url,body:JSON.parse(o.body)});return Response.json({blocked:!fail},{status:fail?503:200});},
  });
  b.rememberMetaFeedbackReceipt(sid,token,true);
  const result=await b.blockMetaFeedbackMeasurement();assert.equal(result.requestsBlocked,1);assert.equal(storage.get('dominion_meta_opt_out'),'1');
  assert.deepEqual(Object.keys(calls[0].body).sort(),['submissionId','token']);assert.equal(calls[0].url,'/api/meta-measurement/revoke');
  fail=true;await assert.rejects(b.blockMetaFeedbackMeasurement(),/Could not confirm/);
});
test('server revoke endpoint rejects cross-site calls and invalid capabilities before touching storage',async()=>{
  let calls=0;const rpc=async(name,args)=>{calls++;assert.equal(name,'revoke_meta_seller_measurement');assert.notEqual(args.p_token_hash,token);return{data:true,error:null};};
  const api=load('src/app/api/meta-measurement/revoke/route.ts',{'next/server':{NextResponse:{json:Response.json}},'@/lib/dominion-supabase':{getDominionServiceClient:()=>({rpc})},'@/lib/meta-measurement-policy':policy});
  const request=(origin,body)=>new Request('https://www.dominionhomedeals.com/api/meta-measurement/revoke',{method:'POST',headers:{origin},body:JSON.stringify(body)});
  assert.equal((await api.POST(request('https://evil.example',{submissionId:sid,token}))).status,403);
  assert.equal((await api.POST(request('https://www.dominionhomedeals.com',{submissionId:sid,token:'invalid'}))).status,400);assert.equal(calls,0);
  const response=await api.POST(request('https://www.dominionhomedeals.com',{submissionId:sid,token}));assert.equal(response.status,200);assert.equal((await response.json()).blocked,true);assert.equal(calls,1);
});
