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
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-b from-sky-500/25 via-blue-500/10 to-transparent blur-xl" />

        <div className="relative rounded-2xl border border-slate-700/50 bg-[#0b1120] p-8 shadow-2xl">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-sky-500/15 ring-1 ring-sky-400/35">
            <span className="text-2xl font-display text-sky-300">A</span>
          </div>

          <h1 className="text-center font-display text-2xl text-[#edf4ff]">
            Al Boreland
          </h1>
          <p className="mt-1.5 text-center text-sm text-slate-300/70">
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
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400/65" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                autoFocus
                className="w-full rounded-xl border border-slate-700/50 bg-[#060b17] py-3 pl-10 pr-4 text-sm text-[#eaf2ff] placeholder-slate-400/60 transition-colors focus:border-sky-400/60 focus:outline-none focus:ring-1 focus:ring-sky-400/35"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 py-3 text-sm font-semibold text-slate-950 transition-all hover:bg-sky-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
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
