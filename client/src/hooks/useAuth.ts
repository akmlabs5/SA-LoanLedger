import { useQuery } from "@tanstack/react-query";

// Feature flag to switch between auth systems - DISABLED until Supabase is configured
const USE_SUPABASE_AUTH = false; 

export function useAuth() {
  // Replit Auth implementation (default)
  const { data: replitUser, isLoading: replitLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    enabled: !USE_SUPABASE_AUTH,
  });

  // Only import and use Supabase if enabled (currently disabled)
  if (USE_SUPABASE_AUTH) {
    // This import would be dynamically loaded when Supabase is enabled
    console.log("Supabase auth is disabled - using Replit auth");
    return {
      user: null,
      isLoading: false,
      isAuthenticated: false,
      authSystem: 'supabase' as const
    };
  }

  return {
    user: replitUser,
    isLoading: replitLoading,
    isAuthenticated: !!replitUser,
    authSystem: 'replit' as const
  };
}