# Dominion Routing Proof

Use this packet before treating Dominion website tracking or Lazarus create-only forwarding as ready for production activation.

```powershell
node scripts/dominion-routing-proof.mjs --markdown
```

The script is read-only. It inspects:

- `src/lib/tracking.ts`
- `src/app/analytics.tsx`
- `src/app/sell/thank-you/page.tsx`
- `src/app/api/leads/route.ts`
- `.env.example`
- `docs/lazarus-intake-forwarding.md`

It verifies:

- the active Google Ads conversion ID and labels are present in the active tracking path
- old Google Ads IDs are absent from active tracking files
- the Lazarus forwarder is env-gated
- the Lazarus forwarder uses the narrow intake key
- the Lazarus payload is labeled `Dominion website seller form`
- the forwarder has a short timeout so the seller-facing response is not blocked
- env and activation docs exist

This packet must not submit a seller form, call Lazarus, change tracking, deploy, update production env, or change phone/10DLC.

Production activation still requires Adam approval for the exact env/routing change and one approved live form test.
