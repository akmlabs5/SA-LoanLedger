
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy Supabase client - only created when needed
let _supabaseClient: SupabaseClient | null = null;

function getSupabaseClient() {
  if (!_supabaseClient) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
    }
    
    // Validate URL format
    if (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
      throw new Error(
        `Invalid SUPABASE_URL format. Expected a URL like "https://xxxxx.supabase.co" but got a value starting with "${supabaseUrl.substring(0, 8)}...". ` +
        'Please check your environment secrets and ensure SUPABASE_URL is set to your Supabase project URL, not a secret key.'
      );
    }
    
    _supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  return _supabaseClient;
}

export const supabase = {
  get auth() {
    return getSupabaseClient().auth;
  }
};

// Supabase Auth helper functions
export async function verifySupabaseToken(token: string) {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error) throw error;
    return user;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export async function getSupabaseUser(userId: string) {
  try {
    const { data: { user }, error } = await supabase.auth.admin.getUserById(userId);
    if (error) throw error;
    return user;
  } catch (error) {
    console.error('Failed to get user:', error);
    return null;
  }
}
