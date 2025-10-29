
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendResetCodeRequest {
  email: string;
}

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const generateResetCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
};

// Email validation
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return false;
  
  // Block common disposable email domains
  const disposableDomains = ['tempmail.com', 'throwaway.email', 'guerrillamail.com', '10minutemail.com', 'mailinator.com'];
  const domain = email.split('@')[1]?.toLowerCase();
  if (disposableDomains.includes(domain)) return false;
  
  return true;
};

const sendResetEmail = async (email: string, resetCode: string) => {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  
  console.log("=== EMAIL SENDING DEBUG ===");
  console.log("Email to send to:", email);
  console.log("Reset code:", resetCode);
  console.log("Resend API key exists:", resendApiKey ? "YES" : "NO");
  console.log("Resend API key length:", resendApiKey ? resendApiKey.length : 0);
  
  if (!resendApiKey) {
    console.error("❌ RESEND_API_KEY is not configured");
    throw new Error("Email service not configured - missing RESEND_API_KEY");
  }

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Reset Your Password</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <p style="font-size: 16px; margin-bottom: 20px;">Hello,</p>
        
        <p style="font-size: 16px; margin-bottom: 25px;">
          We received a request to reset your password for your HisaabDost account. 
          Use the verification code below in the app to reset your password:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <div style="background: #fff; 
                      border: 2px solid #667eea; 
                      padding: 20px; 
                      border-radius: 8px; 
                      font-size: 32px; 
                      font-weight: bold; 
                      color: #667eea;
                      letter-spacing: 8px;
                      display: inline-block;">
            ${resetCode}
          </div>
        </div>
        
        <div style="border-top: 1px solid #ddd; margin-top: 30px; padding-top: 20px;">
          <p style="font-size: 14px; color: #666; margin-bottom: 10px;">
            <strong>Security Notes:</strong>
          </p>
          <ul style="font-size: 14px; color: #666; padding-left: 20px;">
            <li>This code will expire in 10 minutes for security</li>
            <li>Enter this code in the HisaabDost app to reset your password</li>
            <li>If you didn't request this reset, please ignore this email</li>
            <li>Never share this code with anyone</li>
          </ul>
        </div>
        
        <p style="font-size: 14px; color: #666; text-align: center; margin-top: 30px;">
          Best regards,<br>
          <strong>The HisaabDost Team</strong>
        </p>
      </div>
    </body>
    </html>
  `;

  const emailPayload = {
    from: "HisaabDost <onboarding@resend.dev>", // Using verified Resend domain
    to: [email],
    subject: "Your HisaabDost Password Reset Code",
    html: emailHtml,
  };

  console.log("📧 Preparing to send email with payload:", JSON.stringify(emailPayload, null, 2));

  try {
    console.log("🚀 Making request to Resend API...");
    console.log("Resend API URL: https://api.resend.com/emails");
    
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload),
    });

    console.log("📨 Resend API response status:", response.status);
    console.log("📨 Resend API response headers:", Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log("📨 Resend API response body:", responseText);

    if (!response.ok) {
      console.error("❌ Resend API error:", response.status, responseText);
      throw new Error(`Email service error: ${response.status} - ${responseText}`);
    }

    console.log("✅ Password reset email sent successfully to:", email);
    return JSON.parse(responseText);
  } catch (error) {
    console.error("💥 Failed to send password reset email:", error);
    console.error("Error details:", error instanceof Error ? error.message : 'Unknown error');
    console.error("Error stack:", error instanceof Error ? error.stack : 'No stack available');
    throw error;
  }
};

const handler = async (req: Request): Promise<Response> => {
  console.log("🔥 Password reset handler started");
  console.log("Request method:", req.method);
  console.log("Request URL:", req.url);

  if (req.method === "OPTIONS") {
    console.log("Handling CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.text();
    console.log("📥 Raw request body:", requestBody);
    
    const { email }: SendResetCodeRequest = JSON.parse(requestBody);
    console.log("📧 Password reset request received for email:", email);

    if (!email || !isValidEmail(email)) {
      console.error("❌ Invalid email format");
      // Return generic success for security (don't reveal if email exists)
      return new Response(
        JSON.stringify({ success: true, message: "If the email exists, a reset code has been sent" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check rate limiting - 1 per minute AND max 5 per day
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    console.log("⏰ Checking rate limiting since:", oneMinuteAgo);
    
    const { data: recentCodes, error: rateLimitError } = await supabaseAdmin
      .from("password_reset_codes")
      .select("id")
      .eq("email", email)
      .gte("created_at", oneMinuteAgo);

    if (rateLimitError) {
      console.error("❌ Rate limit check error:", rateLimitError);
    }

    if (recentCodes && recentCodes.length > 0) {
      console.log("🛑 Rate limit hit for email:", email, "recent codes:", recentCodes.length);
      return new Response(
        JSON.stringify({ error: "Please wait a minute before requesting another reset code" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check daily limit (max 5 per day)
    const { data: dailyCodes, error: dailyError } = await supabaseAdmin
      .from("password_reset_codes")
      .select("id")
      .eq("email", email)
      .gte("created_at", oneDayAgo);

    if (dailyError) {
      console.error("❌ Daily limit check error:", dailyError);
    }

    if (dailyCodes && dailyCodes.length >= 5) {
      console.log("🛑 Daily limit hit for email:", email, "total today:", dailyCodes.length);
      return new Response(
        JSON.stringify({ error: "Too many reset attempts. Please try again tomorrow." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user exists using listUsers with pagination
    console.log("👤 Checking if user exists...");
    
    let userExists = false;
    let page = 1;
    const perPage = 1000;
    
    try {
      while (!userExists) {
        const { data: usersData, error: userError } = await supabaseAdmin.auth.admin.listUsers({
          page,
          perPage
        });
        
        console.log(`👤 User lookup page ${page}:`, usersData ? `Got ${usersData.users?.length || 0} users` : "No users data");
        console.log("👤 User lookup error:", userError);
        
        if (userError) {
          console.error("❌ Error checking users:", userError);
          return new Response(
            JSON.stringify({ error: "Failed to verify user" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        if (!usersData || !usersData.users || usersData.users.length === 0) {
          // No more users to check
          break;
        }
        
        // Check if user exists in this batch and has confirmed email
        const user = usersData.users.find(u => u.email === email);
        if (user) {
          // CRITICAL: Only send reset codes to CONFIRMED email addresses
          if (!user.email_confirmed_at) {
            console.log("⚠️ User email not confirmed, skipping reset");
            // Return generic success for security (don't reveal email not confirmed)
            return new Response(
              JSON.stringify({ success: true, message: "If the email exists, a reset code has been sent" }),
              { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          userExists = true;
          console.log("👤 User found in page", page, "with confirmed email");
          break;
        }
        
        // If we got less than perPage users, we've reached the end
        if (usersData.users.length < perPage) {
          break;
        }
        
        page++;
      }
      
      console.log("👤 User exists check result:", userExists ? "true" : "false", "for email:", email);
      
      if (!userExists) {
        // For security, we still send a success response but don't actually send an email
        console.log("🔒 User does not exist, returning success for security (no email sent)");
        return new Response(
          JSON.stringify({ success: true, message: "If the email exists, a reset link has been sent" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } catch (userCheckError) {
      console.error("💥 Error checking user existence:", userCheckError);
      return new Response(
        JSON.stringify({ error: "Failed to verify user" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Invalidate any existing unused codes for this email
    console.log("🗑️ Invalidating old reset codes...");
    const { error: updateError } = await supabaseAdmin
      .from("password_reset_codes")
      .update({ used: true })
      .eq("email", email)
      .eq("used", false);

    if (updateError) {
      console.error("❌ Error invalidating old codes:", updateError);
    }

    // Generate new code
    const code = generateResetCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    console.log("🎫 Generated reset code:", code);
    console.log("⏰ Code expires at:", expiresAt);

    // Store the code
    console.log("💾 Storing reset code in database...");
    const { error: insertError } = await supabaseAdmin
      .from("password_reset_codes")
      .insert({
        email,
        code, // Store in code field
        token: code, // Also store in token field for compatibility
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error("❌ Error storing reset code:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to generate reset code" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("✅ Reset code stored successfully");

    // Send reset email
    console.log("📧 Attempting to send reset email...");
    try {
      await sendResetEmail(email, code);
      console.log("🎉 Password reset process completed successfully for:", email);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Password reset code has been sent to your email"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (emailError) {
      console.error("💥 Email sending failed:", emailError);
      console.error("Email error message:", emailError instanceof Error ? emailError.message : 'Unknown email error');
      
      return new Response(
        JSON.stringify({ error: `Failed to send reset email: ${emailError instanceof Error ? emailError.message : 'Unknown error'}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

  } catch (error) {
    console.error("💥 Error in send-password-reset-code handler:", error);
    console.error("Handler error message:", error instanceof Error ? error.message : 'Unknown error');
    console.error("Handler error stack:", error instanceof Error ? error.stack : 'No stack available');
    
    return new Response(
      JSON.stringify({ error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

console.log("🚀 Password reset edge function initialized");
serve(handler);
