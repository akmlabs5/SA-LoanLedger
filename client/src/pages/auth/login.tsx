import { useState } from "react";
import { useLocation } from "wouter";
import { SignInCard } from "@/components/ui/sign-in-card";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();

  const handleEmailPasswordSignIn = async (email: string, password: string, rememberMe: boolean) => {
    setIsLoading(true);
    setError("");

    try {
      // For now, this is a placeholder for custom email/password auth
      // You can integrate with Supabase or your custom auth system here
      throw new Error("Email/password authentication not yet implemented. Please use Replit Auth.");
    } catch (error: any) {
      setError(error.message || "Failed to sign in");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleReplitAuth = () => {
    // Redirect to Replit Auth endpoint
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