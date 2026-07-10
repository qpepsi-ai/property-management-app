import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { cardClass, pagePanelClass } from "@/lib/ui";
import Badge from "@/components/ui/Badge";

const PRIORITY_VARIANT: Record<string, "neutral" | "warning" | "danger"> = {
  low: "neutral",
  medium: "warning",
  high: "danger",
};

export default async function MaintenancePage() {
  const supabase = await createClient();

  const { data: requests } = await supabase
    .from("maintenance_requests")
    .select(
      "id, description, priority, status, date_reported, resolved_date, unit:units(id, label, property:properties(id, address))",
    )
    .order("date_reported", { ascending: false });

  const open = (requests ?? []).filter((r) => r.status === "open");
  const resolved = (requests ?? []).filter((r) => r.status === "resolved");

  const resolveTimes = resolved
    .filter((r) => r.resolved_date)
    .map(
      (r) =>
        (new Date(r.resolved_date!).getTime() - new Date(r.date_reported).getTime()) /
        (1000 * 60 * 60 * 24),
    );
  const avgResolveDays =
    resolveTimes.length > 0
      ? Math.round(resolveTimes.reduce((a, b) => a + b, 0) / resolveTimes.length)
      : null;

  function renderList(items: typeof open) {
    return (
      <ul className="space-y-3">
        {items.map((r) => {
          const unit = Array.isArray(r.unit) ? r.unit[0] : r.unit;
          const property = Array.isArray(unit?.property) ? unit.property[0] : unit?.property;
          return (
            <li key={r.id}>
              <Link
                href={`/properties/${property?.id ?? ""}`}
                className={`flex items-start justify-between ${cardClass} transition-shadow hover:shadow-md`}
              >
                <span>
                  <span className="font-medium text-foreground">
                    {unit?.label}, {property?.address}
                  </span>
                  <br />
                  <span className="text-muted">
                    {r.description} · reported {r.date_reported}
                  </span>
                </span>
                <Badge variant={PRIORITY_VARIANT[r.priority]}>{r.priority}</Badge>
              </Link>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div className={`mx-auto w-full max-w-3xl px-6 py-14 ${pagePanelClass}`}>
      <Link href="/dashboard" className="mb-8 inline-block text-sm text-muted hover:text-accent">
        ← All properties
      </Link>

      <h1 className="mb-1 text-3xl font-semibold tracking-tight text-foreground">Maintenance tracking</h1>
      {avgResolveDays !== null && (
        <p className="mb-8 text-sm text-muted">
          Average resolve time: {avgResolveDays} day{avgResolveDays === 1 ? "" : "s"}
        </p>
      )}

      <h2 className="mb-4 text-xl font-semibold text-foreground">Open ({open.length})</h2>
      {open.length > 0 ? renderList(open) : <p className="text-sm text-muted">No open requests.</p>}

      <h2 className="mt-10 mb-4 text-xl font-semibold text-foreground">
        Resolved ({resolved.length})
      </h2>
      {resolved.length > 0 ? (
        renderList(resolved)
      ) : (
        <p className="text-sm text-muted">No resolved requests yet.</p>
      )}
    </div>
  );
}
