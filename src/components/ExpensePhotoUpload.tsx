"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ExpensePhotoUpload({
  expenseId,
  propertyId,
}: {
  expenseId: string;
  propertyId: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus("saving");
    setErrorMessage("");

    const supabase = createClient();
    const path = `${propertyId}/${crypto.randomUUID()}-${file.name}`;

    const { error: uploadError } = await supabase.storage.from("receipts").upload(path, file);

    if (uploadError) {
      setStatus("error");
      setErrorMessage(uploadError.message);
      return;
    }

    // No AI extraction here — the expense details were entered by hand,
    // so the receipt starts as needs-review until verified against the photo.
    const { error: insertError } = await supabase.from("receipt_scans").insert({
      expense_id: expenseId,
      image_url: path,
      raw_extracted_text: null,
      confidence: null,
    });

    if (insertError) {
      setStatus("error");
      setErrorMessage(insertError.message);
      return;
    }

    router.refresh();
  }

  return (
    <div className="text-right">
      <label className="cursor-pointer text-xs text-accent hover:underline">
        {status === "saving" ? "Uploading…" : "Upload photo"}
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelected}
          disabled={status === "saving"}
          className="hidden"
        />
      </label>
      {status === "error" && <p className="mt-1 text-xs text-danger-fg">{errorMessage}</p>}
    </div>
  );
}
