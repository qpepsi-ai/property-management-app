"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { EXPENSE_CATEGORIES as CATEGORIES } from "@/lib/expense-categories";
import { inputClass, labelClass, buttonClass, cardClass } from "@/lib/ui";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function readFileAsBase64(file: File): Promise<{ base64: string; mediaType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve({ base64, mediaType: file.type });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function AddExpenseForm({ propertyId }: { propertyId: string }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [date, setDate] = useState(today());
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const [scanState, setScanState] = useState<"idle" | "scanning" | "scanned" | "error">("idle");
  const [scanError, setScanError] = useState("");
  const [confidence, setConfidence] = useState<string | null>(null);
  const [rawExtractedText, setRawExtractedText] = useState<string | null>(null);
  const [receiptPath, setReceiptPath] = useState<string | null>(null);

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanState("scanning");
    setScanError("");

    const supabase = createClient();
    const path = `${propertyId}/${crypto.randomUUID()}-${file.name}`;
    let uploaded = false;

    try {
      const [{ base64, mediaType }, uploadResult] = await Promise.all([
        readFileAsBase64(file),
        supabase.storage.from("receipts").upload(path, file),
      ]);

      if (uploadResult.error) throw uploadResult.error;

      // The photo is saved from here on regardless of whether the scan
      // below succeeds, so it's never orphaned in storage with no way
      // to find it again from the app.
      uploaded = true;
      setReceiptPath(path);

      const res = await fetch("/api/scan-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mediaType }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Scan failed");

      const { extracted, rawText } = data;
      if (extracted.date) setDate(extracted.date);
      if (extracted.amount) setAmount(String(extracted.amount));
      if (extracted.category && CATEGORIES.includes(extracted.category)) {
        setCategory(extracted.category);
      }
      if (extracted.vendor) setDescription(extracted.vendor);
      setConfidence(extracted.confidence ?? null);
      setRawExtractedText(rawText);
      setScanState("scanned");
    } catch (err) {
      setScanState("error");
      setScanError(
        uploaded
          ? "Couldn't read this receipt automatically — fill in the details below manually. The photo is still saved with this expense."
          : (err instanceof Error ? err.message : "Something went wrong."),
      );
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setErrorMessage("");

    const supabase = createClient();
    const { data: expense, error } = await supabase
      .from("expenses")
      .insert({
        property_id: propertyId,
        date,
        category,
        amount: Number(amount),
        description: description || null,
      })
      .select("id")
      .single();

    if (error || !expense) {
      setStatus("error");
      setErrorMessage(error?.message ?? "Something went wrong.");
      return;
    }

    if (receiptPath) {
      await supabase.from("receipt_scans").insert({
        expense_id: expense.id,
        image_url: receiptPath,
        raw_extracted_text: rawExtractedText,
        confidence,
      });
    }

    setAmount("");
    setDescription("");
    setScanState("idle");
    setConfidence(null);
    setRawExtractedText(null);
    setReceiptPath(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setStatus("idle");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-3 ${cardClass}`}>
      <h2 className="text-sm font-semibold text-foreground">Add an expense</h2>

      <label className={labelClass}>
        Scan a receipt (optional)
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelected}
          className="mt-1 w-full text-sm text-foreground"
        />
      </label>
      {scanState === "scanning" && <p className="text-xs text-muted">Scanning receipt…</p>}
      {scanState === "scanned" && (
        <p className="text-xs text-success-fg">
          Scanned — fields pre-filled below (confidence: {confidence ?? "unknown"}). Review and
          adjust as needed.
        </p>
      )}
      {scanState === "error" && <p className="text-xs text-danger-fg">{scanError}</p>}

      <div className="flex flex-col gap-3 sm:flex-row">
        <label className={`flex-1 ${labelClass}`}>
          Date
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={`mt-1 ${inputClass}`}
          />
        </label>
        <label className={`flex-1 ${labelClass}`}>
          Category
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={`mt-1 ${inputClass}`}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className={labelClass}>
        Amount
        <input
          type="number"
          required
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className={`mt-1 ${inputClass}`}
        />
      </label>
      <label className={labelClass}>
        Description
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={`mt-1 ${inputClass}`}
        />
      </label>
      <button type="submit" disabled={status === "saving"} className={buttonClass("primary")}>
        {status === "saving" ? "Saving…" : "Add expense"}
      </button>
      {status === "error" && <p className="text-sm text-danger-fg">{errorMessage}</p>}
    </form>
  );
}
