import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import NewPropertyForm from "@/components/NewPropertyForm";
import PortfolioMap from "@/components/PortfolioMapLoader";
import { cardClass, pagePanelClass } from "@/lib/ui";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: properties } = await supabase
    .from("properties")
    .select("id, address, type, latitude, longitude")
    .order("created_at", { ascending: false });

  return (
    <div className={`mx-auto w-full max-w-2xl px-6 py-14 ${pagePanelClass}`}>
      <h1 className="mb-8 text-3xl font-semibold tracking-tight text-foreground">Properties</h1>

      {properties && properties.length > 0 && (
        <div className="mb-10">
          <PortfolioMap properties={properties} />
        </div>
      )}

      {properties && properties.length > 0 ? (
        <ul className="mb-10 space-y-3">
          {properties.map((property) => (
            <li key={property.id}>
              <Link
                href={`/properties/${property.id}`}
                className={`block ${cardClass} transition-shadow hover:shadow-md`}
              >
                <span className="font-medium text-foreground">{property.address}</span>{" "}
                <span className="text-muted">({property.type})</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-10 text-sm text-muted">No properties yet.</p>
      )}

      <NewPropertyForm />
    </div>
  );
}
