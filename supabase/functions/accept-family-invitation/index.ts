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
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { invitationId } = await req.json();
    console.log("📨 Accept invitation request:", { invitationId });

    if (!invitationId) {
      return new Response(
        JSON.stringify({ error: "Invitation ID is required" }),
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

    // Find and validate invitation
    const { data: invitation, error: inviteError } = await supabaseClient
      .from("family_invitations")
      .select("*")
      .eq("id", invitationId)
      .eq("invited_user_id", user.id)
      .eq("status", "pending")
      .single();

    console.log("🔍 Invitation lookup result:", { invitation, inviteError });

    if (inviteError || !invitation) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired invitation" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if invitation has expired
    if (new Date(invitation.expires_at) < new Date()) {
      // Update invitation status to expired
      await supabaseClient
        .from("family_invitations")
        .update({ status: "expired" })
        .eq("id", invitation.id);

      return new Response(
        JSON.stringify({ error: "Invitation has expired" }),
        { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is already a member
    const { data: existingMember } = await supabaseClient
      .from("family_members")
      .select("id")
      .eq("family_id", invitation.family_id)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    if (existingMember) {
      return new Response(
        JSON.stringify({ error: "You are already a member of this family" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update user's display name if provided in invitation
    if (invitation.member_name) {
      await supabaseClient
        .from("profiles")
        .update({ display_name: invitation.member_name })
        .eq("id", user.id);
      console.log(`✅ Updated user display name to: ${invitation.member_name}`);
    }

    // Add user to family
    const { error: addMemberError } = await supabaseClient
      .from("family_members")
      .insert({
        family_id: invitation.family_id,
        user_id: user.id,
        role: "member",
        is_active: true,
      });

    if (addMemberError) {
      console.error("Error adding member:", addMemberError);
      return new Response(
        JSON.stringify({ error: "Failed to join family" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update user's active family to the newly joined family
    await supabaseClient
      .from("profiles")
      .update({ active_family_id: invitation.family_id })
      .eq("id", user.id);

    // Update invitation status
    await supabaseClient
      .from("family_invitations")
      .update({ status: "accepted" })
      .eq("id", invitation.id);

    // Log activity
    await supabaseClient.from("activity_logs").insert({
      user_id: user.id,
      action_type: "family_joined",
      action_description: `Joined family: ${invitation.family_name || 'Unknown'}`,
      metadata: { 
        family_id: invitation.family_id,
        invited_by: invitation.invited_by,
      },
    });

    return new Response(
      JSON.stringify({ success: true, familyId: invitation.family_id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in accept-family-invitation:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
