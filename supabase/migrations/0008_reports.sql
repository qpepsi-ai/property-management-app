-- Reporting: a per-property YTD income/expense/net summary, callable by
-- any role (owner/co-owner/accountant), per the roles table's "Export
-- reports: Yes" row for all three roles.
--
-- This is SECURITY DEFINER so it can aggregate across leases/units/
-- payments internally even for the accountant role, which is otherwise
-- blocked from reading leases directly (roles table: "Leases: Hidden").
-- Only aggregate totals are returned — no tenant or lease identifying
-- data — which is how "Payments: View" and "Leases: Hidden" coexist
-- for the accountant role.

create function public.property_financial_summary(p_year integer default extract(year from current_date)::integer)
returns table (
  property_id uuid,
  address text,
  ytd_income numeric,
  ytd_expenses numeric,
  net numeric
)
language sql
security definer
stable
set search_path = public
as $$
  select
    p.id as property_id,
    p.address,
    coalesce(income.total, 0) as ytd_income,
    coalesce(expense.total, 0) as ytd_expenses,
    coalesce(income.total, 0) - coalesce(expense.total, 0) as net
  from public.properties p
  left join lateral (
    select sum(pay.amount_paid) as total
    from public.payments pay
    join public.leases l on l.id = pay.lease_id
    join public.units u on u.id = l.unit_id
    where u.property_id = p.id
      and extract(year from pay.due_date) = p_year
  ) income on true
  left join lateral (
    select sum(e.amount) as total
    from public.expenses e
    where e.property_id = p.id
      and extract(year from e.date) = p_year
  ) expense on true
  where public.user_property_role(p.id) is not null
  order by p.address;
$$;

grant execute on function public.property_financial_summary(integer) to authenticated;
