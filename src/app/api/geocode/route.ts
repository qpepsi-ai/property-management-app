import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { address } = await request.json();

  if (!address || typeof address !== "string") {
    return NextResponse.json({ error: "Missing address" }, { status: 400 });
  }

  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`;

  let res;
  try {
    res = await fetch(url, {
      headers: {
        // Nominatim's usage policy requires an identifying User-Agent.
        "User-Agent": "property-management-app (self-hosted, personal use)",
      },
    });
  } catch {
    return NextResponse.json({ error: "Geocoding service unreachable" }, { status: 502 });
  }

  if (!res.ok) {
    return NextResponse.json({ error: "Geocoding request failed" }, { status: 502 });
  }

  const results = await res.json();
  const match = results[0];

  if (!match) {
    return NextResponse.json({ error: "Address not found" }, { status: 404 });
  }

  return NextResponse.json({
    latitude: Number(match.lat),
    longitude: Number(match.lon),
  });
}
