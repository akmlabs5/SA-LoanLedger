
import type { Express, RequestHandler } from "express";
import { supabase, verifySupabaseToken } from "./supabaseClient";
import { storage } from "./storage";

export async function setupSupabaseAuth(app: Express, databaseAvailable = true) {
  console.log("🔧 Supabase Auth setup initialized");
  
  app.post('/api/auth/supabase/signup', async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName
          }
        }
      });
      
      if (error) throw error;
      
      if (!data.user) {
        return res.status(400).json({ message: "Failed to create account" });
      }
      
      if (databaseAvailable) {
        await storage.upsertUser({
          id: data.user.id,
          email: data.user.email || email,
          firstName,
          lastName,
          twoFactorEnabled: false
        });
      }
      
      res.json({ 
        success: true,
        user: data.user,
        session: data.session,
        message: "Account created successfully. Please check your email to verify your account."
      });
    } catch (error: any) {
      console.error("Signup error:", error);
      res.status(400).json({ 
        success: false,
        message: error.message || "Failed to create account" 
      });
    }
  });

  app.post('/api/auth/supabase/signin', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      if (!data.user) {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
      }
      
      let user = null;
      if (databaseAvailable) {
        user = await storage.getUser(data.user.id);
        
        if (user && user.twoFactorEnabled) {
          const { error: otpError } = await supabase.auth.signInWithOtp({
            email,
            options: {
              shouldCreateUser: false,
            }
          });
          
          if (otpError) {
            console.error("OTP send error:", otpError);
          }
          
          return res.json({ 
            success: true,
            requires2FA: true, 
            email,
            message: "2FA code sent to your email"
          });
        }
      }
      
      res.json({ 
        success: true,
        user: data.user, 
        session: data.session,
        requires2FA: false
      });
    } catch (error: any) {
      console.error("Signin error:", error);
      res.status(400).json({ 
        success: false,
        message: error.message || "Invalid credentials" 
      });
    }
  });

  app.post('/api/auth/supabase/verify-otp', async (req, res) => {
    try {
      const { email, token } = req.body;
      
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email'
      });
      
      if (error) throw error;
      
      if (!data.session || !data.user) {
        return res.status(401).json({ 
          success: false,
          message: "Invalid or expired code" 
        });
      }
      
      res.json({ 
        success: true,
        user: data.user, 
        session: data.session 
      });
    } catch (error: any) {
      console.error("OTP verification error:", error);
      res.status(400).json({ 
        success: false,
        message: error.message || "Invalid verification code" 
      });
    }
  });

  app.post('/api/auth/supabase/signout', async (req, res) => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      res.json({ success: true, message: "Signed out successfully" });
    } catch (error: any) {
      console.error("Signout error:", error);
      res.status(500).json({ 
        success: false,
        message: error.message || "Failed to sign out" 
      });
    }
  });

  app.post('/api/auth/supabase/toggle-2fa', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: "No token provided" });
      }
      
      const token = authHeader.split(' ')[1];
      const user = await verifySupabaseToken(token);
      
      if (!user) {
        return res.status(401).json({ success: false, message: "Invalid token" });
      }
      
      const { enabled } = req.body;
      
      if (databaseAvailable) {
        await storage.upsertUser({
          id: user.id,
          email: user.email || '',
          twoFactorEnabled: enabled
        });
      }
      
      res.json({ 
        success: true,
        twoFactorEnabled: enabled,
        message: enabled ? "2FA enabled successfully" : "2FA disabled successfully"
      });
    } catch (error: any) {
      console.error("Toggle 2FA error:", error);
      res.status(500).json({ 
        success: false,
        message: error.message || "Failed to update 2FA settings" 
      });
    }
  });

  app.get('/api/auth/supabase/2fa-status', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: "No token provided" });
      }
      
      const token = authHeader.split(' ')[1];
      const user = await verifySupabaseToken(token);
      
      if (!user) {
        return res.status(401).json({ success: false, message: "Invalid token" });
      }
      
      let twoFactorEnabled = false;
      if (databaseAvailable) {
        const dbUser = await storage.getUser(user.id);
        twoFactorEnabled = dbUser?.twoFactorEnabled || false;
      }
      
      res.json({ 
        success: true,
        twoFactorEnabled 
      });
    } catch (error: any) {
      console.error("Get 2FA status error:", error);
      res.status(500).json({ 
        success: false,
        message: error.message || "Failed to get 2FA status" 
      });
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
