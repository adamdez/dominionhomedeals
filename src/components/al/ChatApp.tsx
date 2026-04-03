"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type FormEvent,
} from "react";
import { Send, Menu, Loader2, X } from "lucide-react";
import { AuthScreen } from "./AuthScreen";
import { Sidebar } from "./Sidebar";

interface Message {
  id: string;
  role: "user" | "al";
  content: string;
  timestamp: number;
  typing?: boolean;
}

const STORAGE_KEY = "al_chat_messages";
const MAX_HISTORY = 30;

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function ChatApp() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesRef = useRef<Message[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  messagesRef.current = messages;

  useEffect(() => {
    fetch("/api/al/verify")
      .then((r) => r.json())
      .then((d) => setAuthed(d.authenticated))
      .catch(() => setAuthed(false));
  }, []);

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

  useEffect(() => {
    if (messages.length > 0) {
      const toSave = messages.map(({ typing, ...rest }) => rest);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    }
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: text.trim(),
        timestamp: Date.now(),
      };

      const currentMessages = [...messagesRef.current, userMsg];
      setMessages(currentMessages);
      setInput("");
      setLoading(true);

      if (inputRef.current) {
        inputRef.current.style.height = "auto";
      }

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
        const res = await fetch("/api/al/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text.trim(),
            history: history.slice(0, -1),
          }),
          signal: abortRef.current.signal,
        });

        if (!res.ok || !res.body) {
          throw new Error(`Server error ${res.status}`);
        }

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
              } else if (parsed.t) {
                accumulated += parsed.t;
              }
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === alId ? { ...m, content: accumulated } : m
                )
              );
            } catch {}
          }
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === alId
              ? {
                  ...m,
                  content: accumulated || "No response received.",
                  typing: false,
                }
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
                      "Failed to reach Al. Check your connection and try again.",
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

      <div className="flex flex-1 flex-col min-w-0">
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
                <span className="text-3xl font-display text-emerald-400">
                  A
                </span>
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
              {loading && !messages.some((m) => m.typing) && <ThinkingDots />}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-emerald-900/20 p-4 lg:p-6">
          <form
            onSubmit={handleSubmit}
            className="mx-auto flex max-w-3xl items-end gap-3"
          >
            <div className="relative flex-1">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message Al..."
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
                disabled={!input.trim()}
                className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white transition-all hover:bg-emerald-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            )}
          </form>
          <p className="mx-auto mt-2 max-w-3xl text-center text-[11px] text-emerald-200/15">
            Enter to send &middot; Shift+Enter for new line
          </p>
        </div>
      </div>

      {/* Settings modal */}
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
        <div className="whitespace-pre-wrap break-words">{message.content}</div>
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

function ThinkingDots() {
  return (
    <div className="flex justify-start animate-fade-up">
      <div className="rounded-2xl border border-emerald-900/15 bg-[#141f1a] px-4 py-3">
        <div className="mb-1.5 text-xs font-medium text-emerald-400/60">
          Al
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
