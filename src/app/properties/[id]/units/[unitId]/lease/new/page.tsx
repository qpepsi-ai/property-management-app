import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NewLeaseForm from "@/components/NewLeaseForm";

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
    <div className="mx-auto max-w-xl px-4 py-10">
      <Link
        href={`/properties/${propertyId}`}
        className="mb-6 inline-block text-sm text-gray-500 hover:underline"
      >
        ← Back to property
      </Link>

      <h1 className="mb-6 text-lg font-semibold">New lease · {unit.label}</h1>

      <NewLeaseForm
        unitId={unit.id}
        propertyId={propertyId}
        defaultRent={unit.rent_amount}
        existingTenants={tenants ?? []}
      />
    </div>
  );
}
