import { z } from "zod";

const configSchema = z.object({
  // Core server configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000').transform(Number),
  
  // Database configuration
  DATABASE_URL: z.string().optional(),
  
  // Replit Auth configuration (required in production)
  REPLIT_DOMAINS: z.string().optional(),
  REPL_ID: z.string().optional(),
  ISSUER_URL: z.string().optional(),
  SESSION_SECRET: z.string().optional(),
  
  // Supabase configuration (optional)
  SUPABASE_URL: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  
  // Email configuration (optional)
  SENDGRID_API_KEY: z.string().optional(),
  SENDGRID_FROM_EMAIL: z.string().default('reminders@aim-labs.com'),
  SENDGRID_AUTH_EMAIL: z.string().default('noreply@akm-labs.com'),
  
  // AI configuration (optional)
  DEEPSEEK_API_KEY: z.string().optional(),
  
  // Admin configuration
  ADMIN_USERNAME: z.string().default('admin'),
  ADMIN_PASSWORD: z.string().default('admin123'),
  
  // Object storage (optional)
  PUBLIC_OBJECT_SEARCH_PATHS: z.string().optional(),
});

export type Config = z.infer<typeof configSchema>;

class ConfigManager {
  private config: Config;
  private warnings: string[] = [];
  
  constructor() {
    const parsed = configSchema.safeParse(process.env);
    
    if (!parsed.success) {
      console.error('❌ Configuration validation failed:');
      console.error(parsed.error.format());
      throw new Error('Invalid configuration');
    }
    
    this.config = parsed.data;
    this.validate();
  }
  
  private validate() {
    // Production-specific validations
    if (this.config.NODE_ENV === 'production') {
      if (!this.config.DATABASE_URL) {
        throw new Error('DATABASE_URL is required in production');
      }
      if (!this.config.SESSION_SECRET) {
        throw new Error('SESSION_SECRET is required in production');
      }
      if (!this.config.REPLIT_DOMAINS || !this.config.REPL_ID) {
        console.warn('⚠️  Replit auth not configured - authentication will not work properly');
        this.warnings.push('Replit auth not configured');
      }
    }
    
    // Optional service warnings
    if (!this.config.SENDGRID_API_KEY) {
      console.log('ℹ️  SendGrid not configured - email notifications disabled');
      this.warnings.push('Email notifications disabled');
    }
    
    if (!this.config.DEEPSEEK_API_KEY) {
      console.log('ℹ️  DeepSeek API not configured - AI insights will use default mode');
      this.warnings.push('AI insights in default mode');
    }
    
    if (!this.config.SUPABASE_URL || !this.config.SUPABASE_ANON_KEY) {
      console.log('ℹ️  Supabase not configured - using Replit auth only');
      this.warnings.push('Supabase auth not configured');
    }
  }
  
  get<K extends keyof Config>(key: K): Config[K] {
    return this.config[key];
  }
  
  has(key: keyof Config): boolean {
    const value = this.config[key];
    return value !== undefined && value !== '' && value !== 'default_key';
  }
  
  isProduction(): boolean {
    return this.config.NODE_ENV === 'production';
  }
  
  isDevelopment(): boolean {
    return this.config.NODE_ENV === 'development';
  }
  
  getWarnings(): string[] {
    return this.warnings;
  }
  
  getAll(): Config {
    return { ...this.config };
  }
}

// Export singleton instance
export const config = new ConfigManager();
