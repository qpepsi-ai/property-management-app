import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MarkReviewedButton from "@/components/MarkReviewedButton";
import ReceiptPhotoActions from "@/components/ReceiptPhotoActions";
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
      "id, date, category, amount, description, property:properties(id, address), receipt_scans(id, image_url, raw_extracted_text, confidence, reviewed_at)",
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
          {property && (
            <ReceiptPhotoActions
              scanId={scan.id}
              propertyId={property.id}
              imagePath={scan.image_url}
            />
          )}
        </div>

        <div>
          {!scan.reviewed_at && scan.confidence === "low" && (
            <p className="mb-4 rounded-2xl bg-warning-bg px-4 py-3 text-sm text-warning-fg">
              Low-confidence scan — double check these details.
            </p>
          )}
          {!scan.reviewed_at && !scan.confidence && (
            <p className="mb-4 rounded-2xl bg-warning-bg px-4 py-3 text-sm text-warning-fg">
              These details weren&apos;t extracted from this photo — double check them against
              the image.
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
            {scan.reviewed_at && (
              <div className="flex justify-between">
                <dt className="text-muted">Reviewed</dt>
                <dd className="text-foreground">{scan.reviewed_at.slice(0, 10)}</dd>
              </div>
            )}
          </dl>

          {!scan.reviewed_at && (scan.confidence === "low" || !scan.confidence) && (
            <div className="mt-4">
              <MarkReviewedButton scanId={scan.id} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
