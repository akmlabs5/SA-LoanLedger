
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Only initialize Supabase client if environment variables are properly configured
// This prevents initialization errors when Supabase is disabled
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export type User = {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  profile_image_url?: string;
};

export type AuthSession = {
  access_token: string;
  refresh_token: string;
  user: User;
};
