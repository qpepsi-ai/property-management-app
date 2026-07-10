import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ExportCsvButton from "@/components/ExportCsvButton";

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
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/" className="mb-6 inline-block text-sm text-gray-500 hover:underline">
        ← All properties
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Reports · {year} YTD</h1>
        {rows && rows.length > 0 && <ExportCsvButton rows={rows} year={year} />}
      </div>

      {rows && rows.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="py-2 pr-4">Property</th>
                <th className="py-2 pr-4 text-right">Income</th>
                <th className="py-2 pr-4 text-right">Expenses</th>
                <th className="py-2 text-right">Net</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.property_id} className="border-b border-gray-100">
                  <td className="py-2 pr-4">
                    <Link href={`/properties/${r.property_id}`} className="hover:underline">
                      {r.address}
                    </Link>
                  </td>
                  <td className="py-2 pr-4 text-right">${r.ytd_income}</td>
                  <td className="py-2 pr-4 text-right">${r.ytd_expenses}</td>
                  <td className="py-2 text-right font-medium">${r.net}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-medium">
                <td className="py-2 pr-4">Total</td>
                <td className="py-2 pr-4 text-right">${totals.income}</td>
                <td className="py-2 pr-4 text-right">${totals.expenses}</td>
                <td className="py-2 text-right">${totals.net}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <p className="text-sm text-gray-500">No properties to report on.</p>
      )}
    </div>
  );
}
