import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buttonClass, cardClass } from "@/lib/ui";

const FEATURES = [
  {
    title: "Properties, units & leases",
    body: "Track every property and unit you own, current and past leases, and vacancy status at a glance.",
  },
  {
    title: "Rent tracking",
    body: "See who's paid this month and who hasn't, log payments against a lease, and catch partial payments.",
  },
  {
    title: "Receipt scanning",
    body: "Photograph a receipt and Claude's vision API extracts the vendor, date, amount, and category for you.",
  },
  {
    title: "Maintenance tracking",
    body: "Log requests by unit with priority and photos, and track how long issues take to resolve.",
  },
  {
    title: "Reporting & export",
    body: "Per-property income, expenses, and net — exportable to CSV for tax time or your accountant.",
  },
  {
    title: "Role-based access",
    body: "Invite a co-owner or accountant with view-only access scoped to exactly the properties they need.",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Add your properties",
    body: "Set up each property and its units — single-family, duplex, or multi-unit.",
  },
  {
    number: "02",
    title: "Track leases & rent",
    body: "Add tenants, create leases, and log rent payments as they come in.",
  },
  {
    number: "03",
    title: "Stay on top of the rest",
    body: "Scan expense receipts, log maintenance requests, and pull reports whenever you need them.",
  },
];

export default async function MarketingHome() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-sm font-semibold text-foreground">Property Manager</span>
          <nav className="flex items-center gap-6">
            <a href="#features" className="text-sm text-muted hover:text-accent">
              Features
            </a>
            <a href="#how-it-works" className="text-sm text-muted hover:text-accent">
              How it works
            </a>
            <Link href="/login" className="text-sm text-accent hover:underline">
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="mb-5 text-5xl font-semibold tracking-tight text-foreground">
          Run your rental portfolio from one place
        </h1>
        <p className="mx-auto mb-10 max-w-xl text-lg text-muted">
          A self-hosted app for tracking properties, leases, rent, expenses, and maintenance —
          built for a small portfolio of rentals, accessible from anywhere.
        </p>
        <Link href="/login" className={buttonClass("primary")}>
          Sign in
        </Link>
      </section>

      <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="mb-10 text-center text-3xl font-semibold tracking-tight text-foreground">
          How it works
        </h2>
        <div className="grid gap-8 sm:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.number}>
              <p className="mb-2 text-sm font-semibold text-accent">{step.number}</p>
              <h3 className="mb-1 font-medium text-foreground">{step.title}</h3>
              <p className="text-sm text-muted">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="mb-10 text-center text-3xl font-semibold tracking-tight text-foreground">
          Features
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title} className={cardClass}>
              <h3 className="mb-1 font-medium text-foreground">{feature.title}</h3>
              <p className="text-sm text-muted">{feature.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border px-6 py-10 text-center text-sm text-muted">
        Property Manager — self-hosted rental portfolio management.
      </footer>
    </div>
  );
}
