"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type FormEvent,
} from "react";
import { Send, Menu, Loader2, X, Paperclip, FileText, Globe } from "lucide-react";
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
  return {
    id: crypto.randomUUID(),
    name: file.name,
    type: mime,
    size: blob.size,
    data,
  };
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function ChatApp() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<Attachment[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesRef = useRef<Message[]>([]);
  const pendingRef = useRef<Attachment[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const dragCounter = useRef(0);

  messagesRef.current = messages;
  pendingRef.current = pendingFiles;

  // --- Auth ---
  useEffect(() => {
    fetch("/api/al/verify")
      .then((r) => r.json())
      .then((d) => setAuthed(d.authenticated))
      .catch(() => setAuthed(false));
  }, []);

  // --- Restore messages ---
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: Message[] = JSON.parse(stored);
        setMessages(parsed.map((m) => ({ ...m, typing: false })));
      }
    } catch {}
  }, []);

  // --- Persist messages (strip attachment data to stay within localStorage limits) ---
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
  }, [messages]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  // --- File handling ---

  async function addFiles(fileList: File[]) {
    const remaining = MAX_FILES - pendingRef.current.length;
    if (remaining <= 0) return;
    const toProcess = fileList.slice(0, remaining);
    const results = await Promise.all(toProcess.map(processFile));
    const valid = results.filter(Boolean) as Attachment[];
    if (valid.length > 0) {
      setPendingFiles((prev) => [...prev, ...valid]);
    }
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

  // --- Send ---

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

      try {
        const body: Record<string, unknown> = {
          message: text.trim(),
          history: history.slice(0, -1),
        };

        if (files.length > 0) {
          body.attachments = files.map(({ name, type, size, data }) => ({
            name,
            type,
            size,
            data,
          }));
        }

        const res = await fetch("/api/al/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: abortRef.current.signal,
        });

        if (!res.ok || !res.body) throw new Error(`Server error ${res.status}`);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n\n");

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const payload = line.slice(6);
            if (payload === "[DONE]") continue;

            try {
              const parsed = JSON.parse(payload);
              if (parsed.error) {
                accumulated += accumulated
                  ? `\n\n---\nError: ${parsed.error}`
                  : `Error: ${parsed.error}`;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === alId ? { ...m, content: accumulated } : m
                  )
                );
              } else if (parsed.status === "searching") {
                setSearchQuery(parsed.query || "the web");
              } else if (parsed.t) {
                setSearchQuery(null);
                accumulated += parsed.t;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === alId ? { ...m, content: accumulated } : m
                  )
                );
              }
            } catch {}
          }
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
                ? { ...m, content: "Failed to reach Al. Check your connection and try again.", typing: false }
                : m
            )
          );
        }
      } finally {
        abortRef.current = null;
        setLoading(false);
      }
    },
    [loading]
  );

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
    setMessages((prev) =>
      prev.map((m) => (m.typing ? { ...m, typing: false } : m))
    );
  }

  const canSend = input.trim() || pendingFiles.length > 0;

  // --- Render gates ---

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

  // --- Main interface ---

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
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="flex-shrink-0 rounded-lg px-3 py-1.5 text-xs text-emerald-200/25 transition-colors hover:bg-emerald-500/10 hover:text-emerald-200/50"
            >
              Clear
            </button>
          )}
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 al-scrollbar lg:px-6">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center px-4">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/15">
                <span className="text-3xl font-display text-emerald-400">A</span>
              </div>
              <h2 className="font-display text-xl text-[#e2ede8]">{getGreeting()}</h2>
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
              {loading && !searchQuery && !messages.some((m) => m.typing) && <ThinkingDots />}
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
                          <p className="truncate text-xs text-[#e2ede8]">{f.name}</p>
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

        {/* Attachment renders */}
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
          <Globe className="h-3.5 w-3.5 animate-spin text-emerald-400/60" style={{ animationDuration: "2s" }} />
          <span className="text-sm text-emerald-200/50">Searching the web&hellip;</span>
        </div>
        <p className="mt-1.5 max-w-xs truncate text-xs italic text-emerald-200/20">
          &ldquo;{query}&rdquo;
        </p>
      </div>
    </div>
  );
}

function SettingsModal({
  onClose,
  onClearChat,
}: {
  onClose: () => void;
  onClearChat: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-md rounded-2xl border border-emerald-900/30 bg-[#111916] p-6 shadow-2xl animate-fade-up"
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
          <div className="rounded-xl border border-emerald-900/20 bg-[#0d1410] px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#e2ede8]">Model</p>
                <p className="mt-0.5 text-xs text-emerald-200/35">Claude Sonnet 4</p>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="text-[11px] font-medium text-emerald-400">Connected</span>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-emerald-900/20 bg-[#0d1410] px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#e2ede8]">Web Search</p>
                <p className="mt-0.5 text-xs text-emerald-200/35">Tavily-powered live internet access</p>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1">
                <Globe className="h-3 w-3 text-emerald-400" />
                <span className="text-[11px] font-medium text-emerald-400">Active</span>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-emerald-900/20 bg-[#0d1410] px-4 py-3">
            <p className="text-sm font-medium text-[#e2ede8]">Trajectory Logging</p>
            <p className="mt-0.5 text-xs text-emerald-200/35">
              Every exchange is logged to the Supabase trajectories table when configured.
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
