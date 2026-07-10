import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EditTenantForm from "@/components/EditTenantForm";
import EndLeaseButton from "@/components/EndLeaseButton";
import LogPaymentForm from "@/components/LogPaymentForm";

const RENEWAL_WINDOW_DAYS = 60;

export default async function LeaseDetailPage({
  params,
}: {
  params: Promise<{ leaseId: string }>;
}) {
  const { leaseId } = await params;
  const supabase = await createClient();

  const { data: lease } = await supabase
    .from("leases")
    .select(
      "id, start_date, end_date, rent_amount, security_deposit, status, unit:units(id, label, property_id, property:properties(id, address)), tenant:tenants(id, name, email, phone)",
    )
    .eq("id", leaseId)
    .single();

  if (!lease) {
    notFound();
  }

  const { data: payments } = await supabase
    .from("payments")
    .select("id, due_date, paid_date, amount_paid, status, notes")
    .eq("lease_id", leaseId)
    .order("due_date", { ascending: false });

  const unit = Array.isArray(lease.unit) ? lease.unit[0] : lease.unit;
  const property = Array.isArray(unit?.property) ? unit.property[0] : unit?.property;
  const tenant = Array.isArray(lease.tenant) ? lease.tenant[0] : lease.tenant;

  const daysUntilEnd = Math.ceil(
    (new Date(lease.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
  const isNearingRenewal =
    lease.status === "active" && daysUntilEnd <= RENEWAL_WINDOW_DAYS;

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <Link
        href={property ? `/properties/${property.id}` : "/"}
        className="mb-6 inline-block text-sm text-gray-500 hover:underline"
      >
        ← {property?.address ?? "Back"}
      </Link>

      <h1 className="mb-1 text-lg font-semibold">{unit?.label}</h1>
      <p className="mb-6 text-sm text-gray-500">{property?.address}</p>

      {isNearingRenewal && (
        <div className="mb-6 rounded border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {daysUntilEnd >= 0
            ? `Lease ends in ${daysUntilEnd} day${daysUntilEnd === 1 ? "" : "s"} — renewal due soon.`
            : `Lease end date has passed by ${Math.abs(daysUntilEnd)} day${Math.abs(daysUntilEnd) === 1 ? "" : "s"}.`}
        </div>
      )}

      <div className="mb-6 rounded border border-gray-200 p-4">
        <h2 className="mb-3 text-sm font-semibold">Lease terms</h2>
        <dl className="space-y-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">Status</dt>
            <dd>{lease.status}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Start date</dt>
            <dd>{lease.start_date}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">End date</dt>
            <dd>{lease.end_date}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Monthly rent</dt>
            <dd>${lease.rent_amount}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Security deposit</dt>
            <dd>{lease.security_deposit ? `$${lease.security_deposit}` : "–"}</dd>
          </div>
        </dl>
      </div>

      {tenant && (
        <div className="mb-6 rounded border border-gray-200 p-4">
          <h2 className="mb-3 text-sm font-semibold">Tenant</h2>
          <EditTenantForm tenant={tenant} />
        </div>
      )}

      <div className="mb-6 rounded border border-gray-200 p-4">
        <h2 className="mb-3 text-sm font-semibold">Payment history</h2>
        {payments && payments.length > 0 ? (
          <ul className="space-y-2 text-sm">
            {payments.map((payment) => (
              <li key={payment.id} className="flex items-center justify-between">
                <span>
                  {payment.due_date} · ${payment.amount_paid}
                  {payment.paid_date ? ` · paid ${payment.paid_date}` : ""}
                  {payment.notes ? ` · ${payment.notes}` : ""}
                </span>
                <span
                  className={
                    payment.status === "paid"
                      ? "rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700"
                      : "rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800"
                  }
                >
                  {payment.status}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No payments logged yet.</p>
        )}
      </div>

      {lease.status === "active" && (
        <div className="mb-6">
          <LogPaymentForm leaseId={lease.id} rentAmount={lease.rent_amount} />
        </div>
      )}

      {lease.status === "active" && <EndLeaseButton leaseId={lease.id} />}
    </div>
  );
}
