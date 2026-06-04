# Lazarus Intake Forwarding

Dominion website seller leads can optionally be copied into Lazarus through its create-only intake endpoint.

This path is intentionally narrow:

- creates one Lazarus lead
- does not read Lazarus data
- does not update existing Lazarus records
- does not send SMS, email, buyer blasts, or dialer actions
- does not block the seller's website response if Lazarus is slow or unavailable

## Activation

Set both env vars in the deployment environment:

```bash
LAZARUS_INTAKE_URL=https://lazarus.dominionhomedeals.com/api/intake/leads
LAZARUS_INTAKE_CREATE_LEAD_KEY=
```

If either value is missing, `/api/leads` logs that Lazarus is not configured and skips the forward.

## Payload Shape

The website sends:

- name, phone, email
- property address, city, state, zip
- `status: new`
- notes with condition, timeline, landing page, SMS consent state, and ad attribution
- `sourceDetails` with source label, page, UTM fields, and GCLID when present

## Verification

Before production use:

1. Confirm Lazarus production has `LAZARUS_INTAKE_CREATE_LEAD_KEY` configured.
2. Configure the Dominion deployment env vars.
3. Submit one test seller form.
4. Confirm the website still returns success even if the Lazarus request is slow.
5. Confirm exactly one new Lazarus lead is created with source label `Dominion website seller form`.
6. Confirm email/SMS/control-memory side effects still work as before.

Production activation is a lead-routing change and needs Adam's explicit approval.
