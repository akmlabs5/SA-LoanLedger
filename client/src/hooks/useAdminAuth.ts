import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

interface AdminUser {
  name: string;
  username: string;
  role: string;
}

export function useAdminAuth() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [authCheckTrigger, setAuthCheckTrigger] = useState(0);
  const [isInitializing, setIsInitializing] = useState(true);

  // Check for stored admin token
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    const user = localStorage.getItem('admin_user');
    
    if (token && user) {
      setIsAdminAuthenticated(true);
      setAdminUser(JSON.parse(user));
    } else {
      setIsAdminAuthenticated(false);
      setAdminUser(null);
    }
    setIsInitializing(false);
  }, [authCheckTrigger]); // Re-run when authCheckTrigger changes

  // Query to validate admin session
  const { data: sessionValid, isLoading, error } = useQuery({
    queryKey: ['/api/admin/auth/me'],
    queryFn: async () => {
      const token = localStorage.getItem('admin_token');
      if (!token) throw new Error('No admin token');
      
      const response = await fetch('/api/admin/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Admin session invalid');
      }
      return response.json();
    },
    enabled: isAdminAuthenticated,
    retry: 1, // Retry once in case of server restart
    retryDelay: 1000, // Wait 1 second before retry
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Handle session validation errors
  useEffect(() => {
    if (error && isAdminAuthenticated) {
      // Session validation failed, clear auth state
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      setIsAdminAuthenticated(false);
      setAdminUser(null);
    }
  }, [error, isAdminAuthenticated]);

  const signOut = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setIsAdminAuthenticated(false);
    setAdminUser(null);
    window.location.href = '/admin-portal/login';
  };

  const refreshAuth = () => {
    setIsInitializing(true);
    setAuthCheckTrigger(prev => prev + 1);
  };

  return {
    isAdminAuthenticated: isAdminAuthenticated && (sessionValid !== undefined ? !!sessionValid : true),
    adminUser,
    isLoading: isInitializing || isLoading,
    signOut,
    refreshAuth
  };
}