# Seller measurement correction

Release approved September 3 2026. The migration is applied and verified. Code deployment verification follows. No provider event or live seller form submission is part of this release verification.

## Release order and verification gate

1. Review and explicitly authorize the additive migration `20260903195719_seller_measurement_lifecycle.sql` and website release. Approval received September 3 2026.
2. Apply the migration to the confirmed Dominion database before deploying this code. Existing deployed code remains compatible with the new nullable column and expanded event constraint. Do not reverse that order.
3. Deploy the reviewed revision and verify the public production alias/revision.
4. Verify client lifecycle with a controlled QA browser without submitting a real inquiry. A separately authorized full-chain test must use an explicit QA marker. It can still create a receipt and send the existing operator notification/PPC forwarding. This flag is not authorization to perform that test.
5. Reconcile any actual lead with its receipt, PPC delivery, conversion mode, and later attributed reporting. HTTP success alone does not prove provider processing or attribution.

## Event meanings

- `page_hidden` and `page_visible` describe visibility transitions. They are not engagement or final abandonment.
- `page_exited` now means `pagehide`. Detail differentiates ordinary page hide from a BFCache-preserved document. It still does not reveal intent or destination.
- `page_restored` means a BFCache `pageshow`. Later page hides can be recorded again without changing the anonymous visit or duplicating one hide.
- `elapsed_ms` remains wall time since the client tracker mounted. It is not time since ad click or navigation start.
- `active_visible_ms` records cumulative visible foreground time since mount. Hidden/BFCache time is excluded. It is not proof of attention. Storage caps it at 30 minutes.
- `engaged_7s` now requires seven cumulative visible seconds. Historical events used a wall timer and are not retroactively corrected.
- `form_viewed` requires a visible document and at least 25 percent intersection of the form container. It does not prove reading or interaction.
- Scroll depth remains viewport-bottom/document-height. An 8 percent reading does not prove someone scrolled 8 percent.
- Earlier `page_exited` rows without detail remain ambiguous between visibility loss and actual page hide. No historical rows are rewritten. Existing visit-summary `max_elapsed_ms` remains wall time. Query the raw new column for visible time.

## QA and conversion semantics

The server classifies explicit `internalQa: true`, landing URL `internal_qa=1`, and exact known QA UTM sources `codex`/`codex_internal_qa`. No seller name, property condition, or other personal attribute determines QA classification. `unmarked` means not explicitly marked QA, not verified human/qualified traffic.

All ordinary intake validation, durable receipt, duplicate conflict checks, operator email and PPC forwarding remain unchanged. Ordinary browser `internal_qa=1` still refuses submission. A deliberate full-chain/API QA receipt stores `measurementClass: internal_qa`, suppresses OpenAI server transmission, and returns browser ineligibility. An unmarked retry cannot remove the saved QA class or re-run fanout.

All duplicate receipts are browser-ineligible. This also prevents a validation-only receipt from becoming a production browser event after configuration changes. It is intentionally conservative. A missing browser event on the original attempt is not automatically repaired through a duplicate submission. Reconcile the original server outcome before considering a separately authorized repair.

Server validation mode also disables the browser production lead event. Server outcomes are persisted in the receipt envelope and, when a visit exists, separate funnel milestones:

| Event | Meaning |
| --- | --- |
| `conversion_reported` | Production HTTP acceptance. Not attribution or processing proof. |
| `conversion_validated` | Validation-only HTTP acceptance. Not a production conversion. |
| `conversion_skipped` | Explicit QA or missing configuration. See bounded detail. |
| `conversion_failed` | Explicit unsuccessful HTTP response. |
| `conversion_unknown` | Transport failure. Provider receipt may already have occurred. No automatic replay. |

The receipt also records outcome when no funnel visit is available. The pre-existing outer timeout may still leave the optional milestone unavailable; the delivery envelope records the ambiguity when its write succeeds. Provider-response per-event processing is not established by this patch.

Stable browser/server event IDs, click/browser references, opt-out setting, ad targeting, and customer identifiers are unchanged. Google Analytics tracking outside ordinary internal-QA mode is not reworked. A full-chain QA receipt can remain in business tables and must be excluded from business KPIs using the explicit marker/source.

## Local proof

`npm run test:seller-measurement` executes the actual tracker handlers, conversion transport, and intake handler using isolated clock/network/database doubles. It sends no network requests. `npm run verify:seller-funnel` retains the existing static checks. Neither is real provider attribution proof.

The standalone lint command currently opens a missing-configuration prompt. Do not silently initialize repository-wide ESLint as part of this narrow patch.

Local results on September 3, 2026. Sixteen behavioral tests passed. Fourteen static funnel checks passed. Existing options/PPC routing verifier passed 1,790 assertions. Existing landing/form verifier passed 379 assertions. Production build and TypeScript check passed. `git diff --check` passed. Browser rendering and live database migration remain untested in this local-only change.

## Read-only release preflight

September 3 2026 at approximately 12:52 PM Pacific. Local HEAD and remote main both resolve to `7206ac2404b2075727a33c281b3c025983b8477f`. The latest listed production deployment is READY at that same revision. The measurement changes remain uncommitted local work. The unrelated untracked ad-image directory is excluded from the proposed release.

Live database catalog confirms the expected existing event-type constraint and that `active_visible_ms` is not present. This matches the prepared migration's starting assumptions. RLS is enabled and anonymous and authenticated roles have no SELECT privilege on the event table. The migration does not change those permissions. The new column and allowed event types must be applied before code deployment.

Sixteen behavioral tests and fourteen static checks were rerun successfully. The options/PPC routing verifier again passed 1,790 assertions. No provider request or live submission was made. No schema change or deployment occurred. This check confirms the release starting state rather than proving an applied migration or deployed runtime.

## Migration application

Applied after owner approval. Database ledger version is `20260903195719`. The prepared file was renamed to match that returned version without changing its DDL. Readback confirms the integer visible-time column and expanded event constraint. Existing 19 events and one receipt are unchanged. RLS remains enabled and anonymous/authenticated SELECT remains unavailable.
