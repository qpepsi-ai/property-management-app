"use client";

import { buttonClass } from "@/lib/ui";

type Row = {
  address: string;
  ytd_income: number;
  ytd_expenses: number;
  net: number;
};

function toCsv(rows: Row[]) {
  const header = "Property,YTD Income,YTD Expenses,Net";
  const lines = rows.map(
    (r) => `"${r.address.replace(/"/g, '""')}",${r.ytd_income},${r.ytd_expenses},${r.net}`,
  );
  return [header, ...lines].join("\n");
}

export default function ExportCsvButton({ rows, year }: { rows: Row[]; year: number }) {
  function handleExport() {
    const csv = toCsv(rows);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `property-report-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button onClick={handleExport} className={buttonClass("secondary")}>
      Export CSV
    </button>
  );
}
