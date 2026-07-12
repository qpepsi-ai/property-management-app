"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { inputClass, buttonClass } from "@/lib/ui";
import Badge from "@/components/ui/Badge";

type Payment = {
  id: string;
  due_date: string;
  paid_date: string | null;
  amount_paid: number;
  status: "paid" | "partial";
  notes: string | null;
};

export default function PaymentRow({ payment }: { payment: Payment }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [dueDate, setDueDate] = useState(payment.due_date);
  const [paidDate, setPaidDate] = useState(payment.paid_date ?? "");
  const [amountPaid, setAmountPaid] = useState(String(payment.amount_paid));
  const [paymentStatus, setPaymentStatus] = useState<"paid" | "partial">(payment.status);
  const [notes, setNotes] = useState(payment.notes ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setErrorMessage("");

    const supabase = createClient();
    const { error } = await supabase
      .from("payments")
      .update({
        due_date: dueDate,
        paid_date: paidDate || null,
        amount_paid: Number(amountPaid),
        status: paymentStatus,
        notes: notes || null,
      })
      .eq("id", payment.id);

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    setStatus("idle");
    setEditing(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!window.confirm("Delete this payment record?")) return;

    setStatus("saving");
    const supabase = createClient();
    const { error } = await supabase.from("payments").delete().eq("id", payment.id);

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    router.refresh();
  }

  if (editing) {
    return (
      <li>
        <form onSubmit={handleSave} className="space-y-2 rounded-xl border border-border p-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="flex-1 text-xs text-muted">
              Due date
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={`mt-1 ${inputClass}`}
              />
            </label>
            <label className="flex-1 text-xs text-muted">
              Paid date
              <input
                type="date"
                value={paidDate}
                onChange={(e) => setPaidDate(e.target.value)}
                className={`mt-1 ${inputClass}`}
              />
            </label>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="flex-1 text-xs text-muted">
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
            <label className="flex-1 text-xs text-muted">
              Status
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as "paid" | "partial")}
                className={`mt-1 ${inputClass}`}
              >
                <option value="paid">paid</option>
                <option value="partial">partial</option>
              </select>
            </label>
          </div>
          <label className="block text-xs text-muted">
            Notes
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`mt-1 ${inputClass}`}
            />
          </label>
          <div className="flex gap-3">
            <button type="submit" disabled={status === "saving"} className={buttonClass("primary")}>
              {status === "saving" ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className={buttonClass("secondary")}
            >
              Cancel
            </button>
          </div>
          {status === "error" && <p className="text-sm text-danger-fg">{errorMessage}</p>}
        </form>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-3">
      <span className="min-w-0 truncate text-foreground">
        {payment.due_date} · ${Number(payment.amount_paid).toFixed(2)}
        {payment.paid_date ? ` · paid ${payment.paid_date}` : ""}
        {payment.notes ? ` · ${payment.notes}` : ""}
      </span>
      <span className="flex shrink-0 items-center gap-3">
        <Badge variant={payment.status === "paid" ? "success" : "warning"}>{payment.status}</Badge>
        <button onClick={() => setEditing(true)} className="text-xs text-accent hover:underline">
          Edit
        </button>
        <button
          onClick={handleDelete}
          disabled={status === "saving"}
          className="text-xs text-danger-fg hover:underline disabled:opacity-50"
        >
          Delete
        </button>
      </span>
    </li>
  );
}
