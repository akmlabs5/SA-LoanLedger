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
    console.warn("DATABASE_URL not set. Running with in-memory storage only.");
    return false;
  }

  try {
    console.log("Attempting to connect to database...");
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    // Test connection with timeout
    const testQuery = await Promise.race([
      pool.query('SELECT 1'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Database connection timeout')), 5000))
    ]);
    
    db = drizzle({ client: pool, schema });
    dbAvailable = true;
    console.log("✅ Database connection successful");
    return true;
  } catch (error) {
    console.warn("⚠️ Database connection failed, falling back to in-memory storage:", (error as Error).message);
    dbAvailable = false;
    pool = null;
    db = null;
    return false;
  }
}

// Export database objects and utilities
export { pool, db, dbAvailable, initializeDatabase };