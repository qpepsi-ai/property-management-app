import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AddUnitForm from "@/components/AddUnitForm";
import EditPropertyForm from "@/components/EditPropertyForm";
import UnitRow from "@/components/UnitRow";
import AddExpenseForm from "@/components/AddExpenseForm";
import ExpenseRow from "@/components/ExpenseRow";
import NewMaintenanceRequestForm from "@/components/NewMaintenanceRequestForm";
import MaintenanceRequestRow from "@/components/MaintenanceRequestRow";

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: property } = await supabase
    .from("properties")
    .select("id, address, type, purchase_date")
    .eq("id", id)
    .single();

  if (!property) {
    notFound();
  }

  const { data: units } = await supabase
    .from("units")
    .select("id, label, bedrooms, bathrooms, rent_amount, status")
    .eq("property_id", id)
    .order("label");

  const { data: activeLeases } = await supabase
    .from("leases")
    .select("id, unit_id")
    .eq("status", "active")
    .in("unit_id", units?.map((u) => u.id) ?? []);

  const leaseIdByUnit = new Map(activeLeases?.map((l) => [l.unit_id, l.id]));

  const { data: expenses } = await supabase
    .from("expenses")
    .select("id, date, category, amount, description")
    .eq("property_id", id)
    .order("date", { ascending: false });

  const { data: maintenanceRequests } = await supabase
    .from("maintenance_requests")
    .select("id, unit_id, description, priority, status, date_reported, vendor, cost")
    .in("unit_id", units?.map((u) => u.id) ?? [])
    .order("date_reported", { ascending: false });

  const unitLabelById = new Map(units?.map((u) => [u.id, u.label]));

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <Link href="/" className="mb-6 inline-block text-sm text-gray-500 hover:underline">
        ← All properties
      </Link>

      <EditPropertyForm property={property} />

      <h2 className="mb-3 text-sm font-semibold">Units</h2>
      {units && units.length > 0 ? (
        <ul className="mb-8 space-y-2">
          {units.map((unit) => (
            <UnitRow
              key={unit.id}
              unit={unit}
              propertyId={property.id}
              leaseId={leaseIdByUnit.get(unit.id)}
            />
          ))}
        </ul>
      ) : (
        <p className="mb-8 text-sm text-gray-500">No units yet.</p>
      )}

      <AddUnitForm propertyId={property.id} />

      <h2 className="mt-10 mb-3 text-sm font-semibold">Expenses</h2>
      {expenses && expenses.length > 0 ? (
        <ul className="mb-8 space-y-2">
          {expenses.map((expense) => (
            <ExpenseRow key={expense.id} expense={expense} />
          ))}
        </ul>
      ) : (
        <p className="mb-8 text-sm text-gray-500">No expenses yet.</p>
      )}

      <div id="add-expense">
        <AddExpenseForm propertyId={property.id} />
      </div>

      <h2 className="mt-10 mb-3 text-sm font-semibold">Maintenance</h2>
      {maintenanceRequests && maintenanceRequests.length > 0 ? (
        <ul className="mb-8 space-y-2">
          {maintenanceRequests.map((request) => (
            <MaintenanceRequestRow
              key={request.id}
              request={request}
              unitLabel={unitLabelById.get(request.unit_id)}
            />
          ))}
        </ul>
      ) : (
        <p className="mb-8 text-sm text-gray-500">No maintenance requests yet.</p>
      )}

      {units && units.length > 0 && (
        <NewMaintenanceRequestForm propertyId={property.id} units={units} />
      )}
    </div>
  );
}
