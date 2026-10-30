// Actual browser modules with isolated missing-feature contexts. No network.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';
import {secureUuid} from '../public/seller-screening/flow.mjs';
const folder=new URL('../public/seller-screening/',import.meta.url);

test('secure request identifiers work with random bytes when native randomUUID is absent',()=>{
  const legacy={getRandomValues:bytes=>webcrypto.getRandomValues(bytes)};
  const ids=Array.from({length:100},()=>secureUuid(legacy));
  assert.equal(new Set(ids).size,ids.length);
  for(const id of ids)assert.match(id,/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.throws(()=>secureUuid({}),/Secure request identifiers/);
});

async function browserStart(random){
  const elements=new Map();
  const html=fs.readFileSync(new URL('index.html',folder),'utf8');
  const fallback=html.match(/<div id="screen">([\s\S]*?)<\/section><\/div>/)[1]+'</section>';
  function element(id){
    if(!elements.has(id))elements.set(id,{innerHTML:id==='screen'?fallback:'',hidden:false,style:{},focus(){},setAttribute(){},addEventListener(){},querySelectorAll(){return[];}});
    return elements.get(id);
  }
  const history={state:null,replaceState(state){this.state=state;},pushState(state){this.state=state;}};
  const context=vm.createContext({URLSearchParams,location:{search:'',hash:''},crypto:random,history,
    document:{getElementById:element,addEventListener(){}},window:{addEventListener(){},scrollTo(){}}});
  vm.runInContext('Array.prototype.at=undefined',context);
  const modules=new Map(['app.mjs','flow.mjs','measurement.mjs','progress.mjs'].map(name=>[name,new vm.SourceTextModule(fs.readFileSync(new URL(name,folder),'utf8'),{context,identifier:name})]));
  await modules.get('app.mjs').link(name=>modules.get(name.replace('./','').split('?')[0]));
  await modules.get('app.mjs').evaluate();
  return elements;
}
test('the actual question page starts without randomUUID, Array.at or CSS has support',async()=>{
  const elements=await browserStart({getRandomValues:bytes=>webcrypto.getRandomValues(bytes)});
  assert.match(elements.get('screen').innerHTML,/Is the property inside this red circle/);
  const css=fs.readFileSync(new URL('styles.css',folder),'utf8');assert.equal(css.includes(':has('),false);
  assert.match(css,/\.map-frame::before\{[^}]*padding-top:75\.780089%/);
});
test('without secure random bytes the static phone option stays visible and no question screen starts',async()=>{
  const elements=await browserStart({});
  assert.match(elements.get('screen').innerHTML,/tel:5098225460/);
  assert.equal(elements.get('progress-wrap').hidden,true);
  assert.doesNotMatch(elements.get('screen').innerHTML,/id="question-form"/);
});
