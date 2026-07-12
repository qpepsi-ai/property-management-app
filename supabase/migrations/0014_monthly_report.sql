-- Month-by-month income/expense totals across every property the
-- caller can access, for the Reports monthly-trend chart. Same
-- security model as property_financial_summary (0008): SECURITY
-- DEFINER so the accountant role gets aggregate totals without
-- reading leases, and access is enforced via user_property_role().

create function public.monthly_financial_summary(p_year integer default extract(year from current_date)::integer)
returns table (
  month integer,
  income numeric,
  expenses numeric
)
language sql
security definer
stable
set search_path = public
as $$
  select
    m.month::integer,
    coalesce((
      select sum(pay.amount_paid)
      from public.payments pay
      join public.leases l on l.id = pay.lease_id
      join public.units u on u.id = l.unit_id
      where public.user_property_role(u.property_id) is not null
        and extract(year from pay.due_date) = p_year
        and extract(month from pay.due_date) = m.month
    ), 0) as income,
    coalesce((
      select sum(e.amount)
      from public.expenses e
      where public.user_property_role(e.property_id) is not null
        and extract(year from e.date) = p_year
        and extract(month from e.date) = m.month
    ), 0) as expenses
  from generate_series(1, 12) as m(month)
  order by m.month;
$$;

grant execute on function public.monthly_financial_summary(integer) to authenticated;
