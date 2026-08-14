"use client";

import { FormEvent, useState } from "react";
import { KeyRound, LoaderCircle, Map } from "lucide-react";
import { useRouter } from "next/navigation";

export function LandFinderLogin({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(configured ? "" : "Access has not been configured yet.");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!configured || !password || loading) return;
    setLoading(true);
    setError("");

    const response = await fetch("/api/land-finder/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    }).catch(() => null);
    if (!response?.ok) {
      const body = (await response?.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error || "Could not sign in.");
      setLoading(false);
      return;
    }

    router.refresh();
  }

  return (
    <div className="lf-login-shell">
      <form className="lf-login" onSubmit={submit}>
        <div className="lf-login-mark" aria-hidden="true">
          <Map size={24} />
        </div>
        <p className="lf-login-brand">Dominion Homes</p>
        <h1>Land Finder</h1>
        <label htmlFor="land-finder-password">Password</label>
        <div className="lf-password-field">
          <KeyRound size={18} aria-hidden="true" />
          <input
            id="land-finder-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={!configured || loading}
            autoFocus
          />
        </div>
        {error ? <p className="lf-login-error" role="alert">{error}</p> : null}
        <button type="submit" disabled={!configured || !password || loading}>
          {loading ? <LoaderCircle size={18} className="lf-spin" /> : "Open map"}
        </button>
      </form>
    </div>
  );
}
