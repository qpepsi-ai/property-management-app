"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { inputClass, buttonClass, cardClass } from "@/lib/ui";
import Badge from "@/components/ui/Badge";

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
      <li className={cardClass}>
        <form onSubmit={handleSave} className="space-y-3">
          <input
            type="text"
            required
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className={inputClass}
          />
          <div className="flex gap-3">
            <input
              type="number"
              min="0"
              placeholder="Bedrooms"
              value={bedrooms}
              onChange={(e) => setBedrooms(e.target.value)}
              className={`flex-1 ${inputClass}`}
            />
            <input
              type="number"
              min="0"
              step="0.5"
              placeholder="Bathrooms"
              value={bathrooms}
              onChange={(e) => setBathrooms(e.target.value)}
              className={`flex-1 ${inputClass}`}
            />
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Rent"
              value={rentAmount}
              onChange={(e) => setRentAmount(e.target.value)}
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
      </li>
    );
  }

  return (
    <li className={`flex items-center justify-between text-sm ${cardClass}`}>
      <span>
        <span className="font-medium text-foreground">{unit.label}</span>{" "}
        <span className="text-muted">
          {unit.bedrooms ?? "–"}bd / {unit.bathrooms ?? "–"}ba
          {unit.rent_amount ? ` · $${unit.rent_amount}/mo` : ""}
        </span>
      </span>
      <span className="flex items-center gap-3">
        <Badge variant={unit.status === "occupied" ? "success" : "neutral"}>{unit.status}</Badge>
        {unit.status === "vacant" && (
          <Link
            href={`/properties/${propertyId}/units/${unit.id}/lease/new`}
            className="text-xs text-accent hover:underline"
          >
            New lease
          </Link>
        )}
        {unit.status === "occupied" && leaseId && (
          <Link href={`/leases/${leaseId}`} className="text-xs text-accent hover:underline">
            View lease
          </Link>
        )}
        <button onClick={() => setEditing(true)} className="text-xs text-accent hover:underline">
          Edit
        </button>
        <button
          onClick={handleDelete}
          disabled={status === "saving"}
          className="text-xs text-danger-fg hover:underline disabled:opacity-50"
        >
          Delete
        </button>
      </span>
    </li>
  );
}
