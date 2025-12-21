import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useFirstTimeVisit } from "@/hooks/useFirstTimeVisit";
import { useWelcomeMusic } from "@/hooks/useWelcomeMusic";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
export default function Welcome() {
  const navigate = useNavigate();
  const { markVisitComplete } = useFirstTimeVisit();
  useWelcomeMusic(); // Play intro music

  const handleGetStarted = () => {
    markVisitComplete();
    navigate("/auth");
  };
  return <div className="relative min-h-screen flex items-center justify-center bg-background px-6">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
      
      {/* Main content */}
      <motion.div initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      duration: 0.8,
      ease: "easeOut"
    }} className="relative z-10 max-w-3xl mx-auto text-center space-y-12">
        {/* Logo with elegant glow */}
        <motion.div initial={{
        opacity: 0,
        scale: 0.9
      }} animate={{
        opacity: 1,
        scale: 1
      }} transition={{
        delay: 0.2,
        duration: 0.6
      }} className="flex justify-center">
          <div className="relative">
            <img src="/lovable-uploads/12aae181-1a03-4067-a879-2f29d4213837.png" alt="Hisaab Dost" className="w-32 h-32 md:w-40 md:h-40 object-contain" />
          </div>
        </motion.div>

        {/* Heading */}
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.4,
        duration: 0.6
      }} className="space-y-6">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground">
            Hisaab Dost
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground font-light max-w-2xl mx-auto">
            Take control of your financial future
          </p>
        </motion.div>

        {/* Value proposition */}
        <motion.p initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.6,
        duration: 0.6
      }} className="text-base md:text-lg text-foreground/70 leading-relaxed max-w-xl mx-auto">
          Track expenses, build wealth, and achieve your goals with confidence. 
          Your journey to financial freedom starts here.
        </motion.p>

        {/* CTA */}
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.8,
        duration: 0.6
      }} className="pt-4">
          <Button onClick={handleGetStarted} size="lg" className="group text-base px-8 h-14 rounded-full shadow-lg hover:shadow-xl transition-all">
            Get Started
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.div>

        {/* Trust indicator */}
        <motion.p initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} transition={{
        delay: 1,
        duration: 0.6
      }} className="text-sm text-muted-foreground/60">
          Free forever • No credit card required • Your data is secure
        </motion.p>
      </motion.div>
    </div>;
}