import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const PRIORITY_CLASS: Record<string, string> = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-red-100 text-red-700",
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
      <ul className="space-y-2">
        {items.map((r) => {
          const unit = Array.isArray(r.unit) ? r.unit[0] : r.unit;
          const property = Array.isArray(unit?.property) ? unit.property[0] : unit?.property;
          return (
            <li key={r.id}>
              <Link
                href={`/properties/${property?.id ?? ""}`}
                className="flex items-start justify-between rounded border border-gray-200 px-4 py-3 text-sm hover:border-gray-400"
              >
                <span>
                  <span className="font-medium">
                    {unit?.label}, {property?.address}
                  </span>
                  <br />
                  <span className="text-gray-500">
                    {r.description} · reported {r.date_reported}
                  </span>
                </span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${PRIORITY_CLASS[r.priority]}`}>
                  {r.priority}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/" className="mb-6 inline-block text-sm text-gray-500 hover:underline">
        ← All properties
      </Link>

      <h1 className="mb-1 text-lg font-semibold">Maintenance tracking</h1>
      {avgResolveDays !== null && (
        <p className="mb-6 text-sm text-gray-500">
          Average resolve time: {avgResolveDays} day{avgResolveDays === 1 ? "" : "s"}
        </p>
      )}

      <h2 className="mb-3 text-sm font-semibold">Open ({open.length})</h2>
      {open.length > 0 ? renderList(open) : <p className="text-sm text-gray-500">No open requests.</p>}

      <h2 className="mt-8 mb-3 text-sm font-semibold">Resolved ({resolved.length})</h2>
      {resolved.length > 0 ? (
        renderList(resolved)
      ) : (
        <p className="text-sm text-gray-500">No resolved requests yet.</p>
      )}
    </div>
  );
}
