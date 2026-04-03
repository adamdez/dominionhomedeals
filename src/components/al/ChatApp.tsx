"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type FormEvent,
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
} from "lucide-react";
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
  input: Record<string, string>;
}

interface VaultAction {
  requests: VaultToolRequest[];
  assistantBlocks: unknown[];
  precomputedResults: unknown[];
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = "al_chat_messages";
const MAX_HISTORY = 30;
const MAX_FILES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGE_DIM = 1600;
const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
];

const DEFAULT_BRIDGE_URL = "http://localhost:3141";

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
    url: localStorage.getItem("al_bridge_url") || DEFAULT_BRIDGE_URL,
    token: localStorage.getItem("al_bridge_token") || "",
  };
}

function bridgeHeaders(): Record<string, string> {
  const { token } = getBridgeConfig();
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

async function executeBridgeAction(req: VaultToolRequest): Promise<string> {
  const { url } = getBridgeConfig();
  const headers = bridgeHeaders();
  try {
    switch (req.name) {
      case "vault_list": {
        const res = await fetch(
          `${url}/list?path=${encodeURIComponent(req.input.path)}`,
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
          `${url}/read?path=${encodeURIComponent(req.input.path)}`,
          { headers }
        );
        const data = await res.json();
        if (!res.ok) return `Error: ${data.error}`;
        return data.content;
      }
      case "vault_write": {
        const res = await fetch(`${url}/write`, {
          method: "POST",
          headers,
          body: JSON.stringify({ path: req.input.path, content: req.input.content }),
        });
        const data = await res.json();
        if (!res.ok) return `Error: ${data.error}`;
        return `File written successfully: ${req.input.path}`;
      }
      case "vault_mkdir": {
        const res = await fetch(`${url}/mkdir`, {
          method: "POST",
          headers,
          body: JSON.stringify({ path: req.input.path }),
        });
        const data = await res.json();
        if (!res.ok) return `Error: ${data.error}`;
        return `Folder created: ${req.input.path}`;
      }
      default:
        return `Unknown vault tool: ${req.name}`;
    }
  } catch (err) {
    return `Bridge connection failed: ${err instanceof Error ? err.message : "unknown error"}`;
  }
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function ChatApp() {
  /* ── Core state ── */
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<Attachment[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string | null>(null);

  /* ── Bridge state ── */
  const [bridgeConnected, setBridgeConnected] = useState(false);
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
  }, []);

  function checkBridge() {
    const { url, token } = getBridgeConfig();
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    fetch(`${url}/health`, { headers })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setBridgeConnected(!!d?.ok))
      .catch(() => setBridgeConnected(false));
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
          } else if (parsed.vault_action) {
            vaultAction = parsed.vault_action as VaultAction;
          } else if (parsed.t) {
            setSearchQuery(null);
            if (needsSeparator) {
              accumulated += "\n\n";
              needsSeparator = false;
            }
            accumulated += parsed.t;
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
          originalRequestRef.current = body;
          setPendingVaultAction(vaultAction);
          vaultActionReceived = true;
          return;
        }

        setSearchQuery(null);
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
    [loading, bridgeConnected]
  );

  /* ── Vault action approval / denial ── */

  async function handleVaultApproval(approved: boolean) {
    const action = pendingVaultAction;
    if (!action || !originalRequestRef.current || !activeAlIdRef.current) return;

    const alId = activeAlIdRef.current;

    interface ToolResultItem {
      type: "tool_result";
      tool_use_id: string;
      content: string;
      is_error?: boolean;
    }

    let toolResults: ToolResultItem[];

    if (approved) {
      setExecutingVault(true);
      toolResults = [];
      for (const req of action.requests) {
        const result = await executeBridgeAction(req);
        toolResults.push({ type: "tool_result", tool_use_id: req.id, content: result });
      }
      setExecutingVault(false);
    } else {
      toolResults = action.requests.map((r) => ({
        type: "tool_result" as const,
        tool_use_id: r.id,
        content: "User denied this file system action.",
        is_error: true,
      }));
    }

    setPendingVaultAction(null);

    const contBody = {
      ...originalRequestRef.current,
      continuation: {
        assistantBlocks: action.assistantBlocks,
        precomputedResults: action.precomputedResults || [],
        toolResults,
      },
    };

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/al/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contBody),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) throw new Error(`Server error ${res.status}`);

      const { accumulated, vaultAction } = await processStream(
        res,
        alId,
        accumulatedRef.current
      );

      if (vaultAction) {
        accumulatedRef.current = accumulated;
        setPendingVaultAction(vaultAction);
        return;
      }

      setSearchQuery(null);
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
        setMessages((prev) =>
          prev.map((m) =>
            m.id === alId
              ? {
                  ...m,
                  content:
                    accumulatedRef.current +
                    "\n\nFailed to continue after vault action.",
                  typing: false,
                }
              : m
          )
        );
      }
    } finally {
      abortRef.current = null;
      if (!pendingVaultAction) setLoading(false);
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
      />

      <div
        className="relative flex flex-1 flex-col min-w-0"
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
        <header className="flex items-center gap-3 border-b border-emerald-900/20 px-4 py-3 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-emerald-200/40 transition-colors hover:bg-emerald-500/10 hover:text-emerald-200/60 lg:hidden"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold text-[#e2ede8] truncate">
              Command Center
            </h1>
            <p className="text-xs text-emerald-200/35 truncate">
              {messages.length === 0
                ? `${getGreeting()} — ready when you are`
                : `${messages.length} message${messages.length === 1 ? "" : "s"} this session`}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
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
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/15">
                <span className="text-3xl font-display text-emerald-400">A</span>
              </div>
              <h2 className="font-display text-xl text-[#e2ede8]">
                {getGreeting()}
              </h2>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-emerald-200/35">
                Your command center is ready. Use the sidebar for quick actions,
                or type a message below to get started.
              </p>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-4">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              {loading && searchQuery && <SearchingWeb query={searchQuery} />}
              {loading &&
                !searchQuery &&
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
        <div className="border-t border-emerald-900/20 p-4 lg:p-6">
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
            Al
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
          <div className="whitespace-pre-wrap break-words">{message.content}</div>
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
        <div className="mb-1.5 text-xs font-medium text-emerald-400/60">Al</div>
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
      </div>
    </div>
  );
}

function SearchingWeb({ query }: { query: string }) {
  return (
    <div className="flex justify-start animate-fade-up">
      <div className="rounded-2xl border border-emerald-900/15 bg-[#141f1a] px-4 py-3">
        <div className="mb-1.5 text-xs font-medium text-emerald-400/60">Al</div>
        <div className="flex items-center gap-2">
          <Globe
            className="h-3.5 w-3.5 animate-spin text-emerald-400/60"
            style={{ animationDuration: "2s" }}
          />
          <span className="text-sm text-emerald-200/50">
            Searching the web&hellip;
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
    case "vault_write":
      return "Write file";
    case "vault_mkdir":
      return "Create folder";
    default:
      return name;
  }
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
  return (
    <div className="flex justify-start animate-fade-up">
      <div className="w-full max-w-md rounded-2xl border border-amber-500/20 bg-[#1a1810] p-4">
        <div className="mb-3 flex items-center gap-2 text-xs font-medium text-amber-400/70">
          <ShieldCheck className="h-3.5 w-3.5" />
          File System Access Request
        </div>

        <div className="space-y-2">
          {requests.map((req) => (
            <div
              key={req.id}
              className="rounded-lg border border-amber-500/10 bg-black/20 p-3"
            >
              <div className="flex items-center gap-2 text-xs font-medium text-amber-200/60">
                <FolderOpen className="h-3 w-3" />
                {vaultActionLabel(req.name)}
              </div>
              <p className="mt-1 font-mono text-xs text-emerald-200/40">
                {req.input.path}
              </p>
              {req.name === "vault_write" && req.input.content && (
                <pre className="mt-2 max-h-32 overflow-auto rounded bg-black/30 p-2 text-[11px] leading-relaxed text-emerald-200/30 al-scrollbar">
                  {req.input.content.slice(0, 500)}
                  {req.input.content.length > 500 && "\n..."}
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
              "Allow"
            )}
          </button>
          <button
            onClick={onDeny}
            disabled={executing}
            className="rounded-lg border border-amber-500/15 px-4 py-2 text-xs font-medium text-amber-200/50 transition-all hover:bg-amber-500/10 hover:text-amber-200/70 disabled:opacity-50"
          >
            Deny
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
}: {
  onClose: () => void;
  onClearChat: () => void;
  bridgeConnected: boolean;
  onBridgeCheck: () => void;
}) {
  const [bridgeUrl, setBridgeUrl] = useState(
    () => (typeof window !== "undefined" ? localStorage.getItem("al_bridge_url") : null) || DEFAULT_BRIDGE_URL
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
                  Claude Sonnet 4
                </p>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="text-[11px] font-medium text-emerald-400">
                  Connected
                </span>
              </div>
            </div>
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
