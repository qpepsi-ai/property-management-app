"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { inputClass, labelClass, buttonClass } from "@/lib/ui";

type Lease = {
  id: string;
  status: string;
  start_date: string;
  end_date: string | null;
  rent_amount: number;
  security_deposit: number | null;
};

export default function EditLeaseTerms({ lease }: { lease: Lease }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [startDate, setStartDate] = useState(lease.start_date);
  const [endDate, setEndDate] = useState(lease.end_date ?? "");
  const [rentAmount, setRentAmount] = useState(String(lease.rent_amount));
  const [securityDeposit, setSecurityDeposit] = useState(
    lease.security_deposit === null ? "" : String(lease.security_deposit),
  );
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setErrorMessage("");

    const supabase = createClient();
    const { error } = await supabase
      .from("leases")
      .update({
        start_date: startDate,
        end_date: endDate || null,
        rent_amount: Number(rentAmount),
        security_deposit: securityDeposit ? Number(securityDeposit) : null,
      })
      .eq("id", lease.id);

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    setStatus("idle");
    setEditing(false);
    router.refresh();
  }

  if (!editing) {
    return (
      <div>
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
            <dd className="text-foreground">{lease.end_date ?? "Month-to-month"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Monthly rent</dt>
            <dd className="text-foreground">${lease.rent_amount}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Security deposit</dt>
            <dd className="text-foreground">
              {lease.security_deposit ? `$${lease.security_deposit}` : "–"}
            </dd>
          </div>
        </dl>
        <button
          onClick={() => setEditing(true)}
          className="mt-3 text-xs text-accent hover:underline"
        >
          Edit terms
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-3">
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
          End date (blank for month-to-month)
          <input
            type="date"
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
      <div className="flex gap-3">
        <button type="submit" disabled={status === "saving"} className={buttonClass("primary")}>
          {status === "saving" ? "Saving…" : "Save"}
        </button>
        <button type="button" onClick={() => setEditing(false)} className={buttonClass("secondary")}>
          Cancel
        </button>
      </div>
      {status === "error" && <p className="text-sm text-danger-fg">{errorMessage}</p>}
    </form>
  );
}
