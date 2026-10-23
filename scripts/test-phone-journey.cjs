const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
function load(file){const module={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{module,exports:module.exports});return module.exports;}
const {formatSellerPhone:format}=load('src/lib/seller-phone-input.ts');
test('country-code paste and autofill preserve the callback number',()=>{
 for(const value of ['2025550147','(202) 555-0147','+1 (202) 555-0147','1-202-555-0147']) assert.equal(format(value),'(202) 555-0147');
 // Reproduce the deployed defect rather than assuming an observed lead was affected.
 const old='+1 (202) 555-0147'.replace(/\D/g,'').slice(0,10);
 assert.equal(old,'1202555014');assert.notEqual(format(old),format('+1 (202) 555-0147'));
});
test('partial input, editing, and a typed North American prefix remain usable',()=>{
 assert.equal(format(''),'');assert.equal(format('202'),'(202');assert.equal(format('2025'),'(202) 5');
 let value='';for(const d of '12025550147')value=format(value+d);assert.equal(value,'(202) 555-0147');
 assert.equal(format('(202) 555-014'),'(202) 555-014');
});
const landing=load('src/lib/meta-seller-landing.ts');
test('mid-project message is bounded and preserves direct and move-after routing',()=>{
 assert.equal(landing.usesMidProjectMessage({message:'mid_project'},'direct'),true);
 assert.equal(landing.usesMidProjectMessage({message:'mid_project'},'estate'),false);
 assert.equal(landing.usesMidProjectMessage({message:['mid_project']},'direct'),false);
 assert.equal(landing.usesMidProjectMessage({message:'<script>x</script>'},'direct'),false);
 assert.equal(landing.usesMoveAfterMessage({message:'move_after'},'direct'),true);
 assert.equal(landing.resolveMetaSellerVariant({variant:'direct'}),'direct');
 assert.equal(landing.META_MID_PROJECT_COPY.headline,'Sell your house mid-remodel.');
});
