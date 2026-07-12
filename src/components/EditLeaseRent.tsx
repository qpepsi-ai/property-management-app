"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { inputClass } from "@/lib/ui";

export default function EditLeaseRent({
  leaseId,
  rentAmount,
}: {
  leaseId: string;
  rentAmount: number;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState(String(rentAmount));
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setErrorMessage("");

    const supabase = createClient();
    const { error } = await supabase
      .from("leases")
      .update({ rent_amount: Number(amount) })
      .eq("id", leaseId);

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
      <span className="flex items-center gap-2">
        <span className="text-foreground">${rentAmount}</span>
        <button
          onClick={() => setEditing(true)}
          className="text-xs text-accent hover:underline"
        >
          Edit
        </button>
      </span>
    );
  }

  return (
    <form onSubmit={handleSave} className="flex items-center gap-2">
      <input
        type="number"
        required
        min="0"
        step="0.01"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className={`w-28 ${inputClass}`}
        autoFocus
      />
      <button
        type="submit"
        disabled={status === "saving"}
        className="text-xs text-accent hover:underline disabled:opacity-50"
      >
        {status === "saving" ? "Saving…" : "Save"}
      </button>
      <button
        type="button"
        onClick={() => {
          setEditing(false);
          setAmount(String(rentAmount));
        }}
        className="text-xs text-muted hover:underline"
      >
        Cancel
      </button>
      {status === "error" && <span className="text-xs text-danger-fg">{errorMessage}</span>}
    </form>
  );
}
