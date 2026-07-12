"use client";

import { buttonClass } from "@/lib/ui";
import type { ReceiptItem } from "@/components/ReceiptGallery";

function toCsv(items: ReceiptItem[]) {
  const header = "Date,Description,Property,Category,Amount,Needs review";
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const lines = items.map((item) =>
    [
      item.date,
      escape(item.description ?? ""),
      escape(item.address ?? ""),
      escape(item.category),
      Number(item.amount).toFixed(2),
      item.needsReview ? "yes" : "no",
    ].join(","),
  );
  return [header, ...lines].join("\n");
}

export default function ExportExpensesButton({ items }: { items: ReceiptItem[] }) {
  function handleExport() {
    const csv = toCsv(items);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expenses-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button onClick={handleExport} className={buttonClass("secondary")}>
      Export CSV
    </button>
  );
}
