import type { SupabaseClient } from "@supabase/supabase-js";

// Best-effort: a property that fails to geocode just won't show on the
// map yet, rather than blocking the save.
export async function geocodeAndSaveProperty(
  supabase: SupabaseClient,
  propertyId: string,
  address: string,
) {
  try {
    const res = await fetch("/api/geocode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    });
    if (!res.ok) return;
    const { latitude, longitude } = await res.json();
    await supabase.from("properties").update({ latitude, longitude }).eq("id", propertyId);
  } catch {
    // ignore — geocoding is a nice-to-have, not required for the save to succeed
  }
}
