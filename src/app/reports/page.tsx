import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ExportCsvButton from "@/components/ExportCsvButton";
import IncomeExpenseChart from "@/components/IncomeExpenseChart";
import { cardClass, pagePanelClass } from "@/lib/ui";

function formatCurrency(value: number) {
  return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function ReportsPage() {
  const supabase = await createClient();
  const year = new Date().getFullYear();

  const { data } = await supabase.rpc("property_financial_summary", { p_year: year });
  const rows = (data ?? []) as {
    property_id: string;
    address: string;
    ytd_income: number;
    ytd_expenses: number;
    net: number;
  }[];

  const totals = rows.reduce(
    (acc, r) => ({
      income: acc.income + Number(r.ytd_income),
      expenses: acc.expenses + Number(r.ytd_expenses),
      net: acc.net + Number(r.net),
    }),
    { income: 0, expenses: 0, net: 0 },
  );

  return (
    <div className={`mx-auto w-full max-w-3xl px-6 py-14 ${pagePanelClass}`}>
      <Link href="/dashboard" className="mb-8 inline-block text-sm text-muted hover:text-accent">
        ← All properties
      </Link>

      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Reports · {year} YTD</h1>
        {rows && rows.length > 0 && <ExportCsvButton rows={rows} year={year} />}
      </div>

      {rows && rows.length > 0 ? (
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

          <div className={`overflow-x-auto ${cardClass}`}>
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
                      <Link href={`/properties/${r.property_id}`} className="hover:text-accent hover:underline">
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
        </>
      ) : (
        <p className="text-sm text-muted">No properties to report on.</p>
      )}
    </div>
  );
}
