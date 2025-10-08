import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useLocation } from "wouter";
import { Lock, Mail, User, CheckCircle2, Building2, Shield } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import morounaLogo from "@assets/noBgWhite_1759919560002.png";

const signupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  enable2FA: z.boolean().default(false),
  accountType: z.enum(['personal', 'organization']).default('personal'),
  organizationName: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine((data) => {
  if (data.accountType === 'organization' && !data.organizationName?.trim()) {
    return false;
  }
  return true;
}, {
  message: "Organization name is required",
  path: ["organizationName"],
});

type SignupForm = z.infer<typeof signupSchema>;

export default function SupabaseSignupPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [signupComplete, setSignupComplete] = useState(false);

  const form = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      enable2FA: false,
      accountType: 'personal',
      organizationName: "",
    },
  });

  const onSubmit = async (values: SignupForm) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/supabase/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          firstName: values.firstName,
          lastName: values.lastName,
          enable2FA: values.enable2FA,
          accountType: values.accountType,
          organizationName: values.organizationName,
        }),
      });

      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to create account');
      }

      setSignupComplete(true);
      toast({
        title: "Account created!",
        description: data.message || "Please check your email to verify your account.",
      });

      setTimeout(() => {
        setLocation('/unified-login');
      }, 3000);

    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        title: "Sign up failed",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (signupComplete) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 p-4">
        <Card className="w-full max-w-md shadow-2xl bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-white">Account Created!</CardTitle>
            <CardDescription className="text-white/90">
              Please check your email to verify your account before signing in.
            </CardDescription>
          </CardHeader>
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

      <Card className="w-full max-w-md shadow-2xl bg-white/10 backdrop-blur-xl border border-white/20">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-bold text-white">Create Account</CardTitle>
          <CardDescription className="text-white/90">
            Join Morouna Loans today
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white font-medium">First Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
                          <Input 
                            placeholder="First name" 
                            className="pl-11 h-12 rounded-xl bg-white/20 border-white/30 text-white placeholder:text-white/50 focus:border-white/50 focus:ring-white/30 focus:bg-white/25" 
                            {...field} 
                            data-testid="input-first-name"
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-white/90" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white font-medium">Last Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
                          <Input 
                            placeholder="Last name" 
                            className="pl-11 h-12 rounded-xl bg-white/20 border-white/30 text-white placeholder:text-white/50 focus:border-white/50 focus:ring-white/30 focus:bg-white/25" 
                            {...field} 
                            data-testid="input-last-name"
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-white/90" />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white font-medium">Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
                        <Input 
                          type="email" 
                          placeholder="name@example.com" 
                          className="pl-11 h-12 rounded-xl bg-white/20 border-white/30 text-white placeholder:text-white/50 focus:border-white/50 focus:ring-white/30 focus:bg-white/25" 
                          {...field} 
                          data-testid="input-email"
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

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white font-medium">Confirm Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          className="pl-11 h-12 rounded-xl bg-white/20 border-white/30 text-white placeholder:text-white/50 focus:border-white/50 focus:ring-white/30 focus:bg-white/25" 
                          {...field} 
                          data-testid="input-confirm-password"
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-white/90" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accountType"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-white font-medium">Account Type</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-white/10 transition-colors">
                          <RadioGroupItem value="personal" id="personal" className="border-white/50 text-white/70 data-[state=checked]:border-white data-[state=checked]:text-white data-[state=checked]:bg-white/20" />
                          <Label htmlFor="personal" className="text-white font-normal cursor-pointer flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Personal Account
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-white/10 transition-colors">
                          <RadioGroupItem value="organization" id="organization" className="border-white/50 text-white/70 data-[state=checked]:border-white data-[state=checked]:text-white data-[state=checked]:bg-white/20" />
                          <Label htmlFor="organization" className="text-white font-normal cursor-pointer flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            Organization Account
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage className="text-white/90" />
                  </FormItem>
                )}
              />

              {form.watch('accountType') === 'organization' && (
                <FormField
                  control={form.control}
                  name="organizationName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white font-medium">Organization Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
                          <Input 
                            placeholder="Your organization name" 
                            className="pl-11 h-12 rounded-xl bg-white/20 border-white/30 text-white placeholder:text-white/50 focus:border-white/50 focus:ring-white/30 focus:bg-white/25" 
                            {...field} 
                            data-testid="input-organization-name"
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-white/90" />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="enable2FA"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-lg border border-white/20 p-4 bg-white/5">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="border-white/30 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                        data-testid="checkbox-enable-2fa"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-white font-medium cursor-pointer flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Enable Two-Factor Authentication (2FA)
                      </FormLabel>
                      <p className="text-sm text-white/70">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full h-12 text-lg font-semibold bg-green-700 hover:bg-green-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-white" 
                disabled={isLoading}
                data-testid="button-signup"
              >
                {isLoading ? "Creating account..." : "Create Account"}
              </Button>

              <div className="text-center text-sm text-white/80 pt-2">
                Already have an account?{" "}
                <Button
                  variant="link"
                  className="p-0 h-auto font-semibold text-white hover:text-white/90"
                  onClick={() => setLocation('/unified-login')}
                  data-testid="link-signin"
                >
                  Sign In
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
