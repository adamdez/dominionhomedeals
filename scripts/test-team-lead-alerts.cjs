const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),crypto=require('node:crypto');
const source=ts.transpileModule(fs.readFileSync('src/server/team-lead-alerts.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const id='2b395461-18ed-47b3-9dca-b81306b52f0e';
function harness({failFirst=false,suppressed=false}={}) {
 const rows=[],calls=[],env={VERCEL_ENV:'production',TEAM_ALERT_SMS_ENABLED:'true',TEAM_ALERT_SMS_ENABLED_AT:'2026-10-25T00:00:00Z',TEAM_ALERT_SMS_ACCOUNT_SID:'AC'+'a'.repeat(32),TEAM_ALERT_SMS_AUTH_TOKEN:'fixture-only',TEAM_ALERT_SMS_SERVICE_SID:'MG'+'b'.repeat(32),TEAM_ALERT_SMS_FROM:'+15095555460',TEAM_ALERT_SMS_RECIPIENTS:JSON.stringify({Adam:'+15095557091',Logan:'+15095555992'})};
 class Q {
  constructor(table){this.table=table;this.filters=[];this.op='select'}
  select(){return this} limit(){return this} eq(k,v){this.filters.push(r=>r[k]===v);return this} in(k,v){this.filters.push(r=>v.includes(r[k]));return this}
  update(v){this.op='update';this.values=v;return this} upsert(v){this.op='upsert';this.values=v;return this}
  single(){return this.run().then(r=>({...r,data:r.data?.[0]||null}))}
  then(a,b){return this.run().then(a,b)}
  async run(){
   if(this.table==='lazarus_message_suppressions')return{data:suppressed?[{id:'stop'}]:[],error:null};
   if(this.op==='upsert'){for(const r of this.values)if(!rows.some(old=>old.submission_id===r.submission_id&&old.recipient===r.recipient))rows.push({...r});return{data:null,error:null};}
   const found=rows.filter(r=>this.filters.every(f=>f(r)));
   if(this.op==='update')found.forEach(r=>Object.assign(r,this.values));
   return{data:found.map(r=>({...r})),error:null};
  }
 }
 const module={exports:{}};
 vm.runInNewContext(source,{module,exports:module.exports,process:{env},Buffer,Date,URL,URLSearchParams,Request,Response,AbortSignal,console,
  require:n=>n==='server-only'?{}:n==='node:crypto'?crypto:n==='@/lib/dominion-supabase'?{getDominionServiceClient:()=>({from:t=>new Q(t)})}:(()=>{throw Error(n)})(),
  fetch:async(url,options)=>{calls.push({url,body:new URLSearchParams(options.body)});if(failFirst&&calls.length===1)throw Error('timeout');return Response.json({sid:'SM'+calls.length.toString(16).padStart(32,'0'),status:'queued'});}
 });
 return{api:module.exports,env,rows,calls,queue:(extra={})=>module.exports.queueTeamLeadAlerts({submissionId:id,receivedAt:'2026-10-25T23:00:00Z',internalQa:false,...extra})};
}
function statusRequest(h,row,status,changes={},signature=true) {
 const fields={AccountSid:h.env.TEAM_ALERT_SMS_ACCOUNT_SID,MessageSid:row.provider_sid||'SM'+'1'.padStart(32,'0'),MessageStatus:status,To:JSON.parse(h.env.TEAM_ALERT_SMS_RECIPIENTS)[row.recipient],From:h.env.TEAM_ALERT_SMS_FROM,...changes};
 const url='https://www.dominionhomedeals.com/api/internal/team-alert-status?alert_id='+row.id;
 const sig=crypto.createHmac('sha1',h.env.TEAM_ALERT_SMS_AUTH_TOKEN).update(url+Object.keys(fields).sort().map(k=>k+fields[k]).join('')).digest('base64');
 return new Request(url,{method:'POST',headers:{'x-twilio-signature':signature?sig:'wrong'},body:new URLSearchParams(fields)});
}
test('disabled and preview deployments never queue or send',async()=>{for(const change of [{TEAM_ALERT_SMS_ENABLED:'false'},{VERCEL_ENV:'preview'}]){const h=harness();Object.assign(h.env,change);assert.equal(await h.queue(),false);assert.equal(h.rows.length,0);}});
test('only the two fixed operator recipients are permitted',()=>{const h=harness();h.env.TEAM_ALERT_SMS_RECIPIENTS=JSON.stringify({Adam:'+15095550000',Logan:'+15095555992'});assert.throws(()=>h.api.teamAlertConfig());});
test('QA and old submissions are suppressed; exact authorized QA exception works',async()=>{const h=harness();assert.equal(await h.queue({internalQa:true}),false);assert.equal(await h.queue({receivedAt:'2026-10-24T00:00:00Z'}),false);h.env.TEAM_ALERT_SMS_TEST_SUBMISSION_ID=id;assert.equal(await h.queue({internalQa:true}),true);assert.equal(h.rows.length,2);assert.ok(h.rows.every(r=>r.is_test));});
test('repeat submissions and concurrent workers send one message per recipient',async()=>{const h=harness();await h.queue();await h.queue();assert.equal(h.rows.length,2);await Promise.all([h.api.dispatchTeamLeadAlerts(id),h.api.dispatchTeamLeadAlerts(id)]);assert.equal(h.calls.length,2);assert.ok(h.rows.every(r=>r.status==='accepted'));assert.equal(new Set(h.calls.map(c=>c.body.get('To'))).size,2);assert.ok(h.calls.every(c=>c.body.get('StatusCallback').includes('alert_id=')));});
test('alerts contain only a protected card link, not seller details or contact enrollment',async()=>{const h=harness();await h.queue();await h.api.dispatchTeamLeadAlerts(id);const body=h.calls[0].body;assert.equal(body.get('Body'),h.api.teamAlertBody(id,false));assert.ok(body.get('Body').includes('lazarus.dominionhomedeals.com/ppc?ppcLeadId=ppc-options-'+id));assert.deepEqual([...body.keys()].sort(),['Body','From','MessagingServiceSid','StatusCallback','To']);});
test('uncertain acceptance remains unknown and is never blindly resent',async()=>{const h=harness({failFirst:true});await h.queue();await h.api.dispatchTeamLeadAlerts(id);assert.equal(h.rows.find(r=>r.recipient==='Adam').status,'unknown');assert.equal(h.rows.find(r=>r.recipient==='Logan').status,'accepted');await h.api.dispatchTeamLeadAlerts(id);assert.equal(h.calls.length,2);});
test('existing STOP suppressions block operator sends',async()=>{const h=harness({suppressed:true});await h.queue();await h.api.dispatchTeamLeadAlerts(id);assert.equal(h.calls.length,0);assert.ok(h.rows.every(r=>r.status==='failed'&&r.error_code==='recipient_suppressed'));});
test('saved inquiries still alert operators when the CRM handoff needs review',async()=>{const h=harness();await h.queue({crmReady:false});await h.api.dispatchTeamLeadAlerts(id);assert.equal(h.calls.length,2);assert.ok(h.calls.every(c=>c.body.get('Body').includes('CRM handoff needs review; check the lead email')));});
test('callbacks require a real signature and matching account and destination',async()=>{const h=harness();await h.queue();await h.api.dispatchTeamLeadAlerts(id);assert.equal(await h.api.receiveTeamAlertStatus(statusRequest(h,h.rows[0],'delivered',{},false)),403);assert.equal(await h.api.receiveTeamAlertStatus(statusRequest(h,h.rows[0],'delivered',{To:'+15095550000'})),403);assert.equal(h.rows[0].status,'accepted');});
test('carrier delivery is separate from acceptance and terminal receipts cannot regress',async()=>{const h=harness();await h.queue();await h.api.dispatchTeamLeadAlerts(id);assert.equal(await h.api.receiveTeamAlertStatus(statusRequest(h,h.rows[0],'delivered')),204);assert.equal(h.rows[0].status,'delivered');await h.api.receiveTeamAlertStatus(statusRequest(h,h.rows[0],'queued'));assert.equal(h.rows[0].status,'delivered');await h.api.receiveTeamAlertStatus(statusRequest(h,h.rows[1],'undelivered',{ErrorCode:'30007'}));assert.equal(h.rows[1].status,'failed');assert.equal(h.rows[1].error_code,'30007');});
