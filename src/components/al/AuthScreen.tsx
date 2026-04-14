"use client";

import { useState, type FormEvent } from "react";
import { Lock, ArrowRight, AlertCircle } from "lucide-react";

interface AuthScreenProps {
  onAuthenticated: () => void;
}

export function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/al/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        onAuthenticated();
      } else {
        setError("Wrong password");
        setPassword("");
      }
    } catch {
      setError("Connection failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full w-full items-center justify-center p-4">
      <div className="relative w-full max-w-sm">
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-b from-[var(--al-cyan)]/20 via-[var(--al-cyan)]/5 to-transparent blur-xl" />

        <div className="relative al-glass-elevated al-specular rounded-2xl p-8">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--al-cyan-dim)] ring-1 ring-[var(--al-cyan)]/25">
            <span className="text-2xl font-display text-[var(--al-cyan)]">A</span>
          </div>

          <h1 className="text-center font-display text-2xl text-[var(--al-text-primary)]">
            Al Boreland
          </h1>
          <p className="mt-1.5 text-center text-sm text-[var(--al-text-secondary)]">
            Private operating system &mdash; Command Center
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <input
              type="text"
              name="username"
              autoComplete="username"
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
            />
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--al-text-ghost)]" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                autoFocus
                className="al-glass-recessed w-full rounded-xl py-3 pl-10 pr-4 text-sm text-[var(--al-text-primary)] placeholder-[var(--al-text-ghost)] transition-colors focus:border-[var(--al-border-active)] focus:outline-none focus:ring-1 focus:ring-[var(--al-cyan)]/25"
              />
            </div>

            {error && (
              <div className="al-gemstone-red flex items-center gap-2 rounded-lg px-3 py-2 text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="al-specular-button flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--al-cyan)] py-3 text-sm font-semibold text-[var(--al-void)] transition-all hover:shadow-[var(--al-cyan-glow-strong)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  Enter command center
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
