-- Ending a lease (status -> 'ended') flips its unit back to vacant,
-- mirroring the vacant -> occupied flip on lease creation from 0002.

create function public.handle_lease_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'ended' and old.status <> 'ended' then
    update public.units set status = 'vacant' where id = new.unit_id;
  end if;
  return new;
end;
$$;

create trigger on_lease_update
  after update on public.leases
  for each row execute function public.handle_lease_update();
