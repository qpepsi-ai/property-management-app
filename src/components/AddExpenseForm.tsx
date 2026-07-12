"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { EXPENSE_CATEGORIES as CATEGORIES } from "@/lib/expense-categories";
import { inputClass, labelClass, buttonClass, cardClass } from "@/lib/ui";

type PropertyOption = { id: string; address: string };

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

// Distribute a dollar total across n parts in whole cents, first parts
// getting the extra cent, so the parts always sum back to the total.
function evenSplit(total: number, n: number): number[] {
  const cents = Math.round(total * 100);
  const base = Math.floor(cents / n);
  const remainder = cents - base * n;
  return Array.from({ length: n }, (_, i) => (base + (i < remainder ? 1 : 0)) / 100);
}

export default function AddExpenseForm({
  propertyId,
  otherProperties = [],
}: {
  propertyId: string;
  otherProperties?: PropertyOption[];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [date, setDate] = useState(today());
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const [splitEnabled, setSplitEnabled] = useState(false);
  const [splitPropertyIds, setSplitPropertyIds] = useState<string[]>([]);
  const [splitAmounts, setSplitAmounts] = useState<Record<string, string>>({});

  const [scanState, setScanState] = useState<"idle" | "scanning" | "scanned" | "error">("idle");
  const [scanError, setScanError] = useState("");
  const [confidence, setConfidence] = useState<string | null>(null);
  const [rawExtractedText, setRawExtractedText] = useState<string | null>(null);
  const [receiptPath, setReceiptPath] = useState<string | null>(null);

  // The current property always participates in a split.
  const selectedIds = [propertyId, ...splitPropertyIds];
  const splitActive = splitEnabled && splitPropertyIds.length > 0;

  function redistribute(total: string, ids: string[]) {
    const value = Number(total);
    if (!Number.isFinite(value) || value <= 0 || ids.length < 2) {
      setSplitAmounts({});
      return;
    }
    const parts = evenSplit(value, ids.length);
    setSplitAmounts(Object.fromEntries(ids.map((id, i) => [id, parts[i].toFixed(2)])));
  }

  function handleAmountChange(value: string) {
    setAmount(value);
    if (splitActive) redistribute(value, selectedIds);
  }

  function handleToggleSplitProperty(id: string, checked: boolean) {
    const next = checked ? [...splitPropertyIds, id] : splitPropertyIds.filter((p) => p !== id);
    setSplitPropertyIds(next);
    redistribute(amount, [propertyId, ...next]);
  }

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
      if (extracted.amount) handleAmountChange(String(extracted.amount));
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

    let rows: { property_id: string; amount: number }[];
    if (splitActive) {
      const parts = selectedIds.map((id) => ({ property_id: id, amount: Number(splitAmounts[id]) }));
      if (parts.some((p) => !Number.isFinite(p.amount) || p.amount <= 0)) {
        setStatus("error");
        setErrorMessage("Every property in the split needs an amount above zero.");
        return;
      }
      const sum = parts.reduce((acc, p) => acc + p.amount, 0);
      if (Math.abs(sum - Number(amount)) > 0.005) {
        setStatus("error");
        setErrorMessage(
          `The split amounts add up to $${sum.toFixed(2)}, but the total is $${Number(amount).toFixed(2)}.`,
        );
        return;
      }
      rows = parts;
    } else {
      rows = [{ property_id: propertyId, amount: Number(amount) }];
    }

    const { data: inserted, error } = await supabase
      .from("expenses")
      .insert(rows.map((r) => ({ ...r, date, category, description: description || null })))
      .select("id, property_id");

    if (error || !inserted || inserted.length === 0) {
      setStatus("error");
      setErrorMessage(error?.message ?? "Something went wrong.");
      return;
    }

    if (receiptPath) {
      // Each property's copy of the receipt lives in that property's own
      // storage folder, since viewing rights are checked per folder.
      const filename = receiptPath.split("/").slice(1).join("/");
      await Promise.all(
        inserted.map(async (expense) => {
          let imagePath = receiptPath;
          if (expense.property_id !== propertyId) {
            const copyPath = `${expense.property_id}/${filename}`;
            const { error: copyError } = await supabase.storage
              .from("receipts")
              .copy(receiptPath, copyPath);
            if (!copyError) imagePath = copyPath;
          }
          await supabase.from("receipt_scans").insert({
            expense_id: expense.id,
            image_url: imagePath,
            raw_extracted_text: rawExtractedText,
            confidence,
          });
        }),
      );
    }

    setAmount("");
    setDescription("");
    setSplitEnabled(false);
    setSplitPropertyIds([]);
    setSplitAmounts({});
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
        {splitActive ? "Total amount" : "Amount"}
        <input
          type="number"
          required
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => handleAmountChange(e.target.value)}
          className={`mt-1 ${inputClass}`}
        />
      </label>

      {otherProperties.length > 0 && (
        <div className="space-y-2">
          <label className={`flex items-center gap-2 ${labelClass}`}>
            <input
              type="checkbox"
              checked={splitEnabled}
              onChange={(e) => {
                setSplitEnabled(e.target.checked);
                if (!e.target.checked) {
                  setSplitPropertyIds([]);
                  setSplitAmounts({});
                } else {
                  redistribute(amount, selectedIds);
                }
              }}
            />
            Split across multiple properties
          </label>

          {splitEnabled && (
            <div className="space-y-2 rounded-xl border border-border p-3">
              <p className="text-xs text-muted">
                Pick the other properties this expense covers. One expense is recorded per
                property, and the amounts must add up to the total.
              </p>
              {otherProperties.map((p) => (
                <label key={p.id} className={`flex items-center gap-2 ${labelClass}`}>
                  <input
                    type="checkbox"
                    checked={splitPropertyIds.includes(p.id)}
                    onChange={(e) => handleToggleSplitProperty(p.id, e.target.checked)}
                  />
                  {p.address}
                </label>
              ))}

              {splitActive && (
                <div className="space-y-2 pt-1">
                  {selectedIds.map((id) => {
                    const label =
                      id === propertyId
                        ? "This property"
                        : otherProperties.find((p) => p.id === id)?.address;
                    return (
                      <label key={id} className={`flex items-center gap-2 ${labelClass}`}>
                        <span className="flex-1">{label}</span>
                        <input
                          type="number"
                          required
                          min="0.01"
                          step="0.01"
                          value={splitAmounts[id] ?? ""}
                          onChange={(e) =>
                            setSplitAmounts((prev) => ({ ...prev, [id]: e.target.value }))
                          }
                          className={`w-32 ${inputClass}`}
                        />
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

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
        {status === "saving" ? "Saving…" : splitActive ? "Add split expense" : "Add expense"}
      </button>
      {status === "error" && <p className="text-sm text-danger-fg">{errorMessage}</p>}
    </form>
  );
}
