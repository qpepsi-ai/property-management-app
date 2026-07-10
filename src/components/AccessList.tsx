"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Badge from "@/components/ui/Badge";

type Grant = {
  id: string;
  role: "owner" | "co-owner" | "accountant";
  user: { id: string; email: string; name: string | null } | null;
};

export default function AccessList({ grants }: { grants: Grant[] }) {
  const router = useRouter();
  const [revokingId, setRevokingId] = useState<string | null>(null);

  async function handleRevoke(grantId: string) {
    if (!window.confirm("Revoke this person's access to this property?")) return;

    setRevokingId(grantId);
    const supabase = createClient();
    const { error } = await supabase.from("property_access").delete().eq("id", grantId);
    setRevokingId(null);

    if (error) {
      window.alert(error.message);
      return;
    }
    router.refresh();
  }

  if (grants.length === 0) {
    return <p className="text-sm text-muted">No one else has access to this property yet.</p>;
  }

  return (
    <ul className="space-y-2">
      {grants.map((grant) => (
        <li key={grant.id} className="flex items-center justify-between text-sm">
          <span className="text-foreground">
            {grant.user?.name ?? grant.user?.email ?? "Unknown user"}
            {grant.user?.name && (
              <span className="text-muted"> · {grant.user.email}</span>
            )}
          </span>
          <span className="flex items-center gap-3">
            <Badge variant={grant.role === "owner" ? "info" : "neutral"}>{grant.role}</Badge>
            {grant.role !== "owner" && (
              <button
                onClick={() => handleRevoke(grant.id)}
                disabled={revokingId === grant.id}
                className="text-xs text-danger-fg hover:underline disabled:opacity-50"
              >
                Revoke
              </button>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}
