import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Mail, Lock, Eye, EyeClosed, ArrowRight, University } from 'lucide-react';
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

interface SignInCardProps {
  onSubmit?: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  onReplitAuth?: () => void;
  isLoading?: boolean;
  error?: string;
}

export function SignInCard({ onSubmit, onReplitAuth, isLoading: externalLoading = false, error }: SignInCardProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  const loading = isLoading || externalLoading;

  // For 3D card effect - increased rotation range for more pronounced 3D effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-300, 300], [10, -10]);
  const rotateY = useTransform(mouseX, [-300, 300], [-10, 10]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (onSubmit) {
      setIsLoading(true);
      try {
        await onSubmit(email, password, rememberMe);
      } catch (error) {
        // Error handling is done by parent
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen w-screen bg-white relative overflow-hidden flex items-center justify-center">
      {/* Background gradient image with 40% opacity */}
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 768" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:%2380d4a8;stop-opacity:1"/><stop offset="50%" style="stop-color:%2366c79a;stop-opacity:1"/><stop offset="100%" style="stop-color:%234db88c;stop-opacity:1"/></linearGradient><linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:%2366c79a;stop-opacity:0.8"/><stop offset="100%" style="stop-color:%2338a375;stop-opacity:0.8"/></linearGradient></defs><rect width="1024" height="768" fill="url(%23g1)"/><g opacity="0.6"><path d="M-100 -100 L400 400 L-100 900 Z" fill="url(%23g2)"/><path d="M150 -100 L900 650 L150 900 Z" fill="url(%23g2)"/><path d="M400 -100 L1124 624 L400 900 Z" fill="url(%23g2)"/><path d="M650 -100 L1374 624 L650 900 Z" fill="url(%23g2)"/></g><ellipse cx="750" cy="350" rx="280" ry="320" fill="%2338a375" opacity="0.3"/><ellipse cx="300" cy="500" rx="250" ry="280" fill="%2366c79a" opacity="0.25"/></svg>')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-sm relative z-10"
        style={{ perspective: 1500 }}
      >
        <div className="relative">
          <div className="relative group" style={{ transform: 'rotateX(2deg) rotateY(0deg)' }}>
            {/* Card glow effect - static */}
            <div 
              className="absolute -inset-[1px] rounded-2xl opacity-30 transition-opacity duration-700"
              style={{
                boxShadow: "0 0 20px 5px rgba(102, 199, 154, 0.15)"
              }}
            />

            {/* Traveling light beam effect */}
            <div className="absolute -inset-[1px] rounded-2xl overflow-hidden">
              {/* Top light beam */}
              <motion.div 
                className="absolute top-0 left-0 h-[3px] w-[50%] bg-gradient-to-r from-transparent via-white to-transparent opacity-70"
                initial={{ filter: "blur(2px)" }}
                animate={{ 
                  left: ["-50%", "100%"],
                  opacity: [0.3, 0.7, 0.3],
                  filter: ["blur(1px)", "blur(2.5px)", "blur(1px)"]
                }}
                transition={{ 
                  left: {
                    duration: 2.5, 
                    ease: "easeInOut", 
                    repeat: Infinity,
                    repeatDelay: 1
                  },
                  opacity: {
                    duration: 1.2,
                    repeat: Infinity,
                    repeatType: "mirror"
                  },
                  filter: {
                    duration: 1.5,
                    repeat: Infinity,
                    repeatType: "mirror"
                  }
                }}
              />
              
              {/* Right light beam */}
              <motion.div 
                className="absolute top-0 right-0 h-[50%] w-[3px] bg-gradient-to-b from-transparent via-white to-transparent opacity-70"
                initial={{ filter: "blur(2px)" }}
                animate={{ 
                  top: ["-50%", "100%"],
                  opacity: [0.3, 0.7, 0.3],
                  filter: ["blur(1px)", "blur(2.5px)", "blur(1px)"]
                }}
                transition={{ 
                  top: {
                    duration: 2.5, 
                    ease: "easeInOut", 
                    repeat: Infinity,
                    repeatDelay: 1,
                    delay: 0.6
                  },
                  opacity: {
                    duration: 1.2,
                    repeat: Infinity,
                    repeatType: "mirror",
                    delay: 0.6
                  },
                  filter: {
                    duration: 1.5,
                    repeat: Infinity,
                    repeatType: "mirror",
                    delay: 0.6
                  }
                }}
              />
              
              {/* Bottom light beam */}
              <motion.div 
                className="absolute bottom-0 right-0 h-[3px] w-[50%] bg-gradient-to-r from-transparent via-white to-transparent opacity-70"
                initial={{ filter: "blur(2px)" }}
                animate={{ 
                  right: ["-50%", "100%"],
                  opacity: [0.3, 0.7, 0.3],
                  filter: ["blur(1px)", "blur(2.5px)", "blur(1px)"]
                }}
                transition={{ 
                  right: {
                    duration: 2.5, 
                    ease: "easeInOut", 
                    repeat: Infinity,
                    repeatDelay: 1,
                    delay: 1.2
                  },
                  opacity: {
                    duration: 1.2,
                    repeat: Infinity,
                    repeatType: "mirror",
                    delay: 1.2
                  },
                  filter: {
                    duration: 1.5,
                    repeat: Infinity,
                    repeatType: "mirror",
                    delay: 1.2
                  }
                }}
              />
              
              {/* Left light beam */}
              <motion.div 
                className="absolute bottom-0 left-0 h-[50%] w-[3px] bg-gradient-to-b from-transparent via-white to-transparent opacity-70"
                initial={{ filter: "blur(2px)" }}
                animate={{ 
                  bottom: ["-50%", "100%"],
                  opacity: [0.3, 0.7, 0.3],
                  filter: ["blur(1px)", "blur(2.5px)", "blur(1px)"]
                }}
                transition={{ 
                  bottom: {
                    duration: 2.5, 
                    ease: "easeInOut", 
                    repeat: Infinity,
                    repeatDelay: 1,
                    delay: 1.8
                  },
                  opacity: {
                    duration: 1.2,
                    repeat: Infinity,
                    repeatType: "mirror",
                    delay: 1.8
                  },
                  filter: {
                    duration: 1.5,
                    repeat: Infinity,
                    repeatType: "mirror",
                    delay: 1.8
                  }
                }}
              />
              
              {/* Corner glow spots */}
              <motion.div 
                className="absolute top-0 left-0 h-[5px] w-[5px] rounded-full bg-white/40 blur-[1px]"
                animate={{ 
                  opacity: [0.2, 0.4, 0.2] 
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  repeatType: "mirror"
                }}
              />
              <motion.div 
                className="absolute top-0 right-0 h-[8px] w-[8px] rounded-full bg-white/60 blur-[2px]"
                animate={{ 
                  opacity: [0.2, 0.4, 0.2] 
                }}
                transition={{ 
                  duration: 2.4, 
                  repeat: Infinity,
                  repeatType: "mirror",
                  delay: 0.5
                }}
              />
              <motion.div 
                className="absolute bottom-0 right-0 h-[8px] w-[8px] rounded-full bg-white/60 blur-[2px]"
                animate={{ 
                  opacity: [0.2, 0.4, 0.2] 
                }}
                transition={{ 
                  duration: 2.2, 
                  repeat: Infinity,
                  repeatType: "mirror",
                  delay: 1
                }}
              />
              <motion.div 
                className="absolute bottom-0 left-0 h-[5px] w-[5px] rounded-full bg-white/40 blur-[1px]"
                animate={{ 
                  opacity: [0.2, 0.4, 0.2] 
                }}
                transition={{ 
                  duration: 2.3, 
                  repeat: Infinity,
                  repeatType: "mirror",
                  delay: 1.5
                }}
              />
            </div>

            {/* Card border glow */}
            <div className="absolute -inset-[0.5px] rounded-2xl bg-gradient-to-r from-green-500/10 via-green-400/20 to-green-500/10 opacity-50 transition-opacity duration-500" />
            
            {/* Glass card background */}
            <div className="relative bg-white/90 backdrop-blur-xl rounded-2xl p-6 border border-green-200/30 shadow-2xl overflow-hidden">
              {/* Subtle card inner patterns */}
              <div className="absolute inset-0 opacity-[0.02]" 
                style={{
                  backgroundImage: `linear-gradient(135deg, #66c79a 0.5px, transparent 0.5px), linear-gradient(45deg, #66c79a 0.5px, transparent 0.5px)`,
                  backgroundSize: '30px 30px'
                }}
              />

              {/* Logo and header */}
              <div className="text-center space-y-1 mb-5">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", duration: 0.8 }}
                  className="mx-auto w-10 h-10 rounded-full border border-white/10 flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-green-600 to-green-800"
                >
                  <University className="text-lg text-white" />
                  
                  {/* Inner lighting effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" />
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-xl font-bold text-gray-800"
                >
                  Welcome Back
                </motion.h1>
                
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-gray-600 text-xs"
                >
                  Sign in to Morouna Loans
                </motion.p>
              </div>

              {/* Error display */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center"
                >
                  {error}
                </motion.div>
              )}

              {/* Login form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <motion.div className="space-y-3">
                  {/* Email input */}
                  <motion.div 
                    className={`relative ${focusedInput === "email" ? 'z-10' : ''}`}
                    whileFocus={{ scale: 1.02 }}
                    whileHover={{ scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <div className="absolute -inset-[0.5px] bg-gradient-to-r from-white/10 via-white/5 to-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300" />
                    
                    <div className="relative flex items-center overflow-hidden rounded-lg">
                      <Mail className={`absolute left-3 w-4 h-4 transition-all duration-300 ${
                        focusedInput === "email" ? 'text-green-600' : 'text-gray-400'
                      }`} />
                      
                      <Input
                        type="email"
                        placeholder="Email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => setFocusedInput("email")}
                        onBlur={() => setFocusedInput(null)}
                        className="w-full bg-gray-50 border-gray-200 focus:border-green-400 text-gray-900 placeholder:text-gray-400 h-10 transition-all duration-300 pl-10 pr-3 focus:bg-white"
                        data-testid="input-email"
                      />
                      
                      {/* Input highlight effect */}
                      {focusedInput === "email" && (
                        <motion.div 
                          layoutId="input-highlight"
                          className="absolute inset-0 bg-white/5 -z-10"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        />
                      )}
                    </div>
                  </motion.div>

                  {/* Password input */}
                  <motion.div 
                    className={`relative ${focusedInput === "password" ? 'z-10' : ''}`}
                    whileFocus={{ scale: 1.02 }}
                    whileHover={{ scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <div className="absolute -inset-[0.5px] bg-gradient-to-r from-white/10 via-white/5 to-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300" />
                    
                    <div className="relative flex items-center overflow-hidden rounded-lg">
                      <Lock className={`absolute left-3 w-4 h-4 transition-all duration-300 ${
                        focusedInput === "password" ? 'text-green-600' : 'text-gray-400'
                      }`} />
                      
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setFocusedInput("password")}
                        onBlur={() => setFocusedInput(null)}
                        className="w-full bg-gray-50 border-gray-200 focus:border-green-400 text-gray-900 placeholder:text-gray-400 h-10 transition-all duration-300 pl-10 pr-10 focus:bg-white"
                        data-testid="input-password"
                      />
                      
                      {/* Toggle password visibility */}
                      <div 
                        onClick={() => setShowPassword(!showPassword)} 
                        className="absolute right-3 cursor-pointer"
                        data-testid="button-toggle-password"
                      >
                        {showPassword ? (
                          <Eye className="w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors duration-300" />
                        ) : (
                          <EyeClosed className="w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors duration-300" />
                        )}
                      </div>
                      
                      {/* Input highlight effect */}
                      {focusedInput === "password" && (
                        <motion.div 
                          layoutId="input-highlight"
                          className="absolute inset-0 bg-white/5 -z-10"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        />
                      )}
                    </div>
                  </motion.div>
                </motion.div>

                {/* Remember me & Forgot password */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <input
                        id="remember-me"
                        name="remember-me"
                        type="checkbox"
                        checked={rememberMe}
                        onChange={() => setRememberMe(!rememberMe)}
                        className="appearance-none h-4 w-4 rounded border border-gray-300 bg-gray-50 checked:bg-green-600 checked:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-400 transition-all duration-200"
                        data-testid="checkbox-remember-me"
                      />
                      {rememberMe && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute inset-0 flex items-center justify-center text-white pointer-events-none"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        </motion.div>
                      )}
                    </div>
                    <label htmlFor="remember-me" className="text-xs text-gray-600 hover:text-gray-800 transition-colors duration-200">
                      Remember me
                    </label>
                  </div>
                  
                  <div className="text-xs relative group/link">
                    <Link href="/auth/forgot-password" className="text-gray-600 hover:text-green-600 transition-colors duration-200">
                      Forgot password?
                    </Link>
                  </div>
                </div>

                {/* Email/Password Sign in button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full relative group/button mt-5"
                  data-testid="button-signin-email"
                >
                  {/* Button glow effect */}
                  <div className="absolute inset-0 bg-green-400/20 rounded-lg blur-lg opacity-0 group-hover/button:opacity-70 transition-opacity duration-300" />
                  
                  <div className="relative overflow-hidden bg-gradient-to-r from-green-600 to-green-700 text-white font-medium h-10 rounded-lg transition-all duration-300 flex items-center justify-center hover:from-green-700 hover:to-green-800">
                    {/* Button shine effect - static */}
                    <div 
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -z-10"
                      style={{ 
                        opacity: loading ? 1 : 0,
                        transition: 'opacity 0.3s ease'
                      }}
                    />
                    
                    <AnimatePresence mode="wait">
                      {loading ? (
                        <motion.div
                          key="loading"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center justify-center"
                        >
                          <div className="w-4 h-4 border-2 border-black/70 border-t-transparent rounded-full animate-spin" />
                        </motion.div>
                      ) : (
                        <motion.span
                          key="button-text"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center justify-center gap-1 text-sm font-medium"
                        >
                          Sign In
                          <ArrowRight className="w-3 h-3 group-hover/button:translate-x-1 transition-transform duration-300" />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.button>

                {/* Divider */}
                <div className="relative mt-6 mb-5 flex items-center">
                  <div className="flex-grow border-t border-gray-200"></div>
                  <span className="mx-3 text-xs text-gray-500">
                    or
                  </span>
                  <div className="flex-grow border-t border-gray-200"></div>
                </div>

                {/* Replit Auth button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={onReplitAuth}
                  className="w-full relative group/replit"
                  data-testid="button-signin-replit"
                >
                  <div className="absolute inset-0 bg-green-500/10 rounded-lg blur opacity-0 group-hover/replit:opacity-70 transition-opacity duration-300" />
                  
                  <div className="relative overflow-hidden bg-white border-2 border-green-600 text-green-700 font-medium h-10 rounded-lg hover:bg-green-50 transition-all duration-300 flex items-center justify-center gap-2">
                    <University className="w-4 h-4 text-green-600" />
                    
                    <span className="text-sm">
                      Sign in with Replit Auth
                    </span>
                  </div>
                </motion.button>

                {/* Sign up section */}
                <div className="mt-4 space-y-2">
                  <motion.p 
                    className="text-center text-xs text-gray-600"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    Don't have an account?
                  </motion.p>
                  
                  <Link href="/auth/signup" className="block">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      className="w-full relative group/signup"
                      data-testid="button-signup"
                    >
                      <div className="absolute inset-0 bg-green-500/10 rounded-lg blur opacity-0 group-hover/signup:opacity-70 transition-opacity duration-300" />
                      
                      <div className="relative overflow-hidden bg-white border-2 border-green-600 text-green-700 font-medium h-10 rounded-lg hover:bg-green-50 transition-all duration-300 flex items-center justify-center gap-2">
                        <span className="text-sm">
                          Sign up
                        </span>
                      </div>
                    </motion.button>
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Branding Footer */}
      <div className="fixed bottom-6 right-6 z-10">
        <p className="text-sm text-gray-600 font-medium">
          Morouna Loans by AKM Labs
        </p>
      </div>
    </div>
  );
}