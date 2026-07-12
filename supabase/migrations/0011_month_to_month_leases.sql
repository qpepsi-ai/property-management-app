-- Month-to-month leases: a lease with no end date is month-to-month.
-- Fixed-term leases keep their end_date; converting a tenant to
-- month-to-month just clears it (same lease, same payment history).

alter table public.leases alter column end_date drop not null;
