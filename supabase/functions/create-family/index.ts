import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create a Supabase client with the Auth context of the user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify the user is authenticated
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      console.error('User authentication error:', userError);
      throw new Error('Unauthorized');
    }

    console.log('Authenticated user:', user.id);

    // Get the family name from the request body
    const { name } = await req.json();
    if (!name) {
      throw new Error('Family name is required');
    }

    console.log('Creating family with name:', name);

    // Create a Supabase client with SERVICE ROLE to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Create the family using service role
    const { data: family, error: familyError } = await supabaseAdmin
      .from('families')
      .insert({
        name,
        created_by: user.id,
      })
      .select()
      .single();

    if (familyError) {
      console.error('Family creation error:', familyError);
      throw familyError;
    }

    console.log('Family created:', family.id);

    // Add the creator as owner using service role
    const { error: memberError } = await supabaseAdmin
      .from('family_members')
      .insert({
        family_id: family.id,
        user_id: user.id,
        role: 'owner',
      });

    if (memberError) {
      console.error('Member creation error:', memberError);
      // Rollback: delete the family if member creation fails
      await supabaseAdmin.from('families').delete().eq('id', family.id);
      throw memberError;
    }

    console.log('Family owner added successfully');

    return new Response(JSON.stringify({ family }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in create-family function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
