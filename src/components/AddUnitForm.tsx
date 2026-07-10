"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AddUnitForm({ propertyId }: { propertyId: string }) {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [rentAmount, setRentAmount] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setErrorMessage("");

    const supabase = createClient();
    const { error } = await supabase.from("units").insert({
      property_id: propertyId,
      label,
      bedrooms: bedrooms ? Number(bedrooms) : null,
      bathrooms: bathrooms ? Number(bathrooms) : null,
      rent_amount: rentAmount ? Number(rentAmount) : null,
    });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    setLabel("");
    setBedrooms("");
    setBathrooms("");
    setRentAmount("");
    setStatus("idle");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded border border-gray-200 p-4">
      <h2 className="text-sm font-semibold">Add a unit</h2>
      <input
        type="text"
        required
        placeholder="Label (e.g. Unit A, Main house)"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
      />
      <div className="flex gap-3">
        <input
          type="number"
          min="0"
          placeholder="Bedrooms"
          value={bedrooms}
          onChange={(e) => setBedrooms(e.target.value)}
          className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
        />
        <input
          type="number"
          min="0"
          step="0.5"
          placeholder="Bathrooms"
          value={bathrooms}
          onChange={(e) => setBathrooms(e.target.value)}
          className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
        />
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="Rent"
          value={rentAmount}
          onChange={(e) => setRentAmount(e.target.value)}
          className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={status === "saving"}
        className="rounded bg-black px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {status === "saving" ? "Saving…" : "Add unit"}
      </button>
      {status === "error" && (
        <p className="text-sm text-red-600">{errorMessage}</p>
      )}
    </form>
  );
}
