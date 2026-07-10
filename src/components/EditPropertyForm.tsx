"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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

    router.push("/");
    router.refresh();
  }

  if (!editing) {
    return (
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="mb-1 text-lg font-semibold">{property.address}</h1>
          <p className="text-sm text-gray-500">
            {property.type}
            {property.purchase_date ? ` · purchased ${property.purchase_date}` : ""}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-blue-600 hover:underline"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={status === "saving"}
            className="text-xs text-red-600 hover:underline disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="mb-8 space-y-3 rounded border border-gray-200 p-4">
      <input
        type="text"
        required
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
      />
      <div className="flex gap-3">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as (typeof PROPERTY_TYPES)[number])}
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
