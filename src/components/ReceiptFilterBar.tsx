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
    </div>
  );
}
