"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
          <p className="font-medium">{tenant.name}</p>
          <p className="text-sm text-gray-500">
            {tenant.email ?? "no email"} · {tenant.phone ?? "no phone"}
          </p>
        </div>
        <button onClick={() => setEditing(true)} className="text-xs text-blue-600 hover:underline">
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
        className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
      />
      <div className="flex gap-3">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
        />
        <input
          type="tel"
          placeholder="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={status === "saving"}
          className="rounded bg-black px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {status === "saving" ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="rounded border border-gray-300 px-3 py-2 text-sm"
        >
          Cancel
        </button>
      </div>
      {status === "error" && <p className="text-sm text-red-600">{errorMessage}</p>}
    </form>
  );
}
