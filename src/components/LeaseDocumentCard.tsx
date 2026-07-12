"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { buttonClass, cardClass, labelClass, linkClass } from "@/lib/ui";

export default function LeaseDocumentCard({
  leaseId,
  propertyId,
  documentPath,
  documentUrl,
}: {
  leaseId: string;
  propertyId: string;
  documentPath: string | null;
  documentUrl: string | null;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus("saving");
    setErrorMessage("");

    const supabase = createClient();
    const path = `${propertyId}/${leaseId}-${crypto.randomUUID()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("lease-documents")
      .upload(path, file);

    if (uploadError) {
      setStatus("error");
      setErrorMessage(uploadError.message);
      return;
    }

    const { error: updateError } = await supabase
      .from("leases")
      .update({ document_path: path })
      .eq("id", leaseId);

    if (updateError) {
      setStatus("error");
      setErrorMessage(updateError.message);
      return;
    }

    // Replacing an existing document: the old file is no longer
    // referenced, so clean it up (best-effort).
    if (documentPath) {
      await supabase.storage.from("lease-documents").remove([documentPath]);
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
    setStatus("idle");
    router.refresh();
  }

  async function handleRemove() {
    if (!window.confirm("Remove the lease document? The file is deleted permanently.")) return;

    setStatus("saving");
    setErrorMessage("");

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("leases")
      .update({ document_path: null })
      .eq("id", leaseId);

    if (updateError) {
      setStatus("error");
      setErrorMessage(updateError.message);
      return;
    }

    if (documentPath) {
      await supabase.storage.from("lease-documents").remove([documentPath]);
    }

    setStatus("idle");
    router.refresh();
  }

  return (
    <div className={`mb-6 ${cardClass}`}>
      <h2 className="mb-3 text-sm font-semibold text-foreground">Lease document</h2>

      {documentUrl ? (
        <div className="space-y-3 text-sm">
          <a href={documentUrl} target="_blank" rel="noreferrer" className={linkClass}>
            View signed lease
          </a>
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className={labelClass}>
              Replace document
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,image/*"
                onChange={handleFileSelected}
                disabled={status === "saving"}
                className="mt-1 w-full text-sm text-foreground"
              />
            </label>
            <button
              onClick={handleRemove}
              disabled={status === "saving"}
              className={`self-start sm:self-end ${buttonClass("danger")}`}
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <label className={labelClass}>
          Upload the signed lease (PDF or photo)
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,image/*"
            onChange={handleFileSelected}
            disabled={status === "saving"}
            className="mt-1 w-full text-sm text-foreground"
          />
        </label>
      )}

      {status === "saving" && <p className="mt-2 text-xs text-muted">Saving…</p>}
      {status === "error" && <p className="mt-2 text-sm text-danger-fg">{errorMessage}</p>}
    </div>
  );
}
