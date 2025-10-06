
import type { Express, RequestHandler } from "express";
import { supabase, verifySupabaseToken } from "./supabaseClient";
import { storage } from "./storage";
import { sendEmail } from "./emailService";

const otpStore = new Map<string, { code: string; expiry: Date; password: string }>();

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
          await supabase.auth.signOut();
          
          const otp = Math.floor(100000 + Math.random() * 900000).toString();
          
          const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
          otpStore.set(email, { code: otp, expiry: otpExpiry, password });
          
          try {
            await sendEmail({
              to: email,
              subject: "Your Verification Code",
              text: `Your verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, please ignore this email.`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #2563eb;">Your Verification Code</h2>
                  <p>Your verification code is:</p>
                  <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h1 style="color: #1f2937; font-size: 36px; letter-spacing: 8px; text-align: center; margin: 0;">${otp}</h1>
                  </div>
                  <p style="color: #6b7280;">This code will expire in 10 minutes.</p>
                  <p style="color: #6b7280; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
                </div>
              `
            });
          } catch (emailError) {
            console.error("Failed to send OTP email:", emailError);
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
      
      const storedOTP = otpStore.get(email);
      
      if (!storedOTP || storedOTP.code !== token || new Date() > storedOTP.expiry) {
        return res.status(401).json({ 
          success: false,
          message: "Invalid or expired code" 
        });
      }
      
      const password = storedOTP.password;
      otpStore.delete(email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error || !data.user) {
        return res.status(401).json({ 
          success: false,
          message: "Failed to authenticate after OTP verification" 
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
