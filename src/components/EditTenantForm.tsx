"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { inputClass, buttonClass } from "@/lib/ui";

type Tenant = { id: string; name: string; email: string | null; phone: string | null };

export default function EditTenantForm({ tenant }: { tenant: Tenant }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(tenant.name);
  const [email, setEmail] = useState(tenant.email ?? "");
  const [phone, setPhone] = useState(tenant.phone ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setErrorMessage("");

    const supabase = createClient();
    const { error } = await supabase
      .from("tenants")
      .update({ name, email: email || null, phone: phone || null })
      .eq("id", tenant.id);

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    setStatus("idle");
    setEditing(false);
    router.refresh();
  }

  if (!editing) {
    return (
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium text-foreground">{tenant.name}</p>
          <p className="text-sm text-muted">
            {tenant.email ?? "no email"} · {tenant.phone ?? "no phone"}
          </p>
        </div>
        <button onClick={() => setEditing(true)} className="text-xs text-accent hover:underline">
          Edit
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-3">
      <input
        type="text"
        required
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className={inputClass}
      />
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`flex-1 ${inputClass}`}
        />
        <input
          type="tel"
          placeholder="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={`flex-1 ${inputClass}`}
        />
      </div>
      <div className="flex gap-3">
        <button type="submit" disabled={status === "saving"} className={buttonClass("primary")}>
          {status === "saving" ? "Saving…" : "Save"}
        </button>
        <button type="button" onClick={() => setEditing(false)} className={buttonClass("secondary")}>
          Cancel
        </button>
      </div>
      {status === "error" && <p className="text-sm text-danger-fg">{errorMessage}</p>}
    </form>
  );
}
