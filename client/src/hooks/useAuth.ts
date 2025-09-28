import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";

// Feature flag to switch between auth systems - DISABLED for development, enable for production
const USE_SUPABASE_AUTH = false; // Change to true when ready for production

export function useAuth() {
  const queryClient = useQueryClient();
  
  // Always call hooks - React requires consistent hook order
  const supabaseAuth = useSupabaseAuth();
  
  if (USE_SUPABASE_AUTH) {
    // Use Supabase auth when configured
    return {
      user: supabaseAuth.user,
      isLoading: supabaseAuth.isLoading,
      isAuthenticated: !!supabaseAuth.user,
      authSystem: 'supabase' as const,
      clearAuthCache: () => {} // Not needed for Supabase
    };
  }
  
  // Replit Auth implementation (default)  
  const { data: replitUser, isLoading: replitLoading, error: replitError } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
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