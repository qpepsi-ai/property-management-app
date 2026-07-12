-- Security hardening: the invite flow (/api/invite) identifies existing
-- accounts by public.users.email, so that column must only ever be
-- written by the auth-signup trigger — never by the user. Otherwise any
-- account holder could set their profile email to an address about to
-- be invited and receive the access grant meant for someone else.
--
-- RLS ("users can update own profile") governs which ROWS a user may
-- update; these column-level grants govern which COLUMNS.

revoke update on table public.users from authenticated, anon;
grant update (name) on table public.users to authenticated;
