import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Phone, Loader2 } from "lucide-react";
import { EnhancedCountrySelector } from "./EnhancedCountrySelector";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { formatPhoneNumber, validatePhoneNumber, getPhoneNumberPlaceholder } from "@/utils/phoneFormatter";
import { Country } from "@/data/countries";

const phoneSchema = z.object({
  countryCode: z.string().min(1, "Country code is required"),
  phoneNumber: z.string().min(7, "Phone number must be at least 7 digits").max(15, "Phone number must be less than 15 digits"),
});

interface PhoneLoginFormProps {
  onOtpSent: (phone: string) => void;
  onEmailClick: () => void;
}

const inputVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export const PhoneLoginForm = ({ onOtpSent, onEmailClick }: PhoneLoginFormProps) => {
  const [loading, setLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const { signInWithPhone } = useAuth();

  const form = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      countryCode: "+1",
      phoneNumber: "",
    },
  });

  const handleSubmit = async (values: z.infer<typeof phoneSchema>) => {
    try {
      setLoading(true);
      const cleanedNumber = values.phoneNumber.replace(/\D/g, '');
      
      // Validate phone number format
      if (selectedCountry && !validatePhoneNumber(cleanedNumber, selectedCountry)) {
        toast.error("Please enter a valid phone number for the selected country");
        return;
      }
      
      const fullPhoneNumber = values.countryCode + cleanedNumber;
      await signInWithPhone(fullPhoneNumber);
      onOtpSent(fullPhoneNumber);
      toast.success("OTP sent to your phone!");
    } catch (error: any) {
      console.error("Phone sign in error:", error);
      toast.error(error.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleCountryChange = (dialCode: string, country: Country) => {
    setSelectedCountry(country);
    form.setValue('countryCode', dialCode);
    // Clear phone number when country changes to avoid format conflicts
    form.setValue('phoneNumber', '');
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="countryCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground font-medium">Country</FormLabel>
                <FormControl>
                  <motion.div variants={inputVariants} initial="hidden" animate="visible" transition={{ delay: 0.1 }}>
                    <EnhancedCountrySelector 
                      value={field.value} 
                      onChange={handleCountryChange} 
                    />
                  </motion.div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground font-medium">Phone Number</FormLabel>
                <FormControl>
                  <motion.div variants={inputVariants} initial="hidden" animate="visible" transition={{ delay: 0.2 }}>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        {...field}
                        type="tel"
                        placeholder={getPhoneNumberPlaceholder(selectedCountry)}
                        className="pl-10 bg-background/50 border-border/50 hover:bg-background/70 hover:border-border/70 focus:border-primary/50 focus:ring-primary/20 transition-all duration-200"
                        onChange={(e) => {
                          const formatted = formatPhoneNumber(e.target.value, selectedCountry);
                          field.onChange(formatted);
                        }}
                      />
                      {selectedCountry && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">
                          {selectedCountry.dialCode}
                        </div>
                      )}
                    </div>
                  </motion.div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <motion.div variants={inputVariants} initial="hidden" animate="visible" transition={{ delay: 0.3 }}>
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground font-medium py-3 shadow-lg hover:shadow-xl transition-all duration-200"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending OTP...
              </>
            ) : (
              <>
                <Phone className="mr-2 h-4 w-4" />
                Send OTP
              </>
            )}
          </Button>
        </motion.div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border/30" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        <motion.div variants={inputVariants} initial="hidden" animate="visible" transition={{ delay: 0.4 }}>
          <Button
            type="button"
            variant="outline"
            className="w-full bg-background/50 border-border/50 hover:bg-background/70 hover:border-border/70 text-foreground"
            onClick={onEmailClick}
          >
            Sign in with Email
          </Button>
        </motion.div>
      </form>
    </Form>
  );
};