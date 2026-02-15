import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        // Check if email already exists before attempting signup
        const { data: emailExists, error: checkError } = await supabase
          .rpc('check_email_exists' as any, { _email: email });

        if (checkError) {
          console.error('Error checking email:', checkError);
          // Continue with signup even if check fails
        } else if (emailExists) {
          // Email already registered
          toast({
            title: "Account already exists",
            description: "This email is already registered. Redirecting to sign in...",
            variant: "destructive",
          });
          
          // Wait a moment for user to see the message
          setTimeout(() => {
            setIsSignUp(false);
            setPassword(""); // Clear password for security
          }, 1500);
          
          setLoading(false);
          return;
        }

        // Proceed with signup if email doesn't exist
        const { error } = await signUp(email, password, fullName);
        if (error) throw error;

        toast({
          title: "Account created!",
          description: "Please check your email to verify your account.",
        });
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;

        toast({ title: "Welcome back 👋✨!" });
        navigate("/");
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setFullName("");
    setEmail("");
    setPassword("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#C9E3A8]">
      {/* Background Image */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-white/20 z-10" />
        <img 
          src="/auth-bg.png" 
          alt="Background" 
          className="w-full h-full object-cover opacity-11"
        />
      </div>

      {/* Animated Blur Orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full blur-3xl animate-pulse" style={{ backgroundColor: 'rgba(0, 131, 79, 0.12)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl animate-pulse" style={{ backgroundColor: 'rgba(0, 131, 79, 0.08)', animationDelay: '1s' }} />
      </div>

      {/* Glassmorphic Card */}
      <div className="w-full max-w-[420px] relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={isSignUp ? "signup" : "signin"}
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.96 }}
            transition={{ 
              duration: 0.35, 
              ease: [0.34, 1.56, 0.64, 1]
            }}
          >
            <div
              className="relative rounded-[20px] p-7 shadow-2xl border"
              style={{
                background: "rgba(0, 131, 79, 0.08)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(0, 131, 79, 0.2)",
                boxShadow: "0 8px 32px 0 rgba(0, 131, 79, 0.15), 0 2px 16px 0 rgba(0, 0, 0, 0.08)",
              }}
            >
              {/* Logo Section */}
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.4, ease: "easeOut" }}
                className="flex justify-center mb-5"
              >
                <div
                  className="w-[90px] h-[90px] rounded-full flex items-center justify-center overflow-hidden relative"
                  style={{
                    border: "2.5px solid #07ab69",
                    boxShadow: "0 4px 16px #a5fad8",
                  }}
                >
                  <img
                    src="/logo.ico"
                    alt="PANDIYIN Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
              </motion.div>

              {/* Header */}
              <div className="text-center mb-7">
                <motion.h1
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                  className="text-2xl font-display font-bold mb-2"
                  style={{ color: '#00834f' }}
                >
                  {isSignUp ? "Create Account" : "Welcome Back"}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25, duration: 0.3 }}
                  className="text-[13px] text-gray-700 font-medium"
                >
                  {isSignUp
                    ? "Join PANDIYIN for fresh homemade goodness"
                    : "Sign in to your account"}
                </motion.p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name Field - Animated */}
                <AnimatePresence mode="wait">
                  {isSignUp && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-2 mb-4">
                        <Label
                          htmlFor="name"
                          className="text-sm font-semibold text-gray-800"
                        >
                          Full Name
                        </Label>
                        <Input
                          id="name"
                          placeholder="Enter your full name"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required={isSignUp}
                          className="h-11 bg-white/95 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-green-600 focus:border-green-600 transition-all duration-200"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Email Field */}
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-sm font-semibold text-gray-800"
                  >
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11 bg-white/95 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-green-600 focus:border-green-600 transition-all duration-200"
                  />
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-sm font-semibold text-gray-800"
                  >
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="h-11 bg-white/95 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-green-600 focus:border-green-600 transition-all duration-200"
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 text-white font-semibold text-base shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 mt-5"
                  style={{
                    background: 'linear-gradient(135deg, #00834f 0%, #00a65a 100%)',
                  }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="animate-spin h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Please wait...
                    </span>
                  ) : isSignUp ? (
                    "Create Account"
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>

              {/* Toggle Link */}
              <div className="text-center mt-5">
                <p className="text-sm text-gray-700 font-medium">
                  {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                  <button
                    type="button"
                    onClick={toggleMode}
                    className="font-bold underline decoration-2 underline-offset-2 hover:opacity-80 transition-opacity duration-200"
                    style={{ color: '#00834f' }}
                  >
                    {isSignUp ? "Sign In" : "Sign Up"}
                  </button>
                </p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
