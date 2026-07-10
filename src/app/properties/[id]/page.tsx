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
import { pagePanelClass } from "@/lib/ui";

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
    <div className={`mx-auto w-full max-w-2xl px-6 py-14 ${pagePanelClass}`}>
      <Link href="/dashboard" className="mb-8 inline-block text-sm text-muted hover:text-accent">
        ← All properties
      </Link>

      <EditPropertyForm property={property} />

      <h2 className="mb-4 text-xl font-semibold text-foreground">Units</h2>
      {units && units.length > 0 ? (
        <ul className="mb-10 space-y-3">
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
        <p className="mb-10 text-sm text-muted">No units yet.</p>
      )}

      <AddUnitForm propertyId={property.id} />

      <h2 className="mt-14 mb-4 text-xl font-semibold text-foreground">Expenses</h2>
      {expenses && expenses.length > 0 ? (
        <details className="mb-10 rounded-2xl border border-border p-4">
          <summary className="cursor-pointer text-sm text-foreground marker:text-accent">
            <span className="font-medium">${expenses[0].amount}</span>{" "}
            <span className="text-muted">
              · {expenses[0].category} · {expenses[0].date}
              {expenses[0].description ? ` · ${expenses[0].description}` : ""}
            </span>
            {expenses.length > 1 && (
              <span className="ml-2 text-accent">+{expenses.length - 1} more</span>
            )}
          </summary>
          <ul className="mt-4 space-y-3">
            {expenses.map((expense) => (
              <ExpenseRow key={expense.id} expense={expense} />
            ))}
          </ul>
        </details>
      ) : (
        <p className="mb-10 text-sm text-muted">No expenses yet.</p>
      )}

      <div id="add-expense">
        <AddExpenseForm propertyId={property.id} />
      </div>

      <h2 className="mt-14 mb-4 text-xl font-semibold text-foreground">Maintenance</h2>
      {maintenanceRequests && maintenanceRequests.length > 0 ? (
        <details className="mb-10 rounded-2xl border border-border p-4">
          <summary className="cursor-pointer text-sm text-foreground marker:text-accent">
            <span className="font-medium">
              {unitLabelById.get(maintenanceRequests[0].unit_id)}
            </span>{" "}
            <span className="text-muted">
              · {maintenanceRequests[0].description} · {maintenanceRequests[0].status}
            </span>
            {maintenanceRequests.length > 1 && (
              <span className="ml-2 text-accent">+{maintenanceRequests.length - 1} more</span>
            )}
          </summary>
          <ul className="mt-4 space-y-3">
            {maintenanceRequests.map((request) => (
              <MaintenanceRequestRow
                key={request.id}
                request={request}
                unitLabel={unitLabelById.get(request.unit_id)}
              />
            ))}
          </ul>
        </details>
      ) : (
        <p className="mb-10 text-sm text-muted">No maintenance requests yet.</p>
      )}

      {units && units.length > 0 && (
        <NewMaintenanceRequestForm propertyId={property.id} units={units} />
      )}
    </div>
  );
}
