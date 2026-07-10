"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { inputClass, labelClass, buttonClass, cardClass } from "@/lib/ui";
import { geocodeAndSaveProperty } from "@/lib/geocode-property";

const PROPERTY_TYPES = ["single-family", "duplex", "multi-unit"] as const;

type Property = {
  id: string;
  address: string;
  type: (typeof PROPERTY_TYPES)[number];
  purchase_date: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export default function EditPropertyForm({ property }: { property: Property }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [address, setAddress] = useState(property.address);
  const [type, setType] = useState(property.type);
  const [purchaseDate, setPurchaseDate] = useState(property.purchase_date ?? "");
  const [latitude, setLatitude] = useState(property.latitude?.toString() ?? "");
  const [longitude, setLongitude] = useState(property.longitude?.toString() ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setErrorMessage("");

    const supabase = createClient();
    const manualLat = latitude.trim() ? Number(latitude) : null;
    const manualLng = longitude.trim() ? Number(longitude) : null;

    const { error } = await supabase
      .from("properties")
      .update({
        address,
        type,
        purchase_date: purchaseDate || null,
        ...(manualLat !== null && manualLng !== null
          ? { latitude: manualLat, longitude: manualLng }
          : {}),
      })
      .eq("id", property.id);

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    // Manual coordinates take priority; only auto-geocode if none were
    // entered and the address actually changed.
    if (manualLat === null && manualLng === null && address !== property.address) {
      await geocodeAndSaveProperty(supabase, property.id, address);
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
      <div className="flex flex-col gap-3 sm:flex-row">
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

      <div className="border-t border-border pt-3">
        <p className={labelClass}>
          Map coordinates (optional — auto-detected from address when possible)
        </p>
        <div className="mt-1 flex gap-3">
          <input
            type="number"
            step="any"
            placeholder="Latitude"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            className={`flex-1 ${inputClass}`}
          />
          <input
            type="number"
            step="any"
            placeholder="Longitude"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            className={`flex-1 ${inputClass}`}
          />
        </div>
        <p className="mt-1 text-xs text-muted">
          Find these by right-clicking a location on{" "}
          <a
            href="https://www.google.com/maps"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            Google Maps
          </a>{" "}
          and copying the coordinates shown.
        </p>
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
