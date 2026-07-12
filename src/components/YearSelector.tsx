"use client";

import { useRouter } from "next/navigation";
import { inputClass } from "@/lib/ui";

export default function YearSelector({ years, selected }: { years: number[]; selected: number }) {
  const router = useRouter();

  return (
    <select
      value={selected}
      onChange={(e) => router.push(`/reports?year=${e.target.value}`)}
      className={`w-auto ${inputClass}`}
      aria-label="Report year"
    >
      {years.map((year) => (
        <option key={year} value={year}>
          {year}
        </option>
      ))}
    </select>
  );
}
