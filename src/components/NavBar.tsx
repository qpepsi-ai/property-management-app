import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import MobileNav from "@/components/MobileNav";

const LINKS = [
  { href: "/dashboard", label: "Properties" },
  { href: "/rent", label: "Rent tracking" },
  { href: "/leases", label: "Tenants & Leases" },
  { href: "/maintenance", label: "Maintenance" },
  { href: "/reports", label: "Reports" },
  { href: "/receipts", label: "Receipts" },
];

export default async function NavBar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: ownedGrant } = await supabase
    .from("property_access")
    .select("id")
    .eq("role", "owner")
    .limit(1)
    .maybeSingle();
  const isOwner = Boolean(ownedGrant);

  const links = isOwner ? [...LINKS, { href: "/access", label: "Access" }] : LINKS;

  const cookieStore = await cookies();
  const initialTheme = cookieStore.get("theme")?.value === "dark" ? "dark" : "light";

  return (
    <MobileNav links={links.slice(1)} userEmail={user.email ?? ""} initialTheme={initialTheme} />
  );
}
