"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function EndLeaseButton({ leaseId }: { leaseId: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleEndLease() {
    if (!window.confirm("End this lease? The unit will be marked vacant again.")) {
      return;
    }

    setStatus("saving");
    const supabase = createClient();
    const { error } = await supabase
      .from("leases")
      .update({ status: "ended" })
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
        onClick={handleEndLease}
        disabled={status === "saving"}
        className="rounded border border-red-300 px-3 py-2 text-sm text-red-600 disabled:opacity-50"
      >
        {status === "saving" ? "Ending…" : "End lease"}
      </button>
      {status === "error" && <p className="mt-2 text-sm text-red-600">{errorMessage}</p>}
    </div>
  );
}
