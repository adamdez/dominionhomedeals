import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getServiceClient } from "@/lib/supabase";

/* ------------------------------------------------------------------ */
/*  System prompt                                                      */
/* ------------------------------------------------------------------ */

const SYSTEM_PROMPT = `You are Al Boreland, the autonomous CEO who runs Dominion Homes (wholesale real estate), WrenchReady Mobile (mobile auto repair), Tina (AI business tax agent), and the user's personal life. You are professional, concise, action-oriented, and always reference the uploaded constitutions, doctrines, pre-mortems, and operating principles when relevant. You log every meaningful action as a trajectory and strive to reduce the user's admin workload.

When responding:
- Lead with the most important information first
- Use bullet points for lists and action items
- Flag anything that needs the user's immediate decision
- End with clear next steps when applicable
- When the user shares images or documents, analyze them thoroughly before responding

You have access to a web_search tool. Use it when:
- The user asks about recent news, events, or current data
- You need up-to-date pricing, market data, or statistics
- The user explicitly asks you to search or look something up
- You need current information about a specific company, property, or person
Do NOT search for general knowledge you already have.`;

/* ------------------------------------------------------------------ */
/*  Tool definitions                                                   */
/* ------------------------------------------------------------------ */

const TOOLS: Anthropic.Tool[] = [
  {
    name: "web_search",
    description:
      "Search the internet for current, real-time information. Use for recent news, live prices, current events, company lookups, property data, market conditions, or anything requiring up-to-date knowledge.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "The search query to look up",
        },
      },
      required: ["query"],
    },
  },
];

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

async function executeWebSearch(query: string): Promise<string> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return "Web search is not configured. Ask the admin to set TAVILY_API_KEY.";

  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        max_results: 5,
        include_answer: true,
        search_depth: "basic",
      }),
    });

    if (!res.ok) return `Search failed (${res.status}). Try rephrasing.`;

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

function sseHeaders(): HeadersInit {
  return {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  };
}

/* ------------------------------------------------------------------ */
/*  Streaming tool-use helpers                                         */
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
  prependNewlines: boolean
): Promise<StreamTurnResult> {
  const stream = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages,
    tools,
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
        const block = event.content_block;
        if (block.type === "text") {
          contentBlocks.push({ type: "text", text: "" } as Anthropic.TextBlock);
        } else if (block.type === "tool_use") {
          currentTool = { id: block.id, name: block.name, jsonParts: [] };
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
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ t })}\n\n`)
          );
        } else if (
          event.delta.type === "input_json_delta" &&
          currentTool
        ) {
          currentTool.jsonParts.push(event.delta.partial_json);
        }
        break;
      }
      case "content_block_stop": {
        if (currentTool) {
          let input: Record<string, unknown> = {};
          try {
            input = JSON.parse(currentTool.jsonParts.join(""));
          } catch {}
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

  const { message, history, attachments } = (await request.json()) as {
    message: string;
    history?: HistoryMessage[];
    attachments?: RequestAttachment[];
  };

  const anthropic = new Anthropic({ apiKey });

  const messages: Anthropic.MessageParam[] = (history || []).map((m) => ({
    role: m.role === "al" ? ("assistant" as const) : ("user" as const),
    content: m.content,
  }));

  if (attachments && attachments.length > 0) {
    const content: Anthropic.ContentBlockParam[] = [];
    for (const att of attachments) {
      const base64 = extractBase64(att.data);
      if (att.type.startsWith("image/")) {
        content.push({
          type: "image",
          source: {
            type: "base64",
            media_type: att.type as ImageMediaType,
            data: base64,
          },
        });
      } else if (att.type === "application/pdf") {
        content.push({
          type: "document",
          source: {
            type: "base64",
            media_type: "application/pdf",
            data: base64,
          },
        } as unknown as Anthropic.ContentBlockParam);
      }
    }
    content.push({ type: "text", text: message || "Review the attached file(s)." });
    messages.push({ role: "user", content });
  } else {
    messages.push({ role: "user", content: message });
  }

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      let fullResponse = "";
      const conversationMessages: Anthropic.MessageParam[] = [...messages];

      try {
        for (let turn = 0; turn < 4; turn++) {
          const { stopReason, contentBlocks, textOutput } = await streamOneTurn(
            anthropic,
            conversationMessages,
            TOOLS,
            controller,
            encoder,
            turn > 0 && fullResponse.length > 0
          );

          fullResponse += textOutput;

          if (stopReason !== "tool_use") break;

          const toolBlocks = contentBlocks.filter(
            (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
          );

          if (toolBlocks.length === 0) break;

          conversationMessages.push({
            role: "assistant",
            content: contentBlocks,
          });

          const toolResults: Anthropic.ToolResultBlockParam[] = [];

          for (const tb of toolBlocks) {
            const query =
              (tb.input as Record<string, string>).query || String(tb.input);

            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ status: "searching", query })}\n\n`
              )
            );

            const result = await executeWebSearch(query);

            toolResults.push({
              type: "tool_result",
              tool_use_id: tb.id,
              content: result,
            });
          }

          conversationMessages.push({
            role: "user",
            content: toolResults,
          });
        }

        const actionSummary = attachments?.length
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
