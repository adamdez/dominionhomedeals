# AL Boreland MCP Server Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a local Node.js MCP server that exposes AL Boreland as a single `ask_al` tool inside Claude Code, using the subscription plan (no API tokens) with full vault memory and constitution.

**Architecture:** Local stdio MCP server at `Desktop/al-mcp-server/`. On each `ask_al(message)` call, it fetches AL's persistent memories from Supabase (`al_memories` table) and returns a rich context block containing AL's full system prompt + memories + the user's message. Claude Code generates the response using its own context window — zero Anthropic API calls from the MCP server itself. Registered in `~/.claude/settings.json`.

**Tech Stack:** Node.js (CommonJS), `@modelcontextprotocol/sdk` (stdio server), `@supabase/supabase-js` (memory fetch), no build step.

---

## Task 1: Scaffold the MCP server project

**Files:**
- Create: `C:\Users\adamd\Desktop\al-mcp-server\package.json`
- Create: `C:\Users\adamd\Desktop\al-mcp-server\index.js`

**Step 1: Create the directory and package.json**

```bash
mkdir C:\Users\adamd\Desktop\al-mcp-server
cd C:\Users\adamd\Desktop\al-mcp-server
```

Create `package.json`:
```json
{
  "name": "al-mcp-server",
  "version": "1.0.0",
  "description": "AL Boreland MCP server for Claude Code",
  "main": "index.js",
  "type": "commonjs",
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.10.2",
    "@supabase/supabase-js": "^2.101.1"
  }
}
```

**Step 2: Install dependencies**

```bash
cd C:\Users\adamd\Desktop\al-mcp-server && npm install
```

Expected: `node_modules/` created, `@modelcontextprotocol/sdk` and `@supabase/supabase-js` installed.

**Step 3: Verify SDK is importable**

```bash
node -e "const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js'); console.log('SDK OK')"
```

Expected output: `SDK OK`

**Step 4: Commit**

```bash
cd C:\Users\adamd\Desktop\al-mcp-server && git init && git add package.json package-lock.json && git commit -m "init: al-mcp-server scaffold"
```

---

## Task 2: Write the MCP server (index.js)

**Files:**
- Create: `C:\Users\adamd\Desktop\al-mcp-server\index.js`

**Step 1: Create index.js**

```javascript
#!/usr/bin/env node
'use strict';

const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { createClient } = require('@supabase/supabase-js');
const { z } = require('zod');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://imusghlptroddfeycpei.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY;

// ── AL's full system prompt (mirrors chat route SYSTEM_PROMPT) ──────────────
const AL_SYSTEM_PROMPT = `You are Al Boreland, Chairman of the Board. You oversee four permanent CEOs and two Marketing Directors, each running a vertical of Dez's life and businesses:

1. **Dominion Homes CEO** — wholesale real estate (Spokane/Kootenai)
2. **WrenchReady Mobile CEO** — mobile auto repair (Spokane)
3. **Tina CEO** — tax and accounting across all entities
4. **Personal Life CEO** — health, finance, family, daily operations
5. **Dominion Marketing Director** — Google Ads + Meta Ads for motivated seller leads
6. **WrenchReady Marketing Director** — Google Ads + Meta Ads for local service bookings

You are professional, concise, action-oriented. You strive to reduce Dez's admin workload.

OPERATING IN CLAUDE CODE:
You are running inside Claude Code on Dez's local machine. This means:
- You have direct access to Claude Code tools: Bash, Read, Write, Edit, Glob, Grep, WebSearch, WebFetch
- Use these tools to execute heavy tasks yourself — don't just describe what to do, DO IT
- You can read/write files, run terminal commands, deploy code, and research the web
- When Dez gives you a task like "add a page to the website" or "create a property listing", use the available tools to complete it
- This runs on Dez's Claude subscription — no API token cost

DELEGATION PROTOCOL:
For domain-specific analysis and strategy, consult the relevant CEO verbally in your response. You don't have a delegate_to_ceo tool here — reason through what each CEO would say based on their constitutions below.

CEO CONSTITUTIONS:

[DOMINION HOMES CEO]
Mission: Build a repeatable wholesale machine producing $2M/year through 6+ deals/month.
Team: Dez (systems/marketing), Logan (acquisitions/calls).
Focus: Tax-delinquent leads, motivated sellers, Spokane/Kootenai market.
Escalate to Al: spend >$500, legal questions, confidence <70%.
Style: Numbers and pipeline. Lead with deal viability. Next actions with owners.

[WRENCHREADY MOBILE CEO]
Mission: $400K year-one revenue. Simon at 15-16 jobs/week.
Team: Simon (mechanic, evenings + Saturdays), Dez (systems/marketing).
Five lanes only: oil change, brakes, battery, diagnostics, pre-purchase inspection.
Phone: (509) 309-0617. Site: wrenchreadymobile.com. Google Ads live.
Escalate: ad spend changes >$50/day, scheduling conflicts, service lane changes.
Style: Ground in Simon's schedule. Lead with bookings vs. target.

[TINA CEO — TAX & ACCOUNTING]
Mission: Minimize tax liability across all entities. Make tax season effortless.
Entities: Dominion Home Deals, WrenchReady Mobile, Personal (Dez).
Style: Lead with deadlines and action items. Cite dollar amounts. Flag gray areas.

[PERSONAL LIFE CEO]
Mission: Reduce Dez's personal admin to near-zero. Keep him healthy and focused.
Domains: Health, Personal Finance, Family, Learning, Daily Operations.
Style: Warm but efficient. Lead with what needs attention today.

TOOLS AVAILABLE IN CLAUDE CODE:
- Bash — run terminal commands, Node scripts, git operations, deployments
- Read/Write/Edit — file system access for the full Desktop and beyond
- WebSearch/WebFetch — internet research
- Glob/Grep — codebase search
- Agent — spawn subagents for parallel or isolated work

VAULT STRUCTURE (when reading files):
- al-boreland-vault/00-Al-Boreland-Core/ — constitutions, system handoff
- al-boreland-vault/01-Dominion-Homes/ — Dominion domain
- al-boreland-vault/02-WrenchReady-Mobile/ — WrenchReady domain
- al-boreland-vault/03-Tina-AI-Tax-Agent/ — Tina domain
- al-boreland-vault/04-Personal-Life/ — Personal domain
- al-boreland-vault/Board.md — board overview

KEY PROJECTS:
- dominionhomedeals/ — Next.js site + AL chat UI (deploy via git push to main → Vercel auto-deploys)
- spokane-parcels/ — Scout crawler, parcels.db, push-sentinel.js
- al-boreland-vault/ — Obsidian vault (syncs to GitHub via n8n)
- sentinel-crm — Supabase project imusghlptroddfeycpei

STYLE:
- Execute first, explain later
- Lead with numbers and pipeline status
- Tables over paragraphs
- Short over long
- When challenged, verify with data before defending or backing down`;

// ── Load persistent memories from Supabase ───────────────────────────────────
async function loadMemories() {
  if (!SUPABASE_KEY) return '';
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data } = await supabase
      .from('al_memories')
      .select('id, category, content, updated_at')
      .order('category')
      .order('updated_at', { ascending: false });
    if (!data || data.length === 0) return '';
    const lines = data.map(m => `[${m.category}] (id:${m.id}) ${m.content}`);
    return `\n\nPERSISTENT MEMORY (${data.length} entries):\n${lines.join('\n')}`;
  } catch {
    return '';
  }
}

// ── Build the full context block returned to Claude Code ─────────────────────
async function buildContext(message) {
  const memories = await loadMemories();

  return `AL BORELAND — CHAIRMAN OF THE BOARD
${'='.repeat(60)}

${AL_SYSTEM_PROMPT}${memories}

${'='.repeat(60)}
MESSAGE FROM DEZ:
${'='.repeat(60)}
${message}

${'='.repeat(60)}
INSTRUCTIONS:
You are now Al Boreland. Respond in character using all context above.
If this task requires code execution, file edits, web research, deployment,
or any other action — use your available Claude Code tools to DO IT NOW.
Do not describe what you would do. Execute it directly.
${'='.repeat(60)}`;
}

// ── MCP Server setup ──────────────────────────────────────────────────────────
async function main() {
  const server = new McpServer({
    name: 'al-boreland',
    version: '1.0.0',
  });

  server.tool(
    'ask_al',
    {
      message: z.string().describe(
        'Your message to AL — a question, task, or status request. AL has full context on Dominion Home Deals, WrenchReady Mobile, and Tina AI. Use this for strategic decisions, task delegation, lead status, business context, or any task that needs AL\'s judgment and execution.'
      ),
    },
    async ({ message }) => {
      const context = await buildContext(message);
      return {
        content: [{ type: 'text', text: context }],
      };
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(err => {
  process.stderr.write(`al-mcp-server fatal: ${err.message}\n`);
  process.exit(1);
});
```

**Step 2: Quick smoke test (manual)**

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1"}}}' | node index.js
```

Expected: JSON response with `"name":"al-boreland"` in the result.

**Step 3: Commit**

```bash
git add index.js && git commit -m "feat: implement ask_al MCP tool with vault memory"
```

---

## Task 3: Register the MCP server in Claude Code settings

**Files:**
- Modify: `C:\Users\adamd\.claude\settings.json`

**Step 1: Read the current settings.json**

```bash
cat C:\Users\adamd\.claude\settings.json
```

**Step 2: Add the mcpServers entry**

Add or merge into the existing JSON:

```json
{
  "mcpServers": {
    "al-boreland": {
      "command": "node",
      "args": ["C:\\Users\\adamd\\Desktop\\al-mcp-server\\index.js"],
      "env": {
        "SUPABASE_URL": "https://imusghlptroddfeycpei.supabase.co",
        "SUPABASE_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltdXNnaGxwdHJvZGRmZXljcGVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjE0MTk0MywiZXhwIjoyMDg3NzE3OTQzfQ.w1YJYpSs2a62GsEDPfgGkHMAq3QwH7aC0Anmc3nx8XA"
      }
    }
  }
}
```

**Step 3: Restart Claude Code**

Close and reopen Claude Code (or run `/mcp` to reload servers).

**Step 4: Verify the tool appears**

In a new Claude Code session, run:
```
/mcp
```

Expected: `al-boreland` listed as connected with `ask_al` tool available.

---

## Task 4: End-to-end test

**Step 1: Test with a simple question**

In Claude Code, use the `ask_al` tool:
```
ask_al("What's the current status of the Dominion pipeline?")
```

Expected: AL responds in character with knowledge of Dominion Home Deals, references memories if any exist, asks for context if pipeline data isn't in memory.

**Step 2: Test with a task that requires execution**

```
ask_al("Add a simple placeholder page at /listings to the dominionhomedeals Next.js site")
```

Expected: AL uses Bash/Read/Write/Edit tools to actually create the file and commits it. Not a description — actual execution.

**Step 3: Test memory loading**

If `al_memories` table has entries, they should appear in AL's context:
```bash
node -e "
const { createClient } = require('@supabase/supabase-js');
const sb = createClient('https://imusghlptroddfeycpei.supabase.co', process.env.SUPABASE_KEY);
sb.from('al_memories').select('*').then(({data}) => console.log(data));
"
```

---

## Task 5: Save AL's constitution to the vault

**Goal:** AL should be able to remind himself of this MCP setup in future sessions by reading the vault.

**Step 1: Write a vault note**

```bash
node -e "
const note = \`# AL MCP Server — Claude Code Integration

## What This Is
AL Boreland is available as an MCP tool inside Claude Code via the local al-mcp-server.
Tool name: ask_al
Location: C:\\\\Users\\\\adamd\\\\Desktop\\\\al-mcp-server\\\\index.js
Registered in: C:\\\\Users\\\\adamd\\\\.claude\\\\settings.json

## How AL Works Here
- ask_al loads AL's constitution + Supabase memories
- Claude Code generates the response (subscription plan, no API tokens)
- AL can use all Claude Code tools: Bash, Read, Write, Edit, WebSearch, Agent

## What AL Can Do
- Answer questions about Dominion, WrenchReady, Tina, Personal
- Execute tasks directly using Claude Code tools
- Read/write vault files, run code, deploy, research
- Delegate heavy work to subagents

## What The Chat UI Still Does
al.dominionhomedeals.com still works for non-Claude-Code contexts.
That surface uses API tokens. This surface (MCP) uses the subscription.
\`;
console.log(note);
"
```

Then use `vault_publish` from AL's chat UI to save it to `00-Al-Boreland-Core/MCP-Integration.md`, or write it directly to `al-boreland-vault/00-Al-Boreland-Core/MCP-Integration.md` via Claude Code.

---

## Notes

- **No `.env` file** — credentials go in `settings.json` env block, not on disk in the MCP server directory
- **The MCP server has no API calls** — it only reads from Supabase (memories) and returns static context. Claude Code is the brain.
- **AL's chat UI is unchanged** — `al.dominionhomedeals.com` continues working. The MCP is an additive surface.
- **Memory writes** — For now, AL can't write memories from Claude Code (no `memory_save` tool in the MCP). If needed, add a `memory_save` tool in a future task following the same pattern.
- **If `@modelcontextprotocol/sdk` version issues arise** — check `npm info @modelcontextprotocol/sdk versions` and pin to latest stable.
