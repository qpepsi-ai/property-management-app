"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { buttonClass, labelClass } from "@/lib/ui";

export default function ReceiptPhotoActions({
  scanId,
  propertyId,
  imagePath,
}: {
  scanId: string;
  propertyId: string;
  imagePath: string;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleReplace(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus("saving");
    setErrorMessage("");

    const supabase = createClient();
    const newPath = `${propertyId}/${crypto.randomUUID()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("receipts")
      .upload(newPath, file);

    if (uploadError) {
      setStatus("error");
      setErrorMessage(uploadError.message);
      return;
    }

    // The old extraction and review verdict were about the old image,
    // so they reset along with it — the receipt needs review again.
    const { error: updateError } = await supabase
      .from("receipt_scans")
      .update({
        image_url: newPath,
        raw_extracted_text: null,
        confidence: null,
        reviewed_at: null,
      })
      .eq("id", scanId);

    if (updateError) {
      setStatus("error");
      setErrorMessage(updateError.message);
      return;
    }

    await supabase.storage.from("receipts").remove([imagePath]);

    if (fileInputRef.current) fileInputRef.current.value = "";
    setStatus("idle");
    router.refresh();
  }

  async function handleRemove() {
    if (
      !window.confirm(
        "Remove this photo? The image is deleted permanently; the expense itself is kept.",
      )
    ) {
      return;
    }

    setStatus("saving");
    setErrorMessage("");

    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("receipt_scans")
      .delete()
      .eq("id", scanId);

    if (deleteError) {
      setStatus("error");
      setErrorMessage(deleteError.message);
      return;
    }

    await supabase.storage.from("receipts").remove([imagePath]);

    router.push("/receipts");
    router.refresh();
  }

  return (
    <div className="mt-3 space-y-3 px-4 pb-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className={`flex-1 ${labelClass}`}>
          Replace photo
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleReplace}
            disabled={status === "saving"}
            className="mt-1 w-full text-sm text-foreground"
          />
        </label>
        <button
          onClick={handleRemove}
          disabled={status === "saving"}
          className={`self-start sm:self-end ${buttonClass("danger")}`}
        >
          Remove photo
        </button>
      </div>
      {status === "saving" && <p className="text-xs text-muted">Saving…</p>}
      {status === "error" && <p className="text-sm text-danger-fg">{errorMessage}</p>}
    </div>
  );
}
