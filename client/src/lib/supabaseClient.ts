
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Helper function to validate URL
const isValidUrl = (url: string): boolean => {
  if (!url || url.trim() === '') return false;
  try {
    new URL(url);
    return url.startsWith('http://') || url.startsWith('https://');
  } catch {
    return false;
  }
};

// Only initialize Supabase client if environment variables are properly configured
// This prevents initialization errors when Supabase is disabled
export const supabase = isValidUrl(supabaseUrl) && supabaseAnonKey && supabaseAnonKey.trim() !== ''
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
