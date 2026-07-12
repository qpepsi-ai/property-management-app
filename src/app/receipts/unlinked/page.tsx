import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ExpensePhotoUpload from "@/components/ExpensePhotoUpload";
import OrphanReceiptCard from "@/components/OrphanReceiptCard";
import { cardClass, pagePanelClass } from "@/lib/ui";

export default async function UnlinkedReceiptsPage() {
  const supabase = await createClient();

  const { data: owned } = await supabase
    .from("property_access")
    .select("property:properties(id, address)")
    .eq("role", "owner");

  const ownedProperties = (owned ?? [])
    .map((o) => (Array.isArray(o.property) ? o.property[0] : o.property))
    .filter((p): p is { id: string; address: string } => Boolean(p));

  const sections: {
    property: { id: string; address: string };
    orphans: { path: string; signedUrl: string | null }[];
    candidates: { id: string; date: string; category: string; amount: number; description: string | null }[];
  }[] = [];

  for (const property of ownedProperties) {
    const { data: expenses } = await supabase
      .from("expenses")
      .select("id, date, category, amount, description")
      .eq("property_id", property.id)
      .order("date", { ascending: false });

    const expenseIds = (expenses ?? []).map((e) => e.id);
    const { data: scans } = await supabase
      .from("receipt_scans")
      .select("expense_id, image_url")
      .in("expense_id", expenseIds.length > 0 ? expenseIds : ["00000000-0000-0000-0000-000000000000"]);

    const linkedExpenseIds = new Set((scans ?? []).map((s) => s.expense_id));
    const linkedPaths = new Set((scans ?? []).map((s) => s.image_url));
    const candidates = (expenses ?? []).filter((e) => !linkedExpenseIds.has(e.id));

    const { data: files } = await supabase.storage.from("receipts").list(property.id);
    const orphanPaths = (files ?? [])
      .filter((f) => f.id !== null)
      .map((f) => `${property.id}/${f.name}`)
      .filter((p) => !linkedPaths.has(p));

    if (orphanPaths.length === 0 && candidates.length === 0) continue;

    const { data: signedUrls } = orphanPaths.length
      ? await supabase.storage.from("receipts").createSignedUrls(orphanPaths, 3600)
      : { data: [] as { path: string | null; signedUrl: string }[] };
    const signedUrlByPath = new Map((signedUrls ?? []).map((s) => [s.path, s.signedUrl]));

    sections.push({
      property,
      orphans: orphanPaths.map((path) => ({ path, signedUrl: signedUrlByPath.get(path) ?? null })),
      candidates,
    });
  }

  return (
    <div className={`mx-auto w-full max-w-3xl px-6 py-14 ${pagePanelClass}`}>
      <Link href="/receipts" className="mb-8 inline-block text-sm text-muted hover:text-accent">
        ← All receipts
      </Link>

      <h1 className="mb-2 text-3xl font-semibold tracking-tight text-foreground">
        Unlinked receipts
      </h1>
      <p className="mb-8 text-sm text-muted">
        Photos in storage that never got attached to an expense, and expenses that have no
        photo. Match orphaned photos to the expense they belong to (or discard them), or
        upload a photo directly to an expense.
      </p>

      {sections.length === 0 ? (
        <p className="text-sm text-muted">
          Every photo is attached and every expense has one — you&apos;re all caught up.
        </p>
      ) : (
        <div className="space-y-10">
          {sections.map(({ property, orphans, candidates }) => (
            <div key={property.id}>
              <h2 className="mb-3 text-lg font-semibold text-foreground">{property.address}</h2>
              <div className="space-y-3">
                {orphans.map((orphan) => (
                  <OrphanReceiptCard
                    key={orphan.path}
                    path={orphan.path}
                    signedUrl={orphan.signedUrl}
                    candidates={candidates}
                  />
                ))}
              </div>

              {candidates.length > 0 && (
                <div className={orphans.length > 0 ? "mt-6" : ""}>
                  <h3 className="mb-2 text-sm font-medium text-muted">Expenses without a photo</h3>
                  <ul className="space-y-2">
                    {candidates.map((expense) => (
                      <li
                        key={expense.id}
                        className={`flex items-center justify-between gap-3 text-sm ${cardClass}`}
                      >
                        <span className="min-w-0 truncate">
                          <span className="font-medium text-foreground">
                            {expense.description ?? expense.category}
                          </span>{" "}
                          <span className="text-muted">
                            · {expense.date} · ${Number(expense.amount).toFixed(2)}
                          </span>
                        </span>
                        <ExpensePhotoUpload expenseId={expense.id} propertyId={property.id} />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
