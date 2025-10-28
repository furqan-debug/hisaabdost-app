import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const firebaseServiceAccount = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userId, title, body, data }: NotificationPayload = await req.json();

    console.log("📨 Send push notification request:", { userId, title });

    if (!userId || !title || !body) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: userId, title, body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's device tokens
    let tokensQuery = supabase
      .from("user_device_tokens")
      .select("device_token, platform");
    
    // If userId is "all", fetch all tokens; otherwise filter by user_id
    if (userId !== "all") {
      tokensQuery = tokensQuery.eq("user_id", userId);
    }
    
    const { data: tokens, error: tokensError } = await tokensQuery;

    if (tokensError) {
      console.error("❌ Error fetching push tokens:", tokensError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch push tokens" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!tokens || tokens.length === 0) {
      console.log("⚠️ No push tokens found for user:", userId);
      return new Response(
        JSON.stringify({ success: true, message: "No push tokens registered for user" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results = [];

    // Send notifications via Firebase if configured
    if (firebaseServiceAccount) {
      try {
        const serviceAccount = JSON.parse(firebaseServiceAccount);
        const jwtToken = await generateFirebaseJWT(serviceAccount);
        
        for (const tokenData of tokens) {
          try {
            console.log("📤 Sending FCM to:", tokenData.device_token, "platform:", tokenData.platform);
            
            const fcmResponse = await fetch(
              `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${jwtToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  message: {
                    token: tokenData.device_token,
                    notification: {
                      title: title,
                      body: body,
                    },
                    data: data || {},
                    android: {
                      priority: 'high',
                      notification: {
                        sound: 'default',
                        channel_id: data?.type || 'default',
                      },
                    },
                  },
                }),
              }
            );

            const fcmResult = await fcmResponse.json();

            if (fcmResponse.ok) {
              console.log("✅ FCM sent successfully:", fcmResult);
              results.push({
                token: tokenData.device_token,
                success: true,
                platform: tokenData.platform,
                messageId: fcmResult.name,
              });
            } else {
              console.error("❌ FCM error:", fcmResult);
              results.push({
                token: tokenData.device_token,
                success: false,
                error: fcmResult.error?.message || 'FCM send failed',
                platform: tokenData.platform,
              });
            }
          } catch (error) {
            console.error("❌ Error sending to token:", tokenData.device_token, error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            results.push({
              token: tokenData.device_token,
              success: false,
              error: errorMessage,
              platform: tokenData.platform,
            });
          }
        }
      } catch (parseError) {
        console.error("❌ Error parsing Firebase service account:", parseError);
      }
    } else {
      console.log("⚠️ Firebase service account not configured");
    }

    // Log notification
    await supabase.from("notification_logs").insert({
      user_id: userId !== 'all' ? userId : null,
      title,
      body,
      data: data || {},
      results,
    });

    console.log("✅ Notification processing complete:", results.length, "tokens processed");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Notifications sent",
        results,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Error in send-push-notification:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function generateFirebaseJWT(serviceAccount: any): Promise<string> {
  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: 'https://fcm.googleapis.com/',
    iat: now,
    exp: now + 3600,
  };

  const encoder = new TextEncoder();
  const headerBase64 = btoa(JSON.stringify(header));
  const payloadBase64 = btoa(JSON.stringify(payload));
  const data = `${headerBase64}.${payloadBase64}`;

  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(serviceAccount.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', privateKey, encoder.encode(data));
  const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));

  return `${data}.${signatureBase64}`;
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem.replace(/-----BEGIN PRIVATE KEY-----/, '').replace(/-----END PRIVATE KEY-----/, '').replace(/\s/g, '');
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
