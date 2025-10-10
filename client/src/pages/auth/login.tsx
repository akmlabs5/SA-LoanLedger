import { useState } from "react";
import { useLocation } from "wouter";
import { SignInCard } from "@/components/ui/sign-in-card";
import { AUTH_CONFIG } from "@/lib/authConfig";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [, setLocation] = useLocation();
  const { signIn } = useSupabaseAuth();
  const { toast } = useToast();

  const handleEmailPasswordSignIn = async (email: string, password: string, rememberMe: boolean) => {
    setIsLoading(true);
    setError("");
    setIdentifier(email);

    try {
      // Determine auth provider based on identifier
      const authProvider = AUTH_CONFIG.getAuthProvider(email);

      if (authProvider === 'replit') {
        // Test account - use Replit Auth
        toast({
          title: "Redirecting to Replit Auth",
          description: "Test account detected. Using Replit authentication...",
        });
        
        // Small delay to show the toast
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      } else {
        // New user - use Supabase Auth
        await signIn(email, password);
        toast({
          title: "Login successful",
          description: "Welcome back to Morouna Loans",
        });
        setLocation('/dashboard');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || "Failed to sign in. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReplitAuth = () => {
    // Direct Replit Auth (for test account or admin)
    window.location.href = "/api/login";
  };

  return (
    <SignInCard
      onSubmit={handleEmailPasswordSignIn}
      onReplitAuth={handleReplitAuth}
      isLoading={isLoading}
      error={error}
    />
  );
}
