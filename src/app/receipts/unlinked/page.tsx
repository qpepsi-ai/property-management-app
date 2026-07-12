import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import OrphanReceiptCard from "@/components/OrphanReceiptCard";
import { pagePanelClass } from "@/lib/ui";

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

    if (orphanPaths.length === 0) continue;

    const { data: signedUrls } = await supabase.storage
      .from("receipts")
      .createSignedUrls(orphanPaths, 3600);
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
        Unlinked receipt photos
      </h1>
      <p className="mb-8 text-sm text-muted">
        Photos that uploaded successfully but never got attached to an expense (usually because
        the automatic scan failed before an expense was saved). Match each one to the expense it
        belongs to, or discard it.
      </p>

      {sections.length === 0 ? (
        <p className="text-sm text-muted">No unlinked photos found — you&apos;re all caught up.</p>
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
