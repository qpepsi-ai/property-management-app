"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const PROPERTY_TYPES = ["single-family", "duplex", "multi-unit"] as const;

export default function NewPropertyForm() {
  const router = useRouter();
  const [address, setAddress] = useState("");
  const [type, setType] = useState<(typeof PROPERTY_TYPES)[number]>(
    "single-family",
  );
  const [purchaseDate, setPurchaseDate] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setErrorMessage("");

    const supabase = createClient();
    const { data, error } = await supabase
      .rpc("create_property", {
        p_address: address,
        p_type: type,
        p_purchase_date: purchaseDate || null,
      })
      .single();

    if (error || !data) {
      setStatus("error");
      setErrorMessage(error?.message ?? "Something went wrong.");
      return;
    }

    router.push(`/properties/${(data as { id: string }).id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded border border-gray-200 p-4">
      <h2 className="text-sm font-semibold">Add a property</h2>
      <input
        type="text"
        required
        placeholder="Address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
      />
      <div className="flex gap-3">
        <select
          value={type}
          onChange={(e) =>
            setType(e.target.value as (typeof PROPERTY_TYPES)[number])
          }
          className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
        >
          {PROPERTY_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={purchaseDate}
          onChange={(e) => setPurchaseDate(e.target.value)}
          className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={status === "saving"}
        className="rounded bg-black px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {status === "saving" ? "Saving…" : "Add property"}
      </button>
      {status === "error" && (
        <p className="text-sm text-red-600">{errorMessage}</p>
      )}
    </form>
  );
}
