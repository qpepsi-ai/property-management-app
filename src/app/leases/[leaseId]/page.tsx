import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ConvertToMonthToMonthButton from "@/components/ConvertToMonthToMonthButton";
import EditLeaseRent from "@/components/EditLeaseRent";
import EditTenantForm from "@/components/EditTenantForm";
import EndLeaseButton from "@/components/EndLeaseButton";
import LeaseDocumentCard from "@/components/LeaseDocumentCard";
import LogPaymentForm from "@/components/LogPaymentForm";
import PaymentRow from "@/components/PaymentRow";
import { cardClass, pagePanelClass } from "@/lib/ui";

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
      "id, start_date, end_date, rent_amount, security_deposit, status, document_path, unit:units(id, label, property_id, property:properties(id, address)), tenant:tenants(id, name, email, phone)",
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

  let documentUrl: string | null = null;
  if (lease.document_path) {
    const { data: signed } = await supabase.storage
      .from("lease-documents")
      .createSignedUrl(lease.document_path, 3600);
    documentUrl = signed?.signedUrl ?? null;
  }

  // A lease with no end date is month-to-month — nothing to renew.
  const isMonthToMonth = lease.end_date === null;
  const daysUntilEnd = isMonthToMonth
    ? null
    : Math.ceil((new Date(lease.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isNearingRenewal =
    lease.status === "active" && daysUntilEnd !== null && daysUntilEnd <= RENEWAL_WINDOW_DAYS;

  return (
    <div className={`mx-auto w-full max-w-2xl px-6 py-14 ${pagePanelClass}`}>
      <Link
        href={property ? `/properties/${property.id}` : "/dashboard"}
        className="mb-8 inline-block text-sm text-muted hover:text-accent"
      >
        ← {property?.address ?? "Back"}
      </Link>

      <h1 className="mb-1 text-3xl font-semibold tracking-tight text-foreground">{unit?.label}</h1>
      <p className="mb-8 text-sm text-muted">{property?.address}</p>

      {isNearingRenewal && daysUntilEnd !== null && (
        <div className="mb-8 rounded-2xl bg-warning-bg px-4 py-3 text-sm text-warning-fg">
          {daysUntilEnd >= 0
            ? `Lease ends in ${daysUntilEnd} day${daysUntilEnd === 1 ? "" : "s"} — renewal due soon.`
            : `Lease end date has passed by ${Math.abs(daysUntilEnd)} day${Math.abs(daysUntilEnd) === 1 ? "" : "s"}.`}
        </div>
      )}

      <div className={`mb-6 ${cardClass}`}>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Lease terms</h2>
        <dl className="space-y-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Status</dt>
            <dd className="text-foreground">{lease.status}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Start date</dt>
            <dd className="text-foreground">{lease.start_date}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">End date</dt>
            <dd className="text-foreground">
              {isMonthToMonth ? "Month-to-month" : lease.end_date}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Monthly rent</dt>
            <dd>
              <EditLeaseRent leaseId={lease.id} rentAmount={lease.rent_amount} />
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Security deposit</dt>
            <dd className="text-foreground">
              {lease.security_deposit ? `$${lease.security_deposit}` : "–"}
            </dd>
          </div>
        </dl>
      </div>

      {unit && (
        <LeaseDocumentCard
          leaseId={lease.id}
          propertyId={unit.property_id}
          documentPath={lease.document_path}
          documentUrl={documentUrl}
        />
      )}

      {tenant && (
        <div className={`mb-6 ${cardClass}`}>
          <h2 className="mb-3 text-sm font-semibold text-foreground">Tenant</h2>
          <EditTenantForm tenant={tenant} />
        </div>
      )}

      <div className={`mb-6 ${cardClass}`}>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Payment history</h2>
        {payments && payments.length > 0 ? (
          <ul className="space-y-2 text-sm">
            {payments.map((payment) => (
              <PaymentRow key={payment.id} payment={payment} />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">No payments logged yet.</p>
        )}
      </div>

      {lease.status === "active" && (
        <div className="mb-6">
          <LogPaymentForm leaseId={lease.id} rentAmount={lease.rent_amount} />
        </div>
      )}

      {lease.status === "active" && (
        <div className="flex flex-col gap-3 sm:flex-row">
          {!isMonthToMonth && <ConvertToMonthToMonthButton leaseId={lease.id} />}
          <EndLeaseButton leaseId={lease.id} />
        </div>
      )}
    </div>
  );
}
