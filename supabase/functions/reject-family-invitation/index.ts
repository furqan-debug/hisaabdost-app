import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization")!;

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Extract user id from verified JWT (Supabase verifies before invocation)
    const token = authHeader?.split(" ")[1] ?? "";
    let userId: string | null = null;
    try {
      const payload = JSON.parse(atob(token.split(".")[1] || ""));
      userId = payload?.sub || null;
    } catch (_) {}

    if (!userId) {
      console.error("❌ Missing or invalid JWT token in reject-family-invitation");
      return new Response(
        JSON.stringify({ error: "Unauthorized: invalid or missing token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { invitationId } = await req.json();

    if (!invitationId) {
      return new Response(
        JSON.stringify({ error: "Invitation ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the invitation
    const { data: invitation, error: invitationError } = await supabase
      .from("family_invitations")
      .select("*")
      .eq("id", invitationId)
      .eq("invited_user_id", userId)
      .eq("status", "pending")
      .single();

    if (invitationError || !invitation) {
      console.error("Invitation not found:", invitationError);
      return new Response(
        JSON.stringify({ error: "Invitation not found or already processed" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if invitation has expired
    if (new Date(invitation.expires_at) < new Date()) {
      await supabase
        .from("family_invitations")
        .update({ status: "expired" })
        .eq("id", invitationId);

      return new Response(
        JSON.stringify({ error: "This invitation has expired" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update invitation status to rejected
    const { error: updateError } = await supabase
      .from("family_invitations")
      .update({ status: "rejected" })
      .eq("id", invitationId);

    if (updateError) {
      console.error("Error rejecting invitation:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to reject invitation" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log the activity
    await supabase
      .from("activity_logs")
      .insert({
        user_id: userId,
        action_type: "family_invitation_rejected",
        action_description: `Rejected invitation to join ${invitation.family_name || 'a family'}`,
        metadata: {
          family_id: invitation.family_id,
          invited_by: invitation.invited_by,
        },
      });

    console.log("Invitation rejected successfully");

    return new Response(
      JSON.stringify({ message: "Invitation rejected successfully" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in reject-family-invitation:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
