"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Request = {
  id: string;
  description: string;
  priority: "low" | "medium" | "high";
  status: "open" | "resolved";
  date_reported: string;
  vendor: string | null;
  cost: number | null;
};

const PRIORITY_CLASS: Record<Request["priority"], string> = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-red-100 text-red-700",
};

export default function MaintenanceRequestRow({
  request,
  unitLabel,
}: {
  request: Request;
  unitLabel?: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleToggleResolved() {
    setStatus("saving");
    const supabase = createClient();
    const { error } = await supabase
      .from("maintenance_requests")
      .update({ status: request.status === "open" ? "resolved" : "open" })
      .eq("id", request.id);

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    router.refresh();
  }

  async function handleDelete() {
    if (!window.confirm("Delete this maintenance request?")) return;

    setStatus("saving");
    const supabase = createClient();
    const { error } = await supabase.from("maintenance_requests").delete().eq("id", request.id);

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    router.refresh();
  }

  return (
    <li className="rounded border border-gray-200 px-4 py-3 text-sm">
      <div className="flex items-start justify-between">
        <div>
          <p>
            {unitLabel && <span className="font-medium">{unitLabel} · </span>}
            {request.description}
          </p>
          <p className="text-xs text-gray-500">
            reported {request.date_reported}
            {request.vendor ? ` · ${request.vendor}` : ""}
            {request.cost ? ` · $${request.cost}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`rounded-full px-2 py-0.5 text-xs ${PRIORITY_CLASS[request.priority]}`}>
            {request.priority}
          </span>
          <span
            className={
              request.status === "resolved"
                ? "rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700"
                : "rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700"
            }
          >
            {request.status}
          </span>
        </div>
      </div>
      <div className="mt-2 flex gap-3">
        <button
          onClick={handleToggleResolved}
          disabled={status === "saving"}
          className="text-xs text-blue-600 hover:underline disabled:opacity-50"
        >
          Mark {request.status === "open" ? "resolved" : "open"}
        </button>
        <button
          onClick={handleDelete}
          disabled={status === "saving"}
          className="text-xs text-red-600 hover:underline disabled:opacity-50"
        >
          Delete
        </button>
      </div>
      {status === "error" && <p className="mt-1 text-xs text-red-600">{errorMessage}</p>}
    </li>
  );
}
