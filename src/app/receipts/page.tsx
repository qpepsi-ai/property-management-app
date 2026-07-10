import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ReceiptFilterBar from "@/components/ReceiptFilterBar";

function monthRange(month: string) {
  const [year, m] = month.split("-").map(Number);
  const start = new Date(year, m - 1, 1).toISOString().slice(0, 10);
  const end = new Date(year, m, 1).toISOString().slice(0, 10);
  return { start, end };
}

export default async function ReceiptsPage({
  searchParams,
}: {
  searchParams: Promise<{ property?: string; month?: string; category?: string }>;
}) {
  const { property, month, category } = await searchParams;
  const supabase = await createClient();

  const { data: properties } = await supabase
    .from("properties")
    .select("id, address")
    .order("address");

  const { count: totalScans } = await supabase
    .from("receipt_scans")
    .select("id", { count: "exact", head: true });

  let query = supabase
    .from("expenses")
    .select(
      "id, date, category, amount, description, property_id, property:properties(id, address), receipt_scans(id, image_url, confidence)",
    )
    .order("date", { ascending: false });

  if (property) query = query.eq("property_id", property);
  if (category) query = query.eq("category", category);
  if (month) {
    const { start, end } = monthRange(month);
    query = query.gte("date", start).lt("date", end);
  }

  const { data: expenses } = await query;

  const scanPaths = (expenses ?? [])
    .map((e) => {
      const scan = Array.isArray(e.receipt_scans) ? e.receipt_scans[0] : e.receipt_scans;
      return scan?.image_url;
    })
    .filter((p): p is string => Boolean(p));

  const { data: signedUrls } = scanPaths.length
    ? await supabase.storage.from("receipts").createSignedUrls(scanPaths, 3600)
    : { data: [] as { path: string | null; signedUrl: string }[] };

  const signedUrlByPath = new Map((signedUrls ?? []).map((s) => [s.path, s.signedUrl]));

  const scanButtonHref =
    properties && properties.length === 1
      ? `/properties/${properties[0].id}#add-expense`
      : "/";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/" className="mb-6 inline-block text-sm text-gray-500 hover:underline">
        ← All properties
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Receipts</h1>
          <p className="text-sm text-gray-500">{totalScans ?? 0} scanned</p>
        </div>
        <Link
          href={scanButtonHref}
          className="rounded bg-black px-3 py-2 text-sm font-medium text-white"
        >
          Scan receipt
        </Link>
      </div>

      <ReceiptFilterBar properties={properties ?? []} />

      {expenses && expenses.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {expenses.map((expense) => {
            const propertyInfo = Array.isArray(expense.property)
              ? expense.property[0]
              : expense.property;
            const scan = Array.isArray(expense.receipt_scans)
              ? expense.receipt_scans[0]
              : expense.receipt_scans;
            const imageUrl = scan?.image_url ? signedUrlByPath.get(scan.image_url) : null;
            const needsReview = scan?.confidence === "low";

            const card = (
              <div className="rounded border border-gray-200 p-2 text-xs hover:border-gray-400">
                <div className="mb-2 flex aspect-square items-center justify-center overflow-hidden rounded bg-gray-100">
                  {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-2xl text-gray-400">🧾</span>
                  )}
                </div>
                {needsReview && (
                  <span className="mb-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">
                    Needs review
                  </span>
                )}
                <p className="truncate font-medium">{expense.description ?? expense.category}</p>
                <p className="truncate text-gray-500">
                  {propertyInfo?.address} · ${expense.amount}
                </p>
                <p className="text-gray-400">{expense.date}</p>
              </div>
            );

            return (
              <div key={expense.id}>
                {imageUrl ? <Link href={`/receipts/${expense.id}`}>{card}</Link> : card}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No expenses match these filters.</p>
      )}
    </div>
  );
}
