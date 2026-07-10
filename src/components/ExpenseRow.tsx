"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cardClass } from "@/lib/ui";

type Expense = {
  id: string;
  date: string;
  category: string;
  amount: number;
  description: string | null;
};

export default function ExpenseRow({ expense }: { expense: Expense }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleDelete() {
    if (!window.confirm("Delete this expense?")) return;

    setStatus("saving");
    const supabase = createClient();
    const { error } = await supabase.from("expenses").delete().eq("id", expense.id);

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    router.refresh();
  }

  return (
    <li className={`text-sm ${cardClass}`}>
      <div className="flex items-center justify-between">
        <span>
          <span className="font-medium text-foreground">${expense.amount}</span>{" "}
          <span className="text-muted">
            · {expense.category} · {expense.date}
            {expense.description ? ` · ${expense.description}` : ""}
          </span>
        </span>
        <button
          onClick={handleDelete}
          disabled={status === "saving"}
          className="text-xs text-danger-fg hover:underline disabled:opacity-50"
        >
          Delete
        </button>
      </div>
      {status === "error" && <p className="mt-1 text-xs text-danger-fg">{errorMessage}</p>}
    </li>
  );
}
