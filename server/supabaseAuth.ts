
import type { Express, RequestHandler } from "express";
import { supabase, verifySupabaseToken } from "./supabaseClient";
import { storage } from "./storage";
import { sendEmail } from "./emailService";
import { EmailTemplateService, EmailTemplateType } from "./emailTemplates/templates";

const otpStore = new Map<string, { code: string; expiry: Date; password: string; attempts: number }>();
const otpRequestTracker = new Map<string, { count: number; lastRequest: Date; lockoutUntil?: Date }>();

setInterval(() => {
  const now = new Date();
  for (const [email, data] of Array.from(otpStore.entries())) {
    if (now > data.expiry) {
      otpStore.delete(email);
    }
  }
  for (const [email, tracker] of Array.from(otpRequestTracker.entries())) {
    if (tracker.lockoutUntil && now > tracker.lockoutUntil) {
      otpRequestTracker.delete(email);
    } else if (!tracker.lockoutUntil && now.getTime() - tracker.lastRequest.getTime() > 300000) {
      otpRequestTracker.delete(email);
    }
  }
}, 60000);

export async function setupSupabaseAuth(app: Express, databaseAvailable = true) {
  console.log("🔧 Supabase Auth setup initialized");
  
  app.post('/api/auth/supabase/signup', async (req, res) => {
    try {
      const { 
        email: rawEmail, 
        password, 
        firstName, 
        lastName, 
        enable2FA,
        accountType,
        organizationName 
      } = req.body;
      const email = rawEmail.trim().toLowerCase();

      const userAccountType = accountType || 'personal';

      if (userAccountType === 'organization' && (!organizationName || !organizationName.trim())) {
        return res.status(400).json({ 
          success: false,
          message: "Organization name is required for organization accounts" 
        });
      }
      
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
          twoFactorEnabled: enable2FA || false,
          accountType: userAccountType
        });

        if (userAccountType === 'organization') {
          const organization = await storage.createOrganization({
            name: organizationName.trim(),
            ownerId: data.user.id
          });

          await storage.addMember({
            organizationId: organization.id,
            userId: data.user.id,
            isOwner: true
          });
        } else {
          const defaultOrgName = `${firstName || 'My'}'s Organization`;
          const organization = await storage.createOrganization({
            name: defaultOrgName,
            ownerId: data.user.id
          });

          await storage.addMember({
            organizationId: organization.id,
            userId: data.user.id,
            isOwner: true
          });
        }
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
      const { email: rawEmail, password } = req.body;
      const email = rawEmail.trim().toLowerCase();
      
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
          const tracker = otpRequestTracker.get(email) || { count: 0, lastRequest: new Date() };
          const now = new Date();
          
          if (tracker.lockoutUntil && now < tracker.lockoutUntil) {
            const minutesLeft = Math.ceil((tracker.lockoutUntil.getTime() - now.getTime()) / 60000);
            return res.status(429).json({ 
              success: false,
              message: `Too many OTP requests. Please wait ${minutesLeft} minute(s) before trying again.` 
            });
          }
          
          if (now.getTime() - tracker.lastRequest.getTime() < 60000) {
            tracker.count++;
          } else {
            tracker.count = 1;
          }
          
          tracker.lastRequest = now;
          
          if (tracker.count > 5) {
            tracker.lockoutUntil = new Date(now.getTime() + 15 * 60 * 1000);
            otpRequestTracker.set(email, tracker);
            return res.status(429).json({ 
              success: false,
              message: "Too many OTP requests. Your account has been temporarily locked for 15 minutes." 
            });
          }
          
          otpRequestTracker.set(email, tracker);
          
          await supabase.auth.signOut();
          
          const otp = Math.floor(100000 + Math.random() * 900000).toString();
          
          const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
          
          try {
            const emailTemplate = EmailTemplateService.getTemplate(EmailTemplateType.MFA_CODE, {
              code: otp
            });
            
            await sendEmail({
              to: email,
              subject: emailTemplate.subject,
              text: emailTemplate.text,
              html: emailTemplate.html
            });
            
            otpStore.set(email, { code: otp, expiry: otpExpiry, password, attempts: 0 });
          } catch (emailError) {
            console.error("Failed to send OTP email:", emailError);
            return res.status(500).json({ 
              success: false,
              message: "Failed to send verification code. Please try again later."
            });
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
      const { email: rawEmail, token } = req.body;
      const email = rawEmail.trim().toLowerCase();
      
      const storedOTP = otpStore.get(email);
      
      if (!storedOTP) {
        return res.status(401).json({ 
          success: false,
          message: "No verification code found. Please request a new code." 
        });
      }
      
      if (new Date() > storedOTP.expiry) {
        otpStore.delete(email);
        return res.status(401).json({ 
          success: false,
          message: "Verification code has expired. Please request a new code." 
        });
      }
      
      if (storedOTP.attempts >= 3) {
        otpStore.delete(email);
        return res.status(429).json({ 
          success: false,
          message: "Too many failed attempts. Please request a new verification code." 
        });
      }
      
      if (storedOTP.code !== token) {
        storedOTP.attempts++;
        return res.status(401).json({ 
          success: false,
          message: `Invalid verification code. ${3 - storedOTP.attempts} attempts remaining.` 
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
