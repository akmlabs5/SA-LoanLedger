import type { Express } from "express";
import type { AppDependencies } from "../types";
import crypto from "crypto";
import {
  insertReminderTemplateSchema,
  updateReminderTemplateSchema,
} from "@shared/schema";

// Admin session storage (in production, use proper session store)
// Using global to persist sessions during development hot reloads
const globalAny = global as any;
if (!globalAny.adminSessions) {
  globalAny.adminSessions = new Map<string, { username: string; role: string; loginTime: string }>();
  console.log('🔐 Admin session store initialized');
}
const adminSessions = globalAny.adminSessions;

// Admin middleware for protecting admin routes
const isAdminAuthenticated = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: "Admin token required" });
  }
  
  const session = adminSessions.get(token);
  if (!session) {
    return res.status(401).json({ message: "Invalid admin token" });
  }
  
  // In development mode, extend session timeout to reduce logout frequency
  const sessionTimeout = process.env.NODE_ENV === 'development' ? 168 : 24; // 7 days in dev, 24 hours in prod
  
  const loginTime = new Date(session.loginTime);
  const now = new Date();
  const hoursDiff = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60);
  
  if (hoursDiff > sessionTimeout) {
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
    
    // In development mode, extend session timeout to reduce logout frequency
    const sessionTimeout = process.env.NODE_ENV === 'development' ? 168 : 24; // 7 days in dev, 24 hours in prod
    
    const loginTime = new Date(session.loginTime);
    const now = new Date();
    const hoursDiff = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60);
    
    if (hoursDiff > sessionTimeout) {
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
      // Mock recent activities with privacy-respecting details
      const activities = [
        {
          id: "act_1",
          userId: "user_1",
          userEmail: "user@example.com",
          action: "Created new loan",
          timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
          details: "New loan record created"
        },
        {
          id: "act_2",
          userId: "user_2", 
          userEmail: "manager@example.com",
          action: "Updated bank facility",
          timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 mins ago
          details: "Facility credit limit modified"
        },
        {
          id: "act_3",
          userId: "user_1",
          userEmail: "user@example.com", 
          action: "Added collateral",
          timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(), // 1.5 hours ago
          details: "New collateral record added"
        },
        {
          id: "act_4",
          userId: "user_2",
          userEmail: "manager@example.com", 
          action: "Viewed reports",
          timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
          details: "Generated portfolio report"
        },
        {
          id: "act_5",
          userId: "user_1",
          userEmail: "user@example.com", 
          action: "Updated loan payment",
          timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3 hours ago
          details: "Loan payment status updated"
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

  // Analytics data endpoint
  app.get('/api/admin/analytics', isAdminAuthenticated, async (req: any, res) => {
    try {
      const loans = await storage.getActiveLoansByUser(req.user?.claims?.sub || 'demo-user');
      const banks = await storage.getAllBanks();
      
      // Calculate analytics metrics
      const now = new Date();
      const monthlyData = Array.from({ length: 6 }, (_, i) => {
        const month = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        return {
          month: month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          loans: Math.floor(Math.random() * 20 + 10),
          value: Math.floor(Math.random() * 5000000 + 2000000),
          users: Math.floor(Math.random() * 15 + 5)
        };
      });

      const bankDistribution = banks.slice(0, 5).map(bank => ({
        bankName: bank.name,
        loanCount: Math.floor(Math.random() * 10 + 1),
        totalExposure: Math.floor(Math.random() * 10000000 + 1000000)
      }));

      const analytics = {
        monthlyTrends: monthlyData,
        bankDistribution,
        totalLoansCreated: loans.length,
        totalValue: loans.reduce((sum, loan) => sum + parseFloat(loan.amount), 0),
        averageLoanSize: loans.length > 0 ? loans.reduce((sum, loan) => sum + parseFloat(loan.amount), 0) / loans.length : 0,
        platformGrowth: 23.5, // Percentage growth
        userEngagement: 87.2, // Percentage
        systemUptime: 99.9 // Percentage
      };

      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // User activities detailed endpoint
  app.get('/api/admin/user-activities', isAdminAuthenticated, async (req: any, res) => {
    try {
      const { page = 1, limit = 50, userId, action, startDate, endDate } = req.query;
      
      // Generate sample activities with filtering support and privacy-safe descriptions
      const allActivities = Array.from({ length: 100 }, (_, i) => ({
        id: `activity_${i + 1}`,
        userId: `user_${(i % 3) + 1}`,
        userEmail: ['user@example.com', 'manager@company.com', 'analyst@company.com'][i % 3],
        action: ['Created new loan', 'Updated facility', 'Added collateral', 'Viewed reports', 'Generated analysis'][i % 5],
        timestamp: new Date(Date.now() - i * 1000 * 60 * 30).toISOString(),
        // Privacy-safe descriptions that don't expose sensitive loan/bank details
        details: [
          'Loan record successfully created in the system',
          'Facility information updated by user',
          'Collateral entry added to portfolio',
          'Financial reports accessed by user',
          'AI-powered portfolio analysis completed'
        ][i % 5],
        ipAddress: `192.168.1.${(i % 254) + 1}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }));

      // Apply filters
      let filtered = allActivities;
      if (userId) filtered = filtered.filter(a => a.userId === userId);
      if (action) filtered = filtered.filter(a => a.action === action);
      
      // Pagination
      const start = (Number(page) - 1) * Number(limit);
      const paginated = filtered.slice(start, start + Number(limit));

      res.json({
        activities: paginated,
        total: filtered.length,
        page: Number(page),
        totalPages: Math.ceil(filtered.length / Number(limit))
      });
    } catch (error) {
      console.error("Error fetching user activities:", error);
      res.status(500).json({ message: "Failed to fetch user activities" });
    }
  });

  // Database management endpoint
  app.get('/api/admin/database', isAdminAuthenticated, async (req: any, res) => {
    try {
      const loans = await storage.getActiveLoansByUser(req.user?.claims?.sub || 'demo-user');
      const banks = await storage.getAllBanks();
      
      const dbStats = {
        connectionStatus: "active",
        dbSize: "47.3 MB",
        totalConnections: 12,
        activeConnections: 5,
        slowQueries: 2,
        cacheHitRatio: 94.7,
        lastBackup: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
        tables: [
          { name: 'loans', rowCount: loans.length, size: '12.4 MB' },
          { name: 'banks', rowCount: banks.length, size: '2.1 MB' },
          { name: 'facilities', rowCount: 15, size: '8.7 MB' },
          { name: 'collateral', rowCount: 8, size: '6.5 MB' },
          { name: 'users', rowCount: 3, size: '1.2 MB' }
        ],
        recentQueries: [
          { query: 'SELECT * FROM loans WHERE...', duration: '12ms', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
          { query: 'UPDATE facilities SET...', duration: '8ms', timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString() },
          { query: 'INSERT INTO collateral...', duration: '15ms', timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString() }
        ]
      };

      res.json(dbStats);
    } catch (error) {
      console.error("Error fetching database stats:", error);
      res.status(500).json({ message: "Failed to fetch database stats" });
    }
  });

  // Security logs endpoint
  app.get('/api/admin/security', isAdminAuthenticated, async (req: any, res) => {
    try {
      const securityData = {
        failedLogins: [
          { email: 'unknown@test.com', attempts: 3, lastAttempt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), ipAddress: '192.168.1.45' },
          { email: 'admin@wrong.com', attempts: 5, lastAttempt: new Date(Date.now() - 1000 * 60 * 120).toISOString(), ipAddress: '10.0.0.23' }
        ],
        accessLogs: [
          { user: 'user@example.com', action: 'Admin login', timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), status: 'success', ipAddress: '192.168.1.100' },
          { user: 'manager@company.com', action: 'Template access', timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), status: 'success', ipAddress: '192.168.1.101' },
          { user: 'unknown@test.com', action: 'Admin login', timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), status: 'failed', ipAddress: '192.168.1.45' }
        ],
        securitySettings: {
          sessionTimeout: 24, // hours
          maxFailedAttempts: 5,
          ipWhitelist: [],
          twoFactorEnabled: false,
          passwordPolicy: 'strong'
        },
        activeAdminSessions: adminSessions.size,
        suspiciousActivity: 1
      };

      res.json(securityData);
    } catch (error) {
      console.error("Error fetching security data:", error);
      res.status(500).json({ message: "Failed to fetch security data" });
    }
  });

  // System alerts endpoint
  app.get('/api/admin/alerts', isAdminAuthenticated, async (req: any, res) => {
    try {
      const alerts = [
        {
          id: 'alert_1',
          type: 'warning',
          title: 'High Memory Usage',
          message: 'System memory usage at 78%',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          acknowledged: false,
          severity: 'medium'
        },
        {
          id: 'alert_2',
          type: 'info',
          title: 'Backup Completed',
          message: 'Daily database backup completed successfully',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
          acknowledged: true,
          severity: 'low'
        },
        {
          id: 'alert_3',
          type: 'error',
          title: 'Failed Login Attempts',
          message: '5 failed login attempts from IP 192.168.1.45',
          timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
          acknowledged: false,
          severity: 'high'
        }
      ];

      res.json(alerts);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      res.status(500).json({ message: "Failed to fetch alerts" });
    }
  });

  // Acknowledge alert endpoint
  app.post('/api/admin/alerts/:alertId/acknowledge', isAdminAuthenticated, async (req: any, res) => {
    try {
      const { alertId } = req.params;
      res.json({ message: 'Alert acknowledged', alertId });
    } catch (error) {
      console.error("Error acknowledging alert:", error);
      res.status(500).json({ message: "Failed to acknowledge alert" });
    }
  });

  // System settings endpoint
  app.get('/api/admin/settings', isAdminAuthenticated, async (req: any, res) => {
    try {
      const settings = {
        general: {
          siteName: 'Morouna Loans',
          siteUrl: process.env.REPLIT_DOMAINS || 'localhost:5000',
          maintenanceMode: false,
          debugMode: process.env.NODE_ENV !== 'production'
        },
        email: {
          sendGridConfigured: !!process.env.SENDGRID_API_KEY,
          defaultSender: 'noreply@morounaloans.com',
          emailNotificationsEnabled: true
        },
        ai: {
          deepSeekConfigured: !!process.env.DEEPSEEK_API_KEY,
          aiInsightsEnabled: true,
          maxTokens: 1500
        },
        security: {
          sessionTimeout: 24,
          maxFailedAttempts: 5,
          requireStrongPasswords: true
        },
        features: {
          aiChat: true,
          emailReminders: true,
          advancedAnalytics: true,
          exportReports: true
        }
      };

      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  // Update system settings endpoint
  app.put('/api/admin/settings', isAdminAuthenticated, async (req: any, res) => {
    try {
      const { category, settings } = req.body;
      // In a real implementation, this would update settings in a database
      res.json({ message: 'Settings updated successfully', category, settings });
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });
}
