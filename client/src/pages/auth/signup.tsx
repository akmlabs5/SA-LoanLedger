import { useState } from "react";
import { useLocation } from "wouter";
import { SignUpCard } from "@/components/ui/sign-up-card";

export default function SignUpPage() {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();

  const handleEmailPasswordSignUp = async (firstName: string, lastName: string, email: string, password: string, agreeToTerms: boolean, enable2FA: boolean) => {
    setIsLoading(true);
    setError("");

    try {
      // For now, this is a placeholder for custom email/password auth
      // You can integrate with Supabase or your custom auth system here
      throw new Error("Email/password registration not yet implemented. Please use Replit Auth.");
    } catch (error: any) {
      setError(error.message || "Failed to create account");
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
    <SignUpCard
      onSubmit={handleEmailPasswordSignUp}
      onReplitAuth={handleReplitAuth}
      isLoading={isLoading}
      error={error}
    />
  );
}