# Dominion Website App

This repo is Dominion's public website and lead-routing surface.

Before brand, public identity, lead routing, tracking, forms, or production-facing work, follow `../AGENTS.md` and read:

1. `../dominion-codex-brain/business-memory/task-router.md`
2. `../dominion-codex-brain/business-memory/current-state.md`
3. The routed memory or playbook for website, PPC, lead routing, or local search work

## Public Surface Rules

- Public phone numbers, legal identity, schema/citations, Google Ads tracking, forms, and notification routing are live business facts. Reverify before changing or publishing them.
- Do not change ad spend, conversion tracking, lead routing, public legal/phone identity, or production domains without exact Adam approval.
- Keep Dominion-only boundaries. Do not add non-Dominion customer data, credentials, browser sessions, or unrelated business memory.

## Code Work

- Work on `main` unless Adam explicitly says otherwise.
- Keep changes surgical and consistent with the existing Next.js/Tailwind style.
- Build the actual usable site experience, not explanatory scaffolding.
- Use existing scripts and components before adding new tooling.
- Run the relevant verifier for the touched surface, plus `npm run build`; run lint if the local script is available and working.
- Pushing to GitHub normally triggers Vercel; verify deployment/readback for production-facing fixes.

## Lead Routing

- For forms and PPC/lead-routing work, verify both code behavior and destination recipients.
- Prefer direct code/API/readback checks over slow browser-only inspection when possible.
