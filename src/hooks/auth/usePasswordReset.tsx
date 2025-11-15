import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const usePasswordReset = () => {
  const sendPasswordResetCode = async (email: string) => {
    try {
      console.log("Sending password reset code to:", email);
      
      const { data, error } = await supabase.functions.invoke('send-password-reset-code', {
        body: { email }
      });
      
      console.log("Password reset response:", { data, error });
      
      if (error) {
        console.error("Password reset function error:", error);
        if (error.message?.includes('wait a minute') || error.message?.includes('rate limit')) {
          toast.warning("Too many requests. Please wait a minute before trying again.");
        } else if (error.message?.includes('Email service')) {
          toast.error("Email service is temporarily unavailable. Please try again later.");
        } else {
          toast.error(error.message || "Error sending password reset code");
        }
        throw error;
      } else if (data?.success === false || data?.error) {
        console.error("Password reset data error:", data.error);
        const errorMsg = data.error || "Failed to send password reset code";
        if (errorMsg.includes('wait a minute') || errorMsg.includes('rate limit')) {
          toast.warning("Too many requests. Please wait a minute before trying again.");
        } else if (errorMsg.includes('Email service')) {
          toast.error("Email service is temporarily unavailable. Please try again later.");
        } else {
          toast.error(errorMsg);
        }
        throw new Error(errorMsg);
      } else if (data?.success) {
        console.log("Password reset email sent successfully");
        toast.success("Password reset code sent! Please check your email.");
      } else {
        console.error("Unexpected response format:", data);
        toast.error("Unexpected response from server");
        throw new Error("Unexpected response from server");
      }
    } catch (error: any) {
      console.error("Error sending password reset link:", error);
      if (!error.message?.includes('Too many requests') && !error.message?.includes('Email service')) {
        toast.error(error.message || "Error sending password reset link");
      }
      throw error;
    }
  };

  const verifyPasswordResetToken = async (email: string, codeOrToken: string) => {
    try {
      console.log("Verifying password reset code:", email, codeOrToken);
      const { data, error } = await supabase.functions.invoke('verify-reset-code', {
        body: { email, token: codeOrToken, code: codeOrToken } // Send both for compatibility
      });
      
      if (error) {
        console.error("Password reset code verification error:", error);
        throw error;
      }

      if (data?.error) {
        console.error("Password reset code verification error:", data.error);
        throw new Error(data.error);
      }
      
      console.log("Password reset code verified successfully");
      return data;
    } catch (error: any) {
      console.error("Password reset code verification error:", error);
      toast.error(error.message || "Invalid or expired code");
      throw error;
    }
  };

  const updatePassword = async (email: string, codeOrToken: string, newPassword: string) => {
    try {
      console.log("Updating password for:", email);
      const { data, error } = await supabase.functions.invoke('update-password-with-code', {
        body: { email, token: codeOrToken, newPassword }
      });
      
      if (error) {
        console.error("Password update error:", error);
        throw error;
      }

      if (data?.error) {
        console.error("Password update error:", data.error);
        throw new Error(data.error);
      }
      
      console.log("Password updated successfully");
      toast.success("Password updated successfully!");
      return data;
    } catch (error: any) {
      console.error("Password update error:", error);
      toast.error(error.message || "Failed to update password");
      throw error;
    }
  };

  // Legacy method for backward compatibility
  const verifyPasswordResetCode = verifyPasswordResetToken;

  return {
    sendPasswordResetCode,
    verifyPasswordResetToken,
    verifyPasswordResetCode, // backward compatibility
    updatePassword,
  };
};
