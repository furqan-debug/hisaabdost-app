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
        console.log("🔐 Starting FCM OAuth flow...");
        const serviceAccount = JSON.parse(firebaseServiceAccount);
        
        // Build JWT and exchange for OAuth access token
        const jwt = await buildServiceAccountJWT(serviceAccount);
        const accessToken = await exchangeForAccessToken(jwt);
        console.log("✅ OAuth access token obtained, token length:", accessToken.length);
        
        for (const tokenData of tokens) {
          try {
            const tokenPreview = tokenData.device_token.substring(0, 20) + "...";
            console.log(`📤 Sending FCM to token: ${tokenPreview}, platform: ${tokenData.platform}`);
            
            const fcmResponse = await fetch(
              `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
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
            console.log(`📊 FCM response status: ${fcmResponse.status}`, fcmResult);

            if (fcmResponse.ok) {
              console.log(`✅ FCM sent successfully to ${tokenPreview}`);
              results.push({
                token: tokenData.device_token,
                success: true,
                platform: tokenData.platform,
                messageId: fcmResult.name,
              });
            } else {
              console.error(`❌ FCM error for ${tokenPreview}:`, fcmResult);
              results.push({
                token: tokenData.device_token,
                success: false,
                error: fcmResult.error?.message || 'FCM send failed',
                platform: tokenData.platform,
              });
            }
          } catch (error) {
            console.error("❌ Error sending to token:", error);
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
        console.error("❌ Error in Firebase OAuth flow:", parseError);
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

async function buildServiceAccountJWT(serviceAccount: any): Promise<string> {
  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
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

async function exchangeForAccessToken(jwt: string): Promise<string> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OAuth token exchange failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.access_token;
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
