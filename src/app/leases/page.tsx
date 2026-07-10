import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { cardClass, pagePanelClass } from "@/lib/ui";
import Badge from "@/components/ui/Badge";

const RENEWAL_WINDOW_DAYS = 60;

export default async function LeasesPage() {
  const supabase = await createClient();

  const { data: leases } = await supabase
    .from("leases")
    .select(
      "id, end_date, rent_amount, status, unit:units(id, label, property_id, property:properties(id, address)), tenant:tenants(id, name)",
    )
    .eq("status", "active")
    .order("end_date");

  const { data: vacantUnits } = await supabase
    .from("units")
    .select("id, label, property_id, property:properties(id, address)")
    .eq("status", "vacant");

  return (
    <div className={`mx-auto w-full max-w-3xl px-6 py-14 ${pagePanelClass}`}>
      <Link href="/dashboard" className="mb-8 inline-block text-sm text-muted hover:text-accent">
        ← All properties
      </Link>

      <h1 className="mb-8 text-3xl font-semibold tracking-tight text-foreground">Tenants &amp; Leases</h1>

      <h2 className="mb-4 text-xl font-semibold text-foreground">Current leases</h2>
      {leases && leases.length > 0 ? (
        <ul className="mb-10 space-y-3">
          {leases.map((lease) => {
            const unit = Array.isArray(lease.unit) ? lease.unit[0] : lease.unit;
            const property = Array.isArray(unit?.property) ? unit.property[0] : unit?.property;
            const tenant = Array.isArray(lease.tenant) ? lease.tenant[0] : lease.tenant;
            const daysUntilEnd = Math.ceil(
              (new Date(lease.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
            );
            const nearingRenewal = daysUntilEnd <= RENEWAL_WINDOW_DAYS;

            return (
              <li key={lease.id}>
                <Link
                  href={`/leases/${lease.id}`}
                  className={`flex items-center justify-between ${cardClass} transition-shadow hover:shadow-md`}
                >
                  <span>
                    <span className="font-medium text-foreground">{tenant?.name}</span>{" "}
                    <span className="text-muted">
                      · {unit?.label}, {property?.address} · ${lease.rent_amount}/mo · ends {lease.end_date}
                    </span>
                  </span>
                  {nearingRenewal && <Badge variant="warning">renewal due</Badge>}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mb-10 text-sm text-muted">No active leases.</p>
      )}

      <h2 className="mb-4 text-xl font-semibold text-foreground">Vacant units</h2>
      {vacantUnits && vacantUnits.length > 0 ? (
        <ul className="space-y-3">
          {vacantUnits.map((unit) => {
            const property = Array.isArray(unit.property) ? unit.property[0] : unit.property;
            return (
              <li key={unit.id}>
                <Link
                  href={`/properties/${unit.property_id}/units/${unit.id}/lease/new`}
                  className={`flex items-center justify-between ${cardClass} transition-shadow hover:shadow-md`}
                >
                  <span>
                    <span className="font-medium text-foreground">{unit.label}</span>{" "}
                    <span className="text-muted">· {property?.address}</span>
                  </span>
                  <span className="text-xs text-accent">New lease</span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted">No vacant units.</p>
      )}
    </div>
  );
}
