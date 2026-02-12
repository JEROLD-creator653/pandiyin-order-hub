import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Eye, EyeOff, Mail, Lock, User, Loader2, ArrowRight } from "lucide-react";

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
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
    setShowPassword(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#C9E3A8]">
      {/* Background Image */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src="/auth-bg.png"
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover opacity-[0.12]"
        />
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#C9E3A8]/80 via-[#C9E3A8]/60 to-[#a8d4a0]/70" />
      </div>

      {/* Animated Blur Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full blur-3xl animate-pulse" style={{ backgroundColor: 'rgba(0, 131, 79, 0.10)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl animate-pulse" style={{ backgroundColor: 'rgba(0, 131, 79, 0.07)', animationDelay: '1s' }} />
      </div>

      {/* Auth Card */}
      <div className="w-full max-w-[420px] relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={isSignUp ? "signup" : "signin"}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              className="relative rounded-2xl overflow-hidden"
              style={{
                background: "rgba(255, 255, 255, 0.72)",
                backdropFilter: "blur(24px) saturate(1.5)",
                WebkitBackdropFilter: "blur(24px) saturate(1.5)",
                border: "1px solid rgba(255, 255, 255, 0.5)",
                boxShadow: "0 20px 60px -12px rgba(0, 80, 40, 0.18), 0 0 0 1px rgba(255,255,255,0.3) inset",
              }}
            >
              {/* Top accent bar */}
              <div className="h-1 w-full bg-gradient-to-r from-[#00834f] via-[#00a65a] to-[#00834f]" />

              <div className="px-8 pt-8 pb-8 sm:px-10 sm:pt-10 sm:pb-9">
                {/* Logo */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.35, ease: "easeOut" as const }}
                  className="flex justify-center mb-6"
                >
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden bg-white"
                    style={{
                      border: "2.5px solid #00834f",
                      boxShadow: "0 4px 20px rgba(0, 131, 79, 0.15)",
                    }}
                  >
                    <img
                      src="/logo.ico"
                      alt="PANDIYIN Logo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </motion.div>

                {/* Heading */}
                <div className="text-center mb-8">
                  <motion.h1
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.3 }}
                    className="text-[26px] font-display font-bold tracking-tight mb-1.5"
                    style={{ color: '#00834f' }}
                  >
                    {isSignUp ? "Create Account" : "Welcome Back"}
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                    className="text-sm text-gray-500 font-medium"
                  >
                    {isSignUp
                      ? "Join PANDIYIN for fresh homemade goodness"
                      : "Sign in to continue to your account"}
                  </motion.p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                  {/* Full Name Field */}
                  <AnimatePresence mode="wait">
                    {isSignUp && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-1.5 mb-1">
                          <Label
                            htmlFor="name"
                            className="text-[13px] font-semibold text-gray-700"
                          >
                            Full Name
                          </Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" aria-hidden="true" />
                            <Input
                              id="name"
                              placeholder="Enter your full name"
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              required={isSignUp}
                              autoComplete="name"
                              aria-required={isSignUp}
                              className="h-11 pl-10 bg-white/90 border-gray-200/80 text-gray-900 placeholder:text-gray-400 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#00834f]/30 focus:border-[#00834f] transition-all duration-200"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Email Field */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="email"
                      className="text-[13px] font-semibold text-gray-700"
                    >
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" aria-hidden="true" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                        aria-required="true"
                        className="h-11 pl-10 bg-white/90 border-gray-200/80 text-gray-900 placeholder:text-gray-400 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#00834f]/30 focus:border-[#00834f] transition-all duration-200"
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="password"
                      className="text-[13px] font-semibold text-gray-700"
                    >
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" aria-hidden="true" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        autoComplete={isSignUp ? "new-password" : "current-password"}
                        aria-required="true"
                        className="h-11 pl-10 pr-11 bg-white/90 border-gray-200/80 text-gray-900 placeholder:text-gray-400 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#00834f]/30 focus:border-[#00834f] transition-all duration-200"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#00834f]/40 rounded-md transition-colors"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {isSignUp && (
                      <p className="text-[11px] text-gray-400 mt-1">Must be at least 6 characters</p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 text-white font-semibold text-[15px] rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 mt-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                    style={{
                      background: loading
                        ? '#5fa882'
                        : 'linear-gradient(135deg, #00834f 0%, #00a65a 50%, #00834f 100%)',
                      backgroundSize: '200% auto',
                    }}
                    aria-busy={loading}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Please wait...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        {isSignUp ? "Create Account" : "Sign In"}
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    )}
                  </Button>
                </form>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200/60" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white/70 px-3 text-xs text-gray-400 font-medium">
                      {isSignUp ? "Already a member?" : "New here?"}
                    </span>
                  </div>
                </div>

                {/* Toggle Link */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={toggleMode}
                    className="inline-flex items-center gap-1.5 text-sm font-bold hover:opacity-80 transition-opacity duration-200 focus:outline-none focus:ring-2 focus:ring-[#00834f]/40 rounded-lg px-3 py-1.5"
                    style={{ color: '#00834f' }}
                  >
                    {isSignUp ? "Sign in to your account" : "Create a new account"}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Footer text */}
            <p className="text-center text-[11px] text-gray-500/80 mt-4 font-medium">
              Pure, honest & handcrafted from Madurai 🌿
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
