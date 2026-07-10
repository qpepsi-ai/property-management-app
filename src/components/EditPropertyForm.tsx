"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { inputClass, buttonClass, cardClass } from "@/lib/ui";

const PROPERTY_TYPES = ["single-family", "duplex", "multi-unit"] as const;

type Property = {
  id: string;
  address: string;
  type: (typeof PROPERTY_TYPES)[number];
  purchase_date: string | null;
};

export default function EditPropertyForm({ property }: { property: Property }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [address, setAddress] = useState(property.address);
  const [type, setType] = useState(property.type);
  const [purchaseDate, setPurchaseDate] = useState(property.purchase_date ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setErrorMessage("");

    const supabase = createClient();
    const { error } = await supabase
      .from("properties")
      .update({ address, type, purchase_date: purchaseDate || null })
      .eq("id", property.id);

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    setStatus("idle");
    setEditing(false);
    router.refresh();
  }

  async function handleDelete() {
    if (
      !window.confirm(
        "Delete this property? This also removes all its units, tenants' leases, and lease history. This cannot be undone.",
      )
    ) {
      return;
    }

    setStatus("saving");
    const supabase = createClient();
    const { error } = await supabase.from("properties").delete().eq("id", property.id);

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  if (!editing) {
    return (
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="mb-1 text-lg font-semibold text-foreground">{property.address}</h1>
          <p className="text-sm text-muted">
            {property.type}
            {property.purchase_date ? ` · purchased ${property.purchase_date}` : ""}
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setEditing(true)} className={buttonClass("ghost")}>
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={status === "saving"}
            className={`${buttonClass("ghost")} text-danger-fg`}
          >
            Delete
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className={`mb-8 space-y-3 ${cardClass}`}>
      <input
        type="text"
        required
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        className={inputClass}
      />
      <div className="flex gap-3">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as (typeof PROPERTY_TYPES)[number])}
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
