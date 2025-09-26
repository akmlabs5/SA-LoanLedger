import { useQuery } from "@tanstack/react-query";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";

// Feature flag to switch between auth systems
const USE_SUPABASE_AUTH = import.meta.env.VITE_SUPABASE_URL && 
  import.meta.env.VITE_SUPABASE_ANON_KEY;

export function useAuth() {
  // Supabase Auth
  const supabaseAuth = useSupabaseAuth();
  
  // Replit Auth implementation
  const { data: replitUser, isLoading: replitLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    enabled: !USE_SUPABASE_AUTH,
  });

  if (USE_SUPABASE_AUTH) {
    return {
      user: supabaseAuth.user,
      isLoading: supabaseAuth.isLoading,
      isAuthenticated: !!supabaseAuth.user,
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
