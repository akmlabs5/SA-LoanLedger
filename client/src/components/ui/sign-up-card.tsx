import { useState } from 'react';
import { Link } from 'wouter';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Mail, Lock, Eye, EyeClosed, ArrowRight, User, Building2 } from 'lucide-react';
import { SiReplit } from 'react-icons/si';
import { cn } from "@/lib/utils";
import morounaLogo from "@assets/with_padding_1759917358345.png";

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

interface SignUpCardProps {
  onSubmit?: (firstName: string, lastName: string, email: string, password: string, agreeToTerms: boolean, enable2FA: boolean, accountType: 'personal' | 'organization', organizationName?: string) => Promise<void>;
  onReplitAuth?: () => void;
  isLoading?: boolean;
  error?: string;
}

export function SignUpCard({ onSubmit, onReplitAuth, isLoading: externalLoading = false, error }: SignUpCardProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [enable2FA, setEnable2FA] = useState(false);
  const [accountType, setAccountType] = useState<'personal' | 'organization'>('personal');
  const [organizationName, setOrganizationName] = useState("");

  const loading = isLoading || externalLoading;

  // For 3D card effect
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
    
    if (password !== confirmPassword) {
      return; // Password validation will be shown in UI
    }
    
    if (!agreeToTerms) {
      return; // Terms validation will be shown in UI
    }
    
    if (accountType === 'organization' && !organizationName.trim()) {
      return; // Organization name required for organization accounts
    }
    
    if (onSubmit) {
      setIsLoading(true);
      try {
        await onSubmit(firstName, lastName, email, password, agreeToTerms, enable2FA, accountType, organizationName || undefined);
      } catch (error) {
        // Error handling is done by parent
      } finally {
        setIsLoading(false);
      }
    }
  };

  const passwordsMatch = password === confirmPassword || confirmPassword === "";
  const canSubmit = firstName && lastName && email && password && confirmPassword && passwordsMatch && agreeToTerms && (accountType === 'personal' || organizationName.trim()) && !loading;

  return (
    <div className="min-h-screen w-screen bg-black relative overflow-hidden flex items-center justify-center">
      {/* Background gradient effect - blue/green for sign up */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/20 via-green-600/20 to-black" />
      
      {/* Subtle noise texture overlay */}
      <div className="absolute inset-0 opacity-[0.03] mix-blend-soft-light" 
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px'
        }}
      />

      {/* Top radial glow */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[120vh] h-[60vh] rounded-b-[50%] bg-blue-400/10 blur-[80px]" />
      <motion.div 
        className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[100vh] h-[60vh] rounded-b-full bg-blue-300/15 blur-[60px]"
        animate={{ 
          opacity: [0.15, 0.3, 0.15],
          scale: [0.98, 1.02, 0.98]
        }}
        transition={{ 
          duration: 8, 
          repeat: Infinity,
          repeatType: "mirror"
        }}
      />
      <motion.div 
        className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[90vh] h-[90vh] rounded-t-full bg-green-400/15 blur-[60px]"
        animate={{ 
          opacity: [0.3, 0.5, 0.3],
          scale: [1, 1.1, 1]
        }}
        transition={{ 
          duration: 6, 
          repeat: Infinity,
          repeatType: "mirror",
          delay: 1
        }}
      />

      {/* Animated glow spots */}
      <div className="absolute left-1/4 top-1/4 w-96 h-96 bg-white/5 rounded-full blur-[100px] animate-pulse opacity-40" />
      <div className="absolute right-1/4 bottom-1/4 w-96 h-96 bg-white/5 rounded-full blur-[100px] animate-pulse delay-1000 opacity-40" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md relative z-10"
        style={{ perspective: 1500 }}
      >
        <motion.div
          className="relative"
          style={{ rotateX, rotateY }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          whileHover={{ z: 10 }}
        >
          <div className="relative group">
            {/* Card glow effect */}
            <motion.div 
              className="absolute -inset-[1px] rounded-2xl opacity-0 lg:group-hover:opacity-70 transition-opacity duration-700"
              animate={{
                boxShadow: [
                  "0 0 10px 2px rgba(255,255,255,0.03)",
                  "0 0 15px 5px rgba(255,255,255,0.05)",
                  "0 0 10px 2px rgba(255,255,255,0.03)"
                ],
                opacity: [0.2, 0.4, 0.2]
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity, 
                ease: "easeInOut", 
                repeatType: "mirror" 
              }}
            />

            {/* Traveling light beam effect - same as sign in */}
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
            </div>

            {/* Card border glow */}
            <div className="absolute -inset-[0.5px] rounded-2xl bg-gradient-to-r from-white/3 via-white/7 to-white/3 opacity-0 lg:group-hover:opacity-70 transition-opacity duration-500" />
            
            {/* Glass card background */}
            <div className="relative bg-black/40 backdrop-blur-xl rounded-2xl p-6 border border-white/[0.05] shadow-2xl overflow-hidden">
              {/* Subtle card inner patterns */}
              <div className="absolute inset-0 opacity-[0.03]" 
                style={{
                  backgroundImage: `linear-gradient(135deg, white 0.5px, transparent 0.5px), linear-gradient(45deg, white 0.5px, transparent 0.5px)`,
                  backgroundSize: '30px 30px'
                }}
              />

              {/* Logo and header */}
              <div className="text-center space-y-1 mb-5">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", duration: 0.8 }}
                  className="mx-auto mb-2"
                >
                  <img src={morounaLogo} alt="Morouna Loans" className="h-20 w-auto object-contain" />
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/80"
                >
                  Create Account
                </motion.h1>
                
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-white/60 text-xs"
                >
                  Join Morouna Loans platform
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

              {/* Sign up form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <motion.div className="space-y-3">
                  {/* Name inputs row */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* First Name input */}
                    <motion.div 
                      className={`relative ${focusedInput === "firstName" ? 'z-10' : ''}`}
                      whileFocus={{ scale: 1.02 }}
                      whileHover={{ scale: 1.01 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    >
                      <div className="relative flex items-center overflow-hidden rounded-lg">
                        <User className={`absolute left-3 w-4 h-4 transition-all duration-300 ${
                          focusedInput === "firstName" ? 'text-white' : 'text-white/40'
                        }`} />
                        
                        <Input
                          type="text"
                          placeholder="First name"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          onFocus={() => setFocusedInput("firstName")}
                          onBlur={() => setFocusedInput(null)}
                          className="w-full bg-white/5 border-transparent focus:border-white/20 text-white placeholder:text-white/30 h-10 transition-all duration-300 pl-10 pr-3 focus:bg-white/10"
                          data-testid="input-first-name"
                          required
                        />
                      </div>
                    </motion.div>

                    {/* Last Name input */}
                    <motion.div 
                      className={`relative ${focusedInput === "lastName" ? 'z-10' : ''}`}
                      whileFocus={{ scale: 1.02 }}
                      whileHover={{ scale: 1.01 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    >
                      <div className="relative flex items-center overflow-hidden rounded-lg">
                        <Input
                          type="text"
                          placeholder="Last name"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          onFocus={() => setFocusedInput("lastName")}
                          onBlur={() => setFocusedInput(null)}
                          className="w-full bg-white/5 border-transparent focus:border-white/20 text-white placeholder:text-white/30 h-10 transition-all duration-300 px-3 focus:bg-white/10"
                          data-testid="input-last-name"
                          required
                        />
                      </div>
                    </motion.div>
                  </div>

                  {/* Account Type Selector */}
                  <div className="space-y-2">
                    <label className="text-white/70 text-xs font-medium">Account Type</label>
                    <div className="grid grid-cols-2 gap-3">
                      <motion.button
                        type="button"
                        onClick={() => setAccountType('personal')}
                        className={`relative h-10 rounded-lg border transition-all duration-300 ${
                          accountType === 'personal' 
                            ? 'bg-white/10 border-white/30 text-white' 
                            : 'bg-white/5 border-transparent text-white/50 lg:hover:bg-white/7'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        data-testid="button-account-personal"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <User className="w-4 h-4" />
                          <span className="text-sm">Personal</span>
                        </div>
                      </motion.button>

                      <motion.button
                        type="button"
                        onClick={() => setAccountType('organization')}
                        className={`relative h-10 rounded-lg border transition-all duration-300 ${
                          accountType === 'organization' 
                            ? 'bg-white/10 border-white/30 text-white' 
                            : 'bg-white/5 border-transparent text-white/50 lg:hover:bg-white/7'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        data-testid="button-account-organization"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <Building2 className="w-4 h-4" />
                          <span className="text-sm">Organization</span>
                        </div>
                      </motion.button>
                    </div>
                  </div>

                  {/* Organization Name (conditional) */}
                  <AnimatePresence>
                    {accountType === 'organization' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className={`relative ${focusedInput === "organizationName" ? 'z-10' : ''}`}
                      >
                        <div className="relative flex items-center overflow-hidden rounded-lg">
                          <Building2 className={`absolute left-3 w-4 h-4 transition-all duration-300 ${
                            focusedInput === "organizationName" ? 'text-white' : 'text-white/40'
                          }`} />
                          
                          <Input
                            type="text"
                            placeholder="Organization name"
                            value={organizationName}
                            onChange={(e) => setOrganizationName(e.target.value)}
                            onFocus={() => setFocusedInput("organizationName")}
                            onBlur={() => setFocusedInput(null)}
                            className="w-full bg-white/5 border-transparent focus:border-white/20 text-white placeholder:text-white/30 h-10 transition-all duration-300 pl-10 pr-3 focus:bg-white/10"
                            data-testid="input-organization-name"
                            required={accountType === 'organization'}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Email input */}
                  <motion.div 
                    className={`relative ${focusedInput === "email" ? 'z-10' : ''}`}
                    whileFocus={{ scale: 1.02 }}
                    whileHover={{ scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <div className="relative flex items-center overflow-hidden rounded-lg">
                      <Mail className={`absolute left-3 w-4 h-4 transition-all duration-300 ${
                        focusedInput === "email" ? 'text-white' : 'text-white/40'
                      }`} />
                      
                      <Input
                        type="email"
                        placeholder="Email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => setFocusedInput("email")}
                        onBlur={() => setFocusedInput(null)}
                        className="w-full bg-white/5 border-transparent focus:border-white/20 text-white placeholder:text-white/30 h-10 transition-all duration-300 pl-10 pr-3 focus:bg-white/10"
                        data-testid="input-email"
                        required
                      />
                    </div>
                  </motion.div>

                  {/* Password input */}
                  <motion.div 
                    className={`relative ${focusedInput === "password" ? 'z-10' : ''}`}
                    whileFocus={{ scale: 1.02 }}
                    whileHover={{ scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <div className="relative flex items-center overflow-hidden rounded-lg">
                      <Lock className={`absolute left-3 w-4 h-4 transition-all duration-300 ${
                        focusedInput === "password" ? 'text-white' : 'text-white/40'
                      }`} />
                      
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setFocusedInput("password")}
                        onBlur={() => setFocusedInput(null)}
                        className="w-full bg-white/5 border-transparent focus:border-white/20 text-white placeholder:text-white/30 h-10 transition-all duration-300 pl-10 pr-10 focus:bg-white/10"
                        data-testid="input-password"
                        required
                      />
                      
                      {/* Toggle password visibility */}
                      <div 
                        onClick={() => setShowPassword(!showPassword)} 
                        className="absolute right-3 cursor-pointer"
                        data-testid="button-toggle-password"
                      >
                        {showPassword ? (
                          <Eye className="w-4 h-4 text-white/40 lg:hover:text-white transition-colors duration-300" />
                        ) : (
                          <EyeClosed className="w-4 h-4 text-white/40 lg:hover:text-white transition-colors duration-300" />
                        )}
                      </div>
                    </div>
                  </motion.div>

                  {/* Confirm Password input */}
                  <motion.div 
                    className={`relative ${focusedInput === "confirmPassword" ? 'z-10' : ''}`}
                    whileFocus={{ scale: 1.02 }}
                    whileHover={{ scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <div className="relative flex items-center overflow-hidden rounded-lg">
                      <Lock className={`absolute left-3 w-4 h-4 transition-all duration-300 ${
                        focusedInput === "confirmPassword" ? 'text-white' : 'text-white/40'
                      }`} />
                      
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Confirm password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onFocus={() => setFocusedInput("confirmPassword")}
                        onBlur={() => setFocusedInput(null)}
                        className={`w-full bg-white/5 border-transparent focus:border-white/20 text-white placeholder:text-white/30 h-10 transition-all duration-300 pl-10 pr-3 focus:bg-white/10 ${
                          !passwordsMatch ? 'border-red-500/50' : ''
                        }`}
                        data-testid="input-confirm-password"
                        required
                      />
                    </div>
                    {!passwordsMatch && confirmPassword && (
                      <motion.p 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-400 text-xs mt-1"
                      >
                        Passwords don't match
                      </motion.p>
                    )}
                  </motion.div>
                </motion.div>

                {/* Terms and conditions */}
                <div className="flex items-start space-x-2 pt-1">
                  <div className="relative mt-1">
                    <input
                      id="agree-terms"
                      name="agree-terms"
                      type="checkbox"
                      checked={agreeToTerms}
                      onChange={() => setAgreeToTerms(!agreeToTerms)}
                      className="appearance-none h-4 w-4 rounded border border-white/20 bg-white/5 checked:bg-white checked:border-white focus:outline-none focus:ring-1 focus:ring-white/30 transition-all duration-200"
                      data-testid="checkbox-agree-terms"
                    />
                    {agreeToTerms && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute inset-0 flex items-center justify-center text-black pointer-events-none"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </motion.div>
                    )}
                  </div>
                  <label htmlFor="agree-terms" className="text-xs text-white/60 lg:hover:text-white/80 transition-colors duration-200 leading-relaxed">
                    I agree to the{' '}
                    <Link href="/terms" className="text-white underline lg:hover:text-white/80">
                      Terms of Service
                    </Link>
                    {' '}and{' '}
                    <Link href="/privacy" className="text-white underline lg:hover:text-white/80">
                      Privacy Policy
                    </Link>
                  </label>
                </div>

                {/* 2FA Toggle */}
                <div className="flex items-start space-x-2 pt-3">
                  <div className="relative mt-1">
                    <input
                      id="enable-2fa"
                      name="enable-2fa"
                      type="checkbox"
                      checked={enable2FA}
                      onChange={() => setEnable2FA(!enable2FA)}
                      className="appearance-none h-4 w-4 rounded border border-white/20 bg-white/5 checked:bg-cyan-500 checked:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-400/30 transition-all duration-200"
                      data-testid="checkbox-enable-2fa"
                    />
                    {enable2FA && (
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
                  <label htmlFor="enable-2fa" className="text-xs text-white/60 lg:hover:text-white/80 transition-colors duration-200 leading-relaxed">
                    Enable Two-Factor Authentication (2FA) for enhanced security
                  </label>
                </div>

                {/* Email/Password Sign up button */}
                <motion.button
                  whileHover={{ scale: canSubmit ? 1.02 : 1 }}
                  whileTap={{ scale: canSubmit ? 0.98 : 1 }}
                  type="submit"
                  disabled={!canSubmit}
                  className={`w-full relative group/button mt-5 ${!canSubmit ? 'opacity-50 cursor-not-allowed' : ''}`}
                  data-testid="button-signup-email"
                >
                  {/* Button glow effect */}
                  <div className={`absolute inset-0 bg-white/10 rounded-lg blur-lg opacity-0 transition-opacity duration-300 ${canSubmit ? 'group-hover/button:opacity-70' : ''}`} />
                  
                  <div className="relative overflow-hidden bg-white text-black font-medium h-10 rounded-lg transition-all duration-300 flex items-center justify-center">
                    {/* Button background animation */}
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 -z-10"
                      animate={{ 
                        x: ['-100%', '100%'],
                      }}
                      transition={{ 
                        duration: 1.5, 
                        ease: "easeInOut", 
                        repeat: Infinity,
                        repeatDelay: 1
                      }}
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
                          Create Account
                          <ArrowRight className={`w-3 h-3 transition-transform duration-300 ${canSubmit ? 'group-hover/button:translate-x-1' : ''}`} />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.button>

                {/* Divider */}
                <div className="relative mt-6 mb-5 flex items-center">
                  <div className="flex-grow border-t border-white/5"></div>
                  <motion.span 
                    className="mx-3 text-xs text-white/40"
                    initial={{ opacity: 0.7 }}
                    animate={{ opacity: [0.7, 0.9, 0.7] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  >
                    or
                  </motion.span>
                  <div className="flex-grow border-t border-white/5"></div>
                </div>

                {/* Replit Auth button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={onReplitAuth}
                  className="w-full relative group/replit"
                  data-testid="button-signup-replit"
                >
                  <div className="absolute inset-0 bg-green-500/10 rounded-lg blur opacity-0 group-hover/replit:opacity-70 transition-opacity duration-300" />
                  
                  <div className="relative overflow-hidden bg-green-600/20 text-white font-medium h-10 rounded-lg border border-green-500/30 lg:hover:border-green-400/50 transition-all duration-300 flex items-center justify-center gap-2">
                    <SiReplit className="w-4 h-4 text-green-400" />
                    
                    <span className="text-white/90 group-hover/replit:text-white transition-colors text-sm">
                      Sign up with Replit Auth
                    </span>
                    
                    {/* Button hover effect */}
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-green-500/0 via-green-500/10 to-green-500/0"
                      initial={{ x: '-100%' }}
                      whileHover={{ x: '100%' }}
                      transition={{ 
                        duration: 1, 
                        ease: "easeInOut"
                      }}
                    />
                  </div>
                </motion.button>

                {/* Sign in link */}
                <motion.p 
                  className="text-center text-xs text-white/60 mt-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  Already have an account?{' '}
                  <Link 
                    href="/auth/login" 
                    className="relative inline-block group/signin"
                  >
                    <span className="relative z-10 text-white group-hover/signin:text-white/70 transition-colors duration-300 font-medium">
                      Sign in
                    </span>
                    <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-white group-hover/signin:w-full transition-all duration-300" />
                  </Link>
                </motion.p>
              </form>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}