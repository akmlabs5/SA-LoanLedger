// Authentication configuration for dual auth system

export const AUTH_CONFIG = {
  // Test account that uses Replit Auth
  TEST_ACCOUNT_EMAIL: 'test@morounaloans.com',
  TEST_ACCOUNT_USERNAME: 'testuser',
  TEST_ACCOUNT_PASSWORD: 'Testuser123', // For reference only, actual auth via Replit
  
  // Auth provider detection
  isTestAccount: (identifier: string): boolean => {
    const normalizedIdentifier = identifier.toLowerCase().trim();
    return (
      normalizedIdentifier === AUTH_CONFIG.TEST_ACCOUNT_EMAIL.toLowerCase() ||
      normalizedIdentifier === AUTH_CONFIG.TEST_ACCOUNT_USERNAME.toLowerCase()
    );
  },
  
  // Determine which auth provider to use based on identifier
  getAuthProvider: (identifier: string): 'replit' | 'supabase' => {
    return AUTH_CONFIG.isTestAccount(identifier) ? 'replit' : 'supabase';
  }
};
