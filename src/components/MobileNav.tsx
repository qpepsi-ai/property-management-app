"use client";

import { useState } from "react";
import Link from "next/link";

type NavLink = { href: string; label: string };

export default function MobileNav({
  links,
  userEmail,
}: {
  links: NavLink[];
  userEmail: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-sm font-semibold text-foreground">
            Property Manager
          </Link>
          <nav className="hidden flex-wrap gap-x-5 gap-y-1 sm:flex">
            {links.map((link) => (
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

        <div className="hidden items-center gap-3 sm:flex">
          <span className="text-xs text-muted">{userEmail}</span>
          <form action="/logout" method="post">
            <button type="submit" className="text-xs text-muted hover:text-accent">
              Sign out
            </button>
          </form>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="flex h-8 w-8 flex-col items-center justify-center gap-1.5 sm:hidden"
        >
          <span
            className={`h-0.5 w-5 bg-foreground transition-transform ${open ? "translate-y-2 rotate-45" : ""}`}
          />
          <span className={`h-0.5 w-5 bg-foreground transition-opacity ${open ? "opacity-0" : ""}`} />
          <span
            className={`h-0.5 w-5 bg-foreground transition-transform ${open ? "-translate-y-2 -rotate-45" : ""}`}
          />
        </button>
      </div>

      {open && (
        <nav className="border-t border-border px-6 py-4 sm:hidden">
          <ul className="space-y-3">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block text-sm text-foreground hover:text-accent"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
            <span className="text-xs text-muted">{userEmail}</span>
            <form action="/logout" method="post">
              <button type="submit" className="text-xs text-muted hover:text-accent">
                Sign out
              </button>
            </form>
          </div>
        </nav>
      )}
    </header>
  );
}
