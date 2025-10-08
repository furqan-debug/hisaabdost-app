import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Client for auth verification
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Admin client for database operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { familyId, memberName, email } = await req.json();
    console.log("📨 Invite member request:", { familyId, memberName, email });

    if (!familyId || !memberName || !email) {
      console.error("❌ Missing required fields:", { familyId, memberName, email });
      return new Response(
        JSON.stringify({ error: "Family ID, member name, and email are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error("❌ User authentication failed:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("✅ User authenticated:", user.id);

    // Check if user has permission to invite (owner or admin)
    console.log("🔐 Checking permissions for user:", user.id, "in family:", familyId);
    const { data: membership, error: membershipError } = await supabaseClient
      .from("family_members")
      .select("role")
      .eq("family_id", familyId)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    if (membershipError) {
      console.error("❌ Membership query error:", membershipError);
    }
    
    if (!membership) {
      console.error("❌ User is not a member of this family");
    }
    
    if (membership && membership.role !== "owner" && membership.role !== "admin") {
      console.error("❌ User role insufficient:", membership.role);
    }

    if (membershipError || !membership || (membership.role !== "owner" && membership.role !== "admin")) {
      return new Response(
        JSON.stringify({ error: "You don't have permission to invite members" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("✅ Permission check passed. User role:", membership.role);

    // Find user by email using auth.admin.listUsers with page size limit
    console.log("🔍 Looking up user by email:", email);
    let userToAdd = null;
    let page = 1;
    const perPage = 100;
    
    // Search through pages (max 10 pages to prevent infinite loops)
    while (!userToAdd && page <= 10) {
      console.log(`📄 Searching page ${page}...`);
      const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage,
      });
      
      if (listError) {
        console.error("❌ Error listing users:", listError);
        return new Response(
          JSON.stringify({ error: "Failed to verify email" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      userToAdd = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
      
      if (!userToAdd && users.length < perPage) {
        // We've reached the last page
        break;
      }
      
      page++;
    }

    if (!userToAdd) {
      console.error("❌ User not found:", email);
      return new Response(
        JSON.stringify({ error: "This email is not registered on Hisaab Dost" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("✅ User found:", userToAdd.id);

    // Get inviter's profile information
    const { data: inviterProfile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, display_name")
      .eq("id", user.id)
      .single();

    const inviterName = inviterProfile?.display_name || inviterProfile?.full_name || "Someone";

    // Get family information
    const { data: familyData } = await supabaseAdmin
      .from("families")
      .select("name")
      .eq("id", familyId)
      .single();

    const familyName = familyData?.name || "a family";

    // Check if user is already a member of this family
    const { data: existingMember } = await supabaseAdmin
      .from("family_members")
      .select("id, is_active")
      .eq("family_id", familyId)
      .eq("user_id", userToAdd.id)
      .single();

    if (existingMember) {
      if (existingMember.is_active) {
        return new Response(
          JSON.stringify({ error: "This user is already a member of the family" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Create invitation instead of adding directly
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    const { data: invitation, error: inviteError } = await supabaseAdmin
      .from("family_invitations")
      .insert({
        family_id: familyId,
        email: email,
        member_name: memberName,
        invited_by: user.id,
        invited_user_id: userToAdd.id,
        inviter_name: inviterName,
        family_name: familyName,
        token: token,
        status: "pending",
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (inviteError) {
      console.error("Error creating invitation:", inviteError);
      return new Response(
        JSON.stringify({ error: "Failed to send invitation" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Invitation created successfully:", invitation);

    // Send push notification to invited user
    try {
      await supabaseAdmin.functions.invoke("send-push-notification", {
        body: {
          userId: userToAdd.id,
          title: "Family Invitation",
          body: `${inviterName} invited you to join ${familyName}`,
          data: {
            type: "family_invitation",
            invitationId: invitation.id,
            familyId: familyId,
          },
        },
      });
      console.log("Push notification sent successfully");
    } catch (notifError) {
      console.error("Failed to send push notification:", notifError);
      // Don't fail the invitation if notification fails
    }

    return new Response(
      JSON.stringify({
        message: "Invitation sent successfully",
        invitation,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in invite-family-member:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
