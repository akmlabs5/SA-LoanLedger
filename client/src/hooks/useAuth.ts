import { useQuery } from "@tanstack/react-query";

// Feature flag to switch between auth systems - DISABLED until Supabase is configured
const USE_SUPABASE_AUTH = false; 

export function useAuth() {
  // Replit Auth implementation (default)  
  const { data: replitUser, isLoading: replitLoading, error: replitError } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    enabled: !USE_SUPABASE_AUTH,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
  });

  // Simple return logic - no complex error handling that could cause loops
  return {
    user: replitUser || null,
    isLoading: replitLoading,
    isAuthenticated: !!replitUser,
    authSystem: 'replit' as const
  };
}