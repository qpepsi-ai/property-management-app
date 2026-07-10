import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import NewPropertyForm from "@/components/NewPropertyForm";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: properties } = await supabase
    .from("properties")
    .select("id, address, type")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <p className="text-sm text-gray-600">Signed in as {user?.email}</p>
        <form action="/logout" method="post">
          <button
            type="submit"
            className="rounded border border-gray-300 px-3 py-1.5 text-sm"
          >
            Sign out
          </button>
        </form>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Properties</h1>
        <div className="flex gap-4">
          <Link href="/rent" className="text-sm text-blue-600 hover:underline">
            Rent tracking →
          </Link>
          <Link href="/leases" className="text-sm text-blue-600 hover:underline">
            Tenants &amp; Leases →
          </Link>
          <Link href="/maintenance" className="text-sm text-blue-600 hover:underline">
            Maintenance →
          </Link>
          <Link href="/reports" className="text-sm text-blue-600 hover:underline">
            Reports →
          </Link>
          <Link href="/receipts" className="text-sm text-blue-600 hover:underline">
            Receipts →
          </Link>
        </div>
      </div>

      {properties && properties.length > 0 ? (
        <ul className="mb-8 space-y-2">
          {properties.map((property) => (
            <li key={property.id}>
              <Link
                href={`/properties/${property.id}`}
                className="block rounded border border-gray-200 px-4 py-3 text-sm hover:border-gray-400"
              >
                <span className="font-medium">{property.address}</span>{" "}
                <span className="text-gray-500">({property.type})</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-8 text-sm text-gray-500">No properties yet.</p>
      )}

      <NewPropertyForm />
    </div>
  );
}
