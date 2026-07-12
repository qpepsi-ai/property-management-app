"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { EXPENSE_CATEGORIES } from "@/lib/expense-categories";
import { inputClass } from "@/lib/ui";

export default function ReceiptFilterBar({
  properties,
}: {
  properties: { id: string; address: string }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/receipts?${params.toString()}`);
  }

  return (
    <div className="mb-6 flex flex-wrap gap-3">
      <select
        value={searchParams.get("property") ?? ""}
        onChange={(e) => updateParam("property", e.target.value)}
        className={`w-auto ${inputClass}`}
      >
        <option value="">All properties</option>
        {properties.map((p) => (
          <option key={p.id} value={p.id}>
            {p.address}
          </option>
        ))}
      </select>

      <input
        type="month"
        value={searchParams.get("month") ?? ""}
        onChange={(e) => updateParam("month", e.target.value)}
        className={`w-auto ${inputClass}`}
      />

      <select
        value={searchParams.get("category") ?? ""}
        onChange={(e) => updateParam("category", e.target.value)}
        className={`w-auto ${inputClass}`}
      >
        <option value="">All categories</option>
        {EXPENSE_CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <div className="ml-auto flex items-center rounded-full bg-surface p-0.5 text-xs">
        {(["grid", "list"] as const).map((mode) => {
          const active = (searchParams.get("view") ?? "grid") === mode;
          return (
            <button
              key={mode}
              onClick={() => updateParam("view", mode === "grid" ? "" : mode)}
              className={`rounded-full px-3 py-1.5 capitalize transition-colors ${
                active ? "bg-background font-medium text-foreground shadow-sm" : "text-muted"
              }`}
            >
              {mode}
            </button>
          );
        })}
      </div>
    </div>
  );
}
