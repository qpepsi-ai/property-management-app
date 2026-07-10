import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

const VALID_ROLES = ["owner", "co-owner", "accountant"];

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { email, propertyId, role } = await request.json();

  if (!email || !propertyId || !VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
  }

  // Only an owner of this property can grant access to it.
  const { data: requesterRole } = await supabase.rpc("user_property_role", {
    p_property_id: propertyId,
  });
  if (requesterRole !== "owner") {
    return NextResponse.json({ error: "Only the property owner can invite" }, { status: 403 });
  }

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Does this person already have an account?
  const { data: existing } = await admin
    .from("users")
    .select("id")
    .ilike("email", email)
    .maybeSingle();

  let invitedUserId = existing?.id;

  if (!invitedUserId) {
    const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email);
    if (inviteError || !invited.user) {
      return NextResponse.json(
        { error: inviteError?.message ?? "Could not invite user" },
        { status: 502 },
      );
    }
    invitedUserId = invited.user.id;
  }

  const { error: grantError } = await admin
    .from("property_access")
    .upsert(
      { user_id: invitedUserId, property_id: propertyId, role },
      { onConflict: "user_id,property_id" },
    );

  if (grantError) {
    return NextResponse.json({ error: grantError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, alreadyHadAccount: Boolean(existing) });
}
