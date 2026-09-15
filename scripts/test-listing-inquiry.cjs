const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
const path = require('node:path')
const calls = []
const integrations = []
const route = fs.readFileSync(path.join(__dirname, '../src/app/api/leads/route.ts'), 'utf8')
const code = ts.transpileModule(route, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
const exportsObject = {}
const stubs = {
  '@/lib/constants': { SITE: { phone: '5095550100' } },
  '@/lib/dominion-leads': { DOMINION_OPTIONS_FLOW: 'seller_options_v1', recordDominionLeadSubmission: async input => { integrations.push(['receipt', input]); return { id: 'receipt-test' } } },
  '@/lib/mailchimp': { syncSellerLeadToMailchimp: async () => integrations.push(['mailchimp']) },
}
vm.runInNewContext(code, {
  exports: exportsObject,
  require: id => id.startsWith('@/') ? stubs[id] || {} : require(id),
  process: { env: { RESEND_API_KEY: 'test-key', LEAD_SMS_RECIPIENTS: 'team-one@example.invalid,team-two@example.invalid', SENTINEL_INTAKE_URL: 'https://sentinel.example.invalid', SENTINEL_INTAKE_SECRET: 'test', LAZARUS_INTAKE_URL: 'https://lazarus.example.invalid', LAZARUS_INTAKE_CREATE_LEAD_KEY: 'test' } },
  fetch: async (url, options) => { calls.push({ url, body: JSON.parse(options.body) }); return new Response(JSON.stringify({ id: 'mail-test' }), { status: 200 }) },
  console: { log() {}, error() {} }, URL, URLSearchParams, Response, Request, setTimeout, clearTimeout, AbortController, Buffer, Date,
})
async function run() {
  const payload = { firstName: 'Taylor', lastName: 'Buyer', phone: '5095550142', email: 'buyer@example.invalid', address: '6722 S Plymouth Rd', city: 'Spokane', state: 'WA', zip: '99224', condition: 'Listing inquiry', timeline: 'Listing inquiry', tcpaConsent: true, smsOptIn: false, source: 'off-market-6722-s-plymouth-rd', landingPage: '/off-market/6722-s-plymouth-rd', message: 'Can I view it Friday?' }
  const response = await exportsObject.POST(new Request('http://localhost/api/leads', { method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': '127.0.0.10' }, body: JSON.stringify(payload) }))
  assert.equal(response.status, 200, JSON.stringify(await response.json()))
  assert.equal(calls.length, 3, 'one team email and two internal text gateways')
  const teamEmail = calls.find(call => call.body.html)
  assert.deepEqual(Array.from(teamEmail.body.to), ['adam@dominionhomedeals.com','logan@dominionhomedeals.com','leads@dominionhomedeals.com'])
  assert.match(teamEmail.body.subject, /New buyer inquiry/)
  assert.match(teamEmail.body.html, /Can I view it Friday\?/)
  for (const call of calls.filter(call => call.body.text)) assert.match(call.body.text, /NEW BUYER INQUIRY/)
  assert.deepEqual(integrations.map(i => i[0]), ['receipt'])
  fs.writeFileSync('/tmp/listing-inquiry-notification-fixture.json', JSON.stringify({ html: teamEmail.body.html, subject: teamEmail.body.subject }))
  calls.length = 0; integrations.length = 0
  const sellerResponse = await exportsObject.POST(new Request('http://localhost/api/leads', { method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': '127.0.0.11' }, body: JSON.stringify({ ...payload, source: 'website', landingPage: '/sell' }) }))
  assert.equal(sellerResponse.status, 200)
  assert.ok(integrations.some(i => i[0] === 'mailchimp'))
  assert.ok(calls.some(c => c.url === 'https://lazarus.example.invalid'))
  console.log('PASS listing inquiry preserves all three team alerts and message. Seller routing remains active. No external requests sent.')
}
run().catch(error => { console.error(error); process.exitCode = 1 })
