import type { Express } from "express";
import type { AppDependencies } from "../types";
import crypto from "crypto";
import {
  insertReminderTemplateSchema,
  updateReminderTemplateSchema,
} from "@shared/schema";

// Admin session storage (in production, use proper session store)
// Using global to persist sessions during development hot reloads
if (!(global as any).adminSessions) {
  (global as any).adminSessions = new Map<string, { username: string; role: string; loginTime: string }>();
}
const adminSessions = (global as any).adminSessions;

// Admin middleware for protecting admin routes
const isAdminAuthenticated = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: "Admin token required" });
  }
  
  // Check if token exists in our session store
  const session = adminSessions.get(token);
  if (!session) {
    return res.status(401).json({ message: "Invalid admin token" });
  }
  
  // Check if session is still valid (24 hours)
  const loginTime = new Date(session.loginTime);
  const now = new Date();
  const hoursDiff = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60);
  
  if (hoursDiff > 24) {
    adminSessions.delete(token);
    return res.status(401).json({ message: "Admin session expired" });
  }
  
  req.adminUser = { username: session.username, role: session.role };
  return next();
};

export function registerAdminRoutes(app: Express, deps: AppDependencies) {
  const { storage } = deps;

  // Admin authentication routes
  app.post('/api/admin/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Simple admin credentials (in production, use proper hashing and database storage)
      const ADMIN_CREDENTIALS = {
        username: process.env.ADMIN_USERNAME || 'admin',
        password: process.env.ADMIN_PASSWORD || 'admin123'
      };
      
      if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        // Generate simple session token (in production, use proper JWT)
        const token = crypto.randomBytes(32).toString('hex');
        
        // Store admin session (in production, use proper session storage)
        adminSessions.set(token, {
          username,
          role: 'admin',
          loginTime: new Date().toISOString()
        });
        
        res.json({
          token,
          admin: {
            name: 'System Administrator',
            username,
            role: 'admin'
          }
        });
      } else {
        res.status(401).json({ message: 'Invalid admin credentials' });
      }
    } catch (error) {
      console.error("Error in admin login:", error);
      res.status(500).json({ message: "Admin authentication failed" });
    }
  });

  // Admin auth validation endpoint
  app.get('/api/admin/auth/me', (req: any, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: "Admin token required" });
    }
    
    const session = adminSessions.get(token);
    if (!session) {
      return res.status(401).json({ message: "Invalid admin token" });
    }
    
    // Check if session is still valid (24 hours)
    const loginTime = new Date(session.loginTime);
    const now = new Date();
    const hoursDiff = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60);
    
    if (hoursDiff > 24) {
      adminSessions.delete(token);
      return res.status(401).json({ message: "Admin session expired" });
    }
    
    res.json({
      user: {
        name: 'System Administrator',
        username: session.username,
        role: session.role
      }
    });
  });

  // Admin Template Management Routes (Protected)
  app.get('/api/admin/templates', isAdminAuthenticated, async (req: any, res) => {
    try {
      const templates = await storage.getAllReminderTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  app.get('/api/admin/templates/:templateId', isAdminAuthenticated, async (req: any, res) => {
    try {
      const { templateId } = req.params;
      const template = await storage.getReminderTemplate(templateId);
      
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      res.json(template);
    } catch (error) {
      console.error("Error fetching template:", error);
      res.status(500).json({ message: "Failed to fetch template" });
    }
  });

  app.post('/api/admin/templates', isAdminAuthenticated, async (req: any, res) => {
    try {
      const templateData = insertReminderTemplateSchema.parse(req.body);
      const template = await storage.createReminderTemplate(templateData);
      res.status(201).json(template);
    } catch (error) {
      console.error("Error creating template:", error);
      res.status(500).json({ message: "Failed to create template" });
    }
  });

  app.put('/api/admin/templates/:templateId', isAdminAuthenticated, async (req: any, res) => {
    try {
      const { templateId } = req.params;
      const templateData = updateReminderTemplateSchema.parse({
        ...req.body,
        id: templateId,
      });
      
      const template = await storage.updateReminderTemplate(templateId, templateData);
      
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      res.json(template);
    } catch (error) {
      console.error("Error updating template:", error);
      res.status(500).json({ message: "Failed to update template" });
    }
  });

  app.delete('/api/admin/templates/:templateId', isAdminAuthenticated, async (req: any, res) => {
    try {
      const { templateId } = req.params;
      await storage.deleteReminderTemplate(templateId);
      res.json({ message: "Template deleted successfully" });
    } catch (error) {
      console.error("Error deleting template:", error);
      res.status(500).json({ message: "Failed to delete template" });
    }
  });

  // Admin system stats
  app.get('/api/admin/system/stats', isAdminAuthenticated, async (req: any, res) => {
    try {
      // Get real system stats
      const loans = await storage.getActiveLoansByUser(req.user?.claims?.sub || 'demo-user');
      const banks = await storage.getAllBanks();
      
      const stats = {
        totalUsers: 1, // Demo data
        activeUsers: 1,
        totalLoans: loans.length,
        totalBanks: banks.length,
        systemHealth: "healthy" as const,
        lastBackup: new Date().toISOString(),
        errorRate: Math.round(Math.random() * 5), // 0-5% random error rate
        cpuUsage: Math.round(Math.random() * 30 + 20), // 20-50% CPU
        memoryUsage: Math.round(Math.random() * 40 + 30), // 30-70% Memory
        diskUsage: Math.round(Math.random() * 20 + 40), // 40-60% Disk
        uptime: "7 days, 14 hours",
        totalTransactions: Math.round(Math.random() * 1000 + 500),
        todayTransactions: Math.round(Math.random() * 50 + 10)
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin system stats:", error);
      res.status(500).json({ message: "Failed to fetch system stats" });
    }
  });

  // Admin user activities
  app.get('/api/admin/system/activities', isAdminAuthenticated, async (req: any, res) => {
    try {
      // Mock recent activities
      const activities = [
        {
          id: "act_1",
          userId: "user_1",
          userEmail: "user@example.com",
          action: "Created new loan",
          timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
          details: "SAR 500,000 loan with SABB"
        },
        {
          id: "act_2",
          userId: "user_2", 
          userEmail: "manager@example.com",
          action: "Updated bank facility",
          timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 mins ago
          details: "Increased ANB credit limit"
        },
        {
          id: "act_3",
          userId: "user_1",
          userEmail: "user@example.com", 
          action: "Added collateral",
          timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(), // 1.5 hours ago
          details: "Real estate collateral worth SAR 2M"
        }
      ];

      res.json(activities);
    } catch (error) {
      console.error("Error fetching admin activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // Admin users management
  app.get('/api/admin/users/all', isAdminAuthenticated, async (req: any, res) => {
    try {
      // Get real user data and enhance with admin info
      const currentUser = await storage.getUser(req.user?.claims?.sub || 'demo-user');
      
      const users = [
        {
          id: currentUser?.id || 'demo-user',
          email: currentUser?.email || 'user@example.com',
          firstName: currentUser?.firstName || 'Demo',
          lastName: currentUser?.lastName || 'User',
          isActive: true,
          role: "user" as const,
          lastLogin: new Date().toISOString(),
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(), // 30 days ago
          totalLoans: 5,
          totalExposure: 2500000
        },
        // Add more demo users
        {
          id: 'user_2',
          email: 'manager@company.com',
          firstName: 'Portfolio',
          lastName: 'Manager',
          isActive: true,
          role: "user" as const,
          lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(), // 60 days ago
          totalLoans: 12,
          totalExposure: 8750000
        },
        {
          id: 'user_3',
          email: 'analyst@company.com',
          firstName: 'Risk',
          lastName: 'Analyst',
          isActive: false,
          role: "user" as const,
          lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), // 7 days ago
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(), // 90 days ago
          totalLoans: 3,
          totalExposure: 1200000
        }
      ];

      res.json(users);
    } catch (error) {
      console.error("Error fetching admin users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Regular admin routes (kept for backward compatibility)
  app.get('/api/admin/stats', async (req: any, res) => {
    try {
      // Get aggregate stats for admin dashboard
      const loans = await storage.getActiveLoansByUser(req.user?.claims?.sub || 'demo-user');
      const banks = await storage.getAllBanks();
      
      const stats = {
        totalUsers: 1, // For demo purposes, as we only have the current user
        activeUsers: 1,
        totalLoans: loans.length,
        totalBanks: banks.length,
        systemHealth: "healthy" as const,
        lastBackup: new Date().toISOString(),
        errorRate: 0
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  app.get('/api/admin/users', async (req: any, res) => {
    try {
      // For demo purposes, return the current user
      const currentUser = req.user?.claims;
      
      const users = [{
        id: currentUser?.sub || 'demo-user',
        email: currentUser?.email || 'admin@example.com',
        firstName: currentUser?.first_name || 'Admin',
        lastName: currentUser?.last_name || 'User',
        lastLogin: new Date().toISOString(),
        isActive: true,
        role: "admin" as const
      }];

      res.json(users);
    } catch (error) {
      console.error("Error fetching admin users:", error);
      res.status(500).json({ message: "Failed to fetch admin users" });
    }
  });
}
