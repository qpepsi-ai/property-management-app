"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { buttonClass } from "@/lib/ui";

export default function MarkReviewedButton({ scanId }: { scanId: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleMarkReviewed() {
    setStatus("saving");
    setErrorMessage("");

    const supabase = createClient();
    const { error } = await supabase
      .from("receipt_scans")
      .update({ reviewed_at: new Date().toISOString() })
      .eq("id", scanId);

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
        onClick={handleMarkReviewed}
        disabled={status === "saving"}
        className={buttonClass("secondary")}
      >
        {status === "saving" ? "Saving…" : "Mark as reviewed"}
      </button>
      {status === "error" && <p className="mt-2 text-sm text-danger-fg">{errorMessage}</p>}
    </div>
  );
}
