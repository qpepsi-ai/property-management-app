"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { inputClass, buttonClass, cardClass } from "@/lib/ui";
import { geocodeAndSaveProperty } from "@/lib/geocode-property";

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

    const propertyId = (data as { id: string }).id;
    await geocodeAndSaveProperty(supabase, propertyId, address);

    router.push(`/properties/${propertyId}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-3 ${cardClass}`}>
      <h2 className="text-sm font-semibold text-foreground">Add a property</h2>
      <input
        type="text"
        required
        placeholder="Address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        className={inputClass}
      />
      <div className="flex gap-3">
        <select
          value={type}
          onChange={(e) =>
            setType(e.target.value as (typeof PROPERTY_TYPES)[number])
          }
          className={`flex-1 ${inputClass}`}
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
          className={`flex-1 ${inputClass}`}
        />
      </div>
      <button type="submit" disabled={status === "saving"} className={buttonClass("primary")}>
        {status === "saving" ? "Saving…" : "Add property"}
      </button>
      {status === "error" && (
        <p className="text-sm text-danger-fg">{errorMessage}</p>
      )}
    </form>
  );
}
