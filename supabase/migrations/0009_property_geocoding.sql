-- Latitude/longitude for showing each property on a map. Nullable since
-- geocoding happens asynchronously after a property is created/edited
-- and can fail (address not found, geocoder unavailable).

alter table public.properties
  add column latitude numeric(9, 6),
  add column longitude numeric(9, 6);
