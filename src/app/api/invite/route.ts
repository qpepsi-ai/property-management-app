import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// Ownership is granted only at property creation; invites can never
// mint or replace an owner.
const VALID_ROLES = ["co-owner", "accountant"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { email, propertyId, role } = await request.json();
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

  if (!EMAIL_PATTERN.test(normalizedEmail) || !propertyId || !VALID_ROLES.includes(role)) {
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

  // Does this person already have an account? Exact match only — ilike
  // would treat % and _ in the input as wildcards and could bind the
  // grant to the wrong account. (Supabase stores emails lowercased.)
  const { data: existing } = await admin
    .from("users")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();

  let invitedUserId = existing?.id;

  if (invitedUserId) {
    // Never let an invite overwrite an existing owner grant — that
    // would let one owner silently demote another.
    const { data: currentGrant } = await admin
      .from("property_access")
      .select("role")
      .eq("user_id", invitedUserId)
      .eq("property_id", propertyId)
      .maybeSingle();

    if (currentGrant?.role === "owner") {
      return NextResponse.json(
        { error: "That person is an owner of this property; their role can't be changed here." },
        { status: 409 },
      );
    }
  } else {
    const { data: invited, error: inviteError } =
      await admin.auth.admin.inviteUserByEmail(normalizedEmail);
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
