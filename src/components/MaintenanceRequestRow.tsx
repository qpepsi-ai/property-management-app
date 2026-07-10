"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Badge from "@/components/ui/Badge";
import { cardClass } from "@/lib/ui";

type Request = {
  id: string;
  description: string;
  priority: "low" | "medium" | "high";
  status: "open" | "resolved";
  date_reported: string;
  vendor: string | null;
  cost: number | null;
};

const PRIORITY_VARIANT: Record<Request["priority"], "neutral" | "warning" | "danger"> = {
  low: "neutral",
  medium: "warning",
  high: "danger",
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
    <li className={`text-sm ${cardClass}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-foreground">
            {unitLabel && <span className="font-medium">{unitLabel} · </span>}
            {request.description}
          </p>
          <p className="text-xs text-muted">
            reported {request.date_reported}
            {request.vendor ? ` · ${request.vendor}` : ""}
            {request.cost ? ` · $${request.cost}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={PRIORITY_VARIANT[request.priority]}>{request.priority}</Badge>
          <Badge variant={request.status === "resolved" ? "success" : "info"}>
            {request.status}
          </Badge>
        </div>
      </div>
      <div className="mt-2 flex gap-3">
        <button
          onClick={handleToggleResolved}
          disabled={status === "saving"}
          className="text-xs text-accent hover:underline disabled:opacity-50"
        >
          Mark {request.status === "open" ? "resolved" : "open"}
        </button>
        <button
          onClick={handleDelete}
          disabled={status === "saving"}
          className="text-xs text-danger-fg hover:underline disabled:opacity-50"
        >
          Delete
        </button>
      </div>
      {status === "error" && <p className="mt-1 text-xs text-danger-fg">{errorMessage}</p>}
    </li>
  );
}
