import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AccessList from "@/components/AccessList";
import InviteAccessForm from "@/components/InviteAccessForm";
import { cardClass, pagePanelClass } from "@/lib/ui";

export default async function AccessPage() {
  const supabase = await createClient();

  const { data: owned } = await supabase
    .from("property_access")
    .select("property:properties(id, address)")
    .eq("role", "owner");

  const ownedProperties = (owned ?? [])
    .map((o) => (Array.isArray(o.property) ? o.property[0] : o.property))
    .filter((p): p is { id: string; address: string } => Boolean(p));

  const grantsByProperty = new Map<
    string,
    { id: string; role: "owner" | "co-owner" | "accountant"; user: { id: string; email: string; name: string | null } | null }[]
  >();

  if (ownedProperties.length > 0) {
    const { data: allGrants } = await supabase
      .from("property_access")
      .select("id, role, property_id, user:users(id, email, name)")
      .in(
        "property_id",
        ownedProperties.map((p) => p.id),
      );

    for (const grant of allGrants ?? []) {
      const user = Array.isArray(grant.user) ? grant.user[0] : grant.user;
      const list = grantsByProperty.get(grant.property_id) ?? [];
      list.push({ id: grant.id, role: grant.role, user });
      grantsByProperty.set(grant.property_id, list);
    }
  }

  return (
    <div className={`mx-auto w-full max-w-3xl px-6 py-14 ${pagePanelClass}`}>
      <h1 className="mb-8 text-3xl font-semibold tracking-tight text-foreground">Access</h1>

      {ownedProperties.length === 0 ? (
        <p className="text-sm text-muted">
          You don&apos;t own any properties yet. Access is granted per property, so add a
          property first.
        </p>
      ) : (
        <div className="space-y-10">
          {ownedProperties.map((property) => (
            <div key={property.id}>
              <Link
                href={`/properties/${property.id}`}
                className="mb-3 inline-block text-lg font-semibold text-foreground hover:text-accent"
              >
                {property.address}
              </Link>
              <div className={`mb-4 ${cardClass}`}>
                <AccessList grants={grantsByProperty.get(property.id) ?? []} />
              </div>
              <InviteAccessForm propertyId={property.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
