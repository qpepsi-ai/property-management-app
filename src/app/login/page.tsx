"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { inputClass, buttonClass } from "@/lib/ui";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
    } else {
      setStatus("sent");
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-2xl font-semibold tracking-tight text-foreground">Property Manager</h1>
        <p className="mb-6 text-sm text-muted">Sign in with a magic link</p>

        {status === "sent" ? (
          <p className="text-sm text-muted">
            Check <span className="font-medium text-foreground">{email}</span> for a sign-in
            link.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
            <button
              type="submit"
              disabled={status === "sending"}
              className={`w-full ${buttonClass("primary")}`}
            >
              {status === "sending" ? "Sending…" : "Send magic link"}
            </button>
            {status === "error" && (
              <p className="text-sm text-danger-fg">{errorMessage}</p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
