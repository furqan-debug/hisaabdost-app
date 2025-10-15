
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logCompleteRegistration } from "@/utils/appsflyerTracking";

export const useSignUp = () => {
  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      console.log("Starting signup process for:", email);
      
      // First, try to sign up the user with Supabase
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth`,
        },
      });
      
      if (signUpError) {
        console.error("Signup error:", signUpError);
        
        // Handle specific error cases with user-friendly messages
        if (signUpError.message?.toLowerCase().includes('already registered') || 
            signUpError.message?.toLowerCase().includes('user already exists')) {
          const friendlyError = new Error(`This email address (${email}) is already registered. Please try signing in instead or use a different email.`);
          toast.error(friendlyError.message);
          throw friendlyError;
        }
        
        throw signUpError;
      }

      console.log("Supabase signup successful, user created:", data.user?.id);

      // Check if user needs confirmation
      if (data.user && !data.session) {
        console.log("User needs email confirmation, sending custom verification email");
        
        // Send custom verification email
        try {
          console.log("Calling send-verification-email function...");
          const { data: emailData, error: emailError } = await supabase.functions.invoke('send-verification-email', {
            body: { email }
          });
          
          if (emailError) {
            console.error("Custom verification email error:", emailError);
            toast.error("Failed to send verification email. Please try again.");
            throw emailError;
          } else if (emailData?.error) {
            console.error("Custom verification email data error:", emailData.error);
            toast.error("Failed to send verification email. Please try again.");
            throw new Error(emailData.error);
          } else {
            console.log("Custom verification email sent successfully:", emailData);
            toast.success("Account created! Please check your email for your 6-digit verification code.");
          }
        } catch (customEmailError) {
          console.error("Failed to send custom verification email:", customEmailError);
          toast.error("Failed to send verification email. Please try again.");
          throw customEmailError;
        }
        
        return { email };
      }

      // If user is immediately signed in (email confirmation disabled)
      if (data.session) {
        console.log("User signed in immediately");
        toast.success("Account created and signed in successfully!");
        return { email };
      }

      return { email };
    } catch (error: any) {
      console.error("Signup error:", error);
      
      // Provide user-friendly error messages
      let errorMessage = error.message || "Error creating account";
      
      // Don't show toast again if we already showed it for duplicate email
      if (!error.message?.includes('already registered')) {
        toast.error(errorMessage);
      }
      
      throw error;
    }
  };

  return {
    signUp,
  };
};
