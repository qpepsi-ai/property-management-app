# Property Management App — Project Plan

A reference document summarizing the design decisions made for a self-hosted rental property management app.

## Getting started with Claude Code

Open this project folder in Claude Code (or point it at this file) and start with a prompt like:

> Read property-management-app-plan.md. Let's start with step 1 of the build order in section 7: set up a Next.js project with Tailwind, initialize a Supabase project, and implement the database schema from section 1, including the User and PropertyAccess tables and row-level security rules matching the roles table in section 2. Don't build any UI yet — just get the project scaffolded and the schema migrated.

Once that's working, move on to step 2 (Properties/Units/Tenants/Leases CRUD) and so on down the build order — one step at a time, rather than asking for everything at once. Each of the 11 screens/forms in section 3 has enough detail here to hand to Claude Code as its own follow-up prompt (e.g. "now build the dashboard screen described in section 3, item 1").

## Overview

- **Scale:** Currently 5 properties, expanding to 8 within a year
- **Users:** Owner (full access), co-owner (read-only), accountant (read-only, financials only)
- **Access:** Hosted on a custom domain, accessible from anywhere

---

## 1. Data model

**Core entities:**

- **User** — id, email, name
- **PropertyAccess** — user_id, property_id, role (owner / co-owner / accountant) — controls who can see which properties and what they can do
- **Property** — id, address, type (single-family / duplex / multi-unit), purchase date
- **Unit** — id, property_id, label, bedrooms, bathrooms, rent amount, status — a duplex has two Unit rows under one Property
- **Tenant** — id, name, email, phone
- **Lease** — id, unit_id, tenant_id, start date, end date, rent amount, security deposit, status — links a tenant to a unit for a period of time
- **Payment** — id, lease_id, due date, paid date, amount paid, status — rent tracking, tied to a lease
- **MaintenanceRequest** — id, unit_id, date reported, description, priority, status, cost
- **Expense** — id, property_id, date, category, amount, description — tracked at the property level (not per-unit), since costs like mortgage/insurance/tax apply to the whole property
- **ReceiptScan** — id, expense_id, image_url, raw_extracted_text, confidence — stores the photo and the AI's extracted read separately from the confirmed Expense, so there's always an audit trail back to the original receipt
- **Document** — attaches to leases, properties, or tenants (signed leases, inspection reports, etc.)

**Key relationships:**
- Property → many Units (handles single-family homes and duplexes alike)
- Unit → many Leases (over time)
- Lease → many Payments
- Unit → many Maintenance Requests
- Property → many Expenses
- User ↔ Property, via PropertyAccess (many-to-many, with a role per pairing)

---

## 2. Roles and permissions

| Feature area | Owner | Co-owner | Accountant |
|---|---|---|---|
| Dashboard & financial reports | Full | View | View |
| Property details | Full | View | View (financials only) |
| Tenant info (names, contact) | Full | View | Hidden |
| Leases | Full | View | Hidden |
| Payments / rent tracking | Full edit | View | View |
| Maintenance requests | Full edit | View | Hidden |
| Expenses | Full edit | View | View |
| Export reports (PDF/CSV) | Yes | Yes | Yes |

Access is granted **per property** via the PropertyAccess table, so you can choose which of your properties each accountant or co-owner can see — not an all-or-nothing global setting. Enforced at the database level using Supabase row-level security (RLS), not just hidden in the UI.

---

## 3. Screens designed

1. **Dashboard** — top-level metrics (rent collected, occupancy, open maintenance, upcoming lease renewals), property list with status flags, recent maintenance feed
2. **Property detail** — property-level P&L (rent roll, YTD income/expenses/net), list of units with tenant and lease status per unit, scoped maintenance and expense lists
3. **Rent tracking** — cross-property list of all leases for the current month, due vs. paid amounts, status per tenant
4. **Log payment form** — modal to record a payment against a lease, with amount due auto-filled from the lease
5. **Maintenance tracking** — cross-property list grouped by status (open / resolved), with priority flags and average resolve time
6. **Tenants and leases** — list of all tenants with their unit, lease term, and rent; flags leases nearing renewal; explicitly shows vacant units
7. **Lease detail** — full lease terms, renewal countdown/banner, tenant contact info, payment history for that lease, attached documents

**Forms:**

8. **Log payment** — records a payment against a lease; amount due auto-fills from the lease so you only enter what was actually paid; includes a notes field for partial payments
9. **New lease** — creates a lease for a unit, with an inline "add new tenant" option for vacant units, and a document upload area for the signed lease, inspection report, etc. Creating a lease flips the unit's status from vacant to occupied.
10. **Add expense** — leads with a "scan a receipt" option (photo, taken live or chosen from an existing library/camera roll — not camera-only) that pre-fills date, amount, category, and description via the Claude vision API; manual entry remains available as a fallback. Property is always confirmed manually, since it can't reliably be inferred from a receipt. Date defaults to today but is fully editable, supporting retroactive entry.
11. **New maintenance request** — captures unit, description, priority (low/medium/high as a quick-tap control), date reported, an optional vendor field (filled in once assigned), and photos of the issue itself (separate from expense receipts).

---

## 4. Feature phasing

**Phase 1 (build first):**
1. Auth + roles (Owner / Co-owner / Accountant) + PropertyAccess
2. Core CRUD: Properties, Units, Tenants, Leases
3. Payments + rent tracking
4. Expenses (manual entry, with support for backdating — you can log expenses retroactively back to April, since Expense just has a plain date field)
5. **Receipt-scanning** — photograph a receipt, send it to Claude's vision API to extract vendor/date/amount/category, pre-fill a new Expense, and save the photo as a linked ReceiptScan record. Moved up into phase 1 given the backlog of receipts since April that need entering.
6. Maintenance tracking
7. Reporting/export, with per-property filtering for accountant access

**Phase 2 (later):**
- Anything not listed above — e.g., tenant self-service portal, automated late-rent reminders, deeper analytics

---

## 5. Tech stack

- **Frontend:** Next.js + Tailwind CSS
- **Backend/database:** Supabase (hosted Postgres, built-in auth, row-level security, file storage)
- **File storage:** Supabase storage (lease PDFs, receipt photos, property photos)
- **AI receipt scanning:** Anthropic API (Claude), called from the app when a receipt photo is submitted
- **Hosting:** Vercel (pairs naturally with Next.js, free tier sufficient, push-to-deploy)

This combination minimizes infrastructure you have to manage yourself — auth, database, and file storage all come from Supabase, and deployment is handled by Vercel.

---

## 6. Domain

Recommended registrars for a personal .com domain, prioritizing flat long-term pricing over first-year promos that spike on renewal:

| Registrar | Approx. price/year | Notes |
|---|---|---|
| Porkbun | ~$10.99 | Same price for registration and renewal, free WHOIS privacy, free SSL |
| Cloudflare | ~$10.44 | At-cost pricing, no markup — but requires using Cloudflare's nameservers |
| Namecheap | Under $10 first year, ~$18/year renewal | Free lifetime WHOIS privacy, beginner-friendly |
| NameSilo | ~$11/year flat | Predictable pricing, free WHOIS privacy |

**Recommended:** Porkbun or Cloudflare — both land around $10–11/year with no renewal surprises, and both work cleanly with Vercel.

**Avoid:** GoDaddy — high renewal costs, and as of February 2026 reclassified all customers as "Business Customers," stripping standard consumer protections.

---

## 7. Build order summary

1. Set up Supabase project, database schema, auth, and roles
2. Build Properties/Units/Tenants/Leases CRUD screens
3. Build rent tracking + payment logging
4. Build expense tracking (manual entry first)
5. Add receipt-scanning on top of expenses
6. Build maintenance tracking
7. Build reporting/export with per-property, per-role filtering
8. Register domain, connect to Vercel deployment
9. Invite co-owner and accountant accounts, assign PropertyAccess
