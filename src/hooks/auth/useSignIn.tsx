
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export const useSignIn = () => {
  const navigate = useNavigate();

  const signInWithEmail = async (email: string, password: string) => {
    try {
      console.log("Attempting sign in for:", email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error("Sign in error:", error);
        throw error;
      }
      
      if (data.user) {
        console.log("Sign in successful for user:", data.user.id);
        toast.success("Successfully signed in!");
        navigate("/app/dashboard");
      }
    } catch (error: any) {
      console.error("Sign in error:", error);
      
      // Provide user-friendly error messages
      let errorMessage = "Error signing in";
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = "Invalid email or password";
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = "Please verify your email address first";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      throw error;
    }
  };

  return {
    signInWithEmail,
  };
};
