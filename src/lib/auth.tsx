
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ email: string } | undefined>;
  signOut: () => Promise<void>;
  verifyOtp: (email: string, token: string) => Promise<void>;
  resendOtp: (email: string) => Promise<void>;
  sendPasswordResetCode: (email: string) => Promise<void>;
}

const AUTH_FALLBACK: AuthContextType = {
  user: null,
  session: null,
  loading: true,
  signInWithEmail: async () => { throw new Error('AuthProvider not mounted'); },
  signUp: async () => { throw new Error('AuthProvider not mounted'); },
  signOut: async () => { throw new Error('AuthProvider not mounted'); },
  verifyOtp: async () => { throw new Error('AuthProvider not mounted'); },
  resendOtp: async () => { throw new Error('AuthProvider not mounted'); },
  sendPasswordResetCode: async () => { throw new Error('AuthProvider not mounted'); },
};

const AuthContext = createContext<AuthContextType>(AUTH_FALLBACK);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    if (import.meta.env.DEV) {
      console.warn('useAuth called outside AuthProvider - returning fallback context');
    }
    const fallback: AuthContextType = {
      user: null,
      session: null,
      loading: true,
      signInWithEmail: async () => { throw new Error('AuthProvider not mounted'); },
      signUp: async () => { throw new Error('AuthProvider not mounted'); },
      signOut: async () => { throw new Error('AuthProvider not mounted'); },
      verifyOtp: async () => { throw new Error('AuthProvider not mounted'); },
      resendOtp: async () => { throw new Error('AuthProvider not mounted'); },
      sendPasswordResetCode: async () => { throw new Error('AuthProvider not mounted'); },
    };
    return fallback;
  }
  return context;
};

// Optional variant for components that can render outside AuthProvider during boot
export const useAuthOptional = () => useContext(AuthContext);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Auth methods implemented directly
  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      if (data.user) {
        toast.success("Successfully signed in!");
      }
    } catch (error: any) {
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




  const signUp = async (email: string, password: string, fullName: string) => {
    try {
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
      
      if (signUpError) throw signUpError;

      if (data.user && !data.session) {
        toast.success("Account created! Please check your email for verification code.");
        return { email };
      }

      if (data.session) {
        toast.success("Account created and signed in successfully!");
        return { email };
      }

      return { email };
    } catch (error: any) {
      toast.error(error.message || "Error creating account");
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Signed out successfully");
    } catch (error) {
      toast.error("Error signing out");
    }
  };

  const verifyOtp = async (email: string, token: string) => {
    try {
      console.log("Verifying custom verification code for email:", email, "code:", token);
      
      // Use custom verification code system
      const { data, error } = await supabase.functions.invoke('verify-email-code', {
        body: { email, code: token }
      });
      
      if (error) {
        console.error("Custom verification failed:", error);
        throw error;
      }

      if (data?.error) {
        console.error("Verification error:", data.error);
        throw new Error(data.error);
      }
      
      if (data?.valid) {
        console.log("Email verification successful - email confirmed");
        toast.success("Email verified! Please sign in with your credentials.");
        // Don't try to refresh session here - user needs to sign in first
      }
    } catch (error: any) {
      console.error("Verification error:", error);
      const message = error.message || "Verification failed. Please check your code and try again.";
      toast.error(message);
      throw error;
    }
  };


  const resendOtp = async (email: string) => {
    try {
      console.log("Resending verification code to:", email);
      
      const { data, error } = await supabase.functions.invoke('send-verification-email', {
        body: { email }
      });
      
      if (error) {
        console.error("Custom email error:", error);
        throw error;
      }

      if (data?.error) {
        console.error("Verification email error:", data.error);
        if (data.error.includes('rate limit') || data.error.includes('wait a minute')) {
          toast.warning("Please wait a moment before requesting another code.");
        } else {
          throw new Error(data.error);
        }
      } else if (data?.success) {
        toast.success("New verification code sent! Please check your email.");
      }
    } catch (error: any) {
      console.error("Resend OTP error:", error);
      toast.error(error.message || "Failed to resend verification code");
      throw error;
    }
  };


  const sendPasswordResetCode = async (email: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-password-reset-code', {
        body: { email }
      });
      
      if (error) {
        if (error.message?.includes('wait a minute')) {
          toast.warning("Too many requests. Please wait a minute before trying again.");
        } else {
          throw error;
        }
      } else if (data?.error) {
        if (data.error.includes('wait a minute')) {
          toast.warning("Too many requests. Please wait a minute before trying again.");
        } else {
          throw new Error(data.error);
        }
      } else {
        toast.success("Password reset link sent! Please check your email.");
      }
    } catch (error: any) {
      toast.error(error.message || "Error sending password reset link");
      throw error;
    }
  };

  useEffect(() => {
    console.log('🔐 AuthProvider: Initializing auth...');
    
    let mounted = true;

    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log('🔐 Auth state change:', event, currentSession ? 'session exists' : 'no session');
        
        if (mounted) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          setLoading(false);
        }
      }
    );

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('🔐 Getting initial session...');
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('🔐 Error getting session:', error);
        } else {
          console.log('🔐 Initial session:', initialSession ? 'found' : 'none');
        }
        
        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          setLoading(false);
        }
      } catch (error) {
        console.error('🔐 Error in getInitialSession:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value: AuthContextType = {
    user,
    session,
    loading,
    signInWithEmail,
    signUp,
    signOut,
    verifyOtp,
    resendOtp,
    sendPasswordResetCode,
  };

  console.log('🔐 AuthProvider rendering with state:', {
    loading,
    hasUser: !!user,
    hasSession: !!session
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
