/**
 * Send Push Notification Edge Function
 * 
 * Supports multiple request formats:
 * - Single user: { userId: "uuid", title: "...", body: "...", data?: {} }
 * - Multiple users: { userIds: ["uuid1", "uuid2"], title: "...", body: "...", data?: {} }
 * - Broadcast to all: { sendToAll: true, title: "...", body: "...", data?: {} }
 * 
 * Features:
 * - Input validation with clear error messages
 * - Firebase Cloud Messaging (FCM) integration
 * - Per-token success/failure tracking
 * - Failed attempt tracking for token cleanup
 * - Comprehensive logging
 * - Notification history logging
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Firebase configuration interface
interface FirebaseServiceAccount {
  project_id: string;
  private_key: string;
  client_email: string;
}

// Request payload interface
interface NotificationRequest {
  userId?: string;
  userIds?: string[];
  sendToAll?: boolean;
  title: string;
  body: string;
  data?: Record<string, string>;
}

// Token record from database
interface DeviceToken {
  id: string;
  user_id: string;
  device_token: string;
  platform: string;
  failed_attempts: number;
}

// Result for each token send attempt
interface SendResult {
  token: string;
  userId: string;
  success: boolean;
  error?: string;
}

/**
 * Validates the incoming request payload
 * Returns error message if invalid, null if valid
 */
function validateRequest(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') {
    return "Request body must be a valid JSON object";
  }

  const req = payload as NotificationRequest;

  // Validate required fields
  if (!req.title || typeof req.title !== 'string' || req.title.trim() === '') {
    return "Missing or invalid 'title' field - must be a non-empty string";
  }

  if (!req.body || typeof req.body !== 'string' || req.body.trim() === '') {
    return "Missing or invalid 'body' field - must be a non-empty string";
  }

  // Validate recipient specification (at least one must be provided)
  const hasUserId = req.userId && typeof req.userId === 'string';
  const hasUserIds = Array.isArray(req.userIds) && req.userIds.length > 0;
  const hasSendToAll = req.sendToAll === true;

  if (!hasUserId && !hasUserIds && !hasSendToAll) {
    return "Must specify one of: 'userId' (string), 'userIds' (array), or 'sendToAll' (true)";
  }

  // Validate data field if provided
  if (req.data !== undefined && (typeof req.data !== 'object' || Array.isArray(req.data))) {
    return "'data' field must be an object with string values";
  }

  return null;
}

/**
 * Generates a Firebase OAuth2 access token using service account credentials
 */
async function getFirebaseAccessToken(serviceAccount: FirebaseServiceAccount): Promise<string> {
  console.log("🔑 Generating Firebase access token...");
  
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 3600; // Token valid for 1 hour

  // Create JWT header and claims
  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: exp,
  };

  // Base64URL encode helper
  const base64url = (data: string): string => {
    return btoa(data).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedClaims = base64url(JSON.stringify(claims));
  const signatureInput = `${encodedHeader}.${encodedClaims}`;

  // Import private key and sign
  const pemContents = serviceAccount.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");

  const binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(signatureInput)
  );

  const encodedSignature = base64url(String.fromCharCode(...new Uint8Array(signature)));
  const jwt = `${signatureInput}.${encodedSignature}`;

  // Exchange JWT for access token
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    console.error("❌ Firebase OAuth error:", errorText);
    throw new Error(`Firebase OAuth failed: ${tokenResponse.status} - ${errorText}`);
  }

  const tokenData = await tokenResponse.json();
  console.log("✅ Firebase access token obtained successfully");
  return tokenData.access_token;
}

/**
 * Sends a notification to a single FCM token
 */
async function sendToToken(
  token: string,
  userId: string,
  title: string,
  body: string,
  data: Record<string, string>,
  accessToken: string,
  projectId: string
): Promise<SendResult> {
  const fcmUrl = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

  const message = {
    message: {
      token: token,
      notification: { title, body },
      data: data,
      android: {
        priority: "high",
        notification: { sound: "default", channel_id: "default" },
      },
      apns: {
        payload: {
          aps: { sound: "default", badge: 1 },
        },
      },
    },
  };

  try {
    const response = await fetch(fcmUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    if (response.ok) {
      return { token, userId, success: true };
    }

    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData?.error?.message || `HTTP ${response.status}`;
    
    // Check for unregistered/invalid token errors
    const isInvalidToken = errorMessage.includes("UNREGISTERED") || 
                           errorMessage.includes("INVALID_ARGUMENT") ||
                           response.status === 404;

    return { 
      token, 
      userId, 
      success: false, 
      error: isInvalidToken ? "INVALID_TOKEN" : errorMessage 
    };
  } catch (error) {
    return { 
      token, 
      userId, 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

/**
 * Main handler function
 */
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("\n========================================");
  console.log("📨 Push Notification Request Received");
  console.log("========================================");

  try {
    // Parse and validate request
    const payload = await req.json().catch(() => null);
    console.log("📋 Request payload:", JSON.stringify(payload, null, 2));

    const validationError = validateRequest(payload);
    if (validationError) {
      console.error("❌ Validation failed:", validationError);
      return new Response(
        JSON.stringify({ success: false, error: validationError }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const request = payload as NotificationRequest;
    const { title, body, data = {}, userId, userIds, sendToAll } = request;

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch device tokens based on request type
    let tokens: DeviceToken[] = [];

    if (sendToAll) {
      console.log("📢 Broadcast mode: Fetching ALL device tokens...");
      const { data: allTokens, error } = await supabase
        .from("user_device_tokens")
        .select("id, user_id, device_token, platform, failed_attempts")
        .lt("failed_attempts", 5); // Skip tokens that have failed too many times

      if (error) {
        console.error("❌ Failed to fetch tokens:", error);
        throw new Error(`Database error: ${error.message}`);
      }

      tokens = allTokens || [];
      console.log(`📱 Found ${tokens.length} device tokens for broadcast`);

    } else if (userIds && userIds.length > 0) {
      console.log(`👥 Multi-user mode: Fetching tokens for ${userIds.length} users...`);
      const { data: userTokens, error } = await supabase
        .from("user_device_tokens")
        .select("id, user_id, device_token, platform, failed_attempts")
        .in("user_id", userIds)
        .lt("failed_attempts", 5);

      if (error) {
        console.error("❌ Failed to fetch tokens:", error);
        throw new Error(`Database error: ${error.message}`);
      }

      tokens = userTokens || [];
      console.log(`📱 Found ${tokens.length} device tokens for ${userIds.length} users`);

    } else if (userId) {
      console.log(`👤 Single user mode: Fetching tokens for user ${userId}...`);
      const { data: userTokens, error } = await supabase
        .from("user_device_tokens")
        .select("id, user_id, device_token, platform, failed_attempts")
        .eq("user_id", userId)
        .lt("failed_attempts", 5);

      if (error) {
        console.error("❌ Failed to fetch tokens:", error);
        throw new Error(`Database error: ${error.message}`);
      }

      tokens = userTokens || [];
      console.log(`📱 Found ${tokens.length} device tokens for user`);
    }

    // Check if we have any tokens to send to
    if (tokens.length === 0) {
      console.log("⚠️ No valid device tokens found");
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No device tokens found for specified recipients",
          sent: 0,
          failed: 0
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Firebase credentials
    const firebaseServiceAccountJson = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");
    if (!firebaseServiceAccountJson) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT secret is not configured");
    }

    let serviceAccount: FirebaseServiceAccount;
    try {
      serviceAccount = JSON.parse(firebaseServiceAccountJson);
      if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
        throw new Error("Invalid service account structure");
      }
    } catch (parseError) {
      console.error("❌ Failed to parse Firebase service account:", parseError);
      throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT JSON format");
    }

    // Get Firebase access token
    const accessToken = await getFirebaseAccessToken(serviceAccount);

    // Send notifications to all tokens in parallel
    console.log(`🚀 Sending notifications to ${tokens.length} devices...`);

    const sendPromises = tokens.map((token) =>
      sendToToken(
        token.device_token,
        token.user_id,
        title,
        body,
        data,
        accessToken,
        serviceAccount.project_id
      )
    );

    const results = await Promise.allSettled(sendPromises);

    // Process results
    const successResults: SendResult[] = [];
    const failedResults: SendResult[] = [];
    const tokensToUpdate: { id: string; increment: boolean }[] = [];

    results.forEach((result, index) => {
      const token = tokens[index];
      
      if (result.status === "fulfilled") {
        const sendResult = result.value;
        if (sendResult.success) {
          successResults.push(sendResult);
          // Reset failed attempts on success
          if (token.failed_attempts > 0) {
            tokensToUpdate.push({ id: token.id, increment: false });
          }
        } else {
          failedResults.push(sendResult);
          // Increment failed attempts
          tokensToUpdate.push({ id: token.id, increment: true });
        }
      } else {
        failedResults.push({
          token: token.device_token,
          userId: token.user_id,
          success: false,
          error: result.reason?.message || "Promise rejected",
        });
        tokensToUpdate.push({ id: token.id, increment: true });
      }
    });

    // Update failed_attempts for tokens
    if (tokensToUpdate.length > 0) {
      console.log(`📊 Updating ${tokensToUpdate.length} token failure counts...`);
      
      for (const update of tokensToUpdate) {
        if (update.increment) {
          await supabase
            .from("user_device_tokens")
            .update({ 
              failed_attempts: tokens.find(t => t.id === update.id)!.failed_attempts + 1,
              last_failure_at: new Date().toISOString()
            })
            .eq("id", update.id);
        } else {
          await supabase
            .from("user_device_tokens")
            .update({ failed_attempts: 0 })
            .eq("id", update.id);
        }
      }
    }

    // Log notification to history
    const uniqueUserIds = [...new Set(tokens.map(t => t.user_id))];
    console.log(`📝 Logging notification for ${uniqueUserIds.length} unique users...`);

    await supabase.from("notification_logs").insert({
      user_id: userId || (sendToAll ? null : userIds?.[0]),
      title,
      body,
      data: { 
        ...data, 
        sendToAll: sendToAll ? "true" : "false",
        recipientCount: uniqueUserIds.length.toString()
      },
      results: {
        sent: successResults.length,
        failed: failedResults.length,
        failures: failedResults.slice(0, 10).map(f => ({ userId: f.userId, error: f.error }))
      }
    });

    // Summary
    console.log("\n========================================");
    console.log("📊 NOTIFICATION SUMMARY");
    console.log("========================================");
    console.log(`✅ Sent successfully: ${successResults.length}`);
    console.log(`❌ Failed: ${failedResults.length}`);
    console.log(`👥 Unique users: ${uniqueUserIds.length}`);
    
    if (failedResults.length > 0) {
      console.log("\n❌ Failed tokens:");
      failedResults.slice(0, 5).forEach((f) => {
        console.log(`   - User ${f.userId}: ${f.error}`);
      });
      if (failedResults.length > 5) {
        console.log(`   ... and ${failedResults.length - 5} more`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Notification sent to ${successResults.length} devices`,
        sent: successResults.length,
        failed: failedResults.length,
        uniqueUsers: uniqueUserIds.length,
        errors: failedResults.length > 0 
          ? failedResults.slice(0, 10).map(f => ({ userId: f.userId, error: f.error }))
          : undefined
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("❌ FATAL ERROR:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error occurred" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
