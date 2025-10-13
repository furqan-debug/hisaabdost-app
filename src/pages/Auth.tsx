import { useState, useEffect } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuthOptional } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LoginForm } from "@/components/auth/LoginForm";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { PhoneLoginForm } from "@/components/auth/PhoneLoginForm";
import { PhoneOtpForm } from "@/components/auth/PhoneOtpForm";
import { VerificationForm } from "@/components/auth/VerificationForm";
import { PasswordResetCodeForm } from "@/components/auth/PasswordResetCodeForm";
import { SetNewPasswordForm } from "@/components/auth/SetNewPasswordForm";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

const Auth = () => {
  const auth = useAuthOptional();
  const user = auth?.user ?? null;
  const verifyOtp = auth?.verifyOtp ?? (async () => {});
  const resendOtp = auth?.resendOtp ?? (async () => {});
  const sendPasswordResetCode = auth?.sendPasswordResetCode ?? (async () => {});
  
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email");
  const [isSignUp, setIsSignUp] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [showPhoneOtp, setShowPhoneOtp] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [userPhone, setUserPhone] = useState("");
  
  // Password reset states
  const [passwordResetStep, setPasswordResetStep] = useState<"email" | "code" | "newPassword" | "success" | null>(null);
  const [passwordResetEmail, setPasswordResetEmail] = useState("");
  const [passwordResetCode, setPasswordResetCode] = useState("");
  
  const navigate = useNavigate();
  
  if (user) {
    return <Navigate to="/app/dashboard" replace />;
  }

  const handleVerification = async (code: string) => {
    try {
      await verifyOtp(verificationEmail, code);
      // After successful verification, reset to login
      setTimeout(() => {
        resetToLogin();
      }, 1500);
    } catch (error) {
      // Error is already handled and shown by verifyOtp
      console.error("Verification failed:", error);
    }
  };

  const handleResendVerification = async () => {
    await resendOtp(verificationEmail);
  };

  const handlePasswordResetCodeSent = (email: string) => {
    setPasswordResetEmail(email);
    setPasswordResetStep("code");
  };

  const handleCodeVerified = (email: string, code: string) => {
    setPasswordResetEmail(email);
    setPasswordResetCode(code);
    setPasswordResetStep("newPassword");
  };

  const handlePasswordUpdated = () => {
    setPasswordResetStep("success");
    // Auto redirect to login after 3 seconds
    setTimeout(() => {
      resetToLogin();
    }, 3000);
  };

  const handleResendPasswordResetCode = async () => {
    await sendPasswordResetCode(passwordResetEmail);
  };

  const resetToLogin = () => {
    setAuthMethod("email");
    setIsSignUp(false);
    setShowVerification(false);
    setShowPhoneOtp(false);
    setVerificationEmail("");
    setUserPhone("");
    setPasswordResetStep(null);
    setPasswordResetEmail("");
    setPasswordResetCode("");
  };

  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 20
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4
      }
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.3
      }
    }
  };

  const getCardTitle = () => {
    if (showVerification) return "Verify Email";
    if (showPhoneOtp) return "Verify Phone";
    if (passwordResetStep === "email") return "Reset Password";
    if (passwordResetStep === "code") return "Enter Code";
    if (passwordResetStep === "newPassword") return "Set New Password";
    if (passwordResetStep === "success") return "Success!";
    if (authMethod === "phone") return isSignUp ? "Create Account" : "Sign In";
    if (isSignUp) return "Create Account";
    return "Welcome Back";
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          <motion.div 
            key={showVerification ? "verification" : showPhoneOtp ? "phone-otp" : passwordResetStep ? `reset-${passwordResetStep}` : `${authMethod}-${isSignUp ? "signup" : "login"}`} 
            initial="hidden" 
            animate="visible" 
            exit="exit" 
            variants={cardVariants} 
            className="w-full"
          >
            <Card className="border shadow-sm">
              {/* Card Header */}
              <CardHeader className="space-y-3 text-center pb-6 pt-8 px-8">
                <CardTitle className="text-2xl font-semibold">
                  {getCardTitle()}
                </CardTitle>
              </CardHeader>

              {/* Card Content */}
              <CardContent className="px-8 pb-8">
                {/* Auth Method Toggle */}
                {!showVerification && !showPhoneOtp && !passwordResetStep && (
                  <div className="flex rounded-lg bg-muted p-1 mb-6">
                    <Button
                      type="button"
                      variant={authMethod === "email" ? "default" : "ghost"}
                      size="sm"
                      className="flex-1"
                      onClick={() => setAuthMethod("email")}
                    >
                      Email
                    </Button>
                    <Button
                      type="button"
                      variant={authMethod === "phone" ? "default" : "ghost"}
                      size="sm"
                      className="flex-1"
                      onClick={() => setAuthMethod("phone")}
                    >
                      Phone
                    </Button>
                  </div>
                )}

                {showVerification ? (
                  <VerificationForm 
                    email={verificationEmail} 
                    onVerify={handleVerification} 
                    onResend={handleResendVerification} 
                    onBackToLogin={() => {
                      setShowVerification(false);
                      setVerificationEmail("");
                    }} 
                  />
                ) : showPhoneOtp ? (
                  <PhoneOtpForm 
                    phone={userPhone}
                    onBack={() => setShowPhoneOtp(false)}
                    onSuccess={resetToLogin}
                  />
                ) : passwordResetStep === "email" ? (
                  <ForgotPasswordForm 
                    onBackToLogin={resetToLogin} 
                    onCodeSent={handlePasswordResetCodeSent} 
                  />
                ) : passwordResetStep === "code" ? (
                  <PasswordResetCodeForm
                    email={passwordResetEmail}
                    onCodeVerified={handleCodeVerified}
                    onBackToEmail={() => setPasswordResetStep("email")}
                    onResendCode={handleResendPasswordResetCode}
                  />
                ) : passwordResetStep === "newPassword" ? (
                  <SetNewPasswordForm
                    email={passwordResetEmail}
                    code={passwordResetCode}
                    onPasswordUpdated={handlePasswordUpdated}
                    onBack={() => setPasswordResetStep("code")}
                  />
                ) : passwordResetStep === "success" ? (
                  <div className="text-center space-y-4">
                    <div className="text-primary text-6xl">✓</div>
                    <p className="text-muted-foreground">
                      Redirecting you to login...
                    </p>
                  </div>
                ) : authMethod === "email" && isSignUp ? (
                  <SignUpForm 
                    onLoginClick={() => setIsSignUp(false)} 
                    onSignUpSuccess={email => {
                      setVerificationEmail(email);
                      setShowVerification(true);
                    }} 
                  />
                ) : authMethod === "email" && !isSignUp ? (
                  <LoginForm 
                    onForgotPassword={() => setPasswordResetStep("email")} 
                    onSignUpClick={() => setIsSignUp(true)} 
                  />
                ) : authMethod === "phone" ? (
                  <PhoneLoginForm 
                    onOtpSent={(phone) => {
                      setUserPhone(phone);
                      setShowPhoneOtp(true);
                    }}
                    onEmailClick={() => setAuthMethod("email")}
                  />
                ) : null}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Footer text */}
        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">Secure authentication powered by Quintessentia</p>
        </div>
      </div>
    </div>
  );
};

export default Auth;