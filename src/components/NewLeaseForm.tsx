"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { inputClass, labelClass, buttonClass, cardClass } from "@/lib/ui";

type Tenant = { id: string; name: string };

export default function NewLeaseForm({
  unitId,
  propertyId,
  defaultRent,
  existingTenants,
}: {
  unitId: string;
  propertyId: string;
  defaultRent: number | null;
  existingTenants: Tenant[];
}) {
  const router = useRouter();
  const [tenantMode, setTenantMode] = useState<"existing" | "new">(
    existingTenants.length > 0 ? "existing" : "new",
  );
  const [tenantId, setTenantId] = useState(existingTenants[0]?.id ?? "");
  const [tenantName, setTenantName] = useState("");
  const [tenantEmail, setTenantEmail] = useState("");
  const [tenantPhone, setTenantPhone] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [rentAmount, setRentAmount] = useState(
    defaultRent ? String(defaultRent) : "",
  );
  const [securityDeposit, setSecurityDeposit] = useState("");

  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setErrorMessage("");

    const supabase = createClient();
    let resolvedTenantId = tenantId;

    if (tenantMode === "new") {
      const { data: newTenant, error: tenantError } = await supabase
        .from("tenants")
        .insert({ name: tenantName, email: tenantEmail || null, phone: tenantPhone || null })
        .select("id")
        .single();

      if (tenantError || !newTenant) {
        setStatus("error");
        setErrorMessage(tenantError?.message ?? "Could not create tenant.");
        return;
      }
      resolvedTenantId = newTenant.id;
    }

    const { error: leaseError } = await supabase.from("leases").insert({
      unit_id: unitId,
      tenant_id: resolvedTenantId,
      start_date: startDate,
      end_date: endDate,
      rent_amount: Number(rentAmount),
      security_deposit: securityDeposit ? Number(securityDeposit) : null,
      status: "active",
    });

    if (leaseError) {
      setStatus("error");
      setErrorMessage(leaseError.message);
      return;
    }

    router.push(`/properties/${propertyId}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className={cardClass}>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Tenant</h2>

        {existingTenants.length > 0 && (
          <div className="mb-3 flex gap-4 text-sm text-foreground">
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                checked={tenantMode === "existing"}
                onChange={() => setTenantMode("existing")}
              />
              Existing tenant
            </label>
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                checked={tenantMode === "new"}
                onChange={() => setTenantMode("new")}
              />
              New tenant
            </label>
          </div>
        )}

        {tenantMode === "existing" ? (
          <select
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            className={inputClass}
          >
            {existingTenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        ) : (
          <div className="space-y-3">
            <input
              type="text"
              required
              placeholder="Tenant name"
              value={tenantName}
              onChange={(e) => setTenantName(e.target.value)}
              className={inputClass}
            />
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="email"
                placeholder="Email"
                value={tenantEmail}
                onChange={(e) => setTenantEmail(e.target.value)}
                className={`flex-1 ${inputClass}`}
              />
              <input
                type="tel"
                placeholder="Phone"
                value={tenantPhone}
                onChange={(e) => setTenantPhone(e.target.value)}
                className={`flex-1 ${inputClass}`}
              />
            </div>
          </div>
        )}
      </div>

      <div className={cardClass}>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Lease terms</h2>
        <div className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className={`flex-1 ${labelClass}`}>
              Start date
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`mt-1 ${inputClass}`}
              />
            </label>
            <label className={`flex-1 ${labelClass}`}>
              End date
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={`mt-1 ${inputClass}`}
              />
            </label>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className={`flex-1 ${labelClass}`}>
              Monthly rent
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={rentAmount}
                onChange={(e) => setRentAmount(e.target.value)}
                className={`mt-1 ${inputClass}`}
              />
            </label>
            <label className={`flex-1 ${labelClass}`}>
              Security deposit
              <input
                type="number"
                min="0"
                step="0.01"
                value={securityDeposit}
                onChange={(e) => setSecurityDeposit(e.target.value)}
                className={`mt-1 ${inputClass}`}
              />
            </label>
          </div>
        </div>
      </div>

      <button type="submit" disabled={status === "saving"} className={buttonClass("primary")}>
        {status === "saving" ? "Saving…" : "Create lease"}
      </button>
      {status === "error" && (
        <p className="text-sm text-danger-fg">{errorMessage}</p>
      )}
    </form>
  );
}
