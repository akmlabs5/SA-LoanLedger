
import type { Express, RequestHandler } from "express";
import { supabase, verifySupabaseToken } from "./supabaseClient";
import { storage } from "./storage";

export async function setupSupabaseAuth(app: Express, databaseAvailable = true) {
  console.log("🔧 Supabase Auth setup initialized");
  
  // Auth routes for Supabase
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const { email, password, userData } = req.body;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });
      
      if (error) throw error;
      
      res.json({ user: data.user, session: data.session });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(400).json({ message: "Failed to create account" });
    }
  });

  app.post('/api/auth/signin', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      res.json({ user: data.user, session: data.session });
    } catch (error) {
      console.error("Signin error:", error);
      res.status(400).json({ message: "Invalid credentials" });
    }
  });

  app.post('/api/auth/signout', async (req, res) => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      res.json({ message: "Signed out successfully" });
    } catch (error) {
      console.error("Signout error:", error);
      res.status(500).json({ message: "Failed to sign out" });
    }
  });

  app.post('/api/auth/refresh', async (req, res) => {
    try {
      const { refresh_token } = req.body;
      
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token
      });
      
      if (error) throw error;
      
      res.json({ session: data.session });
    } catch (error) {
      console.error("Refresh error:", error);
      res.status(401).json({ message: "Failed to refresh session" });
    }
  });
}

export const isSupabaseAuthenticated: RequestHandler = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "No token provided" });
    }
    
    const token = authHeader.split(' ')[1];
    const user = await verifySupabaseToken(token);
    
    if (!user) {
      return res.status(401).json({ message: "Invalid token" });
    }
    
    // Attach user to request
    (req as any).user = {
      claims: {
        sub: user.id,
        email: user.email,
        first_name: user.user_metadata?.first_name || '',
        last_name: user.user_metadata?.last_name || '',
        profile_image_url: user.user_metadata?.avatar_url
      }
    };
    
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ message: "Authentication failed" });
  }
};
