import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { ArrowLeft, Loader2, RotateCcw } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

const otpSchema = z.object({
  otp: z.string().min(6, "OTP must be 6 digits").max(6, "OTP must be 6 digits"),
});

interface PhoneOtpFormProps {
  phone: string;
  onBack: () => void;
  onSuccess: () => void;
}

const inputVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export const PhoneOtpForm = ({ phone, onBack, onSuccess }: PhoneOtpFormProps) => {
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const { verifyPhoneOtp, resendPhoneOtp } = useAuth();

  const form = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
    },
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (values: z.infer<typeof otpSchema>) => {
    try {
      setLoading(true);
      await verifyPhoneOtp(phone, values.otp);
      toast.success("Phone number verified successfully!");
      onSuccess();
    } catch (error: any) {
      console.error("OTP verification error:", error);
      toast.error(error.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setResendLoading(true);
      await resendPhoneOtp(phone);
      setResendTimer(30);
      toast.success("OTP sent to your phone!");
    } catch (error: any) {
      console.error("Resend OTP error:", error);
      toast.error(error.message || "Failed to resend OTP");
    } finally {
      setResendLoading(false);
    }
  };

  const maskPhone = (phoneNumber: string) => {
    if (phoneNumber.length > 6) {
      return phoneNumber.slice(0, -6) + "******" + phoneNumber.slice(-2);
    }
    return phoneNumber;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <motion.div variants={inputVariants} initial="hidden" animate="visible">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="mb-4 p-0 h-auto text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to phone number
          </Button>
        </motion.div>

        <motion.div variants={inputVariants} initial="hidden" animate="visible" transition={{ delay: 0.1 }}>
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-foreground">Verify your phone</h3>
            <p className="text-sm text-muted-foreground">
              We sent a code to <span className="font-mono">{maskPhone(phone)}</span>
            </p>
          </div>
        </motion.div>

        <FormField
          control={form.control}
          name="otp"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Enter verification code</FormLabel>
              <FormControl>
        <motion.div variants={inputVariants} initial="hidden" animate="visible" transition={{ delay: 0.2 }}>
          <div className="flex justify-center">
            <InputOTP maxLength={6} {...field}>
              <InputOTPGroup>
                <InputOTPSlot index={0} className="bg-background/50 border-border/50 hover:bg-background/70 hover:border-border/70 focus:border-primary/50 focus:ring-primary/20 transition-all duration-200" />
                <InputOTPSlot index={1} className="bg-background/50 border-border/50 hover:bg-background/70 hover:border-border/70 focus:border-primary/50 focus:ring-primary/20 transition-all duration-200" />
                <InputOTPSlot index={2} className="bg-background/50 border-border/50 hover:bg-background/70 hover:border-border/70 focus:border-primary/50 focus:ring-primary/20 transition-all duration-200" />
                <InputOTPSlot index={3} className="bg-background/50 border-border/50 hover:bg-background/70 hover:border-border/70 focus:border-primary/50 focus:ring-primary/20 transition-all duration-200" />
                <InputOTPSlot index={4} className="bg-background/50 border-border/50 hover:bg-background/70 hover:border-border/70 focus:border-primary/50 focus:ring-primary/20 transition-all duration-200" />
                <InputOTPSlot index={5} className="bg-background/50 border-border/50 hover:bg-background/70 hover:border-border/70 focus:border-primary/50 focus:ring-primary/20 transition-all duration-200" />
              </InputOTPGroup>
            </InputOTP>
          </div>
        </motion.div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <motion.div variants={inputVariants} initial="hidden" animate="visible" transition={{ delay: 0.3 }}>
          <div className="text-center">
            {resendTimer > 0 ? (
              <p className="text-sm text-muted-foreground">
                Resend code in {resendTimer} seconds
              </p>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResendOtp}
                disabled={resendLoading}
                className="text-primary hover:text-primary/80"
              >
                {resendLoading ? (
                  <>
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <RotateCcw className="mr-1 h-3 w-3" />
                    Resend code
                  </>
                )}
              </Button>
            )}
          </div>
        </motion.div>

        <motion.div variants={inputVariants} initial="hidden" animate="visible" transition={{ delay: 0.4 }}>
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground font-medium py-3 shadow-lg hover:shadow-xl transition-all duration-200"
            disabled={loading || form.watch("otp").length !== 6}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify Phone Number"
            )}
          </Button>
        </motion.div>
      </form>
    </Form>
  );
};