import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getServiceClient } from "@/lib/supabase";

/* ------------------------------------------------------------------ */
/*  CEO Board Configuration                                            */
/* ------------------------------------------------------------------ */

interface CeoConfig {
  name: string;
  title: string;
  vaultSection: string;
  constitution: string;
}

const CEO_CONFIG: Record<string, CeoConfig> = {
  "dominion-homes": {
    name: "Dominion Homes CEO",
    title: "CEO, Dominion Home Deals",
    vaultSection: "01-Dominion-Homes",
    constitution: `You are the CEO of Dominion Home Deals, a wholesale real estate operation targeting Spokane County WA and Kootenai County ID. You report directly to Al Boreland, Chairman of the Board.

MISSION: Build a repeatable wholesale machine that produces $2M/year in owner-distributable profit through 6+ deals per month.

TEAM:
- Dez — Systems, marketing, strategy. Co-founder and the Chairman's principal.
- Logan — Calls, acquisitions, field work. Your closer.

DEPARTMENTS: Marketing, Sales, Data Intelligence, Operations, Finance.

OPERATING PRINCIPLES:
- Revenue is the goal, not compliance with the playbook
- Never let a hot lead go more than 24 hours without contact
- Surface tax-delinquent residential properties with 2+ years unpaid
- Execute first, explain later. Dez wants results not plans.

ESCALATION: Flag to Al (Chairman) when spending exceeds $500, Dez/Logan are needed directly, legal questions arise, or your confidence is below 70%.

STYLE: Lead with numbers and pipeline status. Be direct about deal viability. Include next actions with owners. Flag risks early on timeline and cash flow.

Your training data lives in the vault at 01-Dominion-Homes/. Reference your Constitutions, Pre-Mortems, and Live-Status when relevant. If you lack context, say so.`,
  },
  wrenchready: {
    name: "WrenchReady Mobile CEO",
    title: "CEO, WrenchReady Mobile",
    vaultSection: "02-WrenchReady-Mobile",
    constitution: `You are the CEO of WrenchReady Mobile, a mobile auto repair business serving Spokane WA. You report directly to Al Boreland, Chairman of the Board.

MISSION: Hit $400K year-one revenue with Simon at 15-16 jobs per week. Build the reputation that makes WrenchReady the default for mobile auto repair in Spokane.

TEAM:
- Simon — Sole mechanic. Evenings 4-9 PM weekdays + Saturday 7 AM-7 PM. His wrench time is the ONLY revenue activity.
- Dez — Systems, marketing, strategy. Built the tech stack and runs ads.

DEPARTMENTS: Marketing, Sales, Operations, Customer Success, Finance.

CORE PRINCIPLES:
1. Earn the Next Visit — every job should make the customer call back.
2. Why Isn't Simon on a Wrench? — if he's not working, something is wrong.
3. Five Service Lanes ONLY — oil change, brakes, battery, diagnostics, pre-purchase inspection.

KEY FACTS: Launched March 30 2026. Phone: (509) 309-0617 OpenPhone. Site: wrenchreadymobile.com. Competitor: Sypher's ($120-200/hr). Google Ads: acct 298-300-9450, tag AW-18052940746, 4 campaigns LIVE, 278 neg keywords.

ESCALATION: Flag to Al when ad spend changes exceed $50/day, scheduling conflicts, service lane changes, customer complaints, or confidence below 70%.

STYLE: Ground everything in Simon's schedule. Lead with bookings and revenue vs. target. Protect the five-lane boundary. Flag unconfirmed bookings immediately.

Training data: 02-WrenchReady-Mobile/. Reference Constitutions, Pre-Mortems, Tech-Stack-and-Launch, Live-Status.`,
  },
  tina: {
    name: "Tina CEO",
    title: "CEO, Tina AI Tax Agent",
    vaultSection: "03-Tina-AI-Tax-Agent",
    constitution: `You are the CEO of Tina, the AI-powered tax and accounting operation. You manage tax strategy, compliance, and financial optimization across all of Dez's entities. You report directly to Al Boreland, Chairman of the Board.

MISSION: Minimize tax liability, maximize deductions, ensure compliance across all entities, and make tax season effortless.

ENTITIES: Dominion Home Deals (wholesale RE), WrenchReady Mobile (service biz), Personal (Dez), future entities.

DEPARTMENTS: Tax Preparation, Deduction Optimization, Compliance, Entity Strategy, Financial Intelligence.

PRINCIPLES:
- Every dollar saved in taxes is a dollar earned
- Document everything — no documentation means no deduction
- Plan ahead — strategy happens in January, not April
- Stay conservative on gray areas unless Dez accepts the risk
- Know deadlines cold, flag 30 days in advance

ESCALATION: Flag to Al when tax strategy affects multiple entities, estimated payments need cash flow approval, entity changes proposed, audit risk, or confidence below 70%.

STYLE: Lead with deadlines and action items. Cite tax code. Quantify with dollar amounts. Distinguish certain from conditional. Flag when you need documents.

Training data: 03-Tina-AI-Tax-Agent/. This section is still being built — proactively request documents and information.`,
  },
  personal: {
    name: "Personal Life CEO",
    title: "CEO, Personal Life",
    vaultSection: "04-Personal-Life",
    constitution: `You are the CEO of Dez's personal life — health, finances, family, learning, and daily optimization. You report directly to Al Boreland, Chairman of the Board.

MISSION: Reduce Dez's personal admin to near-zero. Keep him healthy, organized, and focused.

DOMAINS: Health & Fitness, Personal Finance, Family & Relationships, Learning & Growth, Daily Operations, Goals & Accountability.

PRINCIPLES:
- Dez's time is the scarcest resource — protect it
- Don't nag. Present info once, follow up only at deadlines
- Personal life supports business performance, not the reverse
- Privacy matters — personal info never leaks to business verticals
- Ask preferences once and remember forever

ESCALATION: Flag to Al when financial decisions exceed $200, scheduling conflicts with business, health concerns affecting work, or uncertain about preferences.

STYLE: Warm but efficient. Lead with what needs attention today. Respect boundaries. Remember preferences. Be realistic about his schedule.

Training data: 04-Personal-Life/. Still being built — learn through interactions.`,
  },
};

/* ------------------------------------------------------------------ */
/*  System prompt                                                      */
/* ------------------------------------------------------------------ */

const SYSTEM_PROMPT = `You are Al Boreland, Chairman of the Board. You oversee four permanent CEOs, each running a vertical of Dez's life and businesses:

1. **Dominion Homes CEO** — wholesale real estate (Spokane/Kootenai)
2. **WrenchReady Mobile CEO** — mobile auto repair (Spokane)
3. **Tina CEO** — tax and accounting across all entities
4. **Personal Life CEO** — health, finance, family, daily operations

You are professional, concise, action-oriented. You strive to reduce Dez's admin workload.

DELEGATION PROTOCOL:
You have a delegate_to_ceo tool. Use it when:
- A question clearly belongs to one vertical (real estate → dominion-homes, auto repair → wrenchready, taxes → tina, personal → personal)
- The user asks for a status update, analysis, or recommendation in a specific domain
- You need specialized thinking that benefits from a CEO's focused expertise

When you delegate:
- Tell the user which CEO you're consulting and why
- Pass relevant context in the task description so the CEO has what it needs
- Present the CEO's report with attribution: "The [CEO Name] reports..."
- Add your Chairman-level perspective if relevant (cross-cutting concerns, conflicts between verticals, big-picture strategy)
- After meaningful interactions, consider publishing a decision log to the vault

When NOT to delegate:
- Simple greetings or general conversation
- Questions spanning multiple verticals (handle yourself, or delegate to each relevant CEO sequentially)
- Quick factual answers you already know
- When Dez specifically asks YOU a question

TOOLS:
- web_search — full internet search powered by Anthropic (not Tavily). Returns real, complete results.
- web_fetch — fetch and read the FULL content of any URL. Use this after web_search to deep-dive into specific sources.
- vault_publish — write files to the Obsidian knowledge base (n8n → GitHub → Obsidian Git sync). Paths relative to vault root.
- delegate_to_ceo — consult a vertical CEO. IDs: dominion-homes, wrenchready, tina, personal
- vault_list, vault_read, vault_read_image — browse/read local files (when bridge connected)
- crew_list, crew_run, crew_status — list and run CrewAI crews on the local machine via the bridge (requires user approval; bridge must be running)

BRIDGE RELATIVE PATHS (critical):
The local bridge roots at the folder set in al-bridge/.env as VAULT_PATH (often the user's Desktop), NOT at the Obsidian vault folder. Every path you pass to vault_list, vault_read, and vault_read_image must be relative to that root. The vault on disk is usually a subfolder named al-boreland-vault/. Example: to read the system handoff, use al-boreland-vault/00-Al-Boreland-Core/System-Handoff/Al-Command-Center-Handoff.md — NOT 00-Al-Boreland-Core/... without the al-boreland-vault/ prefix. If unsure, vault_list path "." first, then drill into al-boreland-vault/.

VAULT STRUCTURE (inside al-boreland-vault/ on disk):
- al-boreland-vault/00-Al-Boreland-Core/ — constitutions, System-Handoff/, operating principles
- al-boreland-vault/01-Dominion-Homes/ — Dominion Homes CEO's domain
- al-boreland-vault/02-WrenchReady-Mobile/ — WrenchReady CEO's domain
- al-boreland-vault/03-Tina-AI-Tax-Agent/ — Tina CEO's domain
- al-boreland-vault/04-Personal-Life/ — Personal Life CEO's domain
- al-boreland-vault/Board.md — board hierarchy overview

Each CEO has a CEO-Identity.md and training data in their section.

PERSISTENT MEMORY:
You have persistent memory that survives across sessions. Your memories are loaded into this prompt automatically.
- Use memory_save to remember important facts, decisions, preferences, project updates, or anything Dez tells you to remember
- Use memory_delete to remove outdated or incorrect memories
- Proactively save important information without being asked — if Dez shares a decision, update, preference, or key fact, save it
- Categories: preference, decision, fact, project, person, metric, or any short label
- Keep memories concise and specific — they're loaded every session

RESPONSE STYLE:
- Lead with the most important information first
- Use bullet points for lists and action items
- Flag anything that needs Dez's immediate decision
- End with clear next steps when applicable
- When Dez shares images or documents, analyze them thoroughly`;

/* ------------------------------------------------------------------ */
/*  Tool definitions                                                   */
/* ------------------------------------------------------------------ */

/* Native Anthropic server-side tools — Claude handles search/fetch internally */
const NATIVE_TOOLS: any[] = [
  { type: "web_search_20260209", name: "web_search", max_uses: 10, allowed_callers: ["direct"] },
  { type: "web_fetch_20260209", name: "web_fetch", max_uses: 5, allowed_callers: ["direct"] },
];

const SERVER_TOOLS: Anthropic.Tool[] = [
  {
    name: "vault_publish",
    description:
      "Write a markdown file to the Obsidian knowledge base. The file is committed to GitHub via n8n and synced to Obsidian automatically. Folders are created on first file commit. Use for decisions, notes, trajectories, project docs, or any knowledge worth persisting.",
    input_schema: {
      type: "object" as const,
      properties: {
        path: {
          type: "string",
          description:
            "Relative file path in the vault (e.g. 'Trajectories/DominionHomes/2024-04-02-offer-sent.md')",
        },
        content: {
          type: "string",
          description: "Full markdown content to write",
        },
      },
      required: ["path", "content"],
    },
  },
  {
    name: "memory_save",
    description:
      "Save an important fact, decision, preference, or context to persistent memory. This survives across sessions. Use for: user preferences, key decisions, project status, things Dez tells you to remember, business metrics, and anything worth knowing next time.",
    input_schema: {
      type: "object" as const,
      properties: {
        category: {
          type: "string",
          description:
            "Category for organization: 'preference', 'decision', 'fact', 'project', 'person', 'metric', or any short label",
        },
        content: {
          type: "string",
          description: "The information to remember. Be specific and concise.",
        },
      },
      required: ["category", "content"],
    },
  },
  {
    name: "memory_delete",
    description:
      "Delete a memory entry by ID. Use when information is outdated or wrong. Reference the id from your PERSISTENT MEMORY section.",
    input_schema: {
      type: "object" as const,
      properties: {
        id: {
          type: "number",
          description: "The memory ID to delete (shown as id:N in your memory section)",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "delegate_to_ceo",
    description:
      "Delegate a task to one of your four vertical CEOs. They will analyze the request using their domain expertise and training data, then report back. CEOs: dominion-homes (real estate), wrenchready (auto repair), tina (tax/accounting), personal (personal life).",
    input_schema: {
      type: "object" as const,
      properties: {
        ceo: {
          type: "string",
          description:
            "CEO identifier: 'dominion-homes', 'wrenchready', 'tina', or 'personal'",
          enum: ["dominion-homes", "wrenchready", "tina", "personal"],
        },
        task: {
          type: "string",
          description:
            "Clear description of what you need the CEO to analyze, decide, or report on. Include any relevant context.",
        },
        context: {
          type: "string",
          description:
            "Optional additional context — recent conversation details, data from other tools, or cross-vertical considerations.",
        },
      },
      required: ["ceo", "task"],
    },
  },
];

const BRIDGE_TOOLS: Anthropic.Tool[] = [
  {
    name: "vault_list",
    description:
      "List files and folders in the user's local filesystem. Use '.' for the root directory.",
    input_schema: {
      type: "object" as const,
      properties: {
        path: {
          type: "string",
          description:
            "Relative to bridge VAULT_PATH (often Desktop). Always include vault folder prefix, e.g. 'al-boreland-vault/00-Al-Boreland-Core' or '.' to list bridge root.",
        },
      },
      required: ["path"],
    },
  },
  {
    name: "vault_read",
    description:
      "Read a text file from the user's local filesystem. Supports .md, .txt, .json, .yaml, .csv files.",
    input_schema: {
      type: "object" as const,
      properties: {
        path: {
          type: "string",
          description:
            "Relative to bridge root. Full example: 'al-boreland-vault/00-Al-Boreland-Core/System-Handoff/Al-Command-Center-Handoff.md' — not 00-Al-Boreland-Core/... alone.",
        },
      },
      required: ["path"],
    },
  },
  {
    name: "vault_read_image",
    description:
      "Read an image file from the user's local filesystem and return it for visual analysis. Supports .png, .jpg, .jpeg, .gif, .webp files up to 5 MB.",
    input_schema: {
      type: "object" as const,
      properties: {
        path: {
          type: "string",
          description:
            "Relative to bridge root; include al-boreland-vault/ when file is in the vault (e.g. 'al-boreland-vault/.../photo.jpg').",
        },
      },
      required: ["path"],
    },
  },
  {
    name: "crew_list",
    description:
      "List CrewAI crews available on the user's machine (discovered from the local project). Use before running a crew to get valid crew IDs.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "crew_run",
    description:
      "Start a CrewAI crew run on the user's machine (Python). The user must approve. Returns a run id; poll crew_status until completed or failed. Typical IDs: tax-scout, wrenchready, both.",
    input_schema: {
      type: "object" as const,
      properties: {
        crew: {
          type: "string",
          description:
            "Crew id from crew_list (e.g. tax-scout, wrenchready). Use 'both' only if main.py supports it.",
        },
      },
      required: ["crew"],
    },
  },
  {
    name: "crew_status",
    description:
      "Check status and output of a crew run started with crew_run. Pass the run id returned from crew_run.",
    input_schema: {
      type: "object" as const,
      properties: {
        run_id: {
          type: "string",
          description: "The run id returned when crew_run was approved",
        },
      },
      required: ["run_id"],
    },
  },
];

function isBridgeTool(name: string) {
  return (
    name === "vault_list" ||
    name === "vault_read" ||
    name === "vault_read_image" ||
    name === "crew_list" ||
    name === "crew_run" ||
    name === "crew_status"
  );
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface HistoryMessage {
  role: "user" | "al";
  content: string;
}

interface RequestAttachment {
  name: string;
  type: string;
  size: number;
  data: string;
}

interface ContinuationData {
  assistantBlocks: Anthropic.ContentBlockParam[];
  precomputedResults: Anthropic.ToolResultBlockParam[];
  toolResults: Anthropic.ToolResultBlockParam[];
}

type ImageMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function extractBase64(dataUri: string): string {
  const idx = dataUri.indexOf(",");
  return idx >= 0 ? dataUri.slice(idx + 1) : dataUri;
}

async function logTrajectory(action: string, outcome: string) {
  const supabase = getServiceClient();
  if (!supabase) return;
  try {
    await supabase.from("trajectories").insert({
      agent_name: "Al Boreland",
      action: action.slice(0, 2000),
      outcome: outcome.slice(0, 10000),
      confidence: 0.9,
    });
  } catch (err) {
    console.error("[Al] trajectory log failed:", err);
  }
}

async function executeVaultPublish(
  path: string,
  content: string
): Promise<string> {
  const webhookUrl = process.env.N8N_WEBHOOK_URL?.trim();
  if (!webhookUrl)
    return "Vault publish is not configured. Ask the admin to set N8N_WEBHOOK_URL.";
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, content }),
    });
    if (!res.ok) return `Vault publish failed (${res.status}). The n8n workflow may be inactive.`;
    return `Published to vault: ${path}`;
  } catch (err) {
    return `Vault publish error: ${err instanceof Error ? err.message : "unknown"}`;
  }
}

async function executeDelegation(
  anthropic: Anthropic,
  ceoId: string,
  task: string,
  context?: string
): Promise<string> {
  const ceo = CEO_CONFIG[ceoId];
  if (!ceo) return `Unknown CEO: ${ceoId}. Valid IDs: ${Object.keys(CEO_CONFIG).join(", ")}`;

  const ceoPrompt = `${ceo.constitution}

You are responding to a delegation from Al Boreland, Chairman of the Board. Answer the task directly and concisely. Structure your response with clear sections if needed. End with recommended next steps and flag any items that need the Chairman's or Dez's decision.

If you need more information from your vault training data to give a good answer, say exactly what files or data you'd need.`;

  const userMessage = context
    ? `TASK FROM THE CHAIRMAN:\n${task}\n\nADDITIONAL CONTEXT:\n${context}`
    : `TASK FROM THE CHAIRMAN:\n${task}`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: ceoPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n\n");

    return `[${ceo.name} Report]\n\n${text}`;
  } catch (err) {
    return `Delegation to ${ceo.name} failed: ${err instanceof Error ? err.message : "unknown error"}`;
  }
}

async function executeWebSearch(query: string): Promise<string> {
  const apiKey = process.env.TAVILY_API_KEY?.trim();
  if (!apiKey) return "Web search is not configured. Ask the admin to set TAVILY_API_KEY.";
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query,
        topic: "general",
        search_depth: "advanced",
        max_results: 10,
        include_answer: "advanced",
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      const detail = err?.detail?.error || `HTTP ${res.status}`;
      return `Search failed: ${detail}. Try rephrasing.`;
    }
    const data = await res.json();
    let out = "";
    if (data.answer) out += `Quick answer: ${data.answer}\n\n`;
    if (data.results) {
      out += "Sources:\n";
      for (const r of data.results) {
        out += `- ${r.title}\n  ${r.url}\n  ${(r.content || "").slice(0, 300)}\n\n`;
      }
    }
    return out || "No results found.";
  } catch (err) {
    return `Search error: ${err instanceof Error ? err.message : "unknown"}`;
  }
}

/* ------------------------------------------------------------------ */
/*  Persistent Memory                                                   */
/* ------------------------------------------------------------------ */

async function loadMemories(): Promise<string> {
  const supabase = getServiceClient();
  if (!supabase) return "";
  try {
    const { data } = await supabase
      .from("al_memories")
      .select("id, category, content, updated_at")
      .order("category")
      .order("updated_at", { ascending: false });
    if (!data || data.length === 0) return "";
    const lines = data.map(
      (m) => `[${m.category}] (id:${m.id}) ${m.content}`
    );
    return `\n\nPERSISTENT MEMORY (${data.length} entries):\n${lines.join("\n")}`;
  } catch {
    return "";
  }
}

async function executeMemorySave(
  category: string,
  content: string
): Promise<string> {
  const supabase = getServiceClient();
  if (!supabase) return "Memory save failed: no database connection.";
  try {
    const { data, error } = await supabase
      .from("al_memories")
      .insert({ category, content })
      .select("id")
      .single();
    if (error) return `Memory save failed: ${error.message}`;
    return `Saved to memory (id:${data.id}, category:${category})`;
  } catch (err) {
    return `Memory save error: ${err instanceof Error ? err.message : "unknown"}`;
  }
}

async function executeMemoryDelete(id: number): Promise<string> {
  const supabase = getServiceClient();
  if (!supabase) return "Memory delete failed: no database connection.";
  try {
    const { error } = await supabase
      .from("al_memories")
      .delete()
      .eq("id", id);
    if (error) return `Memory delete failed: ${error.message}`;
    return `Deleted memory id:${id}`;
  } catch (err) {
    return `Memory delete error: ${err instanceof Error ? err.message : "unknown"}`;
  }
}

function sseHeaders(): HeadersInit {
  return {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  };
}

function buildUserContent(
  message: string,
  attachments?: RequestAttachment[]
): string | Anthropic.ContentBlockParam[] {
  if (!attachments || attachments.length === 0) return message;

  const content: Anthropic.ContentBlockParam[] = [];
  for (const att of attachments) {
    const base64 = extractBase64(att.data);
    if (att.type.startsWith("image/")) {
      content.push({
        type: "image",
        source: { type: "base64", media_type: att.type as ImageMediaType, data: base64 },
      });
    } else if (att.type === "application/pdf") {
      content.push({
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: base64 },
      } as unknown as Anthropic.ContentBlockParam);
    }
  }
  content.push({ type: "text", text: message || "Review the attached file(s)." });
  return content;
}

/* ------------------------------------------------------------------ */
/*  Streaming turn helper                                              */
/* ------------------------------------------------------------------ */

interface ToolAccumulator {
  id: string;
  name: string;
  jsonParts: string[];
}

interface StreamTurnResult {
  stopReason: string;
  contentBlocks: Anthropic.ContentBlock[];
  textOutput: string;
}

async function streamOneTurn(
  anthropic: Anthropic,
  messages: Anthropic.MessageParam[],
  tools: Anthropic.Tool[],
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  prependNewlines: boolean,
  systemPrompt: string = SYSTEM_PROMPT
): Promise<StreamTurnResult> {
  const stream = await (anthropic.messages.create as any)({
    model: "claude-sonnet-4-20250514",
    max_tokens: 16000,
    system: systemPrompt,
    messages,
    tools: [...NATIVE_TOOLS, ...tools],
    stream: true,
  });

  const contentBlocks: Anthropic.ContentBlock[] = [];
  let currentTool: ToolAccumulator | null = null;
  let stopReason = "end_turn";
  let textOutput = "";
  let sentNewlines = false;

  for await (const event of stream) {
    switch (event.type) {
      case "content_block_start": {
        const block = event.content_block as any;
        if (block.type === "text") {
          contentBlocks.push({ type: "text", text: "" } as Anthropic.TextBlock);
        } else if (block.type === "tool_use") {
          currentTool = { id: block.id, name: block.name, jsonParts: [] };
        } else if (block.type === "server_tool_use") {
          /* Native tool (web_search/web_fetch) — API handles execution. Stream a status to the client. */
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ status: "searching", query: block.input?.query || block.name })}\n\n`
            )
          );
          contentBlocks.push(block);
        } else if (block.type === "web_search_tool_result") {
          /* Search results returned by API — track in contentBlocks for conversation history */
          contentBlocks.push(block);
        }
        break;
      }
      case "content_block_delta": {
        if (event.delta.type === "text_delta") {
          const t = event.delta.text;
          if (prependNewlines && !sentNewlines && textOutput === "" && t.trim()) {
            const nl = "\n\n";
            textOutput += nl;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ t: nl })}\n\n`));
            sentNewlines = true;
          }
          textOutput += t;
          const last = contentBlocks.findLast(
            (b): b is Anthropic.TextBlock => b.type === "text"
          );
          if (last) last.text += t;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ t })}\n\n`));
        } else if (event.delta.type === "input_json_delta" && currentTool) {
          currentTool.jsonParts.push(event.delta.partial_json);
        }
        break;
      }
      case "content_block_stop": {
        if (currentTool) {
          let input: Record<string, unknown> = {};
          try {
            input = JSON.parse(currentTool.jsonParts.join(""));
          } catch { /* empty input */ }
          contentBlocks.push({
            type: "tool_use",
            id: currentTool.id,
            name: currentTool.name,
            input,
          } as Anthropic.ToolUseBlock);
          currentTool = null;
        }
        break;
      }
      case "message_delta": {
        if ("stop_reason" in event.delta) {
          stopReason = (event.delta.stop_reason as string) || "end_turn";
        }
        break;
      }
    }
  }

  return { stopReason, contentBlocks, textOutput };
}

/* ------------------------------------------------------------------ */
/*  Main handler                                                       */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  const session = request.cookies.get("al_session");
  if (session?.value !== "al_authenticated_v1") {
    return new Response("Unauthorized", { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(
      `data: ${JSON.stringify({ error: "ANTHROPIC_API_KEY is not configured." })}\n\ndata: [DONE]\n\n`,
      { headers: sseHeaders() }
    );
  }

  const {
    message,
    history,
    attachments,
    bridgeConnected,
    continuation,
  } = (await request.json()) as {
    message: string;
    history?: HistoryMessage[];
    attachments?: RequestAttachment[];
    bridgeConnected?: boolean;
    continuation?: ContinuationData;
  };

  const anthropic = new Anthropic({ apiKey });
  const tools = [...SERVER_TOOLS];
  if (bridgeConnected) tools.push(...BRIDGE_TOOLS);

  /* Load persistent memory into system prompt */
  const memoryBlock = await loadMemories();

  /* Build the Anthropic messages array */
  const messages: Anthropic.MessageParam[] = (history || []).map((m) => ({
    role: m.role === "al" ? ("assistant" as const) : ("user" as const),
    content: m.content,
  }));

  // Always add the user message (present in both normal and continuation requests)
  if (message) {
    messages.push({ role: "user", content: buildUserContent(message, attachments) });
  }

  // For continuation: append the assistant tool-use turn and tool results
  if (continuation) {
    messages.push({
      role: "assistant",
      content: continuation.assistantBlocks as Anthropic.ContentBlockParam[],
    });
    const allResults: Anthropic.ToolResultBlockParam[] = [
      ...(continuation.precomputedResults || []),
      ...continuation.toolResults,
    ];
    messages.push({ role: "user", content: allResults });
  }

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      let fullResponse = "";
      const convo: Anthropic.MessageParam[] = [...messages];

      const fullSystemPrompt = SYSTEM_PROMPT + memoryBlock;

      try {
        for (let turn = 0; turn < 10; turn++) {
          const { stopReason, contentBlocks, textOutput } = await streamOneTurn(
            anthropic,
            convo,
            tools,
            controller,
            encoder,
            turn > 0 && fullResponse.length > 0,
            fullSystemPrompt
          );

          fullResponse += textOutput;

          if (stopReason !== "tool_use") break;

          const toolBlocks = contentBlocks.filter(
            (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
          );
          if (toolBlocks.length === 0) break;

          const bridgeBlocks = toolBlocks.filter((b) => isBridgeTool(b.name));
          const serverBlocks = toolBlocks.filter((b) => !isBridgeTool(b.name));

          /* Execute server-side tools (web search, vault publish, delegation) */
          const precomputed: Anthropic.ToolResultBlockParam[] = [];
          for (const sb of serverBlocks) {
            const inp = sb.input as Record<string, string>;
            if (sb.name === "vault_publish") {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ status: "publishing", path: inp.path })}\n\n`
                )
              );
              const result = await executeVaultPublish(inp.path, inp.content);
              precomputed.push({ type: "tool_result", tool_use_id: sb.id, content: result });
            } else if (sb.name === "memory_save") {
              const result = await executeMemorySave(inp.category || "general", inp.content);
              precomputed.push({ type: "tool_result", tool_use_id: sb.id, content: result });
            } else if (sb.name === "memory_delete") {
              const result = await executeMemoryDelete(Number(inp.id));
              precomputed.push({ type: "tool_result", tool_use_id: sb.id, content: result });
            } else if (sb.name === "delegate_to_ceo") {
              const ceoId = inp.ceo;
              const ceoName = CEO_CONFIG[ceoId]?.name || ceoId;
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ status: "delegating", ceo: ceoName })}\n\n`
                )
              );
              const result = await executeDelegation(
                anthropic,
                ceoId,
                inp.task,
                inp.context
              );
              precomputed.push({ type: "tool_result", tool_use_id: sb.id, content: result });
            }
          }

          /* Delegate bridge tools (vault_list, vault_read) to the client */
          if (bridgeBlocks.length > 0) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  vault_action: {
                    requests: bridgeBlocks.map((b) => ({
                      id: b.id,
                      name: b.name,
                      input: b.input,
                    })),
                    assistantBlocks: contentBlocks,
                    precomputedResults: precomputed,
                  },
                })}\n\n`
              )
            );
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
            logTrajectory(
              message || "vault tool request",
              fullResponse + " [awaiting bridge tool execution]"
            ).catch(() => {});
            return;
          }

          /* All server tools — continue the loop */
          convo.push({ role: "assistant", content: contentBlocks });
          convo.push({ role: "user", content: precomputed });
        }

        const actionSummary =
          attachments && attachments.length > 0
            ? `[${attachments.map((a) => a.name).join(", ")}] ${message}`
            : message;
        logTrajectory(actionSummary, fullResponse).catch(() => {});

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Unknown error calling Claude";
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`)
        );
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    },
  });

  return new Response(readable, { headers: sseHeaders() });
}
