import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

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
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/" className="mb-6 inline-block text-sm text-gray-500 hover:underline">
        ← All properties
      </Link>

      <h1 className="mb-6 text-lg font-semibold">Tenants &amp; Leases</h1>

      <h2 className="mb-3 text-sm font-semibold">Current leases</h2>
      {leases && leases.length > 0 ? (
        <ul className="mb-8 space-y-2">
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
                  className="flex items-center justify-between rounded border border-gray-200 px-4 py-3 text-sm hover:border-gray-400"
                >
                  <span>
                    <span className="font-medium">{tenant?.name}</span>{" "}
                    <span className="text-gray-500">
                      · {unit?.label}, {property?.address} · ${lease.rent_amount}/mo · ends {lease.end_date}
                    </span>
                  </span>
                  {nearingRenewal && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                      renewal due
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mb-8 text-sm text-gray-500">No active leases.</p>
      )}

      <h2 className="mb-3 text-sm font-semibold">Vacant units</h2>
      {vacantUnits && vacantUnits.length > 0 ? (
        <ul className="space-y-2">
          {vacantUnits.map((unit) => {
            const property = Array.isArray(unit.property) ? unit.property[0] : unit.property;
            return (
              <li key={unit.id}>
                <Link
                  href={`/properties/${unit.property_id}/units/${unit.id}/lease/new`}
                  className="flex items-center justify-between rounded border border-gray-200 px-4 py-3 text-sm hover:border-gray-400"
                >
                  <span>
                    <span className="font-medium">{unit.label}</span>{" "}
                    <span className="text-gray-500">· {property?.address}</span>
                  </span>
                  <span className="text-xs text-blue-600">New lease</span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">No vacant units.</p>
      )}
    </div>
  );
}
