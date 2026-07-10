"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Unit = {
  id: string;
  label: string;
  bedrooms: number | null;
  bathrooms: number | null;
  rent_amount: number | null;
  status: "vacant" | "occupied";
};

export default function UnitRow({
  unit,
  propertyId,
  leaseId,
}: {
  unit: Unit;
  propertyId: string;
  leaseId?: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(unit.label);
  const [bedrooms, setBedrooms] = useState(unit.bedrooms?.toString() ?? "");
  const [bathrooms, setBathrooms] = useState(unit.bathrooms?.toString() ?? "");
  const [rentAmount, setRentAmount] = useState(unit.rent_amount?.toString() ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setErrorMessage("");

    const supabase = createClient();
    const { error } = await supabase
      .from("units")
      .update({
        label,
        bedrooms: bedrooms ? Number(bedrooms) : null,
        bathrooms: bathrooms ? Number(bathrooms) : null,
        rent_amount: rentAmount ? Number(rentAmount) : null,
      })
      .eq("id", unit.id);

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
    const warning =
      unit.status === "occupied"
        ? "This unit has an active lease. Deleting it also deletes that lease and its history. Continue?"
        : "Delete this unit?";
    if (!window.confirm(warning)) return;

    setStatus("saving");
    const supabase = createClient();
    const { error } = await supabase.from("units").delete().eq("id", unit.id);

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    router.refresh();
  }

  if (editing) {
    return (
      <li className="rounded border border-gray-200 p-4">
        <form onSubmit={handleSave} className="space-y-3">
          <input
            type="text"
            required
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
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between rounded border border-gray-200 px-4 py-3 text-sm">
      <span>
        <span className="font-medium">{unit.label}</span>{" "}
        <span className="text-gray-500">
          {unit.bedrooms ?? "–"}bd / {unit.bathrooms ?? "–"}ba
          {unit.rent_amount ? ` · $${unit.rent_amount}/mo` : ""}
        </span>
      </span>
      <span className="flex items-center gap-3">
        <span
          className={
            unit.status === "occupied"
              ? "rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700"
              : "rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
          }
        >
          {unit.status}
        </span>
        {unit.status === "vacant" && (
          <Link
            href={`/properties/${propertyId}/units/${unit.id}/lease/new`}
            className="text-xs text-blue-600 hover:underline"
          >
            New lease
          </Link>
        )}
        {unit.status === "occupied" && leaseId && (
          <Link href={`/leases/${leaseId}`} className="text-xs text-blue-600 hover:underline">
            View lease
          </Link>
        )}
        <button onClick={() => setEditing(true)} className="text-xs text-blue-600 hover:underline">
          Edit
        </button>
        <button
          onClick={handleDelete}
          disabled={status === "saving"}
          className="text-xs text-red-600 hover:underline disabled:opacity-50"
        >
          Delete
        </button>
      </span>
    </li>
  );
}
