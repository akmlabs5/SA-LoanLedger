
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
