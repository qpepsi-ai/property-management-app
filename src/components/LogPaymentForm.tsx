"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { inputClass, labelClass, buttonClass, cardClass } from "@/lib/ui";

function firstOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().slice(0, 10);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function LogPaymentForm({
  leaseId,
  rentAmount,
}: {
  leaseId: string;
  rentAmount: number;
}) {
  const router = useRouter();
  const [dueDate, setDueDate] = useState(firstOfMonth());
  const [paidDate, setPaidDate] = useState(today());
  const [amountPaid, setAmountPaid] = useState(String(rentAmount));
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setErrorMessage("");

    const paid = Number(amountPaid);
    const supabase = createClient();
    const { error } = await supabase.from("payments").insert({
      lease_id: leaseId,
      due_date: dueDate,
      paid_date: paidDate || null,
      amount_paid: paid,
      status: paid >= rentAmount ? "paid" : "partial",
      notes: notes || null,
    });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    setNotes("");
    setStatus("idle");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-3 ${cardClass}`}>
      <h2 className="text-sm font-semibold text-foreground">Log a payment</h2>
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className={`flex-1 ${labelClass}`}>
          Due date
          <input
            type="date"
            required
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className={`mt-1 ${inputClass}`}
          />
        </label>
        <label className={`flex-1 ${labelClass}`}>
          Paid date
          <input
            type="date"
            value={paidDate}
            onChange={(e) => setPaidDate(e.target.value)}
            className={`mt-1 ${inputClass}`}
          />
        </label>
      </div>
      <label className={labelClass}>
        Amount paid
        <input
          type="number"
          required
          min="0"
          step="0.01"
          value={amountPaid}
          onChange={(e) => setAmountPaid(e.target.value)}
          className={`mt-1 ${inputClass}`}
        />
      </label>
      <label className={labelClass}>
        Notes (e.g. partial payment reason)
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={`mt-1 ${inputClass}`}
        />
      </label>
      <button type="submit" disabled={status === "saving"} className={buttonClass("primary")}>
        {status === "saving" ? "Saving…" : "Log payment"}
      </button>
      {status === "error" && <p className="text-sm text-danger-fg">{errorMessage}</p>}
    </form>
  );
}
