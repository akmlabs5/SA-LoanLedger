import type { Express } from "express";
import { isAuthenticated } from "../replitAuth";
import type { IStorage } from "../storage";
import { z } from "zod";
import { 
  insertUserPreferencesSchema,
  insertAiInsightConfigSchema,
  insertDailyAlertsPreferencesSchema 
} from "@shared/schema";

// Profile update schema (only firstName and lastName can be updated)
const profileUpdateSchema = z.object({
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
});

export function registerAuthRoutes(app: Express, storage: IStorage) {
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let user = await storage.getUser(userId);
      
      // If user doesn't exist in storage (development mode), create it
      if (!user) {
        user = await storage.upsertUser({
          id: userId,
          email: req.user.claims.email || 'developer@test.com',
          firstName: req.user.claims.first_name || 'Test',
          lastName: req.user.claims.last_name || 'Developer',
          profileImageUrl: req.user.claims.profile_image_url || null,
        });
      }
      
      // Fetch organization membership
      const membership = await storage.getOrganizationMembership(userId);
      
      if (!membership) {
        console.log('No organization found for user', userId);
        return res.status(404).json({ 
          success: false,
          message: "Organization not found. Please complete your account setup."
        });
      }
      
      // Fetch organization details
      const organization = await storage.getOrganization(membership.organizationId);
      
      if (!organization) {
        console.log('Organization record not found:', membership.organizationId);
        return res.status(404).json({ 
          success: false,
          message: "Organization not found. Please contact support."
        });
      }
      
      // Return user with organization info
      res.json({
        ...user,
        organizationId: organization.id,
        organizationName: organization.name,
        isOwner: membership.isOwner
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Update user profile (firstName, lastName only - email is locked to auth provider)
  app.patch('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Validate input
      const updates = profileUpdateSchema.parse(req.body);
      
      // Get current user
      const currentUser = await storage.getUser(userId);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Update user with new data (keep existing email)
      const updatedUser = await storage.upsertUser({
        id: userId,
        email: currentUser.email, // Keep existing email
        firstName: updates.firstName || currentUser.firstName,
        lastName: updates.lastName || currentUser.lastName,
        profileImageUrl: currentUser.profileImageUrl,
      });
      
      res.json(updatedUser);
    } catch (error: any) {
      console.error("Error updating user profile:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Get user preferences
  app.get('/api/user/preferences', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const preferences = await storage.getUserPreferences(userId);
      
      const defaults = {
        timezone: 'Asia/Riyadh',
        language: 'en',
        currency: 'SAR',
        dateFormat: 'DD/MM/YYYY',
        theme: 'light',
        dashboardLayout: 'grid',
        itemsPerPage: 10,
        enableNotifications: true,
        enableSounds: false,
        compactView: false,
      };
      
      // Return defaults if no preferences set
      if (!preferences) {
        return res.json(defaults);
      }
      
      // Merge preferences with defaults to ensure no null values
      const mergedPreferences = {
        ...defaults,
        ...preferences,
        // Ensure theme is never null
        theme: preferences.theme || 'light',
      };
      
      res.json(mergedPreferences);
    } catch (error) {
      console.error("Error fetching preferences:", error);
      res.status(500).json({ message: "Failed to fetch preferences" });
    }
  });

  // Save user preferences
  app.post('/api/user/preferences', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Validate input data
      const validatedData = insertUserPreferencesSchema.omit({ 
        id: true, 
        userId: true, 
        createdAt: true, 
        updatedAt: true 
      }).parse(req.body);
      
      const preferences = await storage.upsertUserPreferences({
        userId,
        ...validatedData,
      });
      
      res.json(preferences);
    } catch (error: any) {
      console.error("Error saving preferences:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to save preferences" });
    }
  });

  // Get AI insights configuration
  app.get('/api/user/ai-insights', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const config = await storage.getUserAiConfig(userId);
      
      // Return defaults if no config set
      if (!config) {
        return res.json({
          concentrationRiskThreshold: '40.00',
          ltvOutstandingThreshold: '75.00',
          ltvLimitThreshold: '90.00',
          cashFlowStrainThreshold: '20.00',
          rateDifferentialThreshold: '0.50',
          dueDateAlertDays: 30,
        });
      }
      
      res.json(config);
    } catch (error) {
      console.error("Error fetching AI config:", error);
      res.status(500).json({ message: "Failed to fetch AI configuration" });
    }
  });

  // Save AI insights configuration
  app.post('/api/user/ai-insights', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Validate input data
      const validatedData = insertAiInsightConfigSchema.omit({ 
        id: true, 
        userId: true, 
        updatedAt: true 
      }).parse(req.body);
      
      const config = await storage.upsertAiConfig({
        userId,
        ...validatedData,
      });
      
      res.json(config);
    } catch (error: any) {
      console.error("Error saving AI config:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to save AI configuration" });
    }
  });

  // Get daily alerts preferences
  app.get('/api/user/daily-alerts-preferences', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const preferences = await storage.getDailyAlertsPreferences(userId);
      
      // Return defaults if no preferences set
      if (!preferences) {
        return res.json({
          enabled: false,
          preferredTime: '08:00',
          enableCriticalAlerts: true,
          enableHighAlerts: true,
          enableMediumAlerts: true,
          enableLowAlerts: false,
          utilizationThreshold: '80.00',
          concentrationThreshold: '40.00',
          ltvThreshold: '70.00',
          revolvingThreshold: '80.00',
        });
      }
      
      res.json(preferences);
    } catch (error) {
      console.error("Error fetching daily alerts preferences:", error);
      res.status(500).json({ message: "Failed to fetch daily alerts preferences" });
    }
  });

  // Save daily alerts preferences
  app.post('/api/user/daily-alerts-preferences', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Validate input data
      const validatedData = insertDailyAlertsPreferencesSchema.omit({ 
        id: true, 
        userId: true, 
        createdAt: true, 
        updatedAt: true 
      }).parse(req.body);
      
      const preferences = await storage.upsertDailyAlertsPreferences({
        userId,
        ...validatedData,
      });
      
      res.json(preferences);
    } catch (error: any) {
      console.error("Error saving daily alerts preferences:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to save daily alerts preferences" });
    }
  });
}
