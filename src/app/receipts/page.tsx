import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ReceiptFilterBar from "@/components/ReceiptFilterBar";
import ReceiptGallery, { type ReceiptItem } from "@/components/ReceiptGallery";
import { buttonClass, pagePanelClass } from "@/lib/ui";

function monthRange(month: string) {
  const [year, m] = month.split("-").map(Number);
  const start = new Date(year, m - 1, 1).toISOString().slice(0, 10);
  const end = new Date(year, m, 1).toISOString().slice(0, 10);
  return { start, end };
}

export default async function ReceiptsPage({
  searchParams,
}: {
  searchParams: Promise<{ property?: string; month?: string; category?: string; view?: string }>;
}) {
  const { property, month, category, view } = await searchParams;
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
      : "/dashboard";

  return (
    <div className={`mx-auto w-full max-w-4xl px-6 py-14 ${pagePanelClass}`}>
      <Link href="/dashboard" className="mb-8 inline-block text-sm text-muted hover:text-accent">
        ← All properties
      </Link>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Receipts</h1>
          <p className="text-sm text-muted">
            {totalScans ?? 0} scanned ·{" "}
            <Link href="/receipts/unlinked" className="text-accent hover:underline">
              Review unlinked photos
            </Link>
          </p>
        </div>
        <Link href={scanButtonHref} className={buttonClass("primary")}>
          Scan receipt
        </Link>
      </div>

      <ReceiptFilterBar properties={properties ?? []} />

      {expenses && expenses.length > 0 ? (
        <ReceiptGallery
          view={view === "list" ? "list" : "grid"}
          items={expenses.map((expense): ReceiptItem => {
            const propertyInfo = Array.isArray(expense.property)
              ? expense.property[0]
              : expense.property;
            const scan = Array.isArray(expense.receipt_scans)
              ? expense.receipt_scans[0]
              : expense.receipt_scans;
            return {
              id: expense.id,
              date: expense.date,
              category: expense.category,
              amount: expense.amount,
              description: expense.description,
              address: propertyInfo?.address,
              imageUrl: (scan?.image_url && signedUrlByPath.get(scan.image_url)) || null,
              needsReview: Boolean(scan) && (scan?.confidence === "low" || !scan?.confidence),
            };
          })}
        />
      ) : (
        <p className="text-sm text-muted">No expenses match these filters.</p>
      )}
    </div>
  );
}
