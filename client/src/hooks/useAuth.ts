import { useQuery, useQueryClient } from "@tanstack/react-query";

// Feature flag to switch between auth systems - DISABLED until Supabase is configured
const USE_SUPABASE_AUTH = false; 

export function useAuth() {
  const queryClient = useQueryClient();
  
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

  const clearAuthCache = () => {
    queryClient.removeQueries({ queryKey: ["/api/auth/user"] });
    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
  };

  // Simple return logic - no complex error handling that could cause loops
  return {
    user: replitUser || null,
    isLoading: replitLoading,
    isAuthenticated: !!replitUser,
    authSystem: 'replit' as const,
    clearAuthCache
  };
}