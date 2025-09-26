import { useQuery } from "@tanstack/react-query";

// Feature flag to switch between auth systems
const USE_SUPABASE_AUTH = process.env.NODE_ENV === 'production' && 
  import.meta.env.VITE_SUPABASE_URL && 
  import.meta.env.VITE_SUPABASE_ANON_KEY;

export function useAuth() {
  // Current Replit Auth implementation
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    enabled: !USE_SUPABASE_AUTH,
  });

  // TODO: When ready to migrate, we'll use:
  // const supabaseAuth = useSupabaseAuth();
  // return USE_SUPABASE_AUTH ? supabaseAuth : { user, isLoading, isAuthenticated: !!user };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    authSystem: USE_SUPABASE_AUTH ? 'supabase' : 'replit'
  };
}
