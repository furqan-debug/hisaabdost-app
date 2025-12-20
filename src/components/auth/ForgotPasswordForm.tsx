
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePasswordReset } from "@/hooks/auth/usePasswordReset";

type ForgotPasswordFormProps = {
  onBackToLogin: () => void;
  onCodeSent: (email: string) => void;
};

export const ForgotPasswordForm = ({ onBackToLogin, onCodeSent }: ForgotPasswordFormProps) => {
  const [loading, setLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const { sendPasswordResetCode } = usePasswordReset();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail || !resetEmail.includes('@')) {
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetCode(resetEmail);
      setCodeSent(true);
      onCodeSent(resetEmail);
    } catch (error) {
      // Error is handled in the hook
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <p className="text-sm text-muted-foreground text-center">
        Enter your email and we'll send you a verification code
      </p>

      <div className="space-y-2">
        <Label htmlFor="resetEmail">Email</Label>
        <Input
          id="resetEmail"
          type="email"
          placeholder="you@example.com"
          value={resetEmail}
          onChange={(e) => setResetEmail(e.target.value)}
          required
          autoComplete="username"
          inputMode="email"
        />
      </div>

      <div className="space-y-3">
        <Button type="submit" className="w-full" disabled={loading || codeSent}>
          {loading ? "Sending code..." : "Send Code"}
        </Button>
        
        <p className="text-sm text-center">
          <button
            type="button"
            onClick={onBackToLogin}
            className="text-muted-foreground hover:text-foreground"
          >
            Back to login
          </button>
        </p>
      </div>
    </form>
  );
};
