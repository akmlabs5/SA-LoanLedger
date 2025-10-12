import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestUser() {
  console.log('🔧 Creating test user in Supabase...');
  
  const email = 'testuser@morounaloans.com';
  const password = 'testuser123';
  
  try {
    // Create user with admin API
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        first_name: 'Test',
        last_name: 'User'
      }
    });
    
    if (error) {
      console.error('❌ Error creating user:', error.message);
      return;
    }
    
    console.log('✅ Test user created successfully!');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('🆔 User ID:', data.user.id);
    console.log('\nYou can now login with these credentials at /unified-login');
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

createTestUser();
