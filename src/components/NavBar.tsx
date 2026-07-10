import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

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

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <Link href="/dashboard" className="text-sm font-semibold text-foreground">
            Property Manager
          </Link>
          <nav className="flex flex-wrap gap-x-5 gap-y-1">
            {links.slice(1).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-muted hover:text-accent"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted">{user.email}</span>
          <form action="/logout" method="post">
            <button type="submit" className="text-xs text-muted hover:text-accent">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
