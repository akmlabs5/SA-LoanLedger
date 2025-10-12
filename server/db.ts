import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Database health status
let dbAvailable = false;
let pool: Pool | null = null;
let db: any = null;

// Initialize database connection with health check
async function initializeDatabase() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL not set. Running with in-memory storage only.");
    return false;
  }

  try {
    console.log("🔌 Attempting to connect to database...");
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    // Test connection with longer timeout for Replit environment
    let timeoutId: NodeJS.Timeout;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('Database connection timeout')), 15000);
    });
    
    const testQuery = await Promise.race([
      pool.query('SELECT 1'),
      timeoutPromise
    ]);
    
    clearTimeout(timeoutId!);
    
    db = drizzle({ client: pool, schema });
    dbAvailable = true;
    console.log("✅ Database connection successful - Using PostgreSQL");
    return true;
  } catch (error) {
    console.error("❌ Database connection failed, falling back to in-memory storage:");
    console.error("   Error:", (error as Error).message);
    console.error("   DATABASE_URL exists:", !!process.env.DATABASE_URL);
    dbAvailable = false;
    pool = null;
    db = null;
    return false;
  }
}

// Export database objects and utilities
export { pool, db, dbAvailable, initializeDatabase };