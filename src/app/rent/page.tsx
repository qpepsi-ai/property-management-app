import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

function monthRange(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

export default async function RentTrackingPage() {
  const supabase = await createClient();
  const { start, end } = monthRange();

  const { data: leases } = await supabase
    .from("leases")
    .select(
      "id, rent_amount, unit:units(id, label, property:properties(id, address)), tenant:tenants(id, name)",
    )
    .eq("status", "active");

  const { data: payments } = await supabase
    .from("payments")
    .select("lease_id, amount_paid, due_date")
    .gte("due_date", start)
    .lt("due_date", end);

  const paidByLease = new Map<string, number>();
  for (const payment of payments ?? []) {
    paidByLease.set(
      payment.lease_id,
      (paidByLease.get(payment.lease_id) ?? 0) + Number(payment.amount_paid),
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/" className="mb-6 inline-block text-sm text-gray-500 hover:underline">
        ← All properties
      </Link>

      <h1 className="mb-6 text-lg font-semibold">
        Rent tracking · {new Date().toLocaleString("en-US", { month: "long", year: "numeric" })}
      </h1>

      {leases && leases.length > 0 ? (
        <ul className="space-y-2">
          {leases.map((lease) => {
            const unit = Array.isArray(lease.unit) ? lease.unit[0] : lease.unit;
            const property = Array.isArray(unit?.property) ? unit.property[0] : unit?.property;
            const tenant = Array.isArray(lease.tenant) ? lease.tenant[0] : lease.tenant;
            const paid = paidByLease.get(lease.id) ?? 0;
            const due = Number(lease.rent_amount);
            const statusLabel = paid >= due ? "paid" : paid > 0 ? "partial" : "unpaid";
            const statusClass =
              statusLabel === "paid"
                ? "bg-green-100 text-green-700"
                : statusLabel === "partial"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-red-100 text-red-700";

            return (
              <li key={lease.id}>
                <Link
                  href={`/leases/${lease.id}`}
                  className="flex items-center justify-between rounded border border-gray-200 px-4 py-3 text-sm hover:border-gray-400"
                >
                  <span>
                    <span className="font-medium">{tenant?.name}</span>{" "}
                    <span className="text-gray-500">
                      · {unit?.label}, {property?.address} · ${paid} / ${due}
                    </span>
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${statusClass}`}>
                    {statusLabel}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">No active leases.</p>
      )}
    </div>
  );
}
