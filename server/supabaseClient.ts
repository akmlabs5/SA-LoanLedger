
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
