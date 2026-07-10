"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const PRIORITIES = ["low", "medium", "high"] as const;

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function NewMaintenanceRequestForm({
  propertyId,
  units,
}: {
  propertyId: string;
  units: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [unitId, setUnitId] = useState(units[0]?.id ?? "");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<(typeof PRIORITIES)[number]>("medium");
  const [dateReported, setDateReported] = useState(today());
  const [vendor, setVendor] = useState("");
  const [photos, setPhotos] = useState<FileList | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setErrorMessage("");

    const supabase = createClient();

    const photoUrls: string[] = [];
    if (photos) {
      for (const file of Array.from(photos)) {
        const path = `${propertyId}/${unitId}/${crypto.randomUUID()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("maintenance-photos")
          .upload(path, file);
        if (uploadError) {
          setStatus("error");
          setErrorMessage(uploadError.message);
          return;
        }
        photoUrls.push(path);
      }
    }

    const { error } = await supabase.from("maintenance_requests").insert({
      unit_id: unitId,
      description,
      priority,
      date_reported: dateReported,
      vendor: vendor || null,
      photo_urls: photoUrls,
    });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    setDescription("");
    setVendor("");
    setPhotos(null);
    setStatus("idle");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded border border-gray-200 p-4">
      <h2 className="text-sm font-semibold">New maintenance request</h2>

      <label className="block text-xs text-gray-500">
        Unit
        <select
          value={unitId}
          onChange={(e) => setUnitId(e.target.value)}
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm text-black"
        >
          {units.map((u) => (
            <option key={u.id} value={u.id}>
              {u.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-xs text-gray-500">
        Description
        <textarea
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm text-black"
          rows={2}
        />
      </label>

      <div className="text-xs text-gray-500">
        Priority
        <div className="mt-1 flex gap-2">
          {PRIORITIES.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPriority(p)}
              className={
                priority === p
                  ? "rounded-full bg-black px-3 py-1 text-xs text-white"
                  : "rounded-full border border-gray-300 px-3 py-1 text-xs text-black"
              }
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <label className="flex-1 text-xs text-gray-500">
          Date reported
          <input
            type="date"
            required
            value={dateReported}
            onChange={(e) => setDateReported(e.target.value)}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm text-black"
          />
        </label>
        <label className="flex-1 text-xs text-gray-500">
          Vendor (optional)
          <input
            type="text"
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm text-black"
          />
        </label>
      </div>

      <label className="block text-xs text-gray-500">
        Photos (optional)
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setPhotos(e.target.files)}
          className="mt-1 w-full text-sm text-black"
        />
      </label>

      <button
        type="submit"
        disabled={status === "saving" || !unitId}
        className="rounded bg-black px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {status === "saving" ? "Saving…" : "Add request"}
      </button>
      {status === "error" && <p className="text-sm text-red-600">{errorMessage}</p>}
    </form>
  );
}
