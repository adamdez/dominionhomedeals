"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Fragment,
  useState,
  useEffect,
  useRef,
  useCallback,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  Send,
  Menu,
  Loader2,
  X,
  Paperclip,
  FileText,
  Globe,
  FolderOpen,
  ShieldCheck,
  BookUp,
  Users,
  Bot,
} from "lucide-react";
import { withAlAppPrefix } from "@/lib/al-app-path";
import { AuthScreen } from "./AuthScreen";
import { Sidebar } from "./Sidebar";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  data?: string;
}

interface Message {
  id: string;
  role: "user" | "al";
  content: string;
  timestamp: number;
  typing?: boolean;
  attachments?: Attachment[];
}

interface VaultToolRequest {
  id: string;
  name: string;
  input: Record<string, unknown>;
  accountabilityJobId?: number;
}

interface VaultAction {
  provider?: "openai" | "anthropic";
  previousResponseId?: string;
  requests: VaultToolRequest[];
  assistantBlocks: unknown[];
  precomputedResults: unknown[];
}

interface BridgeCapabilities {
  executor_online?: boolean;
  deep_research?: boolean;
  cowork_execution?: boolean;
  codex_execution?: boolean;
  local_pdf_merge?: boolean;
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

interface BridgeHealthResponse {
  ok?: boolean;
  capabilities?: BridgeCapabilities;
  executor?: {
    online?: boolean;
    status?: string;
    version?: string | null;
  };
}

interface RuntimeLaneTruth {
  id: string;
  label: string;
  status: "live" | "degraded" | "blocked";
  primaryMode: "hosted" | "local-bridge" | "mixed";
  fallbackMode: "hosted" | "local-bridge" | "mixed" | null;
  detail: string;
  nextAction: string;
  outcome: string;
}

interface HostedRuntimeTruth {
  generatedAt: string;
  deployment: {
    environment: string;
    deploymentId: string | null;
    gitCommitSha: string | null;
    gitCommitRef: string | null;
  };
  summary: {
    live: number;
    degraded: number;
    blocked: number;
  };
  lanes: RuntimeLaneTruth[];
}

interface HostedHealthResponse {
  ok?: boolean;
  checks?: Record<string, { ok: boolean; detail: string }>;
  runtimeTruth?: HostedRuntimeTruth;
}

interface OperationalProofReport {
  generatedAt: string;
  summary: {
    healthy: number;
    warning: number;
    failing: number;
  };
  topNextMove: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = "al_chat_messages";
const MAX_HISTORY = 30;
const MAX_FILES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGE_DIM = 1600;
const MAX_BRIDGE_IMAGE_DIM = 1280;
const MAX_CONTINUATION_BODY_BYTES = 900_000;
const MAX_TOOL_RESULT_TEXT_CHARS = 40_000;
const CONTINUATION_RETRY_DELAY_MS = 500;
const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
];

const DEFAULT_BRIDGE_URL = "http://localhost:3141";

function defaultBridgeUrl() {
  if (typeof window === "undefined") {
    return DEFAULT_BRIDGE_URL;
  }
  const host = window.location.hostname;
  if (host === "127.0.0.1" || host === "localhost") {
    return `${window.location.protocol}//${host}:3141`;
  }
  return DEFAULT_BRIDGE_URL;
}

/* ------------------------------------------------------------------ */
/*  File processing helpers                                            */
/* ------------------------------------------------------------------ */

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function readBlobAsDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

function resizeImage(file: File): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const { width, height } = img;
      if (width <= MAX_IMAGE_DIM && height <= MAX_IMAGE_DIM && file.size < 1024 * 1024) {
        resolve(file);
        return;
      }
      const ratio = Math.min(MAX_IMAGE_DIM / width, MAX_IMAGE_DIM / height, 1);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((b) => resolve(b || file), "image/jpeg", 0.85);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
}

async function processFile(file: File): Promise<Attachment | null> {
  if (!ACCEPTED_TYPES.includes(file.type)) return null;
  if (file.size > MAX_FILE_SIZE) return null;
  let blob: Blob = file;
  let mime = file.type;
  if (file.type.startsWith("image/") && file.type !== "image/gif") {
    blob = await resizeImage(file);
    mime = "image/jpeg";
  }
  const data = await readBlobAsDataUri(blob);
  return { id: crypto.randomUUID(), name: file.name, type: mime, size: blob.size, data };
}

function byteLengthOfJson(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).length;
}

async function optimizeBridgeImageResult(result: BridgeImageResult): Promise<BridgeImageResult> {
  if (
    !result.base64 ||
    !result.mimeType.startsWith("image/") ||
    result.mimeType === "image/gif"
  ) {
    return result;
  }

  // Keep already-small payloads untouched.
  if (result.base64.length < 220_000) {
    return result;
  }

  try {
    const sourceDataUri = `data:${result.mimeType};base64,${result.base64}`;
    const blob = await fetch(sourceDataUri).then((r) => r.blob());
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      const objectUrl = URL.createObjectURL(blob);
      image.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(image);
      };
      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Image decode failed"));
      };
      image.src = objectUrl;
    });

    const ratio = Math.min(
      MAX_BRIDGE_IMAGE_DIM / img.width,
      MAX_BRIDGE_IMAGE_DIM / img.height,
      1,
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.width * ratio));
    canvas.height = Math.max(1, Math.round(img.height * ratio));
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return result;
    }
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const optimizedBlob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.82);
    });
    if (!optimizedBlob) {
      return result;
    }

    const optimizedDataUri = await readBlobAsDataUri(optimizedBlob);
    const optimizedBase64 = optimizedDataUri.split(",", 2)[1];
    if (!optimizedBase64 || optimizedBase64.length >= result.base64.length) {
      return result;
    }

    return {
      ...result,
      base64: optimizedBase64,
      mimeType: "image/jpeg",
    };
  } catch {
    return result;
  }
}

function compactContinuationToolResults(
  provider: "openai" | "anthropic" | undefined,
  toolResults: unknown[],
): unknown[] {
  return toolResults.map((result) => {
    if (!result || typeof result !== "object") {
      return result;
    }

    if (provider === "openai") {
      const typed = result as { type?: string; output?: unknown };
      if (typed.type !== "function_call_output" || typeof typed.output !== "string") {
        return result;
      }
      try {
        const parsed = JSON.parse(typed.output) as {
          type?: string;
          path?: string;
          mimeType?: string;
          base64?: string;
        };
        if (parsed.type !== "image" || !parsed.base64) {
          return result;
        }
        return {
          ...(result as Record<string, unknown>),
          output: `Image loaded: ${parsed.path || "bridge image"} (${parsed.mimeType || "image"}). Payload compacted to keep chat continuation stable.`,
        };
      } catch {
        return result;
      }
    }

    const typed = result as { type?: string; content?: unknown };
    if (typed.type !== "tool_result" || !Array.isArray(typed.content)) {
      return result;
    }

    const content = typed.content as Array<{ type?: string; text?: string }>;
    const hasImage = content.some((item) => item?.type === "image");
    if (!hasImage) {
      return result;
    }

    const textSnippet =
      content.find((item) => item?.type === "text" && typeof item.text === "string")?.text ||
      "Bridge image loaded.";
    return {
      ...(result as Record<string, unknown>),
      content: `${textSnippet} Payload compacted to keep chat continuation stable.`,
    };
  });
}

async function extractChatResponseError(res: Response): Promise<string> {
  let raw = "";
  try {
    raw = await res.text();
  } catch {
    return `Server error ${res.status}`;
  }

  if (!raw) {
    return `Server error ${res.status}`;
  }

  const errorMatch = raw.match(/"error"\s*:\s*"([^"]+)"/i);
  if (errorMatch?.[1]) {
    return `Server error ${res.status}: ${errorMatch[1]}`;
  }

  const textMatch = raw.match(/"t"\s*:\s*"([^"]+)"/i);
  if (textMatch?.[1]) {
    return `Server error ${res.status}: ${textMatch[1]}`;
  }

  return `Server error ${res.status}: ${raw.slice(0, 220)}`;
}

function truncateContinuationText(value: string, reqName: string): string {
  if (value.length <= MAX_TOOL_RESULT_TEXT_CHARS) {
    return value;
  }

  return (
    `${value.slice(0, MAX_TOOL_RESULT_TEXT_CHARS)}\n\n` +
    `[${reqName}] result truncated to keep continuation payload stable. ` +
    `Original length: ${value.length} characters.`
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/* ------------------------------------------------------------------ */
/*  Bridge helpers (read config from localStorage, not component state)*/
/* ------------------------------------------------------------------ */

function getBridgeConfig() {
  if (typeof window === "undefined") return { url: DEFAULT_BRIDGE_URL, token: "" };
  return {
    url: localStorage.getItem("al_bridge_url") || defaultBridgeUrl(),
    token: localStorage.getItem("al_bridge_token") || "",
  };
}

function bridgeHeaders(): Record<string, string> {
  const { token } = getBridgeConfig();
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

interface BridgeImageResult {
  type: "image";
  base64: string;
  mimeType: string;
  path: string;
}

type BridgeResult = string | BridgeImageResult;

function inputString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

const URL_PATTERN = /(https?:\/\/[^\s]+)/g;
const MARKDOWN_LINK_PATTERN = /\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g;

function renderAutoLinkedTextSegment(text: string, keyPrefix: string): ReactNode[] {
  return text.split(URL_PATTERN).map((part, index) => {
    if (!/^https?:\/\/[^\s]+$/i.test(part)) {
      return <Fragment key={`${keyPrefix}-text-${index}`}>{part}</Fragment>;
    }

    return (
      <a
        key={`${keyPrefix}-link-${index}`}
        href={part}
        target="_blank"
        rel="noreferrer"
        className="underline decoration-emerald-400/40 underline-offset-4 transition-colors hover:text-emerald-300"
      >
        {part}
      </a>
    );
  });
}

function renderLinkedText(text: string) {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let matchIndex = 0;
  MARKDOWN_LINK_PATTERN.lastIndex = 0;

  for (let match = MARKDOWN_LINK_PATTERN.exec(text); match; match = MARKDOWN_LINK_PATTERN.exec(text)) {
    const [fullMatch, label, url] = match;
    const before = text.slice(lastIndex, match.index);
    if (before) {
      nodes.push(...renderAutoLinkedTextSegment(before, `plain-${matchIndex}`));
    }
    nodes.push(
      <a
        key={`md-${matchIndex}`}
        href={url}
        target="_blank"
        rel="noreferrer"
        className="underline decoration-emerald-400/40 underline-offset-4 transition-colors hover:text-emerald-300"
      >
        {label}
      </a>,
    );
    lastIndex = match.index + fullMatch.length;
    matchIndex += 1;
  }

  const tail = text.slice(lastIndex);
  if (tail) {
    nodes.push(...renderAutoLinkedTextSegment(tail, `tail-${matchIndex}`));
  }

  return nodes;
}

function parseBridgeJsonResult(result: BridgeResult): Record<string, unknown> | null {
  if (typeof result !== "string") return null;
  try {
    const parsed = JSON.parse(result);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function fileNameFromBridgePath(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const normalized = value.replace(/\\/g, "/");
  const fileName = normalized.split("/").pop() || "";
  return fileName || null;
}

function buildHostedReviewPath(jobId: number): string {
  if (typeof window !== "undefined" && window.location.hostname === "al.dominionhomedeals.com") {
    return `/boardroom/${jobId}`;
  }
  return `/al/boardroom/${jobId}`;
}

function bridgeArtifactUrl(reviewPageUrl: string, fileName: string): string {
  const url = new URL(reviewPageUrl);
  url.pathname = url.pathname.replace(/\/review$/, `/artifact/${encodeURIComponent(fileName)}`);
  return url.toString();
}

async function fetchBridgeArtifactUpload(reviewPageUrl: string, fileName: string) {
  const response = await fetch(bridgeArtifactUrl(reviewPageUrl, fileName));
  if (!response.ok) {
    throw new Error(`Could not load bridge artifact ${fileName} (${response.status}).`);
  }
  const blob = await response.blob();
  return {
    dataUrl: await readBlobAsDataUri(blob),
    contentType: blob.type || "image/png",
    fileName,
  };
}

async function maybePromoteBrowserVendorReviewResult(
  req: VaultToolRequest,
  result: BridgeResult,
): Promise<BridgeResult> {
  if (req.name !== "browser_vendor_cart_review" || typeof req.accountabilityJobId !== "number") {
    return result;
  }

  const parsed = parseBridgeJsonResult(result);
  if (!parsed || parsed.ok !== true) {
    return result;
  }

  const localReviewPageUrl = inputString(parsed.review_page_url);
  if (!localReviewPageUrl) {
    return result;
  }

  const chosenDesign =
    parsed.chosen_design && typeof parsed.chosen_design === "object"
      ? (parsed.chosen_design as Record<string, unknown>)
      : {};
  const artifacts =
    parsed.artifacts && typeof parsed.artifacts === "object"
      ? (parsed.artifacts as Record<string, unknown>)
      : {};

  const artifactDefinitions = [
    {
      key: "chosen_design_preview",
      fileName: fileNameFromBridgePath(chosenDesign.preview_path),
    },
    {
      key: "design_review_image",
      fileName: fileNameFromBridgePath(artifacts.design_review),
    },
    {
      key: "cart_review_image",
      fileName: fileNameFromBridgePath(artifacts.cart_review),
    },
  ].filter((entry): entry is { key: string; fileName: string } => Boolean(entry.fileName));

  const hostedArtifacts: Record<
    string,
    { dataUrl: string; contentType: string; fileName: string }
  > = {};
  for (const entry of artifactDefinitions) {
    try {
      hostedArtifacts[entry.key] = await fetchBridgeArtifactUpload(localReviewPageUrl, entry.fileName);
    } catch {
      // Keep the bridge-local artifact as a fallback when one fetch fails.
    }
  }

  try {
    const syncResponse = await fetch(`/api/al/reviews/${req.accountabilityJobId}/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bridgeResult: parsed,
        artifacts: hostedArtifacts,
      }),
    });
    const payload = (await syncResponse.json().catch(() => null)) as
      | {
          ok?: boolean;
          reviewPageUrl?: string;
          reviewState?: string;
          reviewSurface?: Record<string, unknown>;
          nextAction?: string;
        }
      | null;

    if (!syncResponse.ok || !payload?.ok) {
      return result;
    }

    parsed.review_page_url =
      payload.reviewPageUrl || `${window.location.origin}${buildHostedReviewPath(req.accountabilityJobId)}`;
    parsed.review_state = payload.reviewState || "cart_ready_for_review";
    if (payload.reviewSurface) {
      parsed.review_surface = payload.reviewSurface;
    }
    if (payload.nextAction) {
      parsed.next_action = payload.nextAction;
    }
    return JSON.stringify(parsed);
  } catch {
    return result;
  }
}

async function executeBridgeAction(req: VaultToolRequest): Promise<BridgeResult> {
  const { url } = getBridgeConfig();
  const headers = bridgeHeaders();
  try {
    switch (req.name) {
      case "vault_list": {
        const res = await fetch(
          `${url}/list?path=${encodeURIComponent(inputString(req.input.path))}`,
          { headers }
        );
        const data = await res.json();
        if (!res.ok) return `Error: ${data.error}`;
        return (data.entries as { name: string; type: string }[])
          .map((e) => `[${e.type}] ${e.name}`)
          .join("\n") || "Empty folder.";
      }
      case "vault_read": {
        const res = await fetch(
          `${url}/read?path=${encodeURIComponent(inputString(req.input.path))}`,
          { headers }
        );
        const data = await res.json();
        if (!res.ok) return `Error: ${data.error}`;
        return data.content;
      }
      case "vault_read_image": {
        const res = await fetch(
          `${url}/read-image?path=${encodeURIComponent(inputString(req.input.path))}`,
          { headers }
        );
        const data = await res.json();
        if (!res.ok) return `Error: ${data.error}`;
        const rawResult: BridgeImageResult = {
          type: "image",
          base64: data.base64,
          mimeType: data.mimeType || "image/png",
          path: data.path || inputString(req.input.path),
        };
        return optimizeBridgeImageResult(rawResult);
      }
      case "crew_list": {
        const res = await fetch(`${url}/crew/list`, { headers });
        const data = await res.json();
        if (!res.ok) return `Error: ${data.error || res.status}`;
        let out = "";
        if (data.error) out += `Setup: ${data.error}\n\n`;
        const crews = data.crews as { id: string; file: string }[];
        out += crews?.length
          ? crews.map((c) => `- ${c.id} (${c.file})`).join("\n")
          : "No crews discovered.";
        const runs = data.activeRuns as { id: string; crew: string }[] | undefined;
        if (runs?.length)
          out += `\n\nActive runs:\n${runs.map((r) => `- ${r.crew} (${r.id})`).join("\n")}`;
        if (data.crewRoot) out += `\n\nProject: ${data.crewRoot}`;
        return out.trim();
      }
      case "crew_run": {
        const res = await fetch(`${url}/crew/run`, {
          method: "POST",
          headers,
          body: JSON.stringify({ crew: inputString(req.input.crew) }),
        });
        const data = await res.json();
        if (!res.ok) return `Error: ${data.error || res.status}`;
        return JSON.stringify(data, null, 2);
      }
      case "crew_status": {
        const res = await fetch(
          `${url}/crew/status?id=${encodeURIComponent(inputString(req.input.run_id))}`,
          { headers }
        );
        const data = await res.json();
        if (!res.ok) return `Error: ${data.error || res.status}`;
        return JSON.stringify(data, null, 2);
      }
      case "deep_research": {
        const res = await fetch(`${url}/research`, {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({ task: inputString(req.input.task) }),
        });
        const data = await res.json();
        if (!res.ok) return `Error: ${data.error || res.status}`;
        return data.result || JSON.stringify(data);
      }
      case "cowork_task": {
        const res = await fetch(`${url}/cowork`, {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({
            task: inputString(req.input.task),
            domain: inputString(req.input.domain) || "dominionhomedeals",
            authority_zone: 1,
          }),
        });
        const data = await res.json();
        if (!res.ok) return `Error: ${data.error || res.status}`;
        const elapsed = data.elapsed ? ` (${data.elapsed}s)` : "";
        const session = data.session_id ? ` · session ${data.session_id}` : "";
        return `✓ Done${elapsed}${session}\n\n${data.result || JSON.stringify(data)}`;
      }
      case "codex_task": {
        const res = await fetch(`${url}/codex/exec`, {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify(req.input || {}),
        });
        const data = await res.json().catch(() => null);
        return JSON.stringify(
          data || {
            ok: false,
            status: "codex_bridge_request_failed",
            operator_message: `Codex task failed with HTTP ${res.status}.`,
            next_action:
              "Verify the local Codex CLI lane and retry with a tighter task or a safer working directory.",
          },
        );
      }
      case "local_pdf_merge": {
        const res = await fetch(`${url}/pdf/merge`, {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify(req.input || {}),
        });
        const data = await res.json().catch(() => null);
        return JSON.stringify(
          data || {
            ok: false,
            status: "pdf_merge_bridge_request_failed",
            operator_message: `Local PDF merge failed with HTTP ${res.status}.`,
            next_action:
              "Verify the local bridge PDF merge helper and retry without using the legacy local executor.",
          },
        );
      }
      case "browser_vendor_cart_review": {
        const res = await fetch(`${url}/browser/vendor-cart-review`, {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify(req.input || {}),
        });
        const data = await res.json().catch(() => null);
        return JSON.stringify(
          data || {
            ok: false,
            status: "bridge_request_failed",
            operator_message: `Vendor/design lane failed with HTTP ${res.status}.`,
            next_action:
              "Verify the local browser/vendor bridge worker and retry the cart review flow.",
          }
        );
      }
      case "media_production": {
        const res = await fetch(`${url}/media/brand-assets`, {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify(req.input || {}),
        });
        const data = await res.json().catch(() => null);
        return JSON.stringify(
          data || {
            ok: false,
            status: "media_bridge_request_failed",
            operator_message: `Media production lane failed with HTTP ${res.status}.`,
            next_action:
              "Verify local bridge media worker, source photo path, and RUNWAY_API_KEY, then retry.",
          },
        );
      }
      default:
        return `Unknown bridge tool: ${req.name}`;
    }
  } catch (err) {
    return `Bridge connection failed: ${err instanceof Error ? err.message : "unknown error"}`;
  }
}

function toContinuationToolResult(
  provider: "openai" | "anthropic" | undefined,
  req: VaultToolRequest,
  result: BridgeResult,
  denied = false,
) {
  const textResult =
    typeof result === "string" ? truncateContinuationText(result, req.name) : result;

  if (provider === "openai") {
    if (denied) {
      return {
        type: "function_call_output" as const,
        call_id: req.id,
        output: "User denied this file system action.",
      };
    }

    if (typeof result === "object" && result.type === "image") {
      return {
        type: "function_call_output" as const,
        call_id: req.id,
        output: JSON.stringify({
          type: "image",
          path: result.path,
          mimeType: result.mimeType,
          base64: result.base64,
        }),
      };
    }

    return {
      type: "function_call_output" as const,
      call_id: req.id,
      output: textResult as string,
    };
  }

  if (denied) {
    return {
      type: "tool_result" as const,
      tool_use_id: req.id,
      content: "User denied this file system action.",
      is_error: true,
    };
  }

  if (typeof result === "object" && result.type === "image") {
    return {
      type: "tool_result" as const,
      tool_use_id: req.id,
      content: [
        {
          type: "image",
          source: { type: "base64", media_type: result.mimeType, data: result.base64 },
        },
        { type: "text", text: `Image loaded: ${result.path}` },
      ],
    };
  }

  return {
    type: "tool_result" as const,
    tool_use_id: req.id,
    content: textResult as string,
  };
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function ChatApp() {
  /* ── Core state ── */
  const pathname = usePathname();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<Attachment[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string | null>(null);
  const [publishingPath, setPublishingPath] = useState<string | null>(null);
  const [delegatingCeo, setDelegatingCeo] = useState<string | null>(null);
  const [activeJobs, setActiveJobs] = useState<{ job_id: number; ceo_name: string }[]>([]);

  /* ── Bridge state ── */
  const [bridgeConnected, setBridgeConnected] = useState(false);
  const [bridgeHealth, setBridgeHealth] = useState<BridgeHealthResponse | null>(null);
  const [hostedHealth, setHostedHealth] = useState<HostedHealthResponse | null>(null);
  const [operationalProof, setOperationalProof] = useState<OperationalProofReport | null>(null);
  const [pendingVaultAction, setPendingVaultAction] = useState<VaultAction | null>(null);
  const [executingVault, setExecutingVault] = useState(false);

  /* ── Refs ── */
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesRef = useRef<Message[]>([]);
  const pendingRef = useRef<Attachment[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const dragCounter = useRef(0);
  const activeAlIdRef = useRef<string | null>(null);
  const accumulatedRef = useRef("");
  const originalRequestRef = useRef<Record<string, unknown> | null>(null);

  messagesRef.current = messages;
  pendingRef.current = pendingFiles;

  /* ── Auth ── */
  useEffect(() => {
    fetch("/api/al/verify")
      .then((r) => r.json())
      .then((d) => setAuthed(d.authenticated))
      .catch(() => setAuthed(false));
  }, []);

  /* ── Restore messages ── */
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: Message[] = JSON.parse(stored);
        setMessages(parsed.map((m) => ({ ...m, typing: false })));
      }
    } catch { /* corrupt storage */ }
  }, []);

  /* ── Persist messages (strip attachment data to fit localStorage) ── */
  useEffect(() => {
    if (messages.length > 0) {
      const toSave = messages.map(({ typing, ...rest }) => ({
        ...rest,
        attachments: rest.attachments?.map(({ data, ...a }) => a),
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    }
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pendingVaultAction]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  /* ── Bridge health check ── */
  useEffect(() => {
    checkBridge();
    checkHostedHealth();
  }, []);

  useEffect(() => {
    if (authed) {
      checkOperationalProof();
    } else if (authed === false) {
      setOperationalProof(null);
    }
  }, [authed]);

  function checkBridge() {
    const { url, token } = getBridgeConfig();
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    fetch(`${url}/health`, { headers })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: BridgeHealthResponse | null) => {
        setBridgeHealth(d);
        setBridgeConnected(!!d?.ok);
      })
      .catch(() => {
        setBridgeHealth(null);
        setBridgeConnected(false);
      });
  }

  function checkHostedHealth() {
    fetch("/api/al/health")
      .then((r) => (r.ok || r.status === 207 ? r.json() : null))
      .then((d: HostedHealthResponse | null) => {
        setHostedHealth(d);
      })
      .catch(() => {
        setHostedHealth(null);
      });
  }

  function checkOperationalProof() {
    fetch("/api/al/operational-proof", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { ok?: boolean; report?: OperationalProofReport } | null) => {
        setOperationalProof(d?.ok && d.report ? d.report : null);
      })
      .catch(() => {
        setOperationalProof(null);
      });
  }

  /* ── File handling ── */

  async function addFiles(fileList: File[]) {
    const remaining = MAX_FILES - pendingRef.current.length;
    if (remaining <= 0) return;
    const toProcess = fileList.slice(0, remaining);
    const results = await Promise.all(toProcess.map(processFile));
    const valid = results.filter(Boolean) as Attachment[];
    if (valid.length > 0) setPendingFiles((prev) => [...prev, ...valid]);
  }

  function removeFile(id: string) {
    setPendingFiles((prev) => prev.filter((f) => f.id !== id));
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
      e.target.value = "";
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const files = Array.from(e.clipboardData.files);
    if (files.length > 0) {
      e.preventDefault();
      addFiles(files);
    }
  }

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault();
    dragCounter.current++;
    if (e.dataTransfer.types.includes("Files")) setDragActive(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) setDragActive(false);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    dragCounter.current = 0;
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) addFiles(files);
  }

  /* ── SSE stream processor (shared by sendMessage + continuation) ── */

  async function processStream(
    res: Response,
    alId: string,
    startAccumulated: string
  ): Promise<{ accumulated: string; vaultAction: VaultAction | null }> {
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let accumulated = startAccumulated;
    let vaultAction: VaultAction | null = null;
    let needsSeparator = startAccumulated.length > 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      for (const line of chunk.split("\n\n")) {
        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6);
        if (payload === "[DONE]") continue;
        try {
          const parsed = JSON.parse(payload);
          if (parsed.error) {
            accumulated += accumulated
              ? `\n\n---\nError: ${parsed.error}`
              : `Error: ${parsed.error}`;
            setMessages((p) =>
              p.map((m) => (m.id === alId ? { ...m, content: accumulated } : m))
            );
          } else if (parsed.status === "searching") {
            setSearchQuery(parsed.query || "the web");
            setPublishingPath(null);
            setDelegatingCeo(null);
          } else if (parsed.status === "publishing") {
            setPublishingPath(parsed.path || "vault");
            setSearchQuery(null);
            setDelegatingCeo(null);
          } else if (parsed.status === "delegating") {
            setDelegatingCeo(parsed.ceo || "a CEO");
            setSearchQuery(null);
            setPublishingPath(null);
          } else if (parsed.job_dispatched) {
            // Async job fired — add persistent badge, clear the transient delegating indicator
            const { job_id, ceo_name } = parsed.job_dispatched;
            setActiveJobs((prev) => [...prev.filter((j) => j.job_id !== job_id), { job_id, ceo_name }]);
            setDelegatingCeo(null);
          } else if (parsed.vault_action) {
            vaultAction = parsed.vault_action as VaultAction;
          } else if (parsed.t) {
            setSearchQuery(null);
            setPublishingPath(null);
            setDelegatingCeo(null);
            if (needsSeparator) {
              accumulated += "\n\n";
              needsSeparator = false;
            }
            accumulated += parsed.t;
            // Clear job badges when Al streams back a job result (job_status response)
            const jobResultMatch = accumulated.match(/job\s+#(\d+)/gi);
            if (jobResultMatch) {
              const doneIds = jobResultMatch
                .map((s) => parseInt(s.replace(/\D/g, ""), 10))
                .filter((n) => !isNaN(n));
              if (doneIds.length > 0) {
                setActiveJobs((prev) =>
                  prev.filter((j) => !doneIds.includes(j.job_id))
                );
              }
            }
            setMessages((p) =>
              p.map((m) => (m.id === alId ? { ...m, content: accumulated } : m))
            );
          }
        } catch { /* skip malformed */ }
      }
    }

    return { accumulated, vaultAction };
  }

  /* ── Send message ── */

  const sendMessage = useCallback(
    async (text: string) => {
      const files = pendingRef.current;
      if (!text.trim() && files.length === 0) return;
      if (loading) return;

      setPendingFiles([]);
      setInput("");
      setLoading(true);
      if (inputRef.current) inputRef.current.style.height = "auto";

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: text.trim(),
        timestamp: Date.now(),
        attachments: files.length > 0 ? files : undefined,
      };

      const currentMessages = [...messagesRef.current, userMsg];
      setMessages(currentMessages);

      const alId = crypto.randomUUID();
      setMessages((prev) => [
        ...prev,
        { id: alId, role: "al", content: "", timestamp: Date.now(), typing: true },
      ]);

      const history = currentMessages
        .filter((m) => m.content)
        .slice(-MAX_HISTORY)
        .map(({ role, content }) => ({ role, content }));

      abortRef.current = new AbortController();

      const body: Record<string, unknown> = {
        message: text.trim(),
        history: history.slice(0, -1),
        bridgeConnected,
        bridgeCapabilities: bridgeHealth?.capabilities || null,
      };

      if (files.length > 0) {
        body.attachments = files.map(({ name, type, size, data }) => ({
          name,
          type,
          size,
          data,
        }));
      }

      let vaultActionReceived = false;

      try {
        const res = await fetch("/api/al/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: abortRef.current.signal,
        });

        if (!res.ok || !res.body) throw new Error(`Server error ${res.status}`);

        const { accumulated, vaultAction } = await processStream(res, alId, "");

          if (vaultAction) {
            activeAlIdRef.current = alId;
            accumulatedRef.current = accumulated;
            originalRequestRef.current = {
              message: body.message,
              history: body.history,
              bridgeConnected: body.bridgeConnected,
              bridgeCapabilities: body.bridgeCapabilities,
            };

          // Auto-approve vault reads — only crew_run needs manual approval
          const needsApproval = vaultAction.requests.some(
            (r: VaultToolRequest) => r.name === "crew_run"
          );
          if (needsApproval) {
            setPendingVaultAction(vaultAction);
          } else {
            // Execute immediately, no permission dialog
            await autoExecuteVaultAction(vaultAction, alId);
          }
          vaultActionReceived = true;
          return;
        }

        setSearchQuery(null);
        setPublishingPath(null);
        setDelegatingCeo(null);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === alId
              ? { ...m, content: accumulated || "No response received.", typing: false }
              : m
          )
        );
      } catch (err: unknown) {
        const isAbort = err instanceof Error && err.name === "AbortError";
        if (!isAbort) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === alId
                ? {
                    ...m,
                    content: "Failed to reach Al. Check your connection and try again.",
                    typing: false,
                  }
                : m
            )
          );
        }
      } finally {
        abortRef.current = null;
        if (!vaultActionReceived) setLoading(false);
      }
    },
    [loading, bridgeConnected, bridgeHealth]
  );

  /* ── Auto-execute vault actions (no approval needed for reads) ── */

  async function autoExecuteVaultAction(action: VaultAction, alId: string) {
    setExecutingVault(true);
    const toolResults: unknown[] = [];

    for (const req of action.requests) {
      if (req.name === "cowork_task" || req.name === "codex_task") {
        setDelegatingCeo(
          req.name === "codex_task" ? "Codex (OpenAI local lane…)" : "Local executor (legacy lane…)"
        );
      }
      let result = await executeBridgeAction(req);
      result = await maybePromoteBrowserVendorReviewResult(req, result);
      if (req.name === "cowork_task" || req.name === "codex_task") {
        setDelegatingCeo(null);
      }
      toolResults.push(toContinuationToolResult(action.provider, req, result));
    }
    setExecutingVault(false);

    const continuationBase = {
      provider: action.provider,
      previousResponseId: action.previousResponseId,
      assistantBlocks: action.assistantBlocks,
      precomputedResults: action.precomputedResults || [],
      toolResults,
      bridgeJobs: action.requests
        .filter((req) => typeof req.accountabilityJobId === "number")
        .map((req) => ({
          toolUseId: req.id,
          name: req.name,
          jobId: req.accountabilityJobId as number,
        })),
    };

    let continuation = continuationBase;
    let continuationBody = {
      ...originalRequestRef.current,
      continuation,
    };

    if (byteLengthOfJson(continuationBody) > MAX_CONTINUATION_BODY_BYTES) {
      continuation = {
        ...continuationBase,
        toolResults: compactContinuationToolResults(
          action.provider,
          continuationBase.toolResults,
        ),
      };
      continuationBody = {
        ...originalRequestRef.current,
        continuation,
      };
    }

    const attemptContinuation = async (body: Record<string, unknown>) => {
      const res = await fetch("/api/al/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: abortRef.current?.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error(await extractChatResponseError(res));
      }

      return processStream(res, alId, accumulatedRef.current);
    };

    abortRef.current = new AbortController();

    try {
      let continuationResult: Awaited<ReturnType<typeof processStream>>;
      try {
        continuationResult = await attemptContinuation(continuationBody);
      } catch (firstError) {
        const isAbort =
          firstError instanceof Error && firstError.name === "AbortError";
        if (isAbort) {
          throw firstError;
        }

        const retryContinuation = {
          ...continuationBase,
          toolResults: compactContinuationToolResults(
            action.provider,
            continuationBase.toolResults,
          ),
        };
        const retryBody = {
          ...originalRequestRef.current,
          continuation: retryContinuation,
        };

        const shouldRetry =
          byteLengthOfJson(retryBody) < byteLengthOfJson(continuationBody) ||
          /payload|too large|413|entity|body/i.test(
            firstError instanceof Error ? firstError.message : "",
          );

        if (!shouldRetry) {
          throw firstError;
        }

        await new Promise((resolve) =>
          setTimeout(resolve, CONTINUATION_RETRY_DELAY_MS),
        );
        continuationResult = await attemptContinuation(retryBody);
      }

      const { accumulated, vaultAction: nextVaultAction } = continuationResult;

      if (nextVaultAction) {
        accumulatedRef.current = accumulated;
        const needsApproval = nextVaultAction.requests.some((r: VaultToolRequest) => r.name === "crew_run");
        if (needsApproval) {
          setPendingVaultAction(nextVaultAction);
        } else {
          await autoExecuteVaultAction(nextVaultAction, alId);
        }
        return;
      }

      accumulatedRef.current = accumulated;
      setSearchQuery(null);
      setPublishingPath(null);
      setDelegatingCeo(null);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === alId ? { ...m, content: accumulated || "No response.", typing: false } : m
        )
      );
    } catch (err: unknown) {
      const isAbort = err instanceof Error && err.name === "AbortError";
      if (!isAbort) {
        const detail = err instanceof Error ? err.message : "Unknown continuation error.";
        setMessages((prev) =>
          prev.map((m) =>
            m.id === alId
              ? {
                  ...m,
                  content:
                    (accumulatedRef.current
                      ? `${accumulatedRef.current}\n\n`
                      : "") +
                    `Vault action completed, but continuation failed: ${detail}`,
                  typing: false,
                }
              : m
          )
        );
      }
    } finally {
      abortRef.current = null;
      setLoading(false);
    }
  }

  /* ── Vault action approval / denial ── */

  async function handleVaultApproval(approved: boolean) {
    const action = pendingVaultAction;
    if (!action || !originalRequestRef.current || !activeAlIdRef.current) return;

    const alId = activeAlIdRef.current;

    let toolResults: unknown[];

    if (approved) {
      setExecutingVault(true);
      toolResults = [];
      for (const req of action.requests) {
        let result = await executeBridgeAction(req);
        result = await maybePromoteBrowserVendorReviewResult(req, result);
        toolResults.push(toContinuationToolResult(action.provider, req, result));
      }
      setExecutingVault(false);
    } else {
      toolResults = action.requests.map((r) =>
        toContinuationToolResult(action.provider, r, "User denied this file system action.", true),
      );
    }

    setPendingVaultAction(null);

    const continuationBase = {
      provider: action.provider,
      previousResponseId: action.previousResponseId,
      assistantBlocks: action.assistantBlocks,
      precomputedResults: action.precomputedResults || [],
      toolResults,
      bridgeJobs: action.requests
        .filter((req) => typeof req.accountabilityJobId === "number")
        .map((req) => ({
          toolUseId: req.id,
          name: req.name,
          jobId: req.accountabilityJobId as number,
        })),
    };

    let continuation = continuationBase;
    let continuationBody = {
      ...originalRequestRef.current,
      continuation,
    };

    if (byteLengthOfJson(continuationBody) > MAX_CONTINUATION_BODY_BYTES) {
      continuation = {
        ...continuationBase,
        toolResults: compactContinuationToolResults(
          action.provider,
          continuationBase.toolResults,
        ),
      };
      continuationBody = {
        ...originalRequestRef.current,
        continuation,
      };
    }

    const attemptContinuation = async (body: Record<string, unknown>) => {
      const res = await fetch("/api/al/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: abortRef.current?.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error(await extractChatResponseError(res));
      }

      return processStream(res, alId, accumulatedRef.current);
    };

    abortRef.current = new AbortController();

    try {
      let continuationResult: Awaited<ReturnType<typeof processStream>>;
      try {
        continuationResult = await attemptContinuation(continuationBody);
      } catch (firstError) {
        const isAbort =
          firstError instanceof Error && firstError.name === "AbortError";
        if (isAbort) {
          throw firstError;
        }

        const retryContinuation = {
          ...continuationBase,
          toolResults: compactContinuationToolResults(
            action.provider,
            continuationBase.toolResults,
          ),
        };
        const retryBody = {
          ...originalRequestRef.current,
          continuation: retryContinuation,
        };

        const shouldRetry =
          byteLengthOfJson(retryBody) < byteLengthOfJson(continuationBody) ||
          /payload|too large|413|entity|body/i.test(
            firstError instanceof Error ? firstError.message : "",
          );

        if (!shouldRetry) {
          throw firstError;
        }

        await new Promise((resolve) =>
          setTimeout(resolve, CONTINUATION_RETRY_DELAY_MS),
        );
        continuationResult = await attemptContinuation(retryBody);
      }

      const { accumulated, vaultAction } = continuationResult;

      if (vaultAction) {
        accumulatedRef.current = accumulated;
        const needsApproval = vaultAction.requests.some(
          (r: VaultToolRequest) => r.name === "crew_run"
        );
        if (needsApproval) {
          setPendingVaultAction(vaultAction);
        } else {
          await autoExecuteVaultAction(vaultAction, alId);
        }
        return;
      }

      accumulatedRef.current = accumulated;
      setSearchQuery(null);
      setPublishingPath(null);
      setDelegatingCeo(null);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === alId
            ? { ...m, content: accumulated || "No response.", typing: false }
            : m
        )
      );
    } catch (err: unknown) {
      const isAbort = err instanceof Error && err.name === "AbortError";
      if (!isAbort) {
        const detail = err instanceof Error ? err.message : "Unknown continuation error.";
        setMessages((prev) =>
          prev.map((m) =>
            m.id === alId
              ? {
                  ...m,
                  content:
                    (accumulatedRef.current
                      ? `${accumulatedRef.current}\n\n`
                      : "") +
                    `Vault action completed, but continuation failed: ${detail}`,
                  typing: false,
                }
              : m
          )
        );
      }
    } finally {
      abortRef.current = null;
      setLoading(false);
    }
  }

  /* ── Actions ── */

  function handleQuickAction(prompt: string) {
    setSidebarOpen(false);
    if (!prompt) {
      inputRef.current?.focus();
      return;
    }
    sendMessage(prompt);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function clearChat() {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  }

  function stopGenerating() {
    abortRef.current?.abort();
    setLoading(false);
    setPendingVaultAction(null);
    setMessages((prev) =>
      prev.map((m) => (m.typing ? { ...m, typing: false } : m))
    );
  }

  const canSend = input.trim() || pendingFiles.length > 0;

  /* ── Render gates ── */

  if (authed === null) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500/20 border-t-emerald-500" />
      </div>
    );
  }

  if (!authed) {
    return <AuthScreen onAuthenticated={() => setAuthed(true)} />;
  }

  /* ── Main interface ── */

  return (
    <div className="flex h-full w-full">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onQuickAction={handleQuickAction}
        onOpenSettings={() => {
          setSidebarOpen(false);
          setSettingsOpen(true);
        }}
        hostedRuntimeTruth={hostedHealth?.runtimeTruth || null}
        bridgeConnected={bridgeConnected}
        bridgeHealth={bridgeHealth}
      />

      <div
        className="relative flex min-w-0 flex-1 flex-col pb-24 lg:pb-0"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Drag overlay */}
        {dragActive && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-emerald-500/[0.04] backdrop-blur-[1px]">
            <div className="rounded-2xl border-2 border-dashed border-emerald-500/25 bg-[#0a0f0d]/80 px-8 py-6 text-center">
              <Paperclip className="mx-auto mb-2 h-6 w-6 text-emerald-400/60" />
              <p className="text-sm font-medium text-emerald-200/60">
                Drop files here
              </p>
              <p className="mt-1 text-xs text-emerald-200/25">
                Images and PDFs up to 5 MB
              </p>
            </div>
          </div>
        )}

        {/* Top bar */}
        <header
          className="flex items-center gap-3 border-b border-emerald-900/20 px-4 pb-3 pt-4 lg:px-6 lg:py-3"
          style={{ paddingTop: "max(env(safe-area-inset-top), 1rem)" }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-xl p-3 text-emerald-200/50 transition-colors hover:bg-emerald-500/10 hover:text-emerald-200/70 lg:hidden"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold text-[#f2f6f3] truncate">
              Al Boreland
            </h1>
            <p className="text-xs text-emerald-100/45 truncate">
              {messages.length === 0
                ? `${getGreeting()} — ready when you are`
                : `${messages.length} message${messages.length === 1 ? "" : "s"} this session`}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="hidden items-center gap-2 sm:flex lg:hidden">
              <Link
                href={withAlAppPrefix(pathname, "/operational-proof")}
                className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-100"
              >
                Operational Proof
              </Link>
              <Link
                href={withAlAppPrefix(pathname, "/attention")}
                className="rounded-full border border-emerald-900/25 bg-[#101714] px-3 py-1.5 text-xs font-semibold text-emerald-100/80"
              >
                Attention
              </Link>
              <Link
                href={withAlAppPrefix(pathname, "/boardroom")}
                className="rounded-full border border-emerald-900/25 bg-[#101714] px-3 py-1.5 text-xs font-semibold text-emerald-100/80"
              >
                Board Room
              </Link>
              <Link
                href={withAlAppPrefix(pathname, "/planner")}
                className="rounded-full border border-emerald-900/25 bg-[#101714] px-3 py-1.5 text-xs font-semibold text-emerald-100/80"
              >
                Planner
              </Link>
            </div>
            <Link
              href={withAlAppPrefix(pathname, "/operational-proof")}
              className="hidden items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-semibold text-emerald-100 sm:hidden md:inline-flex"
            >
              <ShieldCheck className="h-3 w-3" />
              <span>System Health</span>
            </Link>
            {bridgeConnected && (
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1">
                <FolderOpen className="h-3 w-3 text-emerald-400/60" />
                <span className="text-[10px] font-medium text-emerald-400/50">
                  Vault
                </span>
              </div>
            )}
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="rounded-lg px-3 py-1.5 text-xs text-emerald-200/25 transition-colors hover:bg-emerald-500/10 hover:text-emerald-200/50"
              >
                Clear
              </button>
            )}
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 al-scrollbar lg:px-6">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center px-4">
              <div className="al-avatar-badge relative mb-6 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl">
                <span className="relative z-10 text-2xl font-display text-[#f3faf6]">AB</span>
                <div className="al-avatar-beard absolute inset-x-3 bottom-2 h-5 rounded-b-full" />
              </div>
              <h2 className="font-display text-xl text-[#e2ede8]">
                {getGreeting()}
              </h2>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-emerald-100/45">
                I&apos;ll help you sort what matters, route the work, and keep the next move clear.
                Measure twice, move once.
              </p>
              <div className="mt-8 w-full max-w-2xl rounded-3xl border border-emerald-500/18 bg-[#101714] p-5 text-left shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300/45">
                      Operational Proof
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-[#f3faf6]">
                      Can we trust the loops?
                    </h3>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-emerald-100/65">
                      This is the trust panel for AL. It scores Board Room follow-through, Dominion lead control, WrenchReady day-readiness, OpenClaw ingress, and the attention brief.
                    </p>
                  </div>
                  <Link
                    href={withAlAppPrefix(pathname, "/operational-proof")}
                    className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-[#05110b] transition hover:bg-emerald-400"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Open Operational Proof
                  </Link>
                </div>
                <div className="mt-3 flex flex-wrap gap-3">
                  <Link
                    href={withAlAppPrefix(pathname, "/wrenchready/day-readiness")}
                    className="inline-flex items-center gap-2 rounded-2xl border border-emerald-900/25 bg-[#0b110e] px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:border-emerald-500/40"
                  >
                    Open Tomorrow Readiness
                  </Link>
                  <Link
                    href={withAlAppPrefix(pathname, "/attention")}
                    className="inline-flex items-center gap-2 rounded-2xl border border-emerald-900/25 bg-[#0b110e] px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:border-emerald-500/40"
                  >
                    Open Attention
                  </Link>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-emerald-500/18 bg-[#0b110e] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200/65">
                      Healthy
                    </p>
                    <p className="mt-2 text-3xl font-semibold text-emerald-100">
                      {operationalProof?.summary.healthy ?? "-"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-amber-500/18 bg-[#0b110e] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200/70">
                      Warning
                    </p>
                    <p className="mt-2 text-3xl font-semibold text-amber-100">
                      {operationalProof?.summary.warning ?? "-"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-red-500/18 bg-[#0b110e] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-200/70">
                      Failing
                    </p>
                    <p className="mt-2 text-3xl font-semibold text-red-100">
                      {operationalProof?.summary.failing ?? "-"}
                    </p>
                  </div>
                </div>
                <div className="mt-4 rounded-2xl border border-emerald-900/20 bg-[#0b110e] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/45">
                    Top next move
                  </p>
                  <p className="mt-2 text-sm leading-6 text-emerald-100/75">
                    {operationalProof?.topNextMove || "Checking the control-loop health now."}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-4">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              {loading && searchQuery && <SearchingWeb query={searchQuery} />}
              {loading && publishingPath && <PublishingToVault path={publishingPath} />}
              {loading && delegatingCeo && <DelegatingToCeo ceo={delegatingCeo} />}
              {activeJobs.map((job) => (
                <JobBadge
                  key={job.job_id}
                  job_id={job.job_id}
                  ceo_name={job.ceo_name}
                  onDismiss={() =>
                    setActiveJobs((prev) => prev.filter((j) => j.job_id !== job.job_id))
                  }
                />
              ))}
              {executingVault &&
                pendingVaultAction?.requests.some((r) => r.name === "crew_run") && (
                  <RunningCrew
                    crew={
                      inputString(
                        pendingVaultAction.requests.find((r) => r.name === "crew_run")?.input.crew
                      )
                    }
                  />
                )}
              {loading &&
                !searchQuery &&
                !publishingPath &&
                !delegatingCeo &&
                !pendingVaultAction &&
                !messages.some((m) => m.typing && m.content) && <ThinkingDots />}
              {pendingVaultAction && (
                <ToolApprovalCard
                  requests={pendingVaultAction.requests}
                  onApprove={() => handleVaultApproval(true)}
                  onDeny={() => handleVaultApproval(false)}
                  executing={executingVault}
                />
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-emerald-900/20 bg-[#0a0f0d] p-4 pb-5 lg:p-6">
          <div className="mx-auto max-w-3xl">
            {/* File preview strip */}
            {pendingFiles.length > 0 && (
              <div className="mb-2 flex gap-2 overflow-x-auto pb-1 al-scrollbar">
                {pendingFiles.map((f) => (
                  <div key={f.id} className="relative flex-shrink-0 group/file">
                    {f.type.startsWith("image/") && f.data ? (
                      <img
                        src={f.data}
                        alt={f.name}
                        className="h-16 w-16 rounded-lg object-cover border border-emerald-900/25"
                      />
                    ) : (
                      <div className="flex h-16 items-center gap-2 rounded-lg border border-emerald-900/25 bg-[#0d1410] px-3">
                        <FileText className="h-4 w-4 flex-shrink-0 text-emerald-400/50" />
                        <div className="max-w-[120px]">
                          <p className="truncate text-xs text-[#e2ede8]">
                            {f.name}
                          </p>
                          <p className="text-[10px] text-emerald-200/30">
                            {formatBytes(f.size)}
                          </p>
                        </div>
                      </div>
                    )}
                    <button
                      onClick={() => removeFile(f.id)}
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-emerald-900/30 bg-[#0a0f0d] text-emerald-200/50 transition-colors hover:border-red-400/30 hover:text-red-400"
                      aria-label={`Remove ${f.name}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex items-end gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf"
                className="hidden"
                onChange={handleFileInput}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading || pendingFiles.length >= MAX_FILES}
                className="flex h-12 w-10 flex-shrink-0 items-center justify-center rounded-lg text-emerald-200/35 transition-colors hover:bg-emerald-500/10 hover:text-emerald-200/60 disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Attach files"
              >
                <Paperclip className="h-4 w-4" />
              </button>

              <div className="relative flex-1">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onPaste={handlePaste}
                  placeholder={
                    pendingFiles.length > 0
                      ? "Add a message or just send the files..."
                      : "Message Al..."
                  }
                  rows={1}
                  disabled={loading}
                  className="w-full resize-none rounded-xl border border-emerald-900/25 bg-[#111916] px-4 py-3 text-sm text-[#e2ede8] placeholder-emerald-200/25 transition-colors focus:border-emerald-500/40 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 disabled:opacity-50"
                  style={{ minHeight: 48, maxHeight: 160 }}
                  onInput={(e) => {
                    const el = e.target as HTMLTextAreaElement;
                    el.style.height = "auto";
                    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
                  }}
                />
              </div>

              {loading ? (
                <button
                  type="button"
                  onClick={stopGenerating}
                  className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-emerald-900/25 bg-[#111916] text-emerald-200/50 transition-all hover:bg-[#1a2820] hover:text-emerald-200/70 active:scale-95"
                  aria-label="Stop generating"
                >
                  <div className="h-3.5 w-3.5 rounded-sm bg-emerald-400/70" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!canSend}
                  className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white transition-all hover:bg-emerald-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </button>
              )}
            </form>
            <p className="mt-2 text-center text-[11px] text-emerald-200/15">
              Enter to send &middot; Shift+Enter for new line &middot; Paste or
              drag images &amp; PDFs
            </p>
          </div>
        </div>
      </div>

      {settingsOpen && (
        <SettingsModal
          onClose={() => setSettingsOpen(false)}
          onClearChat={() => {
            clearChat();
            setSettingsOpen(false);
          }}
          bridgeConnected={bridgeConnected}
          onBridgeCheck={checkBridge}
          hostedRuntimeTruth={hostedHealth?.runtimeTruth || null}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const time = new Date(message.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const atts = message.attachments;

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} animate-fade-up`}
    >
      <div
        className={`
          group relative max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed
          ${
            isUser
              ? "bg-emerald-600/15 text-emerald-50 border border-emerald-500/10"
              : "bg-[#141f1a] text-[#cfdbd4] border border-emerald-900/15"
          }
        `}
      >
        {!isUser && (
          <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-emerald-400/60">
            <span className="al-avatar-mini">
              <span className="relative z-10 text-[9px] font-semibold text-[#f3faf6]">AB</span>
            </span>
            <span>Al</span>
            {message.typing && (
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            )}
          </div>
        )}

        {atts && atts.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {atts.map((att) =>
              att.type.startsWith("image/") ? (
                att.data ? (
                  <img
                    key={att.id}
                    src={att.data}
                    alt={att.name}
                    className="max-h-48 max-w-full rounded-lg object-contain"
                  />
                ) : (
                  <AttachmentBadge key={att.id} att={att} />
                )
              ) : (
                <AttachmentBadge key={att.id} att={att} />
              )
            )}
          </div>
        )}

        {message.content && (
          <div className="whitespace-pre-wrap break-words">{renderLinkedText(message.content)}</div>
        )}

        <div
          className={`mt-1.5 text-[10px] transition-opacity ${
            isUser
              ? "text-emerald-300/20 opacity-0 group-hover:opacity-100"
              : "text-emerald-200/15 opacity-0 group-hover:opacity-100"
          }`}
        >
          {time}
        </div>
      </div>
    </div>
  );
}

function AttachmentBadge({ att }: { att: Attachment }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-black/20 px-3 py-2">
      <FileText className="h-4 w-4 flex-shrink-0 text-emerald-400/50" />
      <div className="min-w-0">
        <p className="truncate text-xs">{att.name}</p>
        <p className="text-[10px] opacity-50">{formatBytes(att.size)}</p>
      </div>
    </div>
  );
}

function ThinkingDots() {
  return (
    <div className="flex justify-start animate-fade-up">
      <div className="rounded-2xl border border-emerald-900/15 bg-[#141f1a] px-4 py-3">
        <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-emerald-400/60">
          <span className="al-avatar-mini">
            <span className="relative z-10 text-[9px] font-semibold text-[#f3faf6]">AB</span>
          </span>
          <span>Al</span>
        </div>
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2 w-2 rounded-full bg-emerald-400/50"
              style={{
                animation: `alDotPulse 1.4s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
        <p className="mt-2 text-xs text-emerald-100/35">
          Getting a straight answer lined up.
        </p>
      </div>
    </div>
  );
}

function SearchingWeb({ query }: { query: string }) {
  return (
    <div className="flex justify-start animate-fade-up">
      <div className="rounded-2xl border border-emerald-900/15 bg-[#141f1a] px-4 py-3">
        <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-emerald-400/60">
          <span className="al-avatar-mini">
            <span className="relative z-10 text-[9px] font-semibold text-[#f3faf6]">AB</span>
          </span>
          <span>Al</span>
        </div>
        <div className="flex items-center gap-2">
          <Globe
            className="h-3.5 w-3.5 animate-spin text-emerald-400/60"
            style={{ animationDuration: "2s" }}
          />
          <span className="text-sm text-emerald-200/50">
            Checking the outside world&hellip;
          </span>
        </div>
        <p className="mt-1.5 max-w-xs truncate text-xs italic text-emerald-200/20">
          &ldquo;{query}&rdquo;
        </p>
      </div>
    </div>
  );
}

/* ── Vault Tool Approval Card ── */

function vaultActionLabel(name: string): string {
  switch (name) {
    case "vault_list":
      return "List folder";
    case "vault_read":
      return "Read file";
    case "vault_read_image":
      return "View image";
    case "crew_list":
      return "List CrewAI crews";
    case "crew_run":
      return "Run CrewAI crew";
    case "crew_status":
      return "Check crew run status";
    case "media_production":
      return "Generate brand media";
    case "codex_task":
      return "Run Codex task";
    case "local_pdf_merge":
      return "Merge local PDFs";
    default:
      return name;
  }
}

function bridgeRequestDetail(req: VaultToolRequest): string {
  if (req.name === "crew_run") return inputString(req.input.crew) || "(crew)";
  if (req.name === "crew_status") return inputString(req.input.run_id) || "(run id)";
  if (req.name === "codex_task") {
    return (
      inputString(req.input.cwd) ||
      inputString(req.input.workspace) ||
      inputString(req.input.task) ||
      "(Codex task)"
    );
  }
  if (req.name === "local_pdf_merge") {
    const sources = Array.isArray(req.input.source_paths)
      ? req.input.source_paths.filter((value): value is string => typeof value === "string")
      : [];
    return inputString(req.input.output_path) || sources[0] || "(PDF sources)";
  }
  if (req.name === "media_production") {
    return (
      inputString(req.input.asset_goal) ||
      inputString(req.input.source_dir) ||
      "(default source dir)"
    );
  }
  if (req.name === "crew_list") return "—";
  return inputString(req.input.path) || "";
}

function DelegatingToCeo({ ceo }: { ceo: string }) {
  return (
    <div className="flex justify-start animate-fade-up">
      <div className="rounded-2xl border border-emerald-900/15 bg-[#141f1a] px-4 py-3">
        <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-emerald-400/60">
          <span className="al-avatar-mini">
            <span className="relative z-10 text-[9px] font-semibold text-[#f3faf6]">AB</span>
          </span>
          <span>Al</span>
        </div>
        <div className="flex items-center gap-2">
          <Users
            className="h-3.5 w-3.5 animate-pulse text-emerald-400/60"
          />
          <span className="text-sm text-emerald-200/50">
            Checking with {ceo}&hellip;
          </span>
        </div>
      </div>
    </div>
  );
}

function PublishingToVault({ path }: { path: string }) {
  return (
    <div className="flex justify-start animate-fade-up">
      <div className="rounded-2xl border border-emerald-900/15 bg-[#141f1a] px-4 py-3">
        <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-emerald-400/60">
          <span className="al-avatar-mini">
            <span className="relative z-10 text-[9px] font-semibold text-[#f3faf6]">AB</span>
          </span>
          <span>Al</span>
        </div>
        <div className="flex items-center gap-2">
          <BookUp
            className="h-3.5 w-3.5 animate-pulse text-emerald-400/60"
          />
          <span className="text-sm text-emerald-200/50">
            Putting it on the shelf&hellip;
          </span>
        </div>
        <p className="mt-1.5 max-w-xs truncate text-xs font-mono italic text-emerald-200/20">
          {path}
        </p>
      </div>
    </div>
  );
}

function RunningCrew({ crew }: { crew: string }) {
  return (
    <div className="flex justify-start animate-fade-up">
      <div className="rounded-2xl border border-emerald-900/15 bg-[#141f1a] px-4 py-3">
        <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-emerald-400/60">
          <span className="al-avatar-mini">
            <span className="relative z-10 text-[9px] font-semibold text-[#f3faf6]">AB</span>
          </span>
          <span>Al</span>
        </div>
        <div className="flex items-center gap-2">
          <Bot className="h-3.5 w-3.5 animate-pulse text-emerald-400/60" />
          <span className="text-sm text-emerald-200/50">
            Starting the crew{crew ? ` (${crew})` : ""}&hellip;
          </span>
        </div>
      </div>
    </div>
  );
}

function JobBadge({
  job_id,
  ceo_name,
  onDismiss,
}: {
  job_id: number;
  ceo_name: string;
  onDismiss: () => void;
}) {
  return (
    <div className="flex justify-start animate-fade-up">
      <div className="rounded-2xl border border-emerald-900/15 bg-[#141f1a] px-4 py-3">
        <div className="mb-1.5 text-xs font-medium text-emerald-400/60">Al</div>
        <div className="flex items-center gap-2">
          <Users className="h-3.5 w-3.5 animate-pulse text-emerald-400/60" />
          <span className="text-sm text-emerald-200/50">
            Job #{job_id} &mdash; {ceo_name} is in the back room working on it
          </span>
          <button
            onClick={onDismiss}
            className="ml-1 flex h-4 w-4 items-center justify-center rounded-full text-emerald-200/20 transition-colors hover:text-emerald-200/50"
            aria-label="Dismiss"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ToolApprovalCard({
  requests,
  onApprove,
  onDeny,
  executing,
}: {
  requests: VaultToolRequest[];
  onApprove: () => void;
  onDeny: () => void;
  executing: boolean;
}) {
  const hasCrew = requests.some((r) => r.name.startsWith("crew_"));
  const hasVault = requests.some((r) => r.name.startsWith("vault_"));
  const title =
    hasCrew && hasVault
      ? "Bridge work request"
      : hasCrew
        ? "Crew handoff request"
        : "File access request";

  return (
    <div className="flex justify-start animate-fade-up">
      <div className="w-full max-w-md rounded-2xl border border-amber-500/20 bg-[#1a1810] p-4">
        <div className="mb-3 flex items-center gap-2 text-xs font-medium text-amber-400/70">
          <ShieldCheck className="h-3.5 w-3.5" />
          {title}
        </div>

        <div className="space-y-2">
          {requests.map((req) => (
            <div
              key={req.id}
              className="rounded-lg border border-amber-500/10 bg-black/20 p-3"
            >
              <div className="flex items-center gap-2 text-xs font-medium text-amber-200/60">
                {req.name.startsWith("crew_") ? (
                  <Bot className="h-3 w-3" />
                ) : (
                  <FolderOpen className="h-3 w-3" />
                )}
                {vaultActionLabel(req.name)}
              </div>
              <p className="mt-1 font-mono text-xs text-emerald-200/40 break-all">
                {bridgeRequestDetail(req)}
              </p>
              {req.name === "vault_write" && inputString(req.input.content) && (
                <pre className="mt-2 max-h-32 overflow-auto rounded bg-black/30 p-2 text-[11px] leading-relaxed text-emerald-200/30 al-scrollbar">
                  {inputString(req.input.content).slice(0, 500)}
                  {inputString(req.input.content).length > 500 && "\n..."}
                </pre>
              )}
            </div>
          ))}
        </div>

        <div className="mt-3 flex gap-2">
          <button
            onClick={onApprove}
            disabled={executing}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-emerald-500 active:scale-[0.97] disabled:opacity-50"
          >
            {executing ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Executing&hellip;
              </>
            ) : (
              "Looks good"
            )}
          </button>
          <button
            onClick={onDeny}
            disabled={executing}
            className="rounded-lg border border-amber-500/15 px-4 py-2 text-xs font-medium text-amber-200/50 transition-all hover:bg-amber-500/10 hover:text-amber-200/70 disabled:opacity-50"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Settings Modal ── */

function SettingsModal({
  onClose,
  onClearChat,
  bridgeConnected,
  onBridgeCheck,
  hostedRuntimeTruth,
}: {
  onClose: () => void;
  onClearChat: () => void;
  bridgeConnected: boolean;
  onBridgeCheck: () => void;
  hostedRuntimeTruth: HostedRuntimeTruth | null;
}) {
  const [bridgeUrl, setBridgeUrl] = useState(
    () =>
      (typeof window !== "undefined" ? localStorage.getItem("al_bridge_url") : null) ||
      defaultBridgeUrl()
  );
  const [bridgeToken, setBridgeToken] = useState(
    () => (typeof window !== "undefined" ? localStorage.getItem("al_bridge_token") : null) || ""
  );

  function saveBridgeSettings() {
    localStorage.setItem("al_bridge_url", bridgeUrl);
    localStorage.setItem("al_bridge_token", bridgeToken);
    onBridgeCheck();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-emerald-900/30 bg-[#111916] p-6 shadow-2xl animate-fade-up al-scrollbar"
        role="dialog"
        aria-label="Settings"
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#e2ede8]">Settings</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-emerald-200/40 transition-colors hover:bg-emerald-500/10 hover:text-emerald-200/60"
            aria-label="Close settings"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-5">
          {/* Model */}
          <div className="rounded-xl border border-emerald-900/20 bg-[#0d1410] px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#e2ede8]">Model</p>
                <p className="mt-0.5 text-xs text-emerald-200/35">
                  OpenAI-first chairman runtime
                </p>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="text-[11px] font-medium text-emerald-400">
                  {hostedRuntimeTruth ? "Verified" : "Configured"}
                </span>
              </div>
            </div>
            <p className="mt-2 text-[11px] leading-5 text-emerald-200/35">
              Chairman reasoning is OpenAI-first. Legacy Claude-backed lanes can still exist for specialized fallback work, but they are no longer the primary runtime.
            </p>
          </div>

          {/* Web Search */}
          <div className="rounded-xl border border-emerald-900/20 bg-[#0d1410] px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#e2ede8]">Web Search</p>
                <p className="mt-0.5 text-xs text-emerald-200/35">
                  Tavily-powered live internet access
                </p>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1">
                <Globe className="h-3 w-3 text-emerald-400" />
                <span className="text-[11px] font-medium text-emerald-400">
                  Active
                </span>
              </div>
            </div>
          </div>

          {/* Vault Bridge */}
          <div className="rounded-xl border border-emerald-900/20 bg-[#0d1410] px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-[#e2ede8]">
                  Vault Bridge
                </p>
                <p className="mt-0.5 text-xs text-emerald-200/35">
                  Local Obsidian vault access
                </p>
              </div>
              <div
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 ${
                  bridgeConnected
                    ? "bg-emerald-500/10"
                    : "bg-red-500/10"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    bridgeConnected ? "bg-emerald-400" : "bg-red-400"
                  }`}
                />
                <span
                  className={`text-[11px] font-medium ${
                    bridgeConnected ? "text-emerald-400" : "text-red-400/70"
                  }`}
                >
                  {bridgeConnected ? "Connected" : "Offline"}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <label className="block text-[11px] font-medium text-emerald-200/30 mb-1">
                  Bridge URL
                </label>
                <input
                  type="text"
                  value={bridgeUrl}
                  onChange={(e) => setBridgeUrl(e.target.value)}
                  className="w-full rounded-lg border border-emerald-900/25 bg-[#0a0f0d] px-3 py-2 text-xs text-[#e2ede8] placeholder-emerald-200/20 focus:border-emerald-500/40 focus:outline-none"
                  placeholder="http://localhost:3141"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-emerald-200/30 mb-1">
                  Token (optional)
                </label>
                <input
                  type="password"
                  value={bridgeToken}
                  onChange={(e) => setBridgeToken(e.target.value)}
                  className="w-full rounded-lg border border-emerald-900/25 bg-[#0a0f0d] px-3 py-2 text-xs text-[#e2ede8] placeholder-emerald-200/20 focus:border-emerald-500/40 focus:outline-none"
                  placeholder="bearer token"
                />
              </div>
              <button
                onClick={saveBridgeSettings}
                className="mt-1 rounded-lg bg-emerald-600/20 px-3 py-1.5 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-600/30"
              >
                Save &amp; Test Connection
              </button>
            </div>
          </div>

          {/* Trajectory Logging */}
          <div className="rounded-xl border border-emerald-900/20 bg-[#0d1410] px-4 py-3">
            <p className="text-sm font-medium text-[#e2ede8]">
              Trajectory Logging
            </p>
            <p className="mt-0.5 text-xs text-emerald-200/35">
              Every exchange is logged to the Supabase trajectories table when
              configured.
            </p>
          </div>

          <div className="flex items-center justify-between border-t border-emerald-900/20 pt-5">
            <button
              onClick={() => {
                if (window.confirm("Clear all chat history?")) onClearChat();
              }}
              className="text-xs text-red-400/50 transition-colors hover:text-red-400"
            >
              Clear chat history
            </button>
            <button
              onClick={onClose}
              className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-emerald-500 active:scale-[0.98]"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
