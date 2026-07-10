"use client";

import { useState } from "react";
import { cardClass } from "@/lib/ui";

type Row = {
  property_id: string;
  address: string;
  ytd_income: number;
  ytd_expenses: number;
};

const CHART_HEIGHT = 200;
const BAR_WIDTH = 20;
const BAR_GAP = 4;
const GROUP_GAP = 36;

function formatDollars(value: number) {
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

export default function IncomeExpenseChart({ rows }: { rows: Row[] }) {
  const [hovered, setHovered] = useState<{ propertyId: string; series: "income" | "expense" } | null>(
    null,
  );

  const maxValue = Math.max(1, ...rows.flatMap((r) => [r.ytd_income, r.ytd_expenses]));
  // round the axis ceiling up to a clean step
  const step = Math.pow(10, Math.max(0, Math.floor(Math.log10(maxValue)) - 1));
  const axisMax = Math.ceil(maxValue / (step * 5)) * step * 5;

  const groupWidth = BAR_WIDTH * 2 + BAR_GAP;
  const chartWidth = rows.length * groupWidth + (rows.length + 1) * GROUP_GAP;

  function barHeight(value: number) {
    return (value / axisMax) * (CHART_HEIGHT - 24);
  }

  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className={cardClass}>
      <div className="mb-4 flex items-center gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-chart-income" />
          Income
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-chart-expense" />
          Expenses
        </span>
      </div>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${Math.max(chartWidth, 240)} ${CHART_HEIGHT + 44}`}
          width={Math.max(chartWidth, 240)}
          height={CHART_HEIGHT + 44}
          role="img"
          aria-label="Year-to-date income and expenses by property"
        >
          {/* gridlines + axis labels */}
          {gridLines.map((fraction) => {
            const y = 12 + (CHART_HEIGHT - 24) * (1 - fraction);
            const value = axisMax * fraction;
            return (
              <g key={fraction}>
                <line
                  x1={0}
                  x2={chartWidth}
                  y1={y}
                  y2={y}
                  stroke="var(--border)"
                  strokeWidth={1}
                />
                <text x={0} y={y - 4} fontSize={10} fill="var(--muted)">
                  {formatDollars(value)}
                </text>
              </g>
            );
          })}

          {rows.map((row, i) => {
            const groupX = GROUP_GAP + i * (groupWidth + GROUP_GAP);
            const incomeH = barHeight(row.ytd_income);
            const expenseH = barHeight(row.ytd_expenses);
            const baseline = 12 + (CHART_HEIGHT - 24);

            return (
              <g key={row.property_id}>
                {/* income bar */}
                <rect
                  x={groupX}
                  y={baseline - incomeH}
                  width={BAR_WIDTH}
                  height={Math.max(incomeH, 1)}
                  rx={4}
                  fill="var(--chart-income)"
                  opacity={
                    hovered && hovered.propertyId === row.property_id && hovered.series !== "income"
                      ? 0.5
                      : 1
                  }
                  onMouseEnter={() => setHovered({ propertyId: row.property_id, series: "income" })}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered({ propertyId: row.property_id, series: "income" })}
                  onBlur={() => setHovered(null)}
                  tabIndex={0}
                  role="img"
                  aria-label={`${row.address} income ${formatDollars(row.ytd_income)}`}
                />
                <text
                  x={groupX + BAR_WIDTH / 2}
                  y={baseline - incomeH - 6}
                  fontSize={10}
                  textAnchor="middle"
                  fill="var(--foreground)"
                >
                  {formatDollars(row.ytd_income)}
                </text>

                {/* expense bar */}
                <rect
                  x={groupX + BAR_WIDTH + BAR_GAP}
                  y={baseline - expenseH}
                  width={BAR_WIDTH}
                  height={Math.max(expenseH, 1)}
                  rx={4}
                  fill="var(--chart-expense)"
                  opacity={
                    hovered && hovered.propertyId === row.property_id && hovered.series !== "expense"
                      ? 0.5
                      : 1
                  }
                  onMouseEnter={() => setHovered({ propertyId: row.property_id, series: "expense" })}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered({ propertyId: row.property_id, series: "expense" })}
                  onBlur={() => setHovered(null)}
                  tabIndex={0}
                  role="img"
                  aria-label={`${row.address} expenses ${formatDollars(row.ytd_expenses)}`}
                />
                <text
                  x={groupX + BAR_WIDTH + BAR_GAP + BAR_WIDTH / 2}
                  y={baseline - expenseH - 6}
                  fontSize={10}
                  textAnchor="middle"
                  fill="var(--foreground)"
                >
                  {formatDollars(row.ytd_expenses)}
                </text>

                {/* category label */}
                <text
                  x={groupX + BAR_WIDTH + BAR_GAP / 2}
                  y={CHART_HEIGHT + 32}
                  fontSize={11}
                  textAnchor="middle"
                  fill="var(--muted)"
                >
                  {row.address.length > 14 ? `${row.address.slice(0, 13)}…` : row.address}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      {hovered && (
        <p className="mt-2 text-xs text-muted" aria-live="polite">
          {rows.find((r) => r.property_id === hovered.propertyId)?.address} ·{" "}
          {hovered.series === "income" ? "Income" : "Expenses"}:{" "}
          <span className="font-medium text-foreground">
            {formatDollars(
              hovered.series === "income"
                ? (rows.find((r) => r.property_id === hovered.propertyId)?.ytd_income ?? 0)
                : (rows.find((r) => r.property_id === hovered.propertyId)?.ytd_expenses ?? 0),
            )}
          </span>
        </p>
      )}
    </div>
  );
}
