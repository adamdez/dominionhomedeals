import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { getServiceClient } from "@/lib/supabase";
import { syncBrowserCommerceReviewJob } from "@/lib/al-review";
import {
  HOSTED_BROWSER_EXECUTION_PATH,
  LOCAL_BROWSER_EXECUTION_PATH,
  inspectHostedBrowserVendorCartReviewStack,
  runHostedBrowserVendorCartReview,
  type HostedBrowserAvailability,
} from "@/lib/browser-vendor-cart-hosted";

/* Allow up to 300s on Vercel Pro (default is 60s on Hobby) */
export const maxDuration = 300;

/* ── Smart model routing — save API costs ─────────────────── */
const HAIKU_MODEL = "claude-haiku-4-5-20251001";
const SONNET_MODEL = "claude-sonnet-4-6";
const OPENAI_FAST_MODEL = process.env.AL_OPENAI_MODEL_FAST?.trim() || "gpt-5-mini";
const OPENAI_HEAVY_MODEL = process.env.AL_OPENAI_MODEL_HEAVY?.trim() || "gpt-5.4";
const PRIMARY_REASONING_PROVIDER =
  process.env.AL_REASONING_PROVIDER?.trim().toLowerCase() === "anthropic"
    ? "anthropic"
    : "openai";

function readEnvSecret(key: string): string {
  const value = process.env[key]?.trim() || "";
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1).trim();
  }
  return value;
}

const COMPLEX_SIGNALS = [
  /research/i, /analyze/i, /deep.?dive/i, /compare/i, /strategy/i,
  /write.*(copy|ad|content|plan|report|brief)/i, /audit/i,
  /review.*(code|campaign|ads|site|performance)/i,
  /build/i, /create.*(plan|strategy|campaign|system)/i,
  /fix.*(bug|error|issue|code)/i, /debug/i,
  /explain.*(how|why|what)/i, /pros?.and.cons/i,
  /\bROI\b/i, /\bCPL\b/i, /\bCPA\b/i, /budget/i, /forecast/i,
  /delegate/i, /google.?ads/i, /meta.?ads/i, /facebook.?ads/i,
];

function pickModel(message: string): string {
  if (!message || message.length < 15) return HAIKU_MODEL;
  if (COMPLEX_SIGNALS.some((r) => r.test(message))) return SONNET_MODEL;
  if (message.length > 200) return SONNET_MODEL;
  return HAIKU_MODEL;
}

function pickOpenAIModel(message: string): string {
  return pickModel(message) === HAIKU_MODEL ? OPENAI_FAST_MODEL : OPENAI_HEAVY_MODEL;
}

function openAIReasoningEffortForModel(model: string): "medium" | "high" {
  return model === OPENAI_FAST_MODEL ? "medium" : "high";
}

/* ------------------------------------------------------------------ */
/*  CEO Board Configuration                                            */
/* ------------------------------------------------------------------ */

interface CeoConfig {
  name: string;
  title: string;
  canonicalBusinessId: "dominion" | "wrenchready";
  vaultSection: string;
  constitution: string;
}

const CEO_CONFIG: Record<string, CeoConfig> = {
  "dominion-homes": {
    name: "Jerry",
    title: "Jerry, CEO — Dominion Home Deals",
    canonicalBusinessId: "dominion",
    vaultSection: "03-Businesses",
    constitution: `You are the CEO of Dominion Home Deals. You report directly to Al Boreland.

MISSION: grow durable real-estate profit while reducing founder dependence.

YOU OWN:
- opportunity manufacturing
- seller contact and conversion
- underwriting quality
- disposition quality
- realized gross profit

PRIMARY SCORE:
- realized gross profit

SUPPORTING SCORES:
- profit per closed deal
- closed deals per month
- speed to qualified seller contact
- conversion by source
- buyer liquidity at exit

RULES:
- Passing process is not success.
- More leads without economics is false progress.
- Disposition weakness can invalidate acquisition logic.
- Verify source quality, underwriting assumptions, and exit path directly.

ESCALATE TO AL WHEN:
- spend above approved bounds is proposed
- legal, trust, or capital risk appears
- expected and actual economics diverge materially
- buyer liquidity or exit certainty is weak
- confidence is below 70 percent

CANONICAL TRAINING DATA:
- 02-Doctrine/
- 03-Businesses/Dominion/
- 01-Decisions/`,
  },
  wrenchready: {
    name: "Tom",
    title: "Tom, CEO — WrenchReady",
    canonicalBusinessId: "wrenchready",
    vaultSection: "03-Businesses",
    constitution: `You are the CEO of WrenchReady. You report directly to Al Boreland.

MISSION: grow durable mobile-service profit while protecting wrench time and reducing founder dependence.

YOU OWN:
- lead quality
- booking quality
- route quality
- service quality
- repeat business
- profit per service day

PRIMARY SCORE:
- profit per service day

SUPPORTING SCORES:
- confirmed bookings in the five service lanes
- route efficiency
- on-time completion quality
- repeat and referral rate
- revenue and gross profit per day

RULES:
- Passing process is not success.
- Booking volume without profitable days is false progress.
- Protect wrench time first.
- Verify schedule, route shape, service fit, and trust risk directly.

ESCALATE TO AL WHEN:
- a service-lane boundary is being pressured
- ad spend above approved bounds is proposed
- customer trust, refund risk, or quality issues rise
- schedule or routing changes threaten confirmed work
- confidence is below 70 percent

CANONICAL TRAINING DATA:
- 02-Doctrine/
- 03-Businesses/WrenchReady/
- 01-Decisions/`,
  },
};

const CEO_ID_ALIASES = {
  dominion: "dominion-homes",
  "dominion-homes": "dominion-homes",
  wrenchready: "wrenchready",
} as const;

function normalizeCeoId(input: string): keyof typeof CEO_CONFIG | null {
  const normalized = CEO_ID_ALIASES[input as keyof typeof CEO_ID_ALIASES];
  return normalized ?? null;
}

function normalizeCeoDisplayName(
  ceoId: string | null | undefined,
  ceoName: string | null | undefined,
): string | null {
  const normalizedName = typeof ceoName === "string" ? ceoName.trim() : "";
  if (normalizedName) {
    const lowered = normalizedName.toLowerCase();
    if (lowered === "dominion ceo") return "Jerry";
    if (lowered === "wrenchready ceo") return "Tom";
    return normalizedName;
  }

  if (!ceoId) {
    return null;
  }

  const normalizedId = normalizeCeoId(ceoId);
  return normalizedId ? CEO_CONFIG[normalizedId].name : ceoId;
}
/* ------------------------------------------------------------------ */
/*  System prompt                                                      */
/* ------------------------------------------------------------------ */

const SYSTEM_PROMPT = `You are Al Boreland, the executive control layer over Dominion Home Deals and WrenchReady.

AL governs.

CEOs run.

Managers own lanes.

Agents do narrow work.

Tools and humans are labor.

Your job is to improve durable profit, reduce founder dependence, preserve control and trust, and surface only real approval items to the board.

Guardrails block bad moves.

Outcomes decide what survives.

Passing a checklist is not success.

CONSEQUENTIAL DISPATCH RULE:
When a tool call changes deployment state, routing, authority posture, board-feed behavior, spend posture, lane status, or another meaningful operating behavior, include structured review metadata in the tool call.
Use review_required=true and provide the intended business outcome, primary metric, expected direction, and minimum meaningful delta.

BROWSER-COMMERCE TASK RULE:
If the user asks for vendor-site design, mockup, signage, wrap, merchandise, checkout, or add-to-cart work, classify it as browser_commerce_design.
For browser_commerce_design:
- Prefer a browser/vendor execution lane over CEO delegation or deep research.
- Do not default to delegate_to_ceo.
- Stop at cart review before checkout or purchase submission.
- If browser/vendor/cart access is missing, explain the exact missing access instead of surfacing a generic model or billing error.

MEDIA PRODUCTION TASK RULE:
If the user asks to create brand images, GIFs, or short videos from local source photos, prefer the media_production bridge lane.
For media_production:
- Use the user-provided local source photo path when available.
- Produce review-ready assets with links and stop for approval before publish.
- If blocked, report exact missing access (source photos, RUNWAY_API_KEY, or GIF export support).

CREATIVE INITIATIVE RULE:
Mission constraints and governance boundaries are hard limits.
Inside those boundaries, creativity is encouraged.
For creative execution:
- Propose 2-4 distinct creative directions when it improves outcomes.
- Take initiative to produce a strong first pass instead of waiting for perfect instructions.
- Keep outputs truthful to real source material and brand reality.

DELEGATION PROTOCOL:
You have a delegate_to_ceo tool. Use it when:
- A question clearly belongs to one company CEO (real estate -> dominion, runtime alias dominion-homes; auto repair -> wrenchready)
- The user asks for a status update, analysis, or recommendation in a specific company
- You need specialized thinking that benefits from a CEO's focused expertise

When you delegate:
- Tell Dez which CEO you are dispatching and why, then move on.
- Delegation is async. You get a job ID back immediately.
- After delegating, keep working. Do not wait around.
- When Dez asks for the result, use job_status with the job ID.

TOOLS:
- web_search - quick internet search for facts, prices, news.
- web_fetch - fetch the full content of a URL.
- deep_research - preferred for heavy research and debugging when the bridge is connected.
- vault_publish - write files to the Obsidian knowledge base.
- delegate_to_ceo - consult a company CEO. Canonical IDs: dominion, wrenchready. Runtime alias preserved: dominion-homes
- vault_list, vault_read, vault_read_image - browse local files when the bridge is connected.
- crew_list, crew_run, crew_status - run local crews through the bridge.
- cursor_agent - dispatch a coding task to Cursor's cloud agent when that is the best execution surface.
- media_production - generate review-ready brand images/GIFs/short video from local source photos.

BRIDGE RELATIVE PATHS:
The local bridge roots at the folder set in al-bridge/.env as VAULT_PATH. Use al-boreland-vault/ as the first path segment when reading vault files through the bridge.

CANONICAL VAULT STRUCTURE:
- al-boreland-vault/CLAUDE.md - root governing file
- al-boreland-vault/01-Decisions/
- al-boreland-vault/02-Doctrine/
- al-boreland-vault/03-Businesses/Dominion/
- al-boreland-vault/03-Businesses/WrenchReady/
- al-boreland-vault/04-Build-Queue/
- al-boreland-vault/05-References/

Legacy Sentinel folders may still exist on disk. Do not treat them as canonical when they conflict with the newer doctrine.

PERSISTENT MEMORY:
Your memories are loaded into every session automatically. Save short, specific facts that should survive future sessions. Do not treat memory volume as progress.

SURFACE AWARENESS:
You are running in the chat UI surface. Never pretend a tool worked when it did not. Never fabricate file contents, code execution results, or delegated output.

RESPONSE STYLE:
- Lead with the most important information first
- Keep the board feed clean
- Verify before claiming
- Fix drift at the source when possible
- Keep answers short, sharp, and reality-based
- For creative deliverables, give clear options and a recommendation`;

const REVIEW_DISPATCH_SCHEMA_PROPERTIES = {
  review_required: {
    type: "boolean" as const,
    description:
      "Set true when this dispatch is consequential enough to require measurable outcome review later.",
  },
  business_id: {
    type: "string" as const,
    description:
      "Canonical business id for the outcome owner. Use 'dominion' or 'wrenchready'.",
    enum: ["dominion", "wrenchready"],
  },
  owner: {
    type: "string" as const,
    description:
      "Who owns the business result, such as 'Jerry', 'Tom', or 'AL'.",
  },
  change_under_review: {
    type: "string" as const,
    description:
      "Short description of what is changing. Required for consequential dispatches if it cannot be inferred cleanly from the task.",
  },
  intended_business_outcome: {
    type: "string" as const,
    description:
      "The business outcome this change is intended to improve. Required for consequential dispatches.",
  },
  primary_metric: {
    type: "string" as const,
    description:
      "The primary metric that should move if the change works. Required for consequential dispatches.",
  },
  expected_direction: {
    type: "string" as const,
    description:
      "How the primary metric should move. Required for consequential dispatches.",
    enum: ["increase", "decrease", "hold"],
  },
  minimum_meaningful_delta: {
    type: "number" as const,
    description:
      "Minimum meaningful delta for the primary metric. Required for consequential dispatches.",
  },
  comparison_window: {
    type: "string" as const,
    description:
      "Optional observation window such as '14d post-change' or 'next 2 service weeks'.",
  },
  risk_trust_compliance_notes: {
    type: "string" as const,
    description:
      "Optional risk, trust, or compliance notes that should stay attached to the review debt.",
  },
  actor: {
    type: "string" as const,
    description:
      "Optional actor label for the dispatch, such as 'Al Boreland' or a named operator.",
  },
  lane_id: {
    type: "string" as const,
    description:
      "Optional lane identifier if the dispatch affects a specific lane contract.",
  },
  authority_level: {
    type: "string" as const,
    description:
      "Optional authority posture such as recommend, execute_if_safe, or human_approval_required.",
  },
  board_feed_impact: {
    type: "string" as const,
    description:
      "Optional note when the dispatch changes board-feed behavior, escalation, or approval routing.",
  },
};
/* ------------------------------------------------------------------ */
/*  Tool definitions                                                   */
/* ------------------------------------------------------------------ */

/* Native Anthropic server-side tools — Claude handles search/fetch internally */
const NATIVE_TOOLS: any[] = [
  { type: "web_search_20260209", name: "web_search", max_uses: 10, allowed_callers: ["direct"] },
  { type: "web_fetch_20260209", name: "web_fetch", max_uses: 5, allowed_callers: ["direct"] },
];

const OPENAI_HOSTED_TOOLS = [
  { type: "web_search_preview" as const, search_context_size: "high" as const },
];

const OPENAI_EXTRA_TOOLS = [
  {
    name: "web_fetch",
    description:
      "Fetch the content of a URL and return a readable text summary of the page contents. Use this when you already know the exact URL and need the body, specs, pricing details, or page copy.",
    input_schema: {
      type: "object" as const,
      properties: {
        url: {
          type: "string",
          description: "Absolute HTTP or HTTPS URL to fetch.",
        },
      },
      required: ["url"],
    },
  },
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
      "Delegate a task to one of your two company CEOs. Canonical business ids are dominion and wrenchready. The external runtime still stores Dominion under the stable alias dominion-homes until the remote delegation contract is migrated.",
    input_schema: {
      type: "object" as const,
      properties: {
        ceo: {
          type: "string",
          description:
            "CEO identifier: 'dominion' (preferred canonical id, stored as runtime alias 'dominion-homes'), 'dominion-homes', or 'wrenchready'",
          enum: ["dominion", "dominion-homes", "wrenchready"],
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
        ...REVIEW_DISPATCH_SCHEMA_PROPERTIES,
      },
      required: ["ceo", "task"],
    },
  },
  {
    name: "cowork_task",
    description:
      "Execute a real code or file task using Claude Agent SDK running locally on Dez's machine. Has full access to Read, Write, Edit, Bash, Glob, Grep tools and can git commit/push. Use for: building pages, editing code, fixing bugs, writing files, git operations, running scripts. Domains: 'dominionhomedeals' (default), 'wrench-ready', 'sentinel'. This runs a real Claude Code agent — not reasoning, actual execution. Bridge must be connected. This is not a browser/vendor/cart automation lane unless the live bridge capability block says browser_automation is available.",
    input_schema: {
      type: "object" as const,
      properties: {
        task: {
          type: "string",
          description:
            "Precise description of what to build, fix, or execute. Include file paths, requirements, and expected outcome. The more specific, the better the result.",
        },
        domain: {
          type: "string",
          description:
            "Which repo to work in. Defaults to 'dominionhomedeals'. Options: 'dominionhomedeals', 'wrench-ready', 'sentinel'.",
          enum: ["dominionhomedeals", "wrench-ready", "sentinel"],
        },
        ...REVIEW_DISPATCH_SCHEMA_PROPERTIES,
      },
      required: ["task"],
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
            "Relative to bridge VAULT_PATH (often Desktop). Always include the vault folder prefix, e.g. 'al-boreland-vault/02-Doctrine' or '.' to list bridge root.",
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
            "Relative to bridge root. Full example: 'al-boreland-vault/02-Doctrine/AL-Boreland-True-North.md' - not 02-Doctrine/... alone.",
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
        ...REVIEW_DISPATCH_SCHEMA_PROPERTIES,
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
  {
    name: "deep_research",
    description:
      "Route a complex research task to the local AL executor, which now uses OpenAI-first reasoning with live web search. Use this for deep multi-step research, long analysis, or planning work that should run outside the chairman chat turn. It is not the primary execution lane for browser/vendor/cart workflows.",
    input_schema: {
      type: "object" as const,
      properties: {
        task: {
          type: "string",
          description:
            "Detailed description of the research or work to perform. Be specific — the executor works autonomously and returns a complete answer.",
        },
      },
      required: ["task"],
    },
  },
  {
    name: "job_status",
    description:
      "Check the status of one or more async delegations or background jobs. Use this when Dez asks 'what happened with that delegation?' or 'is the CEO done yet?'. Returns status (pending/running/done/error) and the result if complete. Omit job_id to list all recent jobs.",
    input_schema: {
      type: "object" as const,
      properties: {
        job_id: {
          type: "number",
          description: "Specific job ID to check. Omit to list the 10 most recent jobs.",
        },
      },
      required: [],
    },
  },
  {
    name: "cursor_agent",
    description:
      "Send a coding task to Cursor's Cloud Agent (Composer 2) to execute autonomously on the dominionhomedeals repository. Use this for: building or improving property listing pages, UX/front-end work, React/Next.js/Tailwind changes, multi-file refactors, or any code task that requires the full IDE context. The agent runs in the background on the GitHub repo and opens a PR when done. Returns a job ID you can use to check status.",
    input_schema: {
      type: "object" as const,
      properties: {
        task: {
          type: "string",
          description: "Clear, specific coding task description. Include: what to build/change, which files or routes are affected, any design constraints, and acceptance criteria.",
        },
        repo: {
          type: "string",
          description: "GitHub repository in owner/repo format. Default: the dominionhomedeals repo.",
        },
        model: {
          type: "string",
          description: "Model to use. Default: composer-2. Options: composer-2, claude-sonnet-4-5.",
        },
        ...REVIEW_DISPATCH_SCHEMA_PROPERTIES,
      },
      required: ["task"],
    },
  },
  {
    name: "media_production",
    description:
      "Run local brand media production from source photos. Generates review-ready assets for website use (including short video/GIF when configured) and returns a review page link. Default source folder: C:\\Users\\adamd\\Desktop\\Simon\\simon.",
    input_schema: {
      type: "object" as const,
      properties: {
        source_dir: {
          type: "string",
          description:
            "Absolute local path to source photos. Defaults to C:\\Users\\adamd\\Desktop\\Simon\\simon if omitted.",
        },
        business_id: {
          type: "string",
          description: "Business context for this media package.",
          enum: ["wrenchready", "dominion"],
        },
        asset_goal: {
          type: "string",
          description:
            "Optional brief describing desired assets (example: hero still + GIF + 10s intro clip).",
        },
        creative_direction: {
          type: "string",
          description:
            "Optional creative direction, for example 'bold performance', 'premium trust', or 'friendly local'.",
        },
        variation_count: {
          type: "number",
          description:
            "Optional number of creative options to explore (default 3, max 4).",
        },
        style_guardrails: {
          type: "string",
          description:
            "Optional style rules to enforce while keeping creative freedom (for example brand colors, realism, no text overlays).",
        },
      },
      required: [],
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
    name === "crew_status" ||
    name === "deep_research" ||
    name === "cowork_task" ||
    name === "media_production"
    // job_status and delegate_to_ceo are server-side — NOT bridge tools
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
  provider?: "openai" | "anthropic";
  previousResponseId?: string;
  assistantBlocks: unknown[];
  precomputedResults: unknown[];
  toolResults: unknown[];
  bridgeJobs?: { toolUseId: string; name: string; jobId: number }[];
}

type ImageMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";
type DispatchExpectedDirection = "increase" | "decrease" | "hold";
type DispatchSourceTool =
  | "delegate_to_ceo"
  | "cursor_agent"
  | "cowork_task"
  | "crew_run"
  | "browser_commerce_design";
type DispatchBusinessId = "dominion" | "wrenchready";

interface BridgeCapabilities {
  executor_online?: boolean;
  deep_research?: boolean;
  cowork_execution?: boolean;
  browser_automation?: boolean;
  vendor_site_access?: boolean;
  design_mockup?: boolean;
  screenshot_capture?: boolean;
  cart_preparation?: boolean;
  review_checkpoint?: boolean;
  media_generation?: boolean;
  media_runway?: boolean;
  media_gif_export?: boolean;
}

type ChatTaskClass = "browser_commerce_design";

interface TaskClassification {
  taskClass: ChatTaskClass;
  businessId: DispatchBusinessId;
  owner: string;
  laneId: string;
  preferredExecutionPath: string;
  summary: string;
  reviewCheckpointRequired: boolean;
}

interface TaskPathAssessment {
  executable: boolean;
  selectedExecutionPath: string;
  fallbackExecutionPath: string | null;
  missingAccess: string[];
  operatorMessage: string;
  hostedBrowser: HostedBrowserAvailability;
  localBrowser: {
    available: boolean;
    missingAccess: string[];
  };
}

interface BrowserCommerceBridgeResult {
  ok?: boolean;
  status?: string;
  task_class?: string;
  lane_id?: string;
  business_id?: string;
  preferred_execution_path?: string;
  selected_execution_path?: string;
  review_checkpoint_required?: boolean;
  missing_access?: string[];
  operator_message?: string;
  summary?: string;
  next_action?: string;
  vendor_options?: Array<Record<string, unknown>>;
  design_candidates?: Array<Record<string, unknown>>;
  chosen_design?: Record<string, unknown> | null;
  chosen_option?: Record<string, unknown> | null;
  artifacts?: Record<string, unknown> | null;
  cart_url?: string | null;
  proof_url?: string | null;
  review_page_url?: string | null;
  resume_cart_url?: string | null;
  resume_proof_url?: string | null;
  review_state?: string | null;
  review_surface?: Record<string, unknown> | null;
  link_support?: Record<string, unknown> | null;
  hosted_session_id?: string | null;
  hosted_session_url?: string | null;
  hosted_debugger_url?: string | null;
  hosted_debugger_fullscreen_url?: string | null;
  error?: string;
}

interface DispatchMetadata {
  review_required: boolean;
  business_id: DispatchBusinessId | null;
  owner: string | null;
  change_under_review?: string;
  intended_business_outcome?: string;
  primary_metric?: string;
  expected_direction?: DispatchExpectedDirection;
  minimum_meaningful_delta?: number;
  source_type: "run";
  source_tool: DispatchSourceTool;
  runtime_ref_hint: string;
  comparison_window?: string;
  risk_trust_compliance_notes?: string;
  actor?: string;
  lane_id?: string;
  authority_level?: string;
  board_feed_impact?: string;
}

type OpenAIInputItem = Record<string, unknown>;

interface OpenAIFunctionCall {
  id: string;
  callId: string;
  name: string;
  argumentsJson: string;
}

const CONSEQUENTIAL_DISPATCH_PATTERN =
  /\b(deploy(?:ment)?|rollout|release|routing|board[- ]feed|authority|approval|permission|zone\s*[1-4]|spend|budget|pricing|bid|lane status|service lane|capacity|dispatch state)\b/i;

const BROWSER_COMMERCE_DESIGN_PATTERN =
  /\b(sign(?:age|s)?|van wrap|vehicle wrap|vinyl|decal|sticker|magnet|advertising sign|mockup|design .*cart|add to cart|cart|checkout|vendor|proof|preview|pricing|price|dimensions?|fit)\b/i;
const WRENCHREADY_BRANDING_PATTERN =
  /\b(wrenchready|astro van|2001 astro|service van|vehicle branding|wrap the van|magnet sign)\b/i;
const ANTHROPIC_BILLING_ERROR_PATTERN =
  /\b(credit balance|insufficient credits|billing|payment required|402|quota|rate limit exceeded for billing)\b/i;
type BrowserRuntimePreference =
  | "browserbase_first"
  | "local_bridge_first"
  | "hosted_only"
  | "local_only";

function readBrowserRuntimePreference(): BrowserRuntimePreference {
  const raw = (process.env.AL_BROWSER_RUNTIME || "browserbase_first")
    .trim()
    .toLowerCase();
  if (
    raw === "browserbase_first" ||
    raw === "local_bridge_first" ||
    raw === "hosted_only" ||
    raw === "local_only"
  ) {
    return raw;
  }
  return "browserbase_first";
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function classifyTaskForRouting(message: string): TaskClassification | null {
  const normalized = message.trim();
  if (!normalized) {
    return null;
  }

  if (
    BROWSER_COMMERCE_DESIGN_PATTERN.test(normalized) &&
    WRENCHREADY_BRANDING_PATTERN.test(normalized)
  ) {
    return {
      taskClass: "browser_commerce_design",
      businessId: "wrenchready",
      owner: "Tom",
      laneId: "wrenchready-branding-commerce",
      preferredExecutionPath: HOSTED_BROWSER_EXECUTION_PATH,
      summary: normalizeConsequentialChange(normalized, 180),
      reviewCheckpointRequired: true,
    };
  }

  return null;
}

function assessBrowserCommercePath(
  bridgeConnected: boolean,
  capabilities?: BridgeCapabilities | null,
): TaskPathAssessment {
  const hostedBrowser = inspectHostedBrowserVendorCartReviewStack();
  const localMissingAccess: string[] = [];
  if (!bridgeConnected) {
    localMissingAccess.push("local bridge connection");
  }
  if (!capabilities?.browser_automation) {
    localMissingAccess.push("browser automation");
  }
  if (!capabilities?.vendor_site_access) {
    localMissingAccess.push("vendor site access");
  }
  if (!capabilities?.design_mockup) {
    localMissingAccess.push("design/mockup capability");
  }
  if (!capabilities?.screenshot_capture) {
    localMissingAccess.push("screenshot capture");
  }
  if (!capabilities?.cart_preparation) {
    localMissingAccess.push("cart preparation");
  }
  if (!capabilities?.review_checkpoint) {
    localMissingAccess.push("review checkpoint support");
  }

  const localBrowser = {
    available: localMissingAccess.length === 0,
    missingAccess: localMissingAccess,
  };
  const preference = readBrowserRuntimePreference();

  const executable =
    hostedBrowser.available ||
    (preference !== "hosted_only" && localBrowser.available);
  let selectedExecutionPath = "blocked:browser_vendor_cart_review";
  let fallbackExecutionPath: string | null = null;
  let missingAccess = hostedBrowser.missingAccess.slice();

  if (preference === "local_only") {
    if (localBrowser.available) {
      selectedExecutionPath = LOCAL_BROWSER_EXECUTION_PATH;
      missingAccess = hostedBrowser.missingAccess.slice();
    } else {
      missingAccess = localBrowser.missingAccess.slice();
    }
  } else if (preference === "hosted_only") {
    if (hostedBrowser.available) {
      selectedExecutionPath = HOSTED_BROWSER_EXECUTION_PATH;
      fallbackExecutionPath = null;
      missingAccess = [];
    } else {
      missingAccess = hostedBrowser.missingAccess.slice();
    }
  } else if (preference === "local_bridge_first") {
    if (localBrowser.available) {
      selectedExecutionPath = LOCAL_BROWSER_EXECUTION_PATH;
      fallbackExecutionPath = hostedBrowser.available
        ? HOSTED_BROWSER_EXECUTION_PATH
        : null;
      missingAccess = hostedBrowser.missingAccess.slice();
    } else if (hostedBrowser.available) {
      selectedExecutionPath = HOSTED_BROWSER_EXECUTION_PATH;
      missingAccess = localBrowser.missingAccess.slice();
    } else {
      missingAccess = [
        ...hostedBrowser.missingAccess,
        ...localBrowser.missingAccess,
      ];
    }
  } else {
    if (hostedBrowser.available) {
      selectedExecutionPath = HOSTED_BROWSER_EXECUTION_PATH;
      fallbackExecutionPath = localBrowser.available
        ? LOCAL_BROWSER_EXECUTION_PATH
        : null;
      missingAccess = [];
    } else if (localBrowser.available) {
      selectedExecutionPath = LOCAL_BROWSER_EXECUTION_PATH;
      missingAccess = hostedBrowser.missingAccess.slice();
    } else {
      missingAccess = [
        ...hostedBrowser.missingAccess,
        ...localBrowser.missingAccess,
      ];
    }
  }

  let operatorMessage = "";
  if (!executable) {
    operatorMessage =
      "Vendor/design lane blocked: neither browser runtime is currently usable. " +
      `Hosted Browserbase/Stagehand missing: ${hostedBrowser.missingAccess.join(", ") || "none"}. ` +
      `Local bridge/browser missing: ${localBrowser.missingAccess.join(", ") || "none"}. ` +
      "This job needs browser automation, vendor-site control, screenshot capture, cart preparation, and a review checkpoint before checkout.";
  }

  return {
    executable,
    selectedExecutionPath,
    fallbackExecutionPath:
      fallbackExecutionPath ||
      (selectedExecutionPath !== LOCAL_BROWSER_EXECUTION_PATH &&
      bridgeConnected &&
      capabilities?.cowork_execution
        ? "bridge:cowork_task (planning only, no vendor cart control)"
        : null),
    missingAccess,
    operatorMessage,
    hostedBrowser,
    localBrowser,
  };
}

function buildBridgeCapabilityPrompt(
  bridgeConnected: boolean,
  capabilities?: BridgeCapabilities | null,
): string {
  const hostedBrowser = inspectHostedBrowserVendorCartReviewStack();
  const values = {
    bridge_connected: bridgeConnected,
    executor_online: capabilities?.executor_online === true,
    deep_research: capabilities?.deep_research === true,
    cowork_execution: capabilities?.cowork_execution === true,
    browser_automation: capabilities?.browser_automation === true,
    vendor_site_access: capabilities?.vendor_site_access === true,
    design_mockup: capabilities?.design_mockup === true,
    screenshot_capture: capabilities?.screenshot_capture === true,
    cart_preparation: capabilities?.cart_preparation === true,
    review_checkpoint: capabilities?.review_checkpoint === true,
    media_generation: capabilities?.media_generation === true,
    media_runway: capabilities?.media_runway === true,
    media_gif_export: capabilities?.media_gif_export === true,
    hosted_browser_available: hostedBrowser.available,
  };

  return `\n\nLIVE EXECUTION CAPABILITIES FOR THIS SESSION:
- bridge_connected: ${values.bridge_connected ? "yes" : "no"}
- executor_online: ${values.executor_online ? "yes" : "no"}
- deep_research: ${values.deep_research ? "yes" : "no"}
- cowork_execution: ${values.cowork_execution ? "yes" : "no"}
- browser_automation: ${values.browser_automation ? "yes" : "no"}
- vendor_site_access: ${values.vendor_site_access ? "yes" : "no"}
- design_mockup: ${values.design_mockup ? "yes" : "no"}
- screenshot_capture: ${values.screenshot_capture ? "yes" : "no"}
- cart_preparation: ${values.cart_preparation ? "yes" : "no"}
- review_checkpoint: ${values.review_checkpoint ? "yes" : "no"}
- media_generation: ${values.media_generation ? "yes" : "no"}
- media_runway: ${values.media_runway ? "yes" : "no"}
- media_gif_export: ${values.media_gif_export ? "yes" : "no"}
- hosted_browser_available: ${values.hosted_browser_available ? "yes" : "no"}
- hosted_browser_missing: ${hostedBrowser.missingAccess.join(", ") || "none"}

If browser_automation, vendor_site_access, design_mockup, screenshot_capture, or cart_preparation is no, you do not have a live vendor/cart lane. Do not promise browser/vendor execution. State the exact missing access instead.`;
}

function looksLikeAnthropicBillingError(message: string): boolean {
  return ANTHROPIC_BILLING_ERROR_PATTERN.test(message);
}

function streamingTextResponse(text: string): Response {
  const payload = `data: ${JSON.stringify({ t: text })}\n\ndata: [DONE]\n\n`;
  return new Response(payload, { headers: sseHeaders() });
}

function extractBase64(dataUri: string): string {
  const idx = dataUri.indexOf(",");
  return idx >= 0 ? dataUri.slice(idx + 1) : dataUri;
}

function asNonEmptyString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function asDispatchBusinessId(value: unknown): DispatchBusinessId | undefined {
  return value === "dominion" || value === "wrenchready" ? value : undefined;
}

function asDispatchDirection(value: unknown): DispatchExpectedDirection | undefined {
  return value === "increase" || value === "decrease" || value === "hold"
    ? value
    : undefined;
}

function asFiniteNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function asBoolean(value: unknown): boolean {
  return value === true;
}

function defaultDispatchOwner(businessId: DispatchBusinessId | null): string {
  if (businessId === "dominion") return "Jerry";
  if (businessId === "wrenchready") return "Tom";
  return "AL";
}

function normalizeDispatchOwner(
  owner: string | undefined,
  businessId: DispatchBusinessId | null,
): string {
  if (!owner) {
    return defaultDispatchOwner(businessId);
  }

  const normalized = owner.trim();
  if (!normalized) {
    return defaultDispatchOwner(businessId);
  }

  const lowered = normalized.toLowerCase();
  if (lowered === "dominion ceo") {
    return "Jerry";
  }
  if (lowered === "wrenchready ceo") {
    return "Tom";
  }

  return normalized;
}

function inferBusinessIdFromDomain(domain: string | undefined): DispatchBusinessId | null {
  if (!domain) return null;
  if (domain.toLowerCase().includes("wrench")) return "wrenchready";
  if (domain.toLowerCase().includes("dominion")) return "dominion";
  return null;
}

function inferBusinessIdFromRepo(repo: string | undefined): DispatchBusinessId | null {
  return inferBusinessIdFromDomain(repo);
}

function inferBusinessIdFromCrew(crew: string | undefined): DispatchBusinessId | null {
  if (!crew) return null;
  const normalized = crew.toLowerCase();
  if (normalized.includes("wrench")) return "wrenchready";
  if (normalized.includes("tax-scout") || normalized.includes("tax") || normalized.includes("dominion")) {
    return "dominion";
  }
  return null;
}

function normalizeConsequentialChange(value: string, limit = 160): string {
  const trimmed = value.trim();
  if (trimmed.length <= limit) {
    return trimmed;
  }

  return `${trimmed.slice(0, limit - 3)}...`;
}

function buildDispatchMetadata(input: {
  sourceTool: DispatchSourceTool;
  toolInput: Record<string, unknown>;
  defaultBusinessId: DispatchBusinessId | null;
  runtimeRefHint: string;
  fallbackChangeUnderReview: string;
  heuristicText?: string;
  enforceHeuristicConsequential?: boolean;
}): DispatchMetadata {
  const businessId =
    asDispatchBusinessId(input.toolInput.business_id) ?? input.defaultBusinessId;
  const owner = normalizeDispatchOwner(
    asNonEmptyString(input.toolInput.owner),
    businessId,
  );
  const explicitReviewRequired = asBoolean(input.toolInput.review_required);
  const hasAnyReviewFields = Boolean(
    asNonEmptyString(input.toolInput.change_under_review) ||
      asNonEmptyString(input.toolInput.intended_business_outcome) ||
      asNonEmptyString(input.toolInput.primary_metric) ||
      asDispatchDirection(input.toolInput.expected_direction) ||
      asFiniteNumber(input.toolInput.minimum_meaningful_delta) !== undefined,
  );
  const heuristicConsequential =
    input.enforceHeuristicConsequential === true &&
    Boolean(input.heuristicText) &&
    CONSEQUENTIAL_DISPATCH_PATTERN.test(input.heuristicText ?? "");
  const reviewRequired = explicitReviewRequired || hasAnyReviewFields || heuristicConsequential;

  const changeUnderReview =
    asNonEmptyString(input.toolInput.change_under_review) ??
    (reviewRequired ? normalizeConsequentialChange(input.fallbackChangeUnderReview) : undefined);
  const intendedBusinessOutcome = asNonEmptyString(input.toolInput.intended_business_outcome);
  const primaryMetric = asNonEmptyString(input.toolInput.primary_metric);
  const expectedDirection = asDispatchDirection(input.toolInput.expected_direction);
  const minimumMeaningfulDelta = asFiniteNumber(input.toolInput.minimum_meaningful_delta);
  const comparisonWindow = asNonEmptyString(input.toolInput.comparison_window);
  const riskTrustComplianceNotes = asNonEmptyString(
    input.toolInput.risk_trust_compliance_notes,
  );

  if (reviewRequired) {
    const missingFields: string[] = [];

    if (!businessId) missingFields.push("business_id");
    if (!owner) missingFields.push("owner");
    if (!changeUnderReview) missingFields.push("change_under_review");
    if (!intendedBusinessOutcome) missingFields.push("intended_business_outcome");
    if (!primaryMetric) missingFields.push("primary_metric");
    if (!expectedDirection) missingFields.push("expected_direction");
    if (minimumMeaningfulDelta === undefined) {
      missingFields.push("minimum_meaningful_delta");
    } else if (
      expectedDirection &&
      expectedDirection !== "hold" &&
      minimumMeaningfulDelta <= 0
    ) {
      missingFields.push("minimum_meaningful_delta (> 0 required for increase/decrease)");
    }

    if (missingFields.length > 0) {
      throw new Error(
        `Consequential ${input.sourceTool} dispatches must include structured review metadata. Missing: ${missingFields.join(
          ", ",
        )}.`,
      );
    }
  }

  const metadata: DispatchMetadata = {
    review_required: reviewRequired,
    business_id: businessId,
    owner: owner || null,
    source_type: "run",
    source_tool: input.sourceTool,
    runtime_ref_hint: input.runtimeRefHint,
  };

  if (changeUnderReview) metadata.change_under_review = changeUnderReview;
  if (intendedBusinessOutcome) metadata.intended_business_outcome = intendedBusinessOutcome;
  if (primaryMetric) metadata.primary_metric = primaryMetric;
  if (expectedDirection) metadata.expected_direction = expectedDirection;
  if (minimumMeaningfulDelta !== undefined) {
    metadata.minimum_meaningful_delta = minimumMeaningfulDelta;
  }
  if (comparisonWindow) metadata.comparison_window = comparisonWindow;
  if (riskTrustComplianceNotes) {
    metadata.risk_trust_compliance_notes = riskTrustComplianceNotes;
  }

  const actor = asNonEmptyString(input.toolInput.actor);
  const laneId = asNonEmptyString(input.toolInput.lane_id);
  const authorityLevel = asNonEmptyString(input.toolInput.authority_level);
  const boardFeedImpact = asNonEmptyString(input.toolInput.board_feed_impact);

  if (actor) metadata.actor = actor;
  if (laneId) metadata.lane_id = laneId;
  if (authorityLevel) metadata.authority_level = authorityLevel;
  if (boardFeedImpact) metadata.board_feed_impact = boardFeedImpact;

  return metadata;
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

  // Push to GitHub via n8n and upsert to vault_documents in parallel
  const section = path.split("/")[0] || "misc";
  const supabase = getServiceClient();

  const [res] = await Promise.all([
    fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, content }),
    }),
    supabase
      ? supabase.from("vault_documents").upsert(
          { path, section, content, updated_at: new Date().toISOString() },
          { onConflict: "path" }
        )
      : Promise.resolve(null),
  ]);

  if (!res.ok) return `Vault publish failed (${res.status}). The n8n workflow may be inactive.`;
  return `Published to vault: ${path}`;
}

function extractToolResultText(content: unknown): string {
  if (
    content &&
    typeof content === "object" &&
    "output" in content &&
    typeof (content as { output?: unknown }).output === "string"
  ) {
    return String((content as { output: string }).output);
  }

  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (
          item &&
          typeof item === "object" &&
          "type" in item &&
          (item as { type?: string }).type === "text" &&
          "text" in item
        ) {
          return String((item as { text?: string }).text || "");
        }
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }

  return "";
}

function toolResultLooksLikeError(result: unknown): boolean {
  if (
    result &&
    typeof result === "object" &&
    "is_error" in result &&
    Boolean((result as { is_error?: boolean }).is_error)
  ) {
    return true;
  }

  const content =
    result && typeof result === "object" && "content" in result
      ? (result as { content?: unknown }).content
      : result;
  const text = extractToolResultText(content);
  return /^(Error:|Cowork failed:|Cowork error:|Bridge connection failed:)/i.test(text);
}

async function createAccountabilityJob(input: {
  jobType: string;
  task: string;
  context?: Record<string, unknown>;
  status?: "pending" | "running" | "done" | "error";
}): Promise<{ jobId: number } | { error: string }> {
  const supabase = getServiceClient();
  if (!supabase) return { error: "no database connection" };

  const timestamp = new Date().toISOString();
  const { data, error } = await supabase
    .from("al_jobs")
    .insert({
      job_type: input.jobType,
      task: input.task,
      context: input.context ? JSON.stringify(input.context) : null,
      status: input.status || "pending",
      triggered_by: "al_chat",
      started_at: timestamp,
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    return { error: error?.message || "unknown accountability insert error" };
  }

  return { jobId: data.id as number };
}

async function completeAccountabilityJob(input: {
  jobId: number;
  result: string;
  isError: boolean;
  context?: Record<string, unknown>;
}): Promise<void> {
  const supabase = getServiceClient();
  if (!supabase) return;

  const payload = input.isError
    ? {
        status: "error",
        error_msg: input.result,
        completed_at: new Date().toISOString(),
      }
    : {
        status: "done",
        result: input.result,
        completed_at: new Date().toISOString(),
      };

  if (input.context) {
    Object.assign(payload, {
      context: JSON.stringify(input.context),
    });
  }

  await supabase.from("al_jobs").update(payload).eq("id", input.jobId);
}

async function updateAccountabilityJobContext(
  jobId: number,
  context: Record<string, unknown>,
): Promise<void> {
  const supabase = getServiceClient();
  if (!supabase) return;

  await supabase
    .from("al_jobs")
    .update({ context: JSON.stringify(context) })
    .eq("id", jobId);
}

async function recordBrowserCommerceRoutingOutcome(input: {
  task: string;
  classification: TaskClassification;
  assessment: TaskPathAssessment;
  bridgeConnected: boolean;
  bridgeCapabilities?: BridgeCapabilities | null;
}): Promise<void> {
  const accountability = await createAccountabilityJob({
    jobType: "browser_commerce_design",
    task: input.task,
    context: buildBrowserCommerceExecutionContext({
      task: input.task,
      classification: input.classification,
      assessment: input.assessment,
      bridgeConnected: input.bridgeConnected,
      bridgeCapabilities: input.bridgeCapabilities,
    }),
    status: "running",
  });

  if ("error" in accountability) {
    return;
  }

  await completeAccountabilityJob({
    jobId: accountability.jobId,
    result: input.assessment.operatorMessage,
    isError: !input.assessment.executable,
  });
}

function buildBrowserCommerceDispatchMetadata(
  task: string,
  classification: TaskClassification,
): DispatchMetadata {
  return {
    review_required: true,
    business_id: classification.businessId,
    owner: classification.owner,
    change_under_review: classification.summary,
    intended_business_outcome:
      "Increase qualified WrenchReady service inquiries from vehicle branding that can be reviewed before spend or purchase approval.",
    primary_metric: "qualified_service_inquiries_per_month",
    expected_direction: "increase",
    minimum_meaningful_delta: 2,
    source_type: "run",
    source_tool: "browser_commerce_design",
    runtime_ref_hint: `browser_commerce_design:${normalizeConsequentialChange(task, 80)}`,
    comparison_window: "30d after van signage installation",
    risk_trust_compliance_notes:
      "Stop at cart review before checkout or purchase submission. Do not auto-purchase.",
    actor: "Al Boreland",
    lane_id: classification.laneId,
    authority_level: "recommend",
    board_feed_impact: "Cart review required before purchase approval.",
  };
}

function buildBrowserCommerceExecutionContext(input: {
  task: string;
  classification: TaskClassification;
  assessment: TaskPathAssessment;
  bridgeConnected: boolean;
  bridgeCapabilities?: BridgeCapabilities | null;
}): Record<string, unknown> {
  return {
    task_class: input.classification.taskClass,
    business_id: input.classification.businessId,
    owner: input.classification.owner,
    lane_id: input.classification.laneId,
    preferred_execution_path: input.classification.preferredExecutionPath,
    selected_execution_path: input.assessment.selectedExecutionPath,
    fallback_execution_path: input.assessment.fallbackExecutionPath,
    missing_access: input.assessment.missingAccess,
    bridge_connected: input.bridgeConnected,
    bridge_capabilities: input.bridgeCapabilities || null,
    hosted_browser_status: input.assessment.hostedBrowser.runtimeStatus,
    hosted_browser_missing_access: input.assessment.hostedBrowser.missingAccess,
    hosted_browser_details: input.assessment.hostedBrowser.details,
    local_browser_available: input.assessment.localBrowser.available,
    local_browser_missing_access: input.assessment.localBrowser.missingAccess,
    review_checkpoint_required: input.classification.reviewCheckpointRequired,
    execution_status: input.assessment.executable ? "running" : "blocked",
    summary: input.classification.summary,
    dispatch_metadata: buildBrowserCommerceDispatchMetadata(
      input.task,
      input.classification,
    ),
  };
}

function parseBrowserCommerceBridgeResult(raw: string): BrowserCommerceBridgeResult | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as BrowserCommerceBridgeResult;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

interface CanonicalRecommendedOption {
  vendor: string;
  design_name: string;
  dimensions: string;
  quantity: number;
  material: string;
  estimated_total: string;
  cart_status: string;
  why_selected: string;
  review_page_url: string | null;
  proof_url: string | null;
  replay_url: string | null;
  uncertainty_notes: string[];
}

interface NormalizedAlternativeOption {
  vendor: string;
  approximate_price: string;
  size_spec_fit: string;
  material: string;
  review_readiness: string;
  note: string;
}

interface BrowserCommerceExecutiveBrief {
  text: string;
  recommendedOption: Record<string, unknown> | null;
  alternatives: NormalizedAlternativeOption[];
  nextActions: string[];
  operatorLinks: Array<Record<string, unknown>>;
}

interface ExecutiveBriefLink {
  label: string;
  url: string;
  priority: "primary" | "secondary";
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asBriefString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asBriefStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter((entry) => entry.length > 0);
}

function shortText(value: string, maxLength = 140): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(0, maxLength - 1)).trimEnd()}...`;
}

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const value of values) {
    const normalized = value.toLowerCase();
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    output.push(value);
  }
  return output;
}

function extractMaterialGrade(value: string | null): string | null {
  if (!value) return null;
  const match = value.match(/0\.(?:030|045)/);
  return match ? match[0] : null;
}

function parseQuantityFromUrls(urls: Array<string | null | undefined>): number | null {
  for (const raw of urls) {
    const value = asBriefString(raw);
    if (!value) continue;
    try {
      const parsed = new URL(value, "https://placeholder.local");
      const quantity = Number(parsed.searchParams.get("quantity"));
      if (Number.isFinite(quantity) && quantity > 0) {
        return Math.round(quantity);
      }
    } catch {
      // Ignore malformed URLs and continue.
    }
  }
  return null;
}

function pickVendorOption(
  vendorOptions: Array<Record<string, unknown>>,
  vendorName: string,
): Record<string, unknown> | null {
  const normalizedTarget = vendorName.toLowerCase();
  for (const option of vendorOptions) {
    const optionVendor = asBriefString(option.vendor);
    if (optionVendor && optionVendor.toLowerCase() === normalizedTarget) {
      return option;
    }
  }
  return vendorOptions[0] || null;
}

function buildCanonicalRecommendedOption(
  result: BrowserCommerceBridgeResult,
): CanonicalRecommendedOption {
  const chosenOption = asRecord(result.chosen_option);
  const chosenDesign = asRecord(result.chosen_design);
  const vendorOptions = (Array.isArray(result.vendor_options)
    ? result.vendor_options
    : []) as Array<Record<string, unknown>>;
  const linkSupport = asRecord(result.link_support);
  const reviewSurface = asRecord(result.review_surface);

  const vendor =
    asBriefString(chosenOption.vendor) ||
    asBriefString(vendorOptions[0]?.vendor) ||
    "Vendor pending verification";
  const selectedVendorOption = pickVendorOption(vendorOptions, vendor);
  const selectedSizes = selectedVendorOption
    ? asBriefStringArray(selectedVendorOption.size_signals)
    : [];
  const selectedMaterials = selectedVendorOption
    ? asBriefStringArray(selectedVendorOption.material_signals)
    : [];

  const dimensions =
    asBriefString(chosenOption.dimensions) ||
    selectedSizes.find((size) => size.includes('24" x 18"')) ||
    selectedSizes[0] ||
    '24" x 18"';

  const quantity =
    (typeof chosenOption.quantity === "number" &&
    Number.isFinite(chosenOption.quantity) &&
    chosenOption.quantity > 0
      ? Math.round(chosenOption.quantity)
      : null) ||
    parseQuantityFromUrls([
      asBriefString(result.proof_url),
      asBriefString(result.cart_url),
      asBriefString(chosenOption.cart_url),
    ]) ||
    2;

  const material =
    asBriefString(chosenOption.material) ||
    selectedMaterials[0] ||
    "material uncertain";

  const estimatedTotal =
    asBriefString(chosenOption.estimated_total) ||
    asBriefString(chosenOption.item_price) ||
    "details incomplete";

  const cartStatus =
    asBriefString(chosenOption.cart_status) ||
    asBriefString(result.review_state) ||
    "added_to_cart_waiting_review";

  const reviewPageUrl =
    asBriefString(result.review_page_url) ||
    asBriefString(reviewSurface.hosted_review_url) ||
    null;
  const proofUrl =
    asBriefString(result.proof_url) ||
    asBriefString(reviewSurface.proof_url) ||
    null;
  const replayUrl =
    asBriefString(result.hosted_debugger_fullscreen_url) ||
    asBriefString(result.hosted_session_url) ||
    asBriefString(reviewSurface.hosted_debugger_fullscreen_url) ||
    asBriefString(reviewSurface.hosted_session_url) ||
    null;

  const rawReason =
    asBriefString(chosenOption.why_selected) ||
    asBriefString(chosenOption.why_best);
  const reasonGrade = extractMaterialGrade(rawReason);
  const canonicalGrade = extractMaterialGrade(material);
  const reasonMaterialConflict =
    Boolean(reasonGrade) &&
    Boolean(canonicalGrade) &&
    reasonGrade !== canonicalGrade;

  const uncertaintyNotes: string[] = [];
  if (material.toLowerCase().includes("uncertain")) {
    uncertaintyNotes.push("Material is uncertain in source data.");
  }
  if (estimatedTotal === "details incomplete") {
    uncertaintyNotes.push("Price is incomplete in source data.");
  }
  if (reasonMaterialConflict) {
    uncertaintyNotes.push(
      "Source rationale referenced a different material than the cart-captured option.",
    );
  }

  const whySelected =
    rawReason && !reasonMaterialConflict
      ? rawReason
      : `Selected because ${vendor} reached a review-ready cart state for ${dimensions}, quantity ${quantity}, ${material}${estimatedTotal !== "details incomplete" ? `, estimated total ${estimatedTotal}` : ""}.`;

  return {
    vendor,
    design_name:
      asBriefString(chosenOption.design_name) ||
      asBriefString(chosenDesign.title) ||
      "WrenchReady signage concept",
    dimensions,
    quantity,
    material,
    estimated_total: estimatedTotal,
    cart_status: cartStatus,
    why_selected: whySelected,
    review_page_url: reviewPageUrl,
    proof_url: proofUrl,
    replay_url: replayUrl,
    uncertainty_notes: uncertaintyNotes,
  };
}

function normalizeBrowserCommerceAlternatives(
  result: BrowserCommerceBridgeResult,
  canonical: CanonicalRecommendedOption,
): NormalizedAlternativeOption[] {
  const vendorOptions = (Array.isArray(result.vendor_options)
    ? result.vendor_options
    : []) as Array<Record<string, unknown>>;

  return vendorOptions.slice(0, 4).map((option) => {
    const vendor = asBriefString(option.vendor) || "Vendor";
    const priceSignals = uniqueStrings(asBriefStringArray(option.price_signals)).slice(0, 2);
    const allSizeSignals = uniqueStrings(asBriefStringArray(option.size_signals));
    const sizeSignalsPreview = allSizeSignals.slice(0, 3);
    const materialSignals = uniqueStrings(asBriefStringArray(option.material_signals)).slice(0, 2);
    const notes =
      asBriefString(option.notes) ||
      asBriefString(option.install_fit_note) ||
      "details incomplete";

    const approximatePrice =
      priceSignals.length > 0 ? priceSignals.join(" to ") : "details incomplete";
    const sizeSpecFit =
      allSizeSignals.length === 0
        ? "details incomplete"
        : allSizeSignals.some((size) => size === canonical.dimensions)
          ? `includes ${canonical.dimensions}`
          : sizeSignalsPreview.join(", ");
    const material =
      materialSignals.length > 0 ? materialSignals.join(", ") : "details incomplete";

    let reviewReadiness = "details incomplete";
    if (vendor.toLowerCase() === canonical.vendor.toLowerCase() && result.ok) {
      reviewReadiness = "cart ready for review";
    } else if (option.cart_automation === true) {
      reviewReadiness = "cart path available";
    } else if (option.cart_automation === false) {
      reviewReadiness = "research-ready only";
    }

    return {
      vendor,
      approximate_price: approximatePrice,
      size_spec_fit: sizeSpecFit,
      material,
      review_readiness: reviewReadiness,
      note: shortText(notes, 120),
    };
  });
}

function buildBrowserCommerceNextActions(
  result: BrowserCommerceBridgeResult,
  canonical: CanonicalRecommendedOption | null,
): string[] {
  if (!result.ok || !canonical) {
    return [
      "Reconnect the required browser/vendor lane or run local fallback if available.",
      "Retry the workflow after the blocker is resolved.",
    ];
  }

  return [
    `Approve this design (${canonical.dimensions}, ${canonical.material}, qty ${canonical.quantity}) for checkout readiness.`,
    "Request changes (logo size, service copy, phone, or layout).",
    "Show a cheaper option at similar size/spec fit.",
    "Compare another vendor before checkout readiness.",
    "Re-run with a different size or material.",
    "Prepare checkout after explicit approval (no auto-checkout).",
  ];
}

function toStoredRecommendedOption(option: CanonicalRecommendedOption): Record<string, unknown> {
  return {
    vendor: option.vendor,
    design_name: option.design_name,
    dimensions: option.dimensions,
    quantity: option.quantity,
    material: option.material,
    estimated_total: option.estimated_total,
    cart_status: option.cart_status,
    why_selected: option.why_selected,
    why_best: option.why_selected,
    review_page_url: option.review_page_url,
    proof_url: option.proof_url,
    replay_url: option.replay_url,
    uncertainty_notes: option.uncertainty_notes,
  };
}

function toStoredExecutiveLinks(links: ExecutiveBriefLink[]): Array<Record<string, unknown>> {
  return links.map((link) => ({
    label: link.label,
    url: link.url,
    priority: link.priority,
  }));
}

function buildBrowserCommerceExecutiveBrief(
  result: BrowserCommerceBridgeResult,
): BrowserCommerceExecutiveBrief {
  if (!result.ok) {
    return {
      text:
        result.operator_message ||
        result.error ||
        "Vendor/design lane failed before cart review could be prepared.",
      recommendedOption: null,
      alternatives: [],
      nextActions: [],
      operatorLinks: [],
    };
  }

  const canonical = buildCanonicalRecommendedOption(result);
  const alternatives = normalizeBrowserCommerceAlternatives(result, canonical);
  const nextActions = buildBrowserCommerceNextActions(result, canonical);
  const linkSupport = asRecord(result.link_support);
  const links: ExecutiveBriefLink[] = [];
  if (canonical.review_page_url) {
    links.push({
      label: "Open review page",
      url: canonical.review_page_url,
      priority: "primary",
    });
  }
  if (canonical.proof_url) {
    links.push({
      label: "Open proof",
      url: canonical.proof_url,
      priority: "primary",
    });
  }
  if (canonical.replay_url) {
    links.push({
      label: "Open hosted replay",
      url: canonical.replay_url,
      priority: "secondary",
    });
  }

  const reviewNowLines = [
    canonical.review_page_url
      ? `- [Open review page](${canonical.review_page_url})`
      : "- Review page: details incomplete",
    canonical.proof_url
      ? `- [Open proof](${canonical.proof_url})`
      : "- Open proof: details incomplete",
  ];

  const alternativeLines =
    alternatives.length > 0
      ? alternatives.map(
          (option) =>
            `- ${option.vendor} | approx price ${option.approximate_price} | fit ${option.size_spec_fit} | material ${option.material} | readiness ${option.review_readiness} | note ${option.note}`,
        )
      : ["- details incomplete"];

  const secondaryLines: string[] = [];
  if (canonical.replay_url) {
    secondaryLines.push("- [Open hosted replay](%REPLAY_URL%)");
  }
  const resumeCartUrl = asBriefString(result.resume_cart_url);
  if (resumeCartUrl) {
    secondaryLines.push(`- [Resume local cart session](${resumeCartUrl})`);
  }
  const cartUrl = asBriefString(result.cart_url);
  if (cartUrl) {
    const cartUsable =
      linkSupport.cart_url_cross_session_usable === true ||
      linkSupport.cart_url_usable_cross_session === true;
    if (cartUsable) {
      secondaryLines.push(`- [Open direct cart URL](${cartUrl})`);
    } else {
      const cartNote =
        asBriefString(linkSupport.cart_url_note) ||
        "Vendor cart is session-bound and not a stable cross-session review URL.";
      secondaryLines.push(`- Cart link note: ${cartNote}`);
    }
  }
  if (secondaryLines.length === 0) {
    secondaryLines.push("- none");
  }
  const secondaryLinesResolved = secondaryLines.map((line) =>
    canonical.replay_url ? line.replace("%REPLAY_URL%", canonical.replay_url) : line,
  );

  const output = [
    "Recommended option",
    `- Vendor: ${canonical.vendor}`,
    `- Design: ${canonical.design_name}`,
    `- Specs: ${canonical.dimensions}, qty ${canonical.quantity}, ${canonical.material}`,
    `- Price: ${canonical.estimated_total}`,
    `- Cart status: ${canonical.cart_status}`,
    ...(canonical.uncertainty_notes.length > 0
      ? [`- Data confidence: ${canonical.uncertainty_notes.join(" ")}`]
      : []),
    "",
    "Why it won",
    `- ${canonical.why_selected}`,
    "",
    "Review now",
    ...reviewNowLines,
    "",
    "Alternatives",
    ...alternativeLines,
    "",
    "Your options",
    ...nextActions.map((action) => `- ${action}`),
    "",
    "Secondary links/debug",
    ...secondaryLinesResolved,
  ];

  return {
    text: output.join("\n"),
    recommendedOption: toStoredRecommendedOption(canonical),
    alternatives,
    nextActions,
    operatorLinks: toStoredExecutiveLinks(links),
  };
}

function formatBrowserCommerceBridgeResult(result: BrowserCommerceBridgeResult): string {
  return buildBrowserCommerceExecutiveBrief(result).text;
}

async function finalizeBridgeAccountability(
  continuation?: ContinuationData
): Promise<void> {
  if (!continuation?.bridgeJobs || continuation.bridgeJobs.length === 0) {
    return;
  }

  const jobsByToolId = new Map(
    continuation.bridgeJobs.map((job) => [job.toolUseId, job] as const)
  );

  for (const result of continuation.toolResults || []) {
    if (!result || typeof result !== "object") {
      continue;
    }

    const toolUseId =
      "tool_use_id" in result
        ? String((result as { tool_use_id?: string }).tool_use_id || "")
        : "call_id" in result
          ? String((result as { call_id?: string }).call_id || "")
          : "";

    if (!toolUseId) {
      continue;
    }

    const job = jobsByToolId.get(toolUseId);
    if (!job) {
      continue;
    }

    await completeAccountabilityJob({
      jobId: job.jobId,
      result:
        extractToolResultText(
          "content" in result
            ? (result as { content?: unknown }).content
            : "output" in result
              ? result
              : undefined,
        ) || "Bridge action returned no text output.",
      isError: toolResultLooksLikeError(result),
    });
  }
}

/* ── Async delegation — fire and forget via Edge Function ──────────────────── */
async function executeDelegation(
  ceoId: string,
  task: string,
  context?: string,
  dispatchMetadata?: DispatchMetadata,
  toolUseId?: string,
): Promise<string> {
  const normalizedCeoId = normalizeCeoId(ceoId);
  if (!normalizedCeoId) {
    return `Unknown CEO: ${ceoId}. Valid IDs: dominion, dominion-homes, wrenchready`;
  }

  const ceo = CEO_CONFIG[normalizedCeoId];

  const supabase = getServiceClient();
  if (!supabase) return `Delegation failed: no database connection.`;

  // 1. Create the job row immediately — returns a job_id
  const { data: job, error: insertErr } = await supabase
    .from("al_jobs")
    .insert({
      job_type: "delegate_to_ceo",
      ceo_id: normalizedCeoId,
      ceo_name: ceo.name,
      task,
      context: JSON.stringify({
        freeform_context: context ?? null,
        tool_use_id: toolUseId ?? null,
        dispatch_metadata: dispatchMetadata,
      }),
      status: "pending",
      triggered_by: "al_chat",
    })
    .select("id")
    .single();

  if (insertErr || !job) {
    return `Delegation failed: could not create job — ${insertErr?.message ?? "unknown error"}`;
  }

  const jobId = job.id;

  const markDispatchFailure = async (message: string): Promise<void> => {
    await supabase
      .from("al_jobs")
      .update({
        status: "error",
        error_msg: message,
        completed_at: new Date().toISOString(),
      })
      .eq("id", jobId)
      .eq("status", "pending");
  };

  // 2. Fire the Edge Function without awaiting it
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  const delegateToken = process.env.AL_DELEGATE_SECRET?.trim() || serviceKey;
  const edgeFnUrl = `${supabaseUrl}/functions/v1/al-delegate`;

  if (!supabaseUrl || !delegateToken) {
    const message = "Delegation failed: missing NEXT_PUBLIC_SUPABASE_URL or AL_DELEGATE_SECRET/SUPABASE_SERVICE_ROLE_KEY.";
    await markDispatchFailure(message);
    return message;
  }

  // Non-blocking — intentionally not awaited
  void fetch(edgeFnUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${delegateToken}`,
    },
    body: JSON.stringify({ job_id: jobId, ceo_id: normalizedCeoId, task, context }),
  })
    .then(async (response) => {
      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        const rawDetail = detail.slice(0, 400) || "empty response";
        const message =
          response.status === 401
            ? `al-delegate HTTP 401 Unauthorized. Check Command Center AL_DELEGATE_SECRET (or SUPABASE_SERVICE_ROLE_KEY fallback) against Supabase Edge Function secret AL_DELEGATE_SECRET. Note: this is edge-function auth, not al-bridge BRIDGE_TOKEN. Detail: ${rawDetail}`
            : `al-delegate HTTP ${response.status}: ${rawDetail}`;
        console.error(`[Al] Edge Function dispatch failed for job ${jobId}: ${message}`);
        await markDispatchFailure(message);
        return;
      }

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; job_id?: number }
        | null;
      if (!payload?.ok || payload.job_id !== jobId) {
        const message = "al-delegate returned an unexpected response payload.";
        console.error(`[Al] Edge Function dispatch mismatch for job ${jobId}:`, payload);
        await markDispatchFailure(message);
        return;
      }

      const { data: reconciled, error: reconcileError } = await supabase
        .from("al_jobs")
        .select("status, completed_at, error_msg")
        .eq("id", jobId)
        .single();

      if (reconcileError) {
        console.error(`[Al] Delegation reconciliation lookup failed for job ${jobId}:`, reconcileError);
        return;
      }

      if (reconciled?.status === "pending" || reconciled?.status === "running") {
        const message =
          "al-delegate returned successfully but the job row was not finalized. Manual confirmation required.";
        console.error(`[Al] Delegation reconciliation incomplete for job ${jobId}:`, reconciled);
        await supabase
          .from("al_jobs")
          .update({
            error_msg: message,
          })
          .eq("id", jobId);
      }
    })
    .catch(async (err) => {
      const message = err instanceof Error ? err.message : "unknown fetch error";
      console.error(`[Al] Edge Function fire failed for job ${jobId}:`, err);
      await markDispatchFailure(`al-delegate dispatch error: ${message}`);
    });

  // 3. Return immediately — Al is unblocked
  return `✓ Delegated to ${ceo.name} (job #${jobId}). Working in background — ask me "job status ${jobId}" anytime to check progress, or just ask your next question now.`;
}

/* ── Job status query ──────────────────────────────────────────────────────── */
async function executeJobStatus(jobId?: number): Promise<string> {
  const supabase = getServiceClient();
  if (!supabase) return "Job status unavailable: no database connection.";

  try {
    if (jobId !== undefined) {
      // Single job lookup
      const { data, error } = await supabase
        .from("al_jobs")
        .select("id, job_type, ceo_id, ceo_name, task, status, result, error_msg, created_at, started_at, completed_at")
        .eq("id", jobId)
        .single();

      if (error || !data) return `Job #${jobId} not found.`;

      const duration = data.completed_at && data.started_at
        ? `${Math.round((new Date(data.completed_at).getTime() - new Date(data.started_at).getTime()) / 1000)}s`
        : null;

      const ceoDisplay = normalizeCeoDisplayName(data.ceo_id, data.ceo_name);
      let out = `**Job #${data.id}** — ${ceoDisplay ?? data.job_type}\n`;
      out += `Status: **${data.status.toUpperCase()}**\n`;
      out += `Task: ${data.task.slice(0, 200)}\n`;
      if (duration) out += `Completed in: ${duration}\n`;
      if (data.status === "done" && data.result) out += `\n${data.result}`;
      if (data.status === "error") out += `\nError: ${data.error_msg}`;
      if (data.status === "pending" || data.status === "running") {
        const elapsed = Math.round((Date.now() - new Date(data.created_at).getTime()) / 1000);
        out += `\nElapsed: ${elapsed}s — still working.`;
      }
      return out;
    } else {
      // List 10 most recent jobs
      const { data, error } = await supabase
        .from("al_jobs")
        .select("id, job_type, ceo_id, ceo_name, status, task, created_at, completed_at")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error || !data || data.length === 0) return "No jobs found.";

      const lines = data.map((j) => {
        const age = Math.round((Date.now() - new Date(j.created_at).getTime()) / 1000);
        const ageStr = age < 60 ? `${age}s ago` : `${Math.round(age / 60)}m ago`;
        const statusIcon = ({ pending: "⏳", running: "🔄", done: "✅", error: "❌" } as Record<string, string>)[j.status] ?? "?";
        const ceoDisplay = normalizeCeoDisplayName(j.ceo_id, j.ceo_name);
        return `${statusIcon} #${j.id} [${ceoDisplay ?? j.job_type}] ${j.status} — ${j.task.slice(0, 80)} (${ageStr})`;
      });

      return `**Recent Jobs (last 10):**\n${lines.join("\n")}`;
    }
  } catch (err) {
    return `Job status error: ${err instanceof Error ? err.message : "unknown"}`;
  }
}

/* ── Cowork Task — local Claude Agent SDK via bridge → executor ─────────────── */
async function executeCoworkTask(task: string, domain?: string): Promise<string> {
  const bridgeUrl = process.env.AL_BRIDGE_URL || "http://127.0.0.1:3141";
  const bridgeToken = process.env.AL_BRIDGE_TOKEN || "";

  try {
    const res = await fetch(`${bridgeUrl}/cowork`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(bridgeToken ? { Authorization: `Bearer ${bridgeToken}` } : {}),
      },
      body: JSON.stringify({ task, domain: domain || "dominionhomedeals", authority_zone: 1 }),
      signal: AbortSignal.timeout(280000),
    });

    const data = await res.json() as Record<string, unknown>;

    if (!res.ok) {
      const errMsg = typeof data.error === "string" ? data.error : "Executor error";
      return `Cowork failed: ${errMsg}`;
    }

    const result = typeof data.result === "string" ? data.result : JSON.stringify(data);
    const elapsed = data.elapsed ? ` (${data.elapsed}s)` : "";
    const session = data.session_id ? ` · session ${data.session_id}` : "";
    return `✓ Done${elapsed}${session}\n\n${result}`;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    if (msg.includes("fetch failed") || msg.includes("ECONNREFUSED")) {
      return "Bridge offline — start al-bridge on Dez's machine (run start-al-bridge.bat or node al-bridge/server.js).";
    }
    return `Cowork error: ${msg}`;
  }
}

/* ── Cursor Cloud Agent ─────────────────────────────────────────────────────── */
async function executeCursorAgent(
  task: string,
  repo?: string,
  model?: string
): Promise<string> {
  const apiKey = process.env.CURSOR_AGENTS_API_KEY?.trim();
  if (!apiKey) {
    return "Cursor agent unavailable: CURSOR_AGENTS_API_KEY not set. Dez needs to add this to Vercel environment variables (Settings → Environment Variables). Get the key from cursor.com/dashboard/cloud-agents → User API Keys.";
  }

  // Accept "owner/repo" shorthand or full URL — normalize to full GitHub URL
  const repoRaw = repo || process.env.CURSOR_DEFAULT_REPO || "adamdez/dominionhomedeals";
  const repositoryUrl = repoRaw.startsWith("https://")
    ? repoRaw
    : `https://github.com/${repoRaw}`;

  // "default" uses the model configured in Cursor dashboard (currently gpt-5.4)
  const targetModel = model || "default";

  // Cursor Cloud Agents API v0 — Basic Auth: base64(apiKey + ":")
  const authToken = Buffer.from(`${apiKey}:`).toString("base64");

  try {
    const res = await fetch("https://api.cursor.com/v0/agents", {
      method: "POST",
      headers: {
        Authorization: `Basic ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: { text: task },
        model: targetModel,
        source: { repository: repositoryUrl },
        target: { autoCreatePr: true },
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => res.status.toString());
      if (res.status === 401) return "Cursor agent error: API key rejected. Check CURSOR_AGENTS_API_KEY in Vercel env vars.";
      if (res.status === 402) return "Cursor agent error: Account requires a paid Cursor plan to use the Cloud Agents API.";
      return `Cursor agent error ${res.status}: ${errText}`;
    }

    const data = await res.json() as { id?: string; status?: string; target?: { url?: string; prUrl?: string } };
    const agentId = data.id || "unknown";
    const agentUrl = data.target?.url || `https://cursor.com/agents?id=${agentId}`;

    return `✓ Cursor agent dispatched (ID: ${agentId})\nModel: ${targetModel} | Repo: ${repositoryUrl}\nTask: ${task.slice(0, 200)}\nMonitor: ${agentUrl}\n\nThe agent is running autonomously. It will open a PR on ${repositoryUrl} when done — Dez reviews and merges.`;
  } catch (err) {
    return `Cursor agent failed: ${err instanceof Error ? err.message : "network error"}`;
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

async function loadVaultDocs(): Promise<string> {
  const supabase = getServiceClient();
  if (!supabase) return "";
  try {
    // Load core identity docs every session — constitutions, CEO identities, live status, health checks
    const { data } = await supabase
      .from("vault_documents")
      .select("path, section, content")
      .in("section", ["CLAUDE.md", "01-Decisions", "02-Doctrine", "03-Businesses", "04-Build-Queue", "05-References"])
      .not("path", "like", "%/.gitkeep%")
      .order("section")
      .order("path");
    if (!data || data.length === 0) return "";
    const entries = data.map(d => `--- ${d.path} ---\n${d.content}`).join("\n\n");
    return `\n\nVAULT CONTEXT (${data.length} documents loaded from knowledge base):\n${entries}`;
  } catch {
    return "";
  }
}

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

function buildOpenAIUserContent(
  message: string,
  attachments?: RequestAttachment[],
): Array<Record<string, unknown>> {
  const content: Array<Record<string, unknown>> = [];

  for (const att of attachments || []) {
    if (att.type.startsWith("image/") && att.data) {
      content.push({
        type: "input_image",
        image_url: att.data,
      });
      continue;
    }

    content.push({
      type: "input_text",
      text: `[Attachment: ${att.name} | ${att.type} | ${att.size} bytes]`,
    });
  }

  content.push({
    type: "input_text",
    text: message || "Review the attached file(s).",
  });

  return content;
}

function buildOpenAIConversationInput(input: {
  systemPrompt: string;
  history?: HistoryMessage[];
  message: string;
  attachments?: RequestAttachment[];
}): OpenAIInputItem[] {
  const items: OpenAIInputItem[] = [
    {
      role: "developer",
      content: [{ type: "input_text", text: input.systemPrompt }],
    },
  ];

  for (const msg of input.history || []) {
    items.push({
      role: msg.role === "al" ? "assistant" : "user",
      content: [
        {
          type: msg.role === "al" ? "output_text" : "input_text",
          text: msg.content,
        },
      ],
    });
  }

  items.push({
    role: "user",
    content: buildOpenAIUserContent(input.message, input.attachments),
  });

  return items;
}

function toOpenAIFunctionTools(
  tools: Array<{ name: string; description: string; input_schema: Record<string, unknown> }>,
) {
  return tools.map((tool) => ({
    type: "function" as const,
    name: tool.name,
    description: tool.description,
    parameters: tool.input_schema,
  }));
}

function extractOpenAIOutputText(response: unknown): string {
  const typed = response as {
    output_text?: string;
    output?: Array<{
      type?: string;
      content?: Array<{ type?: string; text?: string }>;
    }>;
  };

  if (typeof typed.output_text === "string" && typed.output_text.length > 0) {
    return typed.output_text;
  }

  const chunks: string[] = [];
  for (const item of typed.output || []) {
    if (item.type !== "message") continue;
    for (const content of item.content || []) {
      if (
        (content.type === "output_text" || content.type === "text") &&
        typeof content.text === "string"
      ) {
        chunks.push(content.text);
      }
    }
  }

  return chunks.join("").trim();
}

function extractOpenAIFunctionCalls(response: unknown): OpenAIFunctionCall[] {
  const typed = response as {
    output?: Array<{
      id?: string;
      type?: string;
      call_id?: string;
      name?: string;
      arguments?: string;
    }>;
  };

  return (typed.output || [])
    .filter((item) => item.type === "function_call" && item.call_id && item.name)
    .map((item) => ({
      id: item.id || item.call_id || crypto.randomUUID(),
      callId: item.call_id as string,
      name: item.name as string,
      argumentsJson: typeof item.arguments === "string" ? item.arguments : "{}",
    }));
}

function buildOpenAIFunctionOutput(callId: string, output: string): OpenAIInputItem {
  return {
    type: "function_call_output",
    call_id: callId,
    output,
  };
}

async function executeWebFetch(url: string): Promise<string> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return "web_fetch failed: invalid URL.";
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return "web_fetch failed: only http and https URLs are allowed.";
  }

  try {
    const response = await fetch(parsed.toString(), {
      signal: AbortSignal.timeout(15_000),
      headers: {
        "User-Agent": "AL-Boreland/1.0 (+https://al.dominionhomedeals.com)",
      },
    });

    if (!response.ok) {
      return `web_fetch failed: HTTP ${response.status} ${response.statusText}`;
    }

    const contentType = response.headers.get("content-type") || "";
    const raw = await response.text();
    const body =
      /html|xml/i.test(contentType)
        ? raw
            .replace(/<script[\s\S]*?<\/script>/gi, " ")
            .replace(/<style[\s\S]*?<\/style>/gi, " ")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim()
        : raw.trim();

    if (!body) {
      return `Fetched ${parsed.toString()} but the page returned no readable text.`;
    }

    return `URL: ${parsed.toString()}\nContent-Type: ${contentType || "unknown"}\n\n${body.slice(
      0,
      20_000,
    )}`;
  } catch (error) {
    return `web_fetch failed: ${error instanceof Error ? error.message : "unknown fetch error"}`;
  }
}

async function runOpenAIChat(input: {
  message: string;
  history?: HistoryMessage[];
  attachments?: RequestAttachment[];
  bridgeConnected?: boolean;
  bridgeCapabilities?: BridgeCapabilities | null;
  continuation?: ContinuationData;
  taskClassification: TaskClassification | null;
  browserCommerceAssessment: TaskPathAssessment | null;
}): Promise<Response> {
  const apiKey = readEnvSecret("OPENAI_API_KEY");
  if (!apiKey) {
    return new Response(
      `data: ${JSON.stringify({
        error: "OPENAI_API_KEY is not configured for the AL chairman reasoning path.",
      })}\n\ndata: [DONE]\n\n`,
      { headers: sseHeaders() },
    );
  }

  const client = new OpenAI({ apiKey });
  const tools = [
    ...OPENAI_HOSTED_TOOLS,
    ...toOpenAIFunctionTools([
      ...OPENAI_EXTRA_TOOLS,
      ...SERVER_TOOLS,
      ...(input.bridgeConnected ? BRIDGE_TOOLS : []),
    ] as Array<{ name: string; description: string; input_schema: Record<string, unknown> }>),
  ];

  await finalizeBridgeAccountability(input.continuation);

  const [memoryBlock, vaultBlock] = await Promise.all([loadMemories(), loadVaultDocs()]);
  const fullSystemPrompt =
    SYSTEM_PROMPT +
    buildBridgeCapabilityPrompt(Boolean(input.bridgeConnected), input.bridgeCapabilities) +
    vaultBlock +
    memoryBlock;
  const selectedModel = input.continuation?.previousResponseId
    ? OPENAI_HEAVY_MODEL
    : pickOpenAIModel(input.message || "");
  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      let fullResponse = "";
      let previousResponseId = input.continuation?.previousResponseId;
      let nextInput: OpenAIInputItem[] = previousResponseId
        ? [
            ...((input.continuation?.precomputedResults || []) as OpenAIInputItem[]),
            ...((input.continuation?.toolResults || []) as OpenAIInputItem[]),
          ]
        : buildOpenAIConversationInput({
            systemPrompt: fullSystemPrompt,
            history: input.history,
            message: input.message,
            attachments: input.attachments,
          });

      try {
        for (let turn = 0; turn < 10; turn++) {
          const model = turn === 0 ? selectedModel : OPENAI_HEAVY_MODEL;
          const response = await client.responses.create({
            model,
            reasoning: { effort: openAIReasoningEffortForModel(model) },
            tools: tools as any,
            ...(previousResponseId ? { previous_response_id: previousResponseId } : {}),
            input: nextInput as any,
          });

          previousResponseId = response.id;

          const textOutput = extractOpenAIOutputText(response);
          if (textOutput) {
            fullResponse += textOutput;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ t: textOutput })}\n\n`),
            );
          }

          const toolCalls = extractOpenAIFunctionCalls(response);
          if (toolCalls.length === 0) {
            const actionSummary =
              input.attachments && input.attachments.length > 0
                ? `[${input.attachments.map((a) => a.name).join(", ")}] ${input.message}`
                : input.message;
            logTrajectory(actionSummary, fullResponse).catch(() => {});
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
            return;
          }

          const bridgeRequests: Array<{
            id: string;
            name: string;
            input: Record<string, unknown>;
            accountabilityJobId?: number;
          }> = [];
          const precomputed: OpenAIInputItem[] = [];

          for (const call of toolCalls) {
            let parsedInput: Record<string, unknown> = {};
            try {
              parsedInput = JSON.parse(call.argumentsJson || "{}");
            } catch {
              parsedInput = {};
            }

            if (call.name === "web_fetch") {
              const result = await executeWebFetch(asNonEmptyString(parsedInput.url) || "");
              precomputed.push(buildOpenAIFunctionOutput(call.callId, result));
              continue;
            }

            if (call.name === "vault_publish") {
              const publishPath = asNonEmptyString(parsedInput.path) || "";
              const publishContent =
                typeof parsedInput.content === "string" ? parsedInput.content : "";
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ status: "publishing", path: publishPath })}\n\n`,
                ),
              );
              const result = await executeVaultPublish(publishPath, publishContent);
              precomputed.push(buildOpenAIFunctionOutput(call.callId, result));
              continue;
            }

            if (call.name === "memory_save") {
              const result = await executeMemorySave(
                asNonEmptyString(parsedInput.category) || "general",
                asNonEmptyString(parsedInput.content) || "",
              );
              precomputed.push(buildOpenAIFunctionOutput(call.callId, result));
              continue;
            }

            if (call.name === "memory_delete") {
              const result = await executeMemoryDelete(Number(parsedInput.id));
              precomputed.push(buildOpenAIFunctionOutput(call.callId, result));
              continue;
            }

            if (call.name === "delegate_to_ceo") {
              const ceoId = asNonEmptyString(parsedInput.ceo) || "";
              const normalizedCeoId = normalizeCeoId(ceoId);
              const defaultBusinessId =
                normalizedCeoId === "wrenchready"
                  ? "wrenchready"
                  : normalizedCeoId === "dominion-homes"
                    ? "dominion"
                    : null;
              const ceoName = normalizedCeoId ? CEO_CONFIG[normalizedCeoId]?.name || ceoId : ceoId;
              let dispatchMetadata: DispatchMetadata;

              try {
                dispatchMetadata = buildDispatchMetadata({
                  sourceTool: "delegate_to_ceo",
                  toolInput: parsedInput,
                  defaultBusinessId,
                  runtimeRefHint: `tool_use:${call.id}`,
                  fallbackChangeUnderReview: `CEO delegation: ${asNonEmptyString(parsedInput.task) || "delegated task"}`,
                  heuristicText: [asNonEmptyString(parsedInput.task), asNonEmptyString(parsedInput.context)]
                    .filter(Boolean)
                    .join(" "),
                  enforceHeuristicConsequential: false,
                });
              } catch (error) {
                precomputed.push(
                  buildOpenAIFunctionOutput(
                    call.callId,
                    error instanceof Error
                      ? error.message
                      : "Consequential delegation metadata is missing.",
                  ),
                );
                continue;
              }

              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ status: "delegating", ceo: ceoName })}\n\n`,
                ),
              );
              const result = await executeDelegation(
                ceoId,
                asNonEmptyString(parsedInput.task) || "",
                asNonEmptyString(parsedInput.context),
                dispatchMetadata,
                call.id,
              );
              const jobMatch = result.match(/job #(\d+)/i);
              if (jobMatch) {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      job_dispatched: {
                        job_id: parseInt(jobMatch[1], 10),
                        ceo_name: ceoName,
                      },
                    })}\n\n`,
                  ),
                );
              }
              precomputed.push(buildOpenAIFunctionOutput(call.callId, result));
              continue;
            }

            if (call.name === "job_status") {
              const result = await executeJobStatus(
                parsedInput.job_id !== undefined ? Number(parsedInput.job_id) : undefined,
              );
              precomputed.push(buildOpenAIFunctionOutput(call.callId, result));
              continue;
            }

            if (call.name === "cursor_agent") {
              let dispatchMetadata: DispatchMetadata;
              try {
                dispatchMetadata = buildDispatchMetadata({
                  sourceTool: "cursor_agent",
                  toolInput: parsedInput,
                  defaultBusinessId:
                    inferBusinessIdFromRepo(asNonEmptyString(parsedInput.repo)) ||
                    inferBusinessIdFromDomain(asNonEmptyString(parsedInput.task)) ||
                    "dominion",
                  runtimeRefHint: `tool_use:${call.id}`,
                  fallbackChangeUnderReview:
                    asNonEmptyString(parsedInput.task) || "Cursor agent dispatch",
                  heuristicText: [
                    asNonEmptyString(parsedInput.task),
                    asNonEmptyString(parsedInput.repo),
                  ]
                    .filter(Boolean)
                    .join(" "),
                  enforceHeuristicConsequential: true,
                });
              } catch (error) {
                precomputed.push(
                  buildOpenAIFunctionOutput(
                    call.callId,
                    error instanceof Error
                      ? error.message
                      : "Consequential cursor dispatch metadata is missing.",
                  ),
                );
                continue;
              }

              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ status: "delegating", ceo: "Cursor Composer 2" })}\n\n`,
                ),
              );
              const accountability = await createAccountabilityJob({
                jobType: "cursor_agent",
                task: asNonEmptyString(parsedInput.task) || "",
                context: {
                  repo:
                    asNonEmptyString(parsedInput.repo) ||
                    process.env.CURSOR_DEFAULT_REPO ||
                    "adamdez/dominionhomedeals",
                  model: asNonEmptyString(parsedInput.model) || "default",
                  tool_use_id: call.id,
                  dispatch_metadata: dispatchMetadata,
                },
                status: "running",
              });
              if ("error" in accountability) {
                precomputed.push(
                  buildOpenAIFunctionOutput(
                    call.callId,
                    `Cursor agent accountability failed: ${accountability.error}. The action was blocked so it would not become invisible to kernel governance.`,
                  ),
                );
                continue;
              }
              const result = await executeCursorAgent(
                asNonEmptyString(parsedInput.task) || "",
                asNonEmptyString(parsedInput.repo),
                asNonEmptyString(parsedInput.model),
              );
              await completeAccountabilityJob({
                jobId: accountability.jobId,
                result,
                isError: /^Cursor agent (unavailable|error|failed)/i.test(result),
              });
              precomputed.push(buildOpenAIFunctionOutput(call.callId, result));
              continue;
            }

            if (!isBridgeTool(call.name)) {
              precomputed.push(
                buildOpenAIFunctionOutput(
                  call.callId,
                  `Unsupported tool call: ${call.name}`,
                ),
              );
              continue;
            }

            if (call.name !== "cowork_task" && call.name !== "crew_run") {
              bridgeRequests.push({
                id: call.callId,
                name: call.name,
                input: parsedInput,
              });
              continue;
            }

            const sourceTool = call.name === "crew_run" ? "crew_run" : "cowork_task";
            const defaultBusinessId =
              call.name === "crew_run"
                ? inferBusinessIdFromCrew(asNonEmptyString(parsedInput.crew))
                : inferBusinessIdFromDomain(asNonEmptyString(parsedInput.domain)) ||
                  inferBusinessIdFromDomain(asNonEmptyString(parsedInput.task)) ||
                  "dominion";
            let dispatchMetadata: DispatchMetadata;

            try {
              dispatchMetadata = buildDispatchMetadata({
                sourceTool,
                toolInput: parsedInput,
                defaultBusinessId,
                runtimeRefHint: `tool_use:${call.id}`,
                fallbackChangeUnderReview:
                  call.name === "crew_run"
                    ? `Crew run: ${asNonEmptyString(parsedInput.crew) || "crew"}`
                    : asNonEmptyString(parsedInput.task) || "Cowork dispatch",
                heuristicText:
                  call.name === "crew_run"
                    ? [asNonEmptyString(parsedInput.crew)].filter(Boolean).join(" ")
                    : [
                        asNonEmptyString(parsedInput.task),
                        asNonEmptyString(parsedInput.domain),
                      ]
                        .filter(Boolean)
                        .join(" "),
                enforceHeuristicConsequential: call.name === "cowork_task",
              });
            } catch (error) {
              precomputed.push(
                buildOpenAIFunctionOutput(
                  call.callId,
                  error instanceof Error
                    ? error.message
                    : "Consequential bridge dispatch metadata is missing.",
                ),
              );
              continue;
            }

            const accountability = await createAccountabilityJob({
              jobType: call.name,
              task:
                call.name === "crew_run"
                  ? `Run crew ${asNonEmptyString(parsedInput.crew) || "unknown"}`
                  : asNonEmptyString(parsedInput.task) || "",
              context: {
                domain:
                  call.name === "cowork_task"
                    ? asNonEmptyString(parsedInput.domain) || "dominionhomedeals"
                    : undefined,
                crew: call.name === "crew_run" ? asNonEmptyString(parsedInput.crew) || null : undefined,
                tool_use_id: call.id,
                dispatch_metadata: dispatchMetadata,
              },
              status: "running",
            });

            if ("error" in accountability) {
              precomputed.push(
                buildOpenAIFunctionOutput(
                  call.callId,
                  `Cowork accountability failed: ${accountability.error}. The task was blocked so it would not become invisible to kernel governance.`,
                ),
              );
              continue;
            }

            bridgeRequests.push({
              id: call.callId,
              name: call.name,
              input: parsedInput,
              accountabilityJobId: accountability.jobId,
            });
          }

          if (bridgeRequests.length > 0) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  vault_action: {
                    provider: "openai",
                    previousResponseId,
                    requests: bridgeRequests,
                    assistantBlocks: [],
                    precomputedResults: precomputed,
                  },
                })}\n\n`,
              ),
            );
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
            logTrajectory(
              input.message || "vault tool request",
              fullResponse + " [awaiting bridge tool execution]",
            ).catch(() => {});
            return;
          }

          nextInput = precomputed;
        }

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              error: "OpenAI max turn limit reached before the run settled.",
            })}\n\n`,
          ),
        );
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Unknown error calling OpenAI";
        if (input.taskClassification?.taskClass === "browser_commerce_design") {
          const usefulMessage = input.browserCommerceAssessment
            ? input.browserCommerceAssessment.operatorMessage
            : `Vendor/design routing failed before the browser lane could run. ${msg}`;
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ t: usefulMessage })}\n\n`),
          );
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
          return;
        }
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`),
        );
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    },
  });

  return new Response(readable, { headers: sseHeaders() });
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
  systemPrompt: string = SYSTEM_PROMPT,
  model: string = SONNET_MODEL
): Promise<StreamTurnResult> {
  const stream = await (anthropic.messages.create as any)({
    model,
    max_tokens: model === HAIKU_MODEL ? 4096 : 32000,
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
          const reversedBlocks = [...contentBlocks].reverse();
          const last = reversedBlocks.find(
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

  const {
    message,
    history,
    attachments,
    bridgeConnected,
    bridgeCapabilities,
    continuation,
  } = (await request.json()) as {
    message: string;
    history?: HistoryMessage[];
    attachments?: RequestAttachment[];
    bridgeConnected?: boolean;
    bridgeCapabilities?: BridgeCapabilities | null;
    continuation?: ContinuationData;
  };

  const taskClassification = continuation
    ? null
    : classifyTaskForRouting(message || "");
  const browserCommerceAssessment =
    taskClassification?.taskClass === "browser_commerce_design"
      ? assessBrowserCommercePath(Boolean(bridgeConnected), bridgeCapabilities)
      : null;
  const continuationBrowserClassification = continuation
    ? classifyTaskForRouting(message || "")
    : null;

  const browserBridgeJob = continuation?.bridgeJobs?.find(
    (job) => job.name === "browser_vendor_cart_review",
  );

  if (browserBridgeJob) {
    const bridgeResult = (continuation?.toolResults || []).find((result) => {
      if (!result || typeof result !== "object") {
        return false;
      }

      if (
        "tool_use_id" in result &&
        String((result as { tool_use_id?: string }).tool_use_id || "") ===
          browserBridgeJob.toolUseId
      ) {
        return true;
      }

      if (
        "call_id" in result &&
        String((result as { call_id?: string }).call_id || "") === browserBridgeJob.toolUseId
      ) {
        return true;
      }

      return false;
    });

    const rawBridgeText =
      extractToolResultText(
        bridgeResult && typeof bridgeResult === "object"
          ? "content" in bridgeResult
            ? (bridgeResult as { content?: unknown }).content
            : "output" in bridgeResult
              ? bridgeResult
              : undefined
          : bridgeResult,
      ) || "Vendor/design lane returned no usable bridge result.";

    const parsedBridgeResult = parseBrowserCommerceBridgeResult(rawBridgeText);
    const classification =
      continuationBrowserClassification ||
      classifyTaskForRouting(message || "") || {
        taskClass: "browser_commerce_design" as const,
        businessId: "wrenchready" as const,
        owner: "Tom",
        laneId: "wrenchready-branding-commerce",
        preferredExecutionPath: HOSTED_BROWSER_EXECUTION_PATH,
        summary: normalizeConsequentialChange(message || "browser commerce review", 180),
        reviewCheckpointRequired: true,
      };
    const assessment =
      browserCommerceAssessment ||
      assessBrowserCommercePath(Boolean(bridgeConnected), bridgeCapabilities);
    const executionContext = buildBrowserCommerceExecutionContext({
      task: message || "",
      classification,
      assessment,
      bridgeConnected: Boolean(bridgeConnected),
      bridgeCapabilities,
    });

    if (!parsedBridgeResult) {
      const failureMessage = rawBridgeText.startsWith("Error:")
        ? rawBridgeText.replace(/^Error:\s*/i, "").trim()
        : rawBridgeText;
      await completeAccountabilityJob({
        jobId: browserBridgeJob.jobId,
        result: failureMessage,
        isError: true,
        context: {
          ...executionContext,
          execution_status: "failed_bridge_result",
        },
      });
      return streamingTextResponse(failureMessage);
    }

    const executiveBrief = buildBrowserCommerceExecutiveBrief(parsedBridgeResult);
    const formattedBridgeResult = executiveBrief.text;
    await completeAccountabilityJob({
      jobId: browserBridgeJob.jobId,
      result: formattedBridgeResult,
      isError: !parsedBridgeResult.ok,
      context: {
        ...executionContext,
        selected_execution_path:
          parsedBridgeResult.selected_execution_path ||
          executionContext.selected_execution_path,
        execution_status:
          parsedBridgeResult.status ||
          (parsedBridgeResult.ok ? "cart_ready_for_review" : "blocked"),
        missing_access:
          parsedBridgeResult.missing_access || executionContext.missing_access,
        vendor_options: parsedBridgeResult.vendor_options || null,
        design_candidates: parsedBridgeResult.design_candidates || null,
        chosen_design: parsedBridgeResult.chosen_design || null,
        chosen_option:
          executiveBrief.recommendedOption || parsedBridgeResult.chosen_option || null,
        recommended_option: executiveBrief.recommendedOption || null,
        alternatives_normalized:
          executiveBrief.alternatives.length > 0 ? executiveBrief.alternatives : null,
        operator_next_actions:
          executiveBrief.nextActions.length > 0 ? executiveBrief.nextActions : null,
        operator_links:
          executiveBrief.operatorLinks.length > 0 ? executiveBrief.operatorLinks : null,
        artifacts: parsedBridgeResult.artifacts || null,
        cart_url: parsedBridgeResult.cart_url || null,
        proof_url: parsedBridgeResult.proof_url || null,
        review_page_url: parsedBridgeResult.review_page_url || null,
        resume_cart_url: parsedBridgeResult.resume_cart_url || null,
        resume_proof_url: parsedBridgeResult.resume_proof_url || null,
        review_state:
          parsedBridgeResult.review_state ||
          (parsedBridgeResult.ok ? "cart_ready_for_review" : "blocked_vendor_session"),
        review_surface: parsedBridgeResult.review_surface || null,
        link_support: parsedBridgeResult.link_support || null,
        next_action: parsedBridgeResult.next_action || null,
      },
    });
    return streamingTextResponse(formattedBridgeResult);
  }

  if (taskClassification && browserCommerceAssessment && !browserCommerceAssessment.executable) {
    await recordBrowserCommerceRoutingOutcome({
      task: message || "",
      classification: taskClassification,
      assessment: browserCommerceAssessment,
      bridgeConnected: Boolean(bridgeConnected),
      bridgeCapabilities,
    });
    return streamingTextResponse(browserCommerceAssessment.operatorMessage);
  }

  if (taskClassification && browserCommerceAssessment && browserCommerceAssessment.executable) {
    const executionContext = buildBrowserCommerceExecutionContext({
      task: message || "",
      classification: taskClassification,
      assessment: browserCommerceAssessment,
      bridgeConnected: Boolean(bridgeConnected),
      bridgeCapabilities,
    });
    const accountability = await createAccountabilityJob({
      jobType: "browser_commerce_design",
      task: message || "",
      context: executionContext,
      status: "running",
    });

    if ("error" in accountability) {
      return streamingTextResponse(
        `Vendor/design lane blocked: could not create accountability for the browser/vendor/cart workflow (${accountability.error}).`,
      );
    }

    if (browserCommerceAssessment.selectedExecutionPath === HOSTED_BROWSER_EXECUTION_PATH) {
      try {
        const hostedExecution = await runHostedBrowserVendorCartReview({
          task: message || "",
          business_id: "wrenchready",
          owner: taskClassification.owner,
          lane_id: taskClassification.laneId,
          vehicle: "2001 Chevy Astro van",
          preferred_size: '24" x 18"',
          quantity: 2,
          review_checkpoint_required: true,
        });

        const syncedReview = await syncBrowserCommerceReviewJob({
          jobId: accountability.jobId,
          origin: request.nextUrl.origin,
          host: request.headers.get("host"),
          browserResult: hostedExecution.browserResult as unknown as Record<string, unknown>,
          artifacts: hostedExecution.artifacts,
        });

        const browserResult = {
          ...hostedExecution.browserResult,
          review_page_url: syncedReview.reviewPageUrl,
          review_state: syncedReview.reviewState,
          review_surface: syncedReview.reviewSurface,
          next_action: syncedReview.nextAction,
        };
        const executiveBrief = buildBrowserCommerceExecutiveBrief(browserResult);
        const formattedBrowserResult = executiveBrief.text;

        await completeAccountabilityJob({
          jobId: accountability.jobId,
          result: formattedBrowserResult,
          isError: !browserResult.ok,
          context: {
            ...executionContext,
            selected_execution_path: HOSTED_BROWSER_EXECUTION_PATH,
            hosted_review_page_url: syncedReview.reviewPageUrl,
            review_page_url: syncedReview.reviewPageUrl,
            review_state: syncedReview.reviewState,
            review_surface: syncedReview.reviewSurface,
            next_action: syncedReview.nextAction,
            vendor_options: browserResult.vendor_options || null,
            design_candidates: browserResult.design_candidates || null,
            chosen_design: browserResult.chosen_design || null,
            chosen_option:
              executiveBrief.recommendedOption || browserResult.chosen_option || null,
            recommended_option: executiveBrief.recommendedOption || null,
            alternatives_normalized:
              executiveBrief.alternatives.length > 0 ? executiveBrief.alternatives : null,
            operator_next_actions:
              executiveBrief.nextActions.length > 0 ? executiveBrief.nextActions : null,
            operator_links:
              executiveBrief.operatorLinks.length > 0 ? executiveBrief.operatorLinks : null,
            artifacts: browserResult.artifacts || null,
            cart_url: browserResult.cart_url || null,
            proof_url: browserResult.proof_url || null,
            link_support: browserResult.link_support || null,
            hosted_session_id: browserResult.hosted_session_id || null,
            hosted_session_url: browserResult.hosted_session_url || null,
            hosted_debugger_url: browserResult.hosted_debugger_url || null,
            hosted_debugger_fullscreen_url:
              browserResult.hosted_debugger_fullscreen_url || null,
            execution_status: browserResult.ok ? "done" : "blocked",
          },
        });

        return streamingTextResponse(formattedBrowserResult);
      } catch (error) {
        const hostedError =
          error instanceof Error
            ? error.message
            : "Hosted Browserbase/Stagehand execution failed.";
        if (browserCommerceAssessment.localBrowser.available) {
          await updateAccountabilityJobContext(accountability.jobId, {
            ...executionContext,
            selected_execution_path: LOCAL_BROWSER_EXECUTION_PATH,
            fallback_execution_path: LOCAL_BROWSER_EXECUTION_PATH,
            hosted_execution_error: hostedError,
            execution_status: "fallback_to_local_bridge",
          });
        } else {
          await completeAccountabilityJob({
            jobId: accountability.jobId,
            result:
              `Vendor/design lane blocked: hosted Browserbase/Stagehand execution failed (${hostedError}). ` +
              "No local browser fallback is currently live.",
            isError: true,
            context: {
              ...executionContext,
              hosted_execution_error: hostedError,
              execution_status: "blocked",
            },
          });
          return streamingTextResponse(
            `Vendor/design lane blocked: hosted Browserbase/Stagehand execution failed (${hostedError}). No local browser fallback is currently live.`,
          );
        }
      }
    }

    return new Response(
      `data: ${JSON.stringify({
        vault_action: {
          requests: [
            {
              id: crypto.randomUUID(),
              name: "browser_vendor_cart_review",
              input: {
                task: message || "",
                business_id: taskClassification.businessId,
                owner: taskClassification.owner,
                lane_id: taskClassification.laneId,
                vehicle: "2001 Chevy Astro van",
                preferred_size: '24" x 18"',
                quantity: 2,
                review_checkpoint_required: true,
              },
              accountabilityJobId: accountability.jobId,
            },
          ],
          assistantBlocks: [],
          precomputedResults: [],
        },
      })}\n\n`,
      { headers: sseHeaders() },
    );
  }

  const openAIKey = readEnvSecret("OPENAI_API_KEY");
  const requestedProvider = continuation?.provider;
  const canUseOpenAIContinuation =
    !continuation || continuation.provider === "openai";
  const shouldUseOpenAI =
    Boolean(openAIKey) &&
    canUseOpenAIContinuation &&
    (
      // Explicit provider selection for continuation calls.
      requestedProvider === "openai" ||
      // OpenAI-first default for fresh requests (no continuation boundary yet).
      (!continuation && requestedProvider !== "anthropic") ||
      // Keep legacy env behavior for compatibility when OpenAI key exists.
      (requestedProvider !== "anthropic" && PRIMARY_REASONING_PROVIDER === "openai")
    );

  if (shouldUseOpenAI) {
    return runOpenAIChat({
      message,
      history,
      attachments,
      bridgeConnected,
      bridgeCapabilities,
      continuation,
      taskClassification,
      browserCommerceAssessment,
    });
  }

  const apiKey = readEnvSecret("ANTHROPIC_API_KEY");
  if (!apiKey) {
    return new Response(
      `data: ${JSON.stringify({
        error:
          PRIMARY_REASONING_PROVIDER === "openai"
            ? "OPENAI_API_KEY is not configured for the AL chairman path, and no Anthropic fallback is available."
            : "ANTHROPIC_API_KEY is not configured.",
      })}\n\ndata: [DONE]\n\n`,
      { headers: sseHeaders() }
    );
  }

  const anthropic = new Anthropic({ apiKey });
  const tools = [...SERVER_TOOLS];
  if (bridgeConnected) tools.push(...BRIDGE_TOOLS);

  await finalizeBridgeAccountability(continuation);

  /* Load persistent memory and vault docs into system prompt */
  const [memoryBlock, vaultBlock] = await Promise.all([loadMemories(), loadVaultDocs()]);

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
    const allResults = [
      ...(continuation.precomputedResults || []),
      ...continuation.toolResults,
    ] as Anthropic.ToolResultBlockParam[];
    messages.push({ role: "user", content: allResults });
  }

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      let fullResponse = "";
      const convo: Anthropic.MessageParam[] = [...messages];

      const fullSystemPrompt =
        SYSTEM_PROMPT +
        buildBridgeCapabilityPrompt(Boolean(bridgeConnected), bridgeCapabilities) +
        vaultBlock +
        memoryBlock;

      /* Smart model routing — Haiku for casual, Sonnet for complex */
      const selectedModel = continuation ? SONNET_MODEL : pickModel(message || "");

      try {
        for (let turn = 0; turn < 10; turn++) {
          const { stopReason, contentBlocks, textOutput } = await streamOneTurn(
            anthropic,
            convo,
            tools,
            controller,
            encoder,
            turn > 0 && fullResponse.length > 0,
            fullSystemPrompt,
            turn === 0 ? selectedModel : SONNET_MODEL // first turn uses smart routing, tool followups use Sonnet
          );

          fullResponse += textOutput;

          /* If the model hit max_tokens mid-response, continue in a new turn */
          if (stopReason === "max_tokens") {
            convo.push({ role: "assistant", content: contentBlocks as any });
            convo.push({ role: "user", content: "Continue your response from where you left off." });
            continue;
          }

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
            const inp = sb.input as Record<string, unknown>;
            if (sb.name === "vault_publish") {
              const publishPath = asNonEmptyString(inp.path) || "";
              const publishContent = typeof inp.content === "string" ? inp.content : "";
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ status: "publishing", path: publishPath })}\n\n`
                )
              );
              const result = await executeVaultPublish(publishPath, publishContent);
              precomputed.push({ type: "tool_result", tool_use_id: sb.id, content: result });
            } else if (sb.name === "memory_save") {
              const result = await executeMemorySave(
                asNonEmptyString(inp.category) || "general",
                asNonEmptyString(inp.content) || "",
              );
              precomputed.push({ type: "tool_result", tool_use_id: sb.id, content: result });
            } else if (sb.name === "memory_delete") {
              const result = await executeMemoryDelete(Number(inp.id));
              precomputed.push({ type: "tool_result", tool_use_id: sb.id, content: result });
            } else if (sb.name === "delegate_to_ceo") {
              const ceoId = asNonEmptyString(inp.ceo) || "";
              const normalizedCeoId = normalizeCeoId(ceoId);
              const defaultBusinessId =
                normalizedCeoId === "wrenchready"
                  ? "wrenchready"
                  : normalizedCeoId === "dominion-homes"
                    ? "dominion"
                    : null;
              const ceoName = normalizedCeoId ? CEO_CONFIG[normalizedCeoId]?.name || ceoId : ceoId;
              let dispatchMetadata: DispatchMetadata;

              try {
                dispatchMetadata = buildDispatchMetadata({
                  sourceTool: "delegate_to_ceo",
                  toolInput: inp,
                  defaultBusinessId,
                  runtimeRefHint: `tool_use:${sb.id}`,
                  fallbackChangeUnderReview: `CEO delegation: ${asNonEmptyString(inp.task) || "delegated task"}`,
                  heuristicText: [asNonEmptyString(inp.task), asNonEmptyString(inp.context)]
                    .filter(Boolean)
                    .join(" "),
                  enforceHeuristicConsequential: false,
                });
              } catch (error) {
                precomputed.push({
                  type: "tool_result",
                  tool_use_id: sb.id,
                  content:
                    error instanceof Error
                      ? error.message
                      : "Consequential delegation metadata is missing.",
                  is_error: true,
                });
                continue;
              }

              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ status: "delegating", ceo: ceoName })}\n\n`
                )
              );
              // Fire-and-forget: returns instantly with job ID, does NOT block
              const result = await executeDelegation(
                ceoId,
                asNonEmptyString(inp.task) || "",
                asNonEmptyString(inp.context),
                dispatchMetadata,
                sb.id,
              );
              // Extract job ID from result and emit a persistent badge event to the UI
              const jobMatch = result.match(/job #(\d+)/i);
              if (jobMatch) {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ job_dispatched: { job_id: parseInt(jobMatch[1]), ceo_name: ceoName } })}\n\n`
                  )
                );
              }
              precomputed.push({ type: "tool_result", tool_use_id: sb.id, content: result });
            } else if (sb.name === "job_status") {
              const jobId = inp.job_id !== undefined ? Number(inp.job_id) : undefined;
              const result = await executeJobStatus(jobId);
              precomputed.push({ type: "tool_result", tool_use_id: sb.id, content: result });
            } else if (sb.name === "cursor_agent") {
              let dispatchMetadata: DispatchMetadata;
              try {
                dispatchMetadata = buildDispatchMetadata({
                  sourceTool: "cursor_agent",
                  toolInput: inp,
                  defaultBusinessId:
                    inferBusinessIdFromRepo(asNonEmptyString(inp.repo)) ||
                    inferBusinessIdFromDomain(asNonEmptyString(inp.task)) ||
                    "dominion",
                  runtimeRefHint: `tool_use:${sb.id}`,
                  fallbackChangeUnderReview:
                    asNonEmptyString(inp.task) || "Cursor agent dispatch",
                  heuristicText: [
                    asNonEmptyString(inp.task),
                    asNonEmptyString(inp.repo),
                  ]
                    .filter(Boolean)
                    .join(" "),
                  enforceHeuristicConsequential: true,
                });
              } catch (error) {
                precomputed.push({
                  type: "tool_result",
                  tool_use_id: sb.id,
                  content:
                    error instanceof Error
                      ? error.message
                      : "Consequential cursor dispatch metadata is missing.",
                  is_error: true,
                });
                continue;
              }

              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ status: "delegating", ceo: "Cursor Composer 2" })}\n\n`
                )
              );
              const accountability = await createAccountabilityJob({
                jobType: "cursor_agent",
                task: asNonEmptyString(inp.task) || "",
                context: {
                  repo:
                    asNonEmptyString(inp.repo) ||
                    process.env.CURSOR_DEFAULT_REPO ||
                    "adamdez/dominionhomedeals",
                  model: asNonEmptyString(inp.model) || "default",
                  tool_use_id: sb.id,
                  dispatch_metadata: dispatchMetadata,
                },
                status: "running",
              });
              if ("error" in accountability) {
                precomputed.push({
                  type: "tool_result",
                  tool_use_id: sb.id,
                  content: `Cursor agent accountability failed: ${accountability.error}. The action was blocked so it would not become invisible to kernel governance.`,
                  is_error: true,
                });
                continue;
              }
              const result = await executeCursorAgent(
                asNonEmptyString(inp.task) || "",
                asNonEmptyString(inp.repo),
                asNonEmptyString(inp.model),
              );
              await completeAccountabilityJob({
                jobId: accountability.jobId,
                result,
                isError: /^Cursor agent (unavailable|error|failed)/i.test(result),
              });
              precomputed.push({ type: "tool_result", tool_use_id: sb.id, content: result });
            }
          }

          /* Delegate bridge tools (vault_list, vault_read, cowork_task) to the client */
          if (bridgeBlocks.length > 0) {
            const bridgeRequests: Array<{
              id: string;
              name: string;
              input: Record<string, unknown>;
              accountabilityJobId?: number;
            }> = [];

            for (const block of bridgeBlocks) {
              if (block.name !== "cowork_task" && block.name !== "crew_run") {
                bridgeRequests.push({
                  id: block.id,
                  name: block.name,
                  input: block.input as Record<string, unknown>,
                });
                continue;
              }

              const bridgeInput = block.input as Record<string, unknown>;
              const sourceTool =
                block.name === "crew_run" ? "crew_run" : "cowork_task";
              const defaultBusinessId =
                block.name === "crew_run"
                  ? inferBusinessIdFromCrew(asNonEmptyString(bridgeInput.crew))
                  : inferBusinessIdFromDomain(asNonEmptyString(bridgeInput.domain)) ||
                    inferBusinessIdFromDomain(asNonEmptyString(bridgeInput.task)) ||
                    "dominion";
              let dispatchMetadata: DispatchMetadata;

              try {
                dispatchMetadata = buildDispatchMetadata({
                  sourceTool,
                  toolInput: bridgeInput,
                  defaultBusinessId,
                  runtimeRefHint: `tool_use:${block.id}`,
                  fallbackChangeUnderReview:
                    block.name === "crew_run"
                      ? `Crew run: ${asNonEmptyString(bridgeInput.crew) || "crew"}`
                      : asNonEmptyString(bridgeInput.task) || "Cowork dispatch",
                  heuristicText:
                    block.name === "crew_run"
                      ? [asNonEmptyString(bridgeInput.crew)]
                          .filter(Boolean)
                          .join(" ")
                      : [
                          asNonEmptyString(bridgeInput.task),
                          asNonEmptyString(bridgeInput.domain),
                        ]
                          .filter(Boolean)
                          .join(" "),
                  enforceHeuristicConsequential: block.name === "cowork_task",
                });
              } catch (error) {
                precomputed.push({
                  type: "tool_result",
                  tool_use_id: block.id,
                  content:
                    error instanceof Error
                      ? error.message
                      : "Consequential bridge dispatch metadata is missing.",
                  is_error: true,
                });
                continue;
              }

              const accountability = await createAccountabilityJob({
                jobType: block.name,
                task:
                  block.name === "crew_run"
                    ? `Run crew ${asNonEmptyString(bridgeInput.crew) || "unknown"}`
                    : (asNonEmptyString(bridgeInput.task) || ""),
                context: {
                  domain:
                    block.name === "cowork_task"
                      ? asNonEmptyString(bridgeInput.domain) || "dominionhomedeals"
                      : undefined,
                  crew:
                    block.name === "crew_run"
                      ? asNonEmptyString(bridgeInput.crew) || null
                      : undefined,
                  tool_use_id: block.id,
                  dispatch_metadata: dispatchMetadata,
                },
                status: "running",
              });

              if ("error" in accountability) {
                precomputed.push({
                  type: "tool_result",
                  tool_use_id: block.id,
                  content: `Cowork accountability failed: ${accountability.error}. The task was blocked so it would not become invisible to kernel governance.`,
                  is_error: true,
                });
                continue;
              }

              bridgeRequests.push({
                id: block.id,
                name: block.name,
                input: block.input as Record<string, unknown>,
                accountabilityJobId: accountability.jobId,
              });
            }

            if (bridgeRequests.length === 0) {
              convo.push({ role: "assistant", content: contentBlocks });
              convo.push({ role: "user", content: precomputed });
              continue;
            }

            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  vault_action: {
                    provider: "anthropic",
                    requests: bridgeRequests,
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
        if (looksLikeAnthropicBillingError(msg)) {
          const fallbackMessage = Boolean(openAIKey)
            ? continuation
              ? "Anthropic billing is unavailable for this in-flight continuation. Start a new message so AL routes on the OpenAI-first path."
              : "Anthropic billing is unavailable. Retry now; AL will route this request on the OpenAI-first path."
            : "Anthropic billing is unavailable and OPENAI_API_KEY is not configured, so no fallback reasoning provider is available.";
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ t: fallbackMessage })}\n\n`),
          );
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
          return;
        }
        if (taskClassification?.taskClass === "browser_commerce_design") {
          const usefulMessage =
            looksLikeAnthropicBillingError(msg) && browserCommerceAssessment
              ? browserCommerceAssessment.operatorMessage
              : `Vendor/design routing failed before the browser lane could run. ${msg}`;
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ t: usefulMessage })}\n\n`)
          );
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
          return;
        }
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
