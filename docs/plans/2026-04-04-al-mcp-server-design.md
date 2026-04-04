# AL Boreland MCP Server — Design Doc
**Date:** 2026-04-04
**Status:** Approved

---

## Problem

AL Boreland lives at `al.dominionhomedeals.com` — accessible only via a chat UI. Cowork (Claude Code) can't reach that domain due to an egress proxy. AL can't delegate heavy tasks (build a page, create a property listing) to Claude Code. Heavy task execution requires a human to manually relay between AL and Claude Code.

---

## Goal

Make AL available inside Claude Code / Cowork as a native MCP tool — same vault, same constitution, same memory — without burning Anthropic API tokens for AL's responses.

---

## Architecture

```
Dez (in Claude Code / Cowork)
  │
  └─ calls ask_al("add a listing for 808 W Chelan Ave")
       │
       ▼
Local MCP Server (Node.js, ~/Desktop/al-mcp-server/)
  │
  ├─ Fetches AL's vault context from Supabase (imusghlptroddfeycpei)
  ├─ Loads AL's constitution (Dominion, WrenchReady, Tina)
  └─ Returns rich context + message as tool result
       │
       ▼
Claude Code brain (subscription plan) generates AL's response
  │
  └─ AL delegates heavy work back to Claude Code tools (Bash, Edit, Write, etc.)
       └─ No API tokens burned — runs on subscription
```

**What does NOT change:** `al.dominionhomedeals.com` chat UI continues working exactly as before — still uses Anthropic API for that surface.

---

## MCP Server Spec

**Location:** `C:\Users\adamd\Desktop\al-mcp-server\`
**Runtime:** Node.js (CommonJS, no build step)
**Protocol:** MCP over stdio (Claude Code's native local MCP transport)
**Registration:** `~/.claude/settings.json` → `mcpServers`

### Tool: `ask_al`

```json
{
  "name": "ask_al",
  "description": "Ask Al Boreland, Chairman of the Board, a question or give him a task. AL has full context on Dominion Home Deals, WrenchReady Mobile, and Tina AI — including live pipeline status, vault constitutions, health checks, and session logs. Use this for strategic decisions, task delegation, lead status, business context, or any question that needs AL's judgment.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "message": {
        "type": "string",
        "description": "Your message to AL — a question, task, or status request."
      }
    },
    "required": ["message"]
  }
}
```

### What the tool returns

A structured context block that Claude Code uses to generate AL's response:

```
AL BORELAND — CHAIRMAN OF THE BOARD
=====================================
[AL's full constitution / personality / operating rules]

VAULT CONTEXT (live from Supabase)
-----------------------------------
[Health checks, live status, session logs for relevant business]

YOUR MESSAGE
-----------------------------------
[Dez's message]

INSTRUCTIONS FOR CLAUDE CODE
-----------------------------------
You are now AL Boreland. Respond in character using the context above.
If the task requires code execution, file edits, web research, or
deployment — use your available Claude Code tools to do it directly.
Do not describe what you would do. Do it.
```

---

## Vault Context Fetching

The MCP server queries Supabase for relevant vault content on each `ask_al` call:

| Query | Table / Source | Purpose |
|-------|---------------|---------|
| Health checks | `al_boreland_vault` or Supabase storage | Live status for all 3 businesses |
| Session logs | Recent entries | Last known state |
| Constitutions | Hardcoded in MCP server | AL's identity, operating rules |

Context is scoped to whichever business the message is about (auto-detected from keywords). Falls back to all-business context if unclear.

---

## Claude Code Registration

Add to `C:\Users\adamd\.claude\settings.json`:

```json
{
  "mcpServers": {
    "al-boreland": {
      "command": "node",
      "args": ["C:\\Users\\adamd\\Desktop\\al-mcp-server\\index.js"],
      "env": {
        "SUPABASE_URL": "https://imusghlptroddfeycpei.supabase.co",
        "SUPABASE_KEY": "<service_role_key>"
      }
    }
  }
}
```

---

## Token Economics

| Action | Cost |
|--------|------|
| `ask_al` via Claude Code | Free (subscription) |
| AL delegates task to Claude Code tools | Free (subscription) |
| `al.dominionhomedeals.com` chat UI | API tokens (unchanged) |

---

## Success Criteria

1. `ask_al` appears as a tool in Claude Code
2. Dez can ask AL a question and get a response with full vault context
3. AL can delegate tasks (write code, edit files, deploy) back to Claude Code
4. No Anthropic API calls made by the MCP server
5. Chat UI at `al.dominionhomedeals.com` continues working unchanged

---

## Out of Scope (for now)

- AL initiating contact with Dez unprompted
- Persistent AL memory across Claude Code sessions (vault is the memory)
- Structured tools beyond `ask_al`
- Migrating the chat UI off API tokens
