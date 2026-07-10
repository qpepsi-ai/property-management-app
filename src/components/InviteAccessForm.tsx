"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { inputClass, labelClass, buttonClass } from "@/lib/ui";

const ROLES = ["co-owner", "accountant"] as const;

export default function InviteAccessForm({ propertyId }: { propertyId: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<(typeof ROLES)[number]>("co-owner");
  const [status, setStatus] = useState<"idle" | "saving" | "error" | "sent">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setMessage("");

    const res = await fetch("/api/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, propertyId, role }),
    });
    const data = await res.json();

    if (!res.ok) {
      setStatus("error");
      setMessage(data.error ?? "Something went wrong.");
      return;
    }

    setStatus("sent");
    setMessage(
      data.alreadyHadAccount
        ? `${email} already had an account — access granted.`
        : `Invite sent to ${email}.`,
    );
    setEmail("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className={`flex-1 ${labelClass}`}>
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`mt-1 ${inputClass}`}
          />
        </label>
        <label className={labelClass}>
          Role
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as (typeof ROLES)[number])}
            className={`mt-1 ${inputClass}`}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
      </div>
      <button type="submit" disabled={status === "saving"} className={buttonClass("primary")}>
        {status === "saving" ? "Sending…" : "Invite"}
      </button>
      {status === "error" && <p className="text-sm text-danger-fg">{message}</p>}
      {status === "sent" && <p className="text-sm text-success-fg">{message}</p>}
    </form>
  );
}
