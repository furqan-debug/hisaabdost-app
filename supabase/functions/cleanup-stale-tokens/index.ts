/**
 * Cleanup Stale Tokens Edge Function
 * Removes device tokens that have failed multiple times
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("🧹 Starting stale token cleanup...");

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get count of tokens to delete
    const { data: staleTokens, error: countError } = await supabase
      .from("user_device_tokens")
      .select("id, user_id, failed_attempts, platform")
      .gte("failed_attempts", 1);

    if (countError) {
      throw new Error(`Failed to fetch stale tokens: ${countError.message}`);
    }

    const tokenCount = staleTokens?.length || 0;
    console.log(`📊 Found ${tokenCount} stale tokens to delete`);

    if (tokenCount === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No stale tokens found", deleted: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Delete stale tokens
    const { error: deleteError } = await supabase
      .from("user_device_tokens")
      .delete()
      .gte("failed_attempts", 1);

    if (deleteError) {
      throw new Error(`Failed to delete stale tokens: ${deleteError.message}`);
    }

    console.log(`✅ Successfully deleted ${tokenCount} stale tokens`);

    // Group by platform for analytics
    const byPlatform: Record<string, number> = {};
    staleTokens?.forEach(token => {
      byPlatform[token.platform] = (byPlatform[token.platform] || 0) + 1;
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Deleted ${tokenCount} stale tokens`,
        deleted: tokenCount,
        byPlatform
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("❌ Cleanup error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
