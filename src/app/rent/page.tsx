import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { cardClass, pagePanelClass } from "@/lib/ui";
import Badge from "@/components/ui/Badge";

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
    <div className={`mx-auto w-full max-w-3xl px-6 py-14 ${pagePanelClass}`}>
      <Link href="/dashboard" className="mb-8 inline-block text-sm text-muted hover:text-accent">
        ← All properties
      </Link>

      <h1 className="mb-8 text-3xl font-semibold tracking-tight text-foreground">
        Rent tracking · {new Date().toLocaleString("en-US", { month: "long", year: "numeric" })}
      </h1>

      {leases && leases.length > 0 ? (
        <ul className="space-y-3">
          {leases.map((lease) => {
            const unit = Array.isArray(lease.unit) ? lease.unit[0] : lease.unit;
            const property = Array.isArray(unit?.property) ? unit.property[0] : unit?.property;
            const tenant = Array.isArray(lease.tenant) ? lease.tenant[0] : lease.tenant;
            const paid = paidByLease.get(lease.id) ?? 0;
            const due = Number(lease.rent_amount);
            const statusLabel = paid >= due ? "paid" : paid > 0 ? "partial" : "unpaid";
            const statusVariant =
              statusLabel === "paid" ? "success" : statusLabel === "partial" ? "warning" : "danger";

            return (
              <li key={lease.id}>
                <Link
                  href={`/leases/${lease.id}`}
                  className={`flex items-center justify-between ${cardClass} transition-shadow hover:shadow-md`}
                >
                  <span>
                    <span className="font-medium text-foreground">{tenant?.name}</span>{" "}
                    <span className="text-muted">
                      · {unit?.label}, {property?.address} · ${paid} / ${due}
                    </span>
                  </span>
                  <Badge variant={statusVariant}>{statusLabel}</Badge>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted">No active leases.</p>
      )}
    </div>
  );
}
