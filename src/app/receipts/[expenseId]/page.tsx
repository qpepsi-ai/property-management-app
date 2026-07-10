import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ReceiptDetailPage({
  params,
}: {
  params: Promise<{ expenseId: string }>;
}) {
  const { expenseId } = await params;
  const supabase = await createClient();

  const { data: expense } = await supabase
    .from("expenses")
    .select(
      "id, date, category, amount, description, property:properties(id, address), receipt_scans(id, image_url, raw_extracted_text, confidence)",
    )
    .eq("id", expenseId)
    .single();

  if (!expense) {
    notFound();
  }

  const property = Array.isArray(expense.property) ? expense.property[0] : expense.property;
  const scan = Array.isArray(expense.receipt_scans)
    ? expense.receipt_scans[0]
    : expense.receipt_scans;

  if (!scan) {
    notFound();
  }

  const { data: signedUrl } = await supabase.storage
    .from("receipts")
    .createSignedUrl(scan.image_url, 3600);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/receipts" className="mb-6 inline-block text-sm text-gray-500 hover:underline">
        ← All receipts
      </Link>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="overflow-hidden rounded border border-gray-200">
          {signedUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={signedUrl.signedUrl} alt="Receipt" className="w-full object-contain" />
          )}
        </div>

        <div>
          {scan.confidence === "low" && (
            <p className="mb-3 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Low-confidence scan — double check these details.
            </p>
          )}
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Property</dt>
              <dd>{property?.address}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Description</dt>
              <dd>{expense.description ?? "–"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Category</dt>
              <dd>{expense.category}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Amount</dt>
              <dd>${expense.amount}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Date</dt>
              <dd>{expense.date}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Scan confidence</dt>
              <dd>{scan.confidence ?? "unknown"}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
