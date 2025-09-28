import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { SignInCard } from "@/components/ui/sign-in-card";

export default function Landing() {
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to dashboard if authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      window.location.href = "/";
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleReplitAuth = () => {
    window.location.href = "/api/login";
  };

  return (
    <SignInCard 
      onReplitAuth={handleReplitAuth}
    />
  );
}