"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { inputClass, buttonClass, cardClass } from "@/lib/ui";

type Candidate = {
  id: string;
  date: string;
  category: string;
  amount: number;
  description: string | null;
};

export default function OrphanReceiptCard({
  path,
  signedUrl,
  candidates,
}: {
  path: string;
  signedUrl: string | null;
  candidates: Candidate[];
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(candidates[0]?.id ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleAttach() {
    if (!selectedId) return;
    setStatus("saving");
    setErrorMessage("");

    const supabase = createClient();
    const { error } = await supabase.from("receipt_scans").insert({
      expense_id: selectedId,
      image_url: path,
      raw_extracted_text: null,
      confidence: null,
    });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }
    router.refresh();
  }

  async function handleDiscard() {
    if (!window.confirm("Permanently delete this photo? This can't be undone.")) return;

    setStatus("saving");
    const supabase = createClient();
    const { error } = await supabase.storage.from("receipts").remove([path]);

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className={`flex gap-4 ${cardClass}`}>
      <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-neutral-bg">
        {signedUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={signedUrl} alt="" className="h-full w-full object-cover" />
        )}
      </div>
      <div className="flex-1 space-y-2">
        {candidates.length > 0 ? (
          <>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className={inputClass}
            >
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.date} · {c.category} · ${c.amount}
                  {c.description ? ` · ${c.description}` : ""}
                </option>
              ))}
            </select>
            <div className="flex gap-3">
              <button
                onClick={handleAttach}
                disabled={status === "saving"}
                className={buttonClass("primary")}
              >
                {status === "saving" ? "Attaching…" : "Attach to expense"}
              </button>
              <button
                onClick={handleDiscard}
                disabled={status === "saving"}
                className={`${buttonClass("ghost")} text-danger-fg`}
              >
                Discard photo
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-muted">
              No unmatched expenses on this property to attach it to.
            </p>
            <button
              onClick={handleDiscard}
              disabled={status === "saving"}
              className={`${buttonClass("ghost")} text-danger-fg`}
            >
              Discard photo
            </button>
          </>
        )}
        {status === "error" && <p className="text-xs text-danger-fg">{errorMessage}</p>}
      </div>
    </div>
  );
}
