"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
    <form onSubmit={handleSubmit} className="space-y-3 rounded border border-gray-200 p-4">
      <h2 className="text-sm font-semibold">Log a payment</h2>
      <div className="flex gap-3">
        <label className="flex-1 text-xs text-gray-500">
          Due date
          <input
            type="date"
            required
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm text-black"
          />
        </label>
        <label className="flex-1 text-xs text-gray-500">
          Paid date
          <input
            type="date"
            value={paidDate}
            onChange={(e) => setPaidDate(e.target.value)}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm text-black"
          />
        </label>
      </div>
      <label className="block text-xs text-gray-500">
        Amount paid
        <input
          type="number"
          required
          min="0"
          step="0.01"
          value={amountPaid}
          onChange={(e) => setAmountPaid(e.target.value)}
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm text-black"
        />
      </label>
      <label className="block text-xs text-gray-500">
        Notes (e.g. partial payment reason)
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm text-black"
        />
      </label>
      <button
        type="submit"
        disabled={status === "saving"}
        className="rounded bg-black px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {status === "saving" ? "Saving…" : "Log payment"}
      </button>
      {status === "error" && <p className="text-sm text-red-600">{errorMessage}</p>}
    </form>
  );
}
