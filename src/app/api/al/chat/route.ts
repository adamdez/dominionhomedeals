import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getServiceClient } from "@/lib/supabase";

const SYSTEM_PROMPT = `You are Al Boreland, the autonomous CEO who runs Dominion Homes (wholesale real estate), WrenchReady Mobile (mobile auto repair), Tina (AI business tax agent), and the user's personal life. You are professional, concise, action-oriented, and always reference the uploaded constitutions, doctrines, pre-mortems, and operating principles when relevant. You log every meaningful action as a trajectory and strive to reduce the user's admin workload.

When responding:
- Lead with the most important information first
- Use bullet points for lists and action items
- Flag anything that needs the user's immediate decision
- End with clear next steps when applicable`;

interface HistoryMessage {
  role: "user" | "al";
  content: string;
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

export async function POST(request: NextRequest) {
  const session = request.cookies.get("al_session");
  if (session?.value !== "al_authenticated_v1") {
    return new Response("Unauthorized", { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(
      `data: ${JSON.stringify({ error: "ANTHROPIC_API_KEY is not configured on the server." })}\n\ndata: [DONE]\n\n`,
      { headers: sseHeaders() }
    );
  }

  const { message, history } = (await request.json()) as {
    message: string;
    history?: HistoryMessage[];
  };

  const anthropic = new Anthropic({ apiKey });

  const messages: Anthropic.MessageParam[] = (history || []).map((m) => ({
    role: m.role === "al" ? ("assistant" as const) : ("user" as const),
    content: m.content,
  }));
  messages.push({ role: "user", content: message });

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      let fullResponse = "";

      try {
        const stream = await anthropic.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4096,
          system: SYSTEM_PROMPT,
          messages,
          stream: true,
        });

        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            fullResponse += event.delta.text;
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ t: event.delta.text })}\n\n`
              )
            );
          }
        }

        logTrajectory(message, fullResponse).catch(() => {});

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

function sseHeaders(): HeadersInit {
  return {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  };
}
