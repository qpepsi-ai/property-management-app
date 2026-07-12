import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ExportCsvButton from "@/components/ExportCsvButton";
import IncomeExpenseChart from "@/components/IncomeExpenseChart";
import YearSelector from "@/components/YearSelector";
import { cardClass, pagePanelClass } from "@/lib/ui";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

type SummaryRow = {
  property_id: string;
  address: string;
  ytd_income: number;
  ytd_expenses: number;
  net: number;
};

function formatCurrency(value: number) {
  return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function totalsOf(rows: SummaryRow[]) {
  return rows.reduce(
    (acc, r) => ({
      income: acc.income + Number(r.ytd_income),
      expenses: acc.expenses + Number(r.ytd_expenses),
      net: acc.net + Number(r.net),
    }),
    { income: 0, expenses: 0, net: 0 },
  );
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const { year: yearParam } = await searchParams;
  const supabase = await createClient();

  const currentYear = new Date().getFullYear();
  const requested = Number(yearParam);
  const year =
    Number.isInteger(requested) && requested >= 1990 && requested <= currentYear
      ? requested
      : currentYear;

  // Selectable years span from the earliest recorded payment or expense
  // through the current year.
  const [{ data: firstPayment }, { data: firstExpense }] = await Promise.all([
    supabase.from("payments").select("due_date").order("due_date").limit(1).maybeSingle(),
    supabase.from("expenses").select("date").order("date").limit(1).maybeSingle(),
  ]);
  const earliestYear = Math.min(
    firstPayment?.due_date ? new Date(firstPayment.due_date).getFullYear() : currentYear,
    firstExpense?.date ? new Date(firstExpense.date).getFullYear() : currentYear,
  );
  const years = Array.from(
    { length: currentYear - earliestYear + 1 },
    (_, i) => currentYear - i,
  );

  const [{ data: summary }, { data: prevSummary }, { data: monthly }] = await Promise.all([
    supabase.rpc("property_financial_summary", { p_year: year }),
    supabase.rpc("property_financial_summary", { p_year: year - 1 }),
    supabase.rpc("monthly_financial_summary", { p_year: year }),
  ]);

  const rows = (summary ?? []) as SummaryRow[];
  const prevRows = (prevSummary ?? []) as SummaryRow[];
  const months = (monthly ?? []) as { month: number; income: number; expenses: number }[];

  const totals = totalsOf(rows);
  const prevTotals = totalsOf(prevRows);
  const prevByPropertyId = new Map(prevRows.map((r) => [r.property_id, r]));
  const hasPrevYearData = prevTotals.income !== 0 || prevTotals.expenses !== 0;
  const hasMonthlyData = months.some((m) => Number(m.income) !== 0 || Number(m.expenses) !== 0);

  const isCurrentYear = year === currentYear;

  return (
    <div className={`mx-auto w-full max-w-3xl px-6 py-14 ${pagePanelClass}`}>
      <Link href="/dashboard" className="mb-8 inline-block text-sm text-muted hover:text-accent">
        ← All properties
      </Link>

      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Reports · {year}
          {isCurrentYear && " YTD"}
        </h1>
        <div className="flex items-center gap-3">
          <YearSelector years={years} selected={year} />
          {rows.length > 0 && <ExportCsvButton rows={rows} year={year} />}
        </div>
      </div>

      {rows.length > 0 ? (
        <>
          <div className="mb-6 grid grid-cols-3 gap-4">
            <div className={cardClass}>
              <p className="text-xs text-muted">Total income</p>
              <p className="mt-1 text-xl font-semibold text-foreground">
                ${formatCurrency(totals.income)}
              </p>
            </div>
            <div className={cardClass}>
              <p className="text-xs text-muted">Total expenses</p>
              <p className="mt-1 text-xl font-semibold text-foreground">
                ${formatCurrency(totals.expenses)}
              </p>
            </div>
            <div className={cardClass}>
              <p className="text-xs text-muted">Net</p>
              <p className="mt-1 text-xl font-semibold text-foreground">
                ${formatCurrency(totals.net)}
              </p>
            </div>
          </div>

          <div className="mb-6">
            <IncomeExpenseChart rows={rows} />
          </div>

          <div className={`mb-6 overflow-x-auto ${cardClass}`}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted">
                  <th className="py-2 pr-4">Property</th>
                  <th className="py-2 pr-4 text-right">Income</th>
                  <th className="py-2 pr-4 text-right">Expenses</th>
                  <th className="py-2 text-right">Net</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.property_id} className="border-b border-border/60 text-foreground">
                    <td className="py-2 pr-4">
                      <Link
                        href={`/properties/${r.property_id}`}
                        className="hover:text-accent hover:underline"
                      >
                        {r.address}
                      </Link>
                    </td>
                    <td className="py-2 pr-4 text-right">${formatCurrency(r.ytd_income)}</td>
                    <td className="py-2 pr-4 text-right">${formatCurrency(r.ytd_expenses)}</td>
                    <td className="py-2 text-right font-medium">${formatCurrency(r.net)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-medium text-foreground">
                  <td className="py-2 pr-4">Total</td>
                  <td className="py-2 pr-4 text-right">${formatCurrency(totals.income)}</td>
                  <td className="py-2 pr-4 text-right">${formatCurrency(totals.expenses)}</td>
                  <td className="py-2 text-right">${formatCurrency(totals.net)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {hasMonthlyData && (
            <div className="mb-6">
              <h2 className="mb-3 text-xl font-semibold text-foreground">
                Monthly trend · {year}
              </h2>
              <IncomeExpenseChart
                rows={months.map((m) => ({
                  property_id: String(m.month),
                  address: MONTH_NAMES[m.month - 1],
                  ytd_income: Number(m.income),
                  ytd_expenses: Number(m.expenses),
                }))}
              />
            </div>
          )}

          {hasPrevYearData && (
            <div className="mb-6">
              <h2 className="mb-3 text-xl font-semibold text-foreground">
                Year over year · {year - 1} vs {year}
              </h2>
              <div className={`overflow-x-auto ${cardClass}`}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted">
                      <th className="py-2 pr-4">Property</th>
                      <th className="py-2 pr-4 text-right">Income {year - 1}</th>
                      <th className="py-2 pr-4 text-right">Income {year}</th>
                      <th className="py-2 pr-4 text-right">Expenses {year - 1}</th>
                      <th className="py-2 pr-4 text-right">Expenses {year}</th>
                      <th className="py-2 pr-4 text-right">Net {year - 1}</th>
                      <th className="py-2 text-right">Net {year}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => {
                      const prev = prevByPropertyId.get(r.property_id);
                      return (
                        <tr
                          key={r.property_id}
                          className="border-b border-border/60 text-foreground"
                        >
                          <td className="py-2 pr-4">{r.address}</td>
                          <td className="py-2 pr-4 text-right">
                            ${formatCurrency(Number(prev?.ytd_income ?? 0))}
                          </td>
                          <td className="py-2 pr-4 text-right">
                            ${formatCurrency(Number(r.ytd_income))}
                          </td>
                          <td className="py-2 pr-4 text-right">
                            ${formatCurrency(Number(prev?.ytd_expenses ?? 0))}
                          </td>
                          <td className="py-2 pr-4 text-right">
                            ${formatCurrency(Number(r.ytd_expenses))}
                          </td>
                          <td className="py-2 pr-4 text-right">
                            ${formatCurrency(Number(prev?.net ?? 0))}
                          </td>
                          <td className="py-2 text-right font-medium">
                            ${formatCurrency(Number(r.net))}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="font-medium text-foreground">
                      <td className="py-2 pr-4">Total</td>
                      <td className="py-2 pr-4 text-right">${formatCurrency(prevTotals.income)}</td>
                      <td className="py-2 pr-4 text-right">${formatCurrency(totals.income)}</td>
                      <td className="py-2 pr-4 text-right">
                        ${formatCurrency(prevTotals.expenses)}
                      </td>
                      <td className="py-2 pr-4 text-right">${formatCurrency(totals.expenses)}</td>
                      <td className="py-2 pr-4 text-right">${formatCurrency(prevTotals.net)}</td>
                      <td className="py-2 text-right">${formatCurrency(totals.net)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <p className="mt-2 text-xs text-muted">
                {isCurrentYear
                  ? `${year} figures are year-to-date; ${year - 1} figures are the full year.`
                  : "Both years show full-year totals."}
              </p>
            </div>
          )}
        </>
      ) : (
        <p className="text-sm text-muted">No properties to report on.</p>
      )}
    </div>
  );
}
