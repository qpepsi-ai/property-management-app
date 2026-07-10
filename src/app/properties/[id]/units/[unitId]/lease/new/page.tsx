import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NewLeaseForm from "@/components/NewLeaseForm";
import { pagePanelClass } from "@/lib/ui";

export default async function NewLeasePage({
  params,
}: {
  params: Promise<{ id: string; unitId: string }>;
}) {
  const { id: propertyId, unitId } = await params;
  const supabase = await createClient();

  const { data: unit } = await supabase
    .from("units")
    .select("id, label, rent_amount, property_id")
    .eq("id", unitId)
    .single();

  if (!unit || unit.property_id !== propertyId) {
    notFound();
  }

  const { data: tenants } = await supabase
    .from("tenants")
    .select("id, name")
    .order("name");

  return (
    <div className={`mx-auto w-full max-w-2xl px-6 py-14 ${pagePanelClass}`}>
      <Link
        href={`/properties/${propertyId}`}
        className="mb-8 inline-block text-sm text-muted hover:text-accent"
      >
        ← Back to property
      </Link>

      <h1 className="mb-8 text-3xl font-semibold tracking-tight text-foreground">New lease · {unit.label}</h1>

      <NewLeaseForm
        unitId={unit.id}
        propertyId={propertyId}
        defaultRent={unit.rent_amount}
        existingTenants={tenants ?? []}
      />
    </div>
  );
}
