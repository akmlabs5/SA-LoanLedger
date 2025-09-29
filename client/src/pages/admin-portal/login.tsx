import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { AdminAuthCard } from "@/components/admin/AdminAuthCard";
import { useAdminAuth } from "@/hooks/useAdminAuth";

export default function AdminLoginPage() {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { isAdminAuthenticated, refreshAuth } = useAdminAuth();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAdminAuthenticated) {
      setLocation("/admin-portal/dashboard");
    }
  }, [isAdminAuthenticated, setLocation]);

  const handleAdminLogin = async (username: string, password: string) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Authentication failed');
      }

      const data = await response.json();
      
      // Store admin session data
      localStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_user', JSON.stringify(data.admin));
      
      // Refresh authentication state to pick up the new tokens
      refreshAuth();
      
      // The useEffect will handle the redirect once isAdminAuthenticated becomes true
    } catch (error: any) {
      setError(error.message || "Failed to authenticate");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminAuthCard
      onSubmit={handleAdminLogin}
      isLoading={isLoading}
      error={error}
    />
  );
}