# Delegate Auth Repair Runbook

This runbook repairs `delegate_to_ceo` failures caused by `al-delegate` auth drift.

## Scope

- Applies to Command Center route dispatch in `src/app/api/al/chat/route.ts`
- Applies to Supabase Edge Function `al-delegate`
- Does **not** involve `al-bridge` `BRIDGE_TOKEN` auth

## Required env alignment

In Command Center (`.env.local` or deployment env):

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `AL_DELEGATE_SECRET` (recommended explicit)

In Supabase function secrets:

- `AL_DELEGATE_SECRET`

## Verification commands

1. Auth contract check (expect HTTP `400` when auth is valid and body is intentionally missing required fields):

```bash
npm run ops:check-delegate-auth
```

2. End-to-end smoke test (creates a delegation job row, calls edge function, verifies final status):

```bash
npm run ops:delegate-smoke-test
```

Expected success shape:

- `dispatch_status: 200`
- `dispatch_payload.ok: true`
- `final_status: done` (or `running` if still in progress)

## Structured metadata payload used in smoke

The smoke tool includes:

- `review_required`
- `business_id`
- `owner`
- `change_under_review`
- `intended_business_outcome`
- `primary_metric`
- `expected_direction`
- `minimum_meaningful_delta`
- `source_type`
- `source_tool`
- `runtime_ref_hint`

## If auth still fails

1. Confirm `AL_DELEGATE_SECRET` exists in Supabase secrets for project `imusghlptroddfeycpei`.
2. Confirm Command Center env uses the same secret value.
3. Re-deploy function:

```bash
npx supabase functions deploy al-delegate --project-ref imusghlptroddfeycpei
```
