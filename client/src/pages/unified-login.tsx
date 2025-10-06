import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Lock, Mail, Shield } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import morounaLogo from "@assets/with_padding (1)_1759754533676.png";

const loginSchema = z.object({
  identifier: z.string().min(1, "Email or username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function UnifiedLoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [otpValue, setOtpValue] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  const isEmailFormat = (str: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
  };

  const onSubmit = async (values: LoginForm) => {
    setIsLoading(true);
    const isEmail = isEmailFormat(values.identifier);

    try {
      if (isEmail) {
        // User login with Supabase
        const response = await fetch('/api/auth/supabase/signin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: values.identifier,
            password: values.password,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Failed to sign in');
        }

        if (data.requires2FA) {
          setRequires2FA(true);
          setUserEmail(data.email);
          toast({
            title: "2FA Required",
            description: data.message || "Please check your email for the verification code",
          });
        } else {
          if (data.session) {
            localStorage.setItem('supabase_session', JSON.stringify(data.session));
          }
          
          toast({
            title: "Welcome back!",
            description: "Successfully signed in",
          });
          
          setLocation('/');
        }
      } else {
        // Admin login
        const response = await fetch('/api/admin/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: values.identifier,
            password: values.password,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Authentication failed');
        }

        const data = await response.json();
        
        localStorage.setItem('admin_token', data.token);
        localStorage.setItem('admin_user', JSON.stringify(data.admin));
        
        toast({
          title: "Admin access granted",
          description: "Welcome to the admin portal",
        });

        try {
          setLocation("/admin-portal/dashboard");
        } catch {
          window.location.href = "/admin-portal/dashboard";
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Sign in failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (otpValue.length !== 6) {
      toast({
        title: "Invalid code",
        description: "Please enter the 6-digit code",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    try {
      const response = await fetch('/api/auth/supabase/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          token: otpValue,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Invalid verification code');
      }

      if (data.session) {
        localStorage.setItem('supabase_session', JSON.stringify(data.session));
      }

      toast({
        title: "Welcome back!",
        description: "Successfully signed in with 2FA",
      });

      setLocation('/');
    } catch (error: any) {
      console.error('OTP verification error:', error);
      toast({
        title: "Verification failed",
        description: error.message || "Invalid or expired code",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  if (requires2FA) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 p-4">
        <Card className="w-full max-w-md shadow-2xl bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mb-4">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-center text-white">Two-Factor Authentication</CardTitle>
            <CardDescription className="text-center text-white/80">
              Enter the 6-digit code sent to {userEmail}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <InputOTP 
                maxLength={6} 
                value={otpValue} 
                onChange={setOtpValue}
                data-testid="input-otp"
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button 
              onClick={verifyOTP} 
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-white" 
              disabled={isVerifying || otpValue.length !== 6}
              data-testid="button-verify-otp"
            >
              {isVerifying ? "Verifying..." : "Verify Code"}
            </Button>

            <div className="text-center">
              <Button
                variant="link"
                className="text-white/90 hover:text-white"
                onClick={() => {
                  setRequires2FA(false);
                  setOtpValue("");
                }}
                data-testid="button-back"
              >
                Back to sign in
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 p-4">
      {/* Logo and Brand */}
      <div className="text-center mb-8">
        <div className="mx-auto w-24 h-24 mb-6 rounded-full bg-white/20 backdrop-blur-sm p-4 shadow-xl">
          <img src={morounaLogo} alt="Morouna Loans" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Morouna Loans</h1>
        <p className="text-white/90 text-lg font-light">Manage Your Financial Journey</p>
      </div>

      {/* Login Card */}
      <Card className="w-full max-w-md shadow-2xl bg-white/10 backdrop-blur-xl border border-white/20">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-bold text-white">Welcome Back</CardTitle>
          <CardDescription className="text-white/90">
            Sign in to continue your financial journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="identifier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white font-medium">Email Address</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
                        <Input 
                          type="text" 
                          placeholder="name@example.com" 
                          className="pl-11 h-12 rounded-xl bg-white/20 border-white/30 text-white placeholder:text-white/50 focus:border-white/50 focus:ring-white/30 focus:bg-white/25" 
                          {...field} 
                          data-testid="input-identifier"
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-white/90" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white font-medium">Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          className="pl-11 h-12 rounded-xl bg-white/20 border-white/30 text-white placeholder:text-white/50 focus:border-white/50 focus:ring-white/30 focus:bg-white/25" 
                          {...field} 
                          data-testid="input-password"
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-white/90" />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full h-12 text-lg font-semibold bg-cyan-500 hover:bg-cyan-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-white" 
                disabled={isLoading}
                data-testid="button-signin"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>

              <div className="text-center text-sm text-white/80 pt-2">
                Don't have an account?{" "}
                <Button
                  variant="link"
                  className="p-0 h-auto font-semibold text-white hover:text-white/90"
                  onClick={() => setLocation('/supabase-signup')}
                  data-testid="link-signup"
                >
                  Create Account
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Footer Tagline */}
      <p className="text-white/80 text-sm mt-8 text-center max-w-md">
        Intelligent loan portfolio management for the Saudi Arabian market
      </p>
    </div>
  );
}
