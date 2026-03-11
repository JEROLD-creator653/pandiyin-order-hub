import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff } from "lucide-react";
import SEOHead from '@/components/SEOHead';
import { GoogleLogin } from "@react-oauth/google";

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { user, signIn, signUp, signInWithGoogleIdToken } = useAuth();
  const navigate = useNavigate();

  // Auto-redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        // Proceed with signup — duplicate email is handled by the auth system
        const { error } = await signUp(email, password, fullName);
        if (error) {
          // Handle duplicate email error gracefully
          if (error.message?.toLowerCase().includes('already registered') || 
              error.message?.toLowerCase().includes('already been registered') ||
              error.message?.toLowerCase().includes('user already registered')) {
            toast({
              title: "Account already exists",
              description: "This email is already registered. Please sign in instead.",
              variant: "destructive",
            });
            setTimeout(() => {
              setIsSignUp(false);
              setPassword("");
            }, 1500);
            setLoading(false);
            return;
          }
          throw error;
        }

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

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setGoogleLoading(true);
    try {
      const idToken = credentialResponse.credential;
      if (!idToken) throw new Error("No credential returned from Google");
      const { error } = await signInWithGoogleIdToken(idToken);
      if (error) throw error;
      toast({ title: "Welcome 👋✨!" });
      navigate("/");
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to sign in with Google",
        variant: "destructive",
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setFullName("");
    setEmail("");
    setPassword("");
  };

  return (
    <>
      <SEOHead title={isSignUp ? 'Create Account' : 'Sign In'} description="Sign in or create an account at PANDIYIN to order authentic homemade foods from Madurai." noindex />
      <div
        className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
        style={{
          backgroundImage: 'url(/auth-bg.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
      {/* Semi-transparent overlay */}
      <div className="absolute inset-0 bg-white/20 z-0" />

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
                    loading="eager"
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
                      initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                      animate={{ opacity: 1, height: "auto", marginBottom: 0 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      style={{ overflow: "hidden" }}
                    >
                      <div className="space-y-2 pb-0">
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
                          className="h-11 bg-white/95 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus-visible:ring-primary focus-visible:border-primary transition-all duration-200"
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
                    className="h-11 bg-white/95 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus-visible:ring-primary focus-visible:border-primary transition-all duration-200"
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
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="h-11 bg-white/95 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus-visible:ring-primary focus-visible:border-primary"
                      style={{ paddingRight: '48px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute text-gray-400 hover:text-gray-700 focus:outline-none"
                      style={{
                        right: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        lineHeight: 0,
                      }}
                      tabIndex={-1}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 pointer-events-none" />
                      ) : (
                        <Eye className="h-5 w-5 pointer-events-none" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading || googleLoading}
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

                {/* OR Divider */}
                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-3 bg-white/95 text-gray-600 font-medium">OR</span>
                  </div>
                </div>

                {/* Google Sign-In Button */}
                <div className="flex justify-center">
                  {googleLoading ? (
                    <div className="w-full h-11 flex items-center justify-center bg-white border-2 border-gray-300 rounded-md">
                      <span className="flex items-center gap-2 text-gray-700 text-sm font-medium">
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Signing in...
                      </span>
                    </div>
                  ) : (
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={() => {
                        toast({
                          title: "Error",
                          description: "Google sign-in failed. Please try again.",
                          variant: "destructive",
                        });
                      }}
                      width="340"
                      text="continue_with"
                      shape="rectangular"
                      theme="outline"
                      size="large"
                    />
                  )}
                </div>
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

              {/* Legal Text */}
              <div className="text-center mt-6 pt-5 border-t border-gray-300/50">
                <p className="text-xs text-gray-600 leading-relaxed">
                  By continuing, you agree to our{" "}
                  <a href="/terms" className="font-semibold hover:underline" style={{ color: '#00834f' }}>
                    Terms of Service
                  </a>
                  {" "}and{" "}
                  <a href="/privacy-policy" className="font-semibold hover:underline" style={{ color: '#00834f' }}>
                    Privacy Policy
                  </a>
                </p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      </div>
    </>
  );
}
