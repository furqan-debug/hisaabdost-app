
import { useState } from "react";
import { useEmailAuth } from "@/hooks/auth/useEmailAuth";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";


// Common weak passwords to check against
const commonWeakPasswords = [
  'password', '123456', '12345678', 'qwerty', 'abc123', 
  'monkey', '1234567', 'letmein', 'trustno1', 'dragon',
  'baseball', 'iloveyou', 'master', 'sunshine', 'ashley',
  'bailey', 'shadow', '123123', '654321', 'superman'
];

const signUpSchema = z.object({
  fullName: z.string().min(2, "Please enter your full name"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .refine((password) => {
      // Check if password is in common weak passwords list
      return !commonWeakPasswords.includes(password.toLowerCase());
    }, "Password is known to be weak and easy to guess, please choose a different one"),
});

// Password strength checker
const checkPasswordStrength = (password: string) => {
  if (!password) return { strength: 0, feedback: [], color: 'text-muted-foreground', label: '' };
  
  let strength = 0;
  const feedback: string[] = [];
  
  // Length check
  if (password.length >= 8) strength += 1;
  else feedback.push("Use at least 8 characters");
  
  // Uppercase check
  if (/[A-Z]/.test(password)) strength += 1;
  else feedback.push("Add uppercase letters (A-Z)");
  
  // Lowercase check
  if (/[a-z]/.test(password)) strength += 1;
  else feedback.push("Add lowercase letters (a-z)");
  
  // Number check
  if (/[0-9]/.test(password)) strength += 1;
  else feedback.push("Add numbers (0-9)");
  
  // Special character check
  if (/[^A-Za-z0-9]/.test(password)) strength += 1;
  else feedback.push("Add special characters (!@#$%^&*)");
  
  // Check for common weak passwords
  if (commonWeakPasswords.includes(password.toLowerCase())) {
    strength = 0;
    feedback.push("This is a commonly used password. Please choose something more unique.");
  }
  
  // Determine color and label
  let color = 'text-muted-foreground';
  let label = '';
  
  if (strength <= 2) {
    color = 'text-destructive';
    label = 'Weak';
  } else if (strength === 3) {
    color = 'text-orange-500';
    label = 'Fair';
  } else if (strength === 4) {
    color = 'text-yellow-500';
    label = 'Good';
  } else {
    color = 'text-success';
    label = 'Strong';
  }
  
  return { strength, feedback, color, label };
};

type SignUpFormProps = {
  onLoginClick: () => void;
  onSignUpSuccess: (email: string) => void;
};

export const SignUpForm = ({ onLoginClick, onSignUpSuccess }: SignUpFormProps) => {
  const { signUp } = useEmailAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ 
    strength: 0, 
    feedback: [] as string[], 
    color: 'text-muted-foreground',
    label: ''
  });

  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
    },
  });

  const handleSubmit = async (values: z.infer<typeof signUpSchema>) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await signUp(values.email, values.password, values.fullName);
      if (result?.email) {
        onSignUpSuccess(result.email);
      }
    } catch (err: any) {
      console.error("Signup error:", err);
      setError(err.message || "An error occurred during sign up");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}
        
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="John Doe"
                    autoComplete="name"
                    autoCorrect="on"
                    autoCapitalize="words"
                    spellCheck={true}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="username"
                    inputMode="email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className="pr-10"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        setPasswordStrength(checkPasswordStrength(e.target.value));
                      }}
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                
                {/* Password strength indicator */}
                {field.value && (
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${
                            passwordStrength.strength <= 2 ? 'bg-destructive' :
                            passwordStrength.strength === 3 ? 'bg-orange-500' :
                            passwordStrength.strength === 4 ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${Math.max(20, (passwordStrength.strength / 5) * 100)}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium ${passwordStrength.color}`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    
                    {/* Password suggestions */}
                    {passwordStrength.feedback.length > 0 && (
                      <div className="text-xs text-destructive space-y-1">
                        <p className="font-medium">To make your password stronger:</p>
                        <ul className="list-disc list-inside space-y-0.5 ml-1">
                          {passwordStrength.feedback.map((tip, index) => (
                            <li key={index}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-col space-y-4 pt-2">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </Button>
          
          <p className="text-sm text-center text-muted-foreground">
            Already have an account?{" "}
            <button
              type="button"
              onClick={onLoginClick}
              className="text-primary hover:underline font-medium"
            >
              Sign in
            </button>
          </p>
        </div>
      </form>
    </Form>
  );
};
