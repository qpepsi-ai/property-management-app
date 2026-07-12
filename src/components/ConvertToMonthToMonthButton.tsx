"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { buttonClass } from "@/lib/ui";

export default function ConvertToMonthToMonthButton({ leaseId }: { leaseId: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleConvert() {
    if (
      !window.confirm(
        "Convert this lease to month-to-month? The end date is removed; everything else stays the same.",
      )
    ) {
      return;
    }

    setStatus("saving");
    const supabase = createClient();
    const { error } = await supabase
      .from("leases")
      .update({ end_date: null })
      .eq("id", leaseId);

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    router.refresh();
  }

  return (
    <div>
      <button
        onClick={handleConvert}
        disabled={status === "saving"}
        className={buttonClass("secondary")}
      >
        {status === "saving" ? "Converting…" : "Convert to month-to-month"}
      </button>
      {status === "error" && <p className="mt-2 text-sm text-danger-fg">{errorMessage}</p>}
    </div>
  );
}
