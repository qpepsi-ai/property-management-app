import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { pagePanelClass } from "@/lib/ui";

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
    <div className={`mx-auto w-full max-w-3xl px-6 py-14 ${pagePanelClass}`}>
      <Link href="/receipts" className="mb-8 inline-block text-sm text-muted hover:text-accent">
        ← All receipts
      </Link>

      <div className="grid gap-8 sm:grid-cols-2">
        <div className="overflow-hidden rounded-2xl bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          {signedUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={signedUrl.signedUrl} alt="Receipt" className="w-full object-contain" />
          )}
        </div>

        <div>
          {scan.confidence === "low" && (
            <p className="mb-4 rounded-2xl bg-warning-bg px-4 py-3 text-sm text-warning-fg">
              Low-confidence scan — double check these details.
            </p>
          )}
          {!scan.confidence && (
            <p className="mb-4 rounded-2xl bg-warning-bg px-4 py-3 text-sm text-warning-fg">
              Automatic scan wasn&apos;t able to read this receipt — the photo was saved, but
              these details were entered manually.
            </p>
          )}
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Property</dt>
              <dd className="text-foreground">{property?.address}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Description</dt>
              <dd className="text-foreground">{expense.description ?? "–"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Category</dt>
              <dd className="text-foreground">{expense.category}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Amount</dt>
              <dd className="text-foreground">${expense.amount}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Date</dt>
              <dd className="text-foreground">{expense.date}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Scan confidence</dt>
              <dd className="text-foreground">{scan.confidence ?? "unknown"}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
