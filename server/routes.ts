import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { generateAIInsights } from "./aiInsights";
import { sendLoanDueNotification } from "./emailService";
import {
  insertBankSchema,
  insertFacilitySchema,
  insertCollateralSchema,
  insertLoanSchema,
  insertAiInsightConfigSchema,
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Initialize default Saudi banks
  await initializeDefaultBanks();

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Bank routes
  app.get('/api/banks', isAuthenticated, async (req, res) => {
    try {
      const banks = await storage.getAllBanks();
      res.json(banks);
    } catch (error) {
      console.error("Error fetching banks:", error);
      res.status(500).json({ message: "Failed to fetch banks" });
    }
  });

  // Facility routes
  app.get('/api/facilities', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const facilities = await storage.getUserFacilities(userId);
      res.json(facilities);
    } catch (error) {
      console.error("Error fetching facilities:", error);
      res.status(500).json({ message: "Failed to fetch facilities" });
    }
  });

  app.post('/api/facilities', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const facilityData = insertFacilitySchema.parse({ ...req.body, userId });
      const facility = await storage.createFacility(facilityData);
      res.json(facility);
    } catch (error) {
      console.error("Error creating facility:", error);
      res.status(400).json({ message: "Failed to create facility" });
    }
  });

  // Collateral routes
  app.get('/api/collateral', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const collateral = await storage.getUserCollateral(userId);
      res.json(collateral);
    } catch (error) {
      console.error("Error fetching collateral:", error);
      res.status(500).json({ message: "Failed to fetch collateral" });
    }
  });

  app.post('/api/collateral', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const collateralData = insertCollateralSchema.parse({ ...req.body, userId });
      const collateral = await storage.createCollateral(collateralData);
      res.json(collateral);
    } catch (error) {
      console.error("Error creating collateral:", error);
      res.status(400).json({ message: "Failed to create collateral" });
    }
  });

  app.put('/api/collateral/:id', isAuthenticated, async (req: any, res) => {
    try {
      const collateralId = req.params.id;
      const updates = req.body;
      const collateral = await storage.updateCollateral(collateralId, updates);
      res.json(collateral);
    } catch (error) {
      console.error("Error updating collateral:", error);
      res.status(400).json({ message: "Failed to update collateral" });
    }
  });

  // Loan routes
  app.get('/api/loans', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const status = req.query.status as string;
      
      let loans;
      if (status === 'settled') {
        loans = await storage.getSettledLoansByUser(userId);
      } else {
        loans = await storage.getActiveLoansByUser(userId);
      }
      
      res.json(loans);
    } catch (error) {
      console.error("Error fetching loans:", error);
      res.status(500).json({ message: "Failed to fetch loans" });
    }
  });

  app.post('/api/loans', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const loanData = insertLoanSchema.parse({ ...req.body, userId });
      const loan = await storage.createLoan(loanData);
      res.json(loan);
    } catch (error) {
      console.error("Error creating loan:", error);
      res.status(400).json({ message: "Failed to create loan" });
    }
  });

  app.put('/api/loans/:id/settle', isAuthenticated, async (req: any, res) => {
    try {
      const loanId = req.params.id;
      const { settledAmount } = req.body;
      const loan = await storage.settleLoan(loanId, settledAmount);
      res.json(loan);
    } catch (error) {
      console.error("Error settling loan:", error);
      res.status(400).json({ message: "Failed to settle loan" });
    }
  });

  // Dashboard analytics
  app.get('/api/dashboard/portfolio', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const portfolioSummary = await storage.getUserPortfolioSummary(userId);
      res.json(portfolioSummary);
    } catch (error) {
      console.error("Error fetching portfolio summary:", error);
      res.status(500).json({ message: "Failed to fetch portfolio summary" });
    }
  });

  // AI Insights
  app.get('/api/ai-insights', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const insights = await generateAIInsights(userId);
      res.json(insights);
    } catch (error) {
      console.error("Error generating AI insights:", error);
      res.status(500).json({ message: "Failed to generate AI insights" });
    }
  });

  // AI Config
  app.get('/api/ai-config', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let config = await storage.getUserAiConfig(userId);
      
      if (!config) {
        // Create default config
        config = await storage.upsertAiConfig({ userId });
      }
      
      res.json(config);
    } catch (error) {
      console.error("Error fetching AI config:", error);
      res.status(500).json({ message: "Failed to fetch AI config" });
    }
  });

  app.put('/api/ai-config', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const configData = insertAiInsightConfigSchema.parse({ ...req.body, userId });
      const config = await storage.upsertAiConfig(configData);
      res.json(config);
    } catch (error) {
      console.error("Error updating AI config:", error);
      res.status(400).json({ message: "Failed to update AI config" });
    }
  });

  // SIBOR rate (simulated for MVP)
  app.get('/api/sibor-rate', async (req, res) => {
    try {
      // In production, this would fetch from a real financial data API
      const currentRate = 5.75; // Current SIBOR rate
      const monthlyChange = 0.25; // Monthly change
      
      res.json({
        rate: currentRate,
        monthlyChange,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error fetching SIBOR rate:", error);
      res.status(500).json({ message: "Failed to fetch SIBOR rate" });
    }
  });

  // Email notifications
  app.post('/api/notifications/due-loans', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.email) {
        return res.status(400).json({ message: "User email not found" });
      }

      const activeLoans = await storage.getActiveLoansByUser(userId);
      const currentDate = new Date();
      const dueLoans = activeLoans.filter(loan => {
        const dueDate = new Date(loan.dueDate);
        const daysDiff = Math.ceil((dueDate.getTime() - currentDate.getTime()) / (1000 * 3600 * 24));
        return daysDiff <= 7 && daysDiff >= 0; // Loans due within 7 days
      });

      if (dueLoans.length > 0) {
        await sendLoanDueNotification(user.email, dueLoans);
      }

      res.json({ message: "Notifications sent", count: dueLoans.length });
    } catch (error) {
      console.error("Error sending notifications:", error);
      res.status(500).json({ message: "Failed to send notifications" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

async function initializeDefaultBanks() {
  try {
    const existingBanks = await storage.getAllBanks();
    
    if (existingBanks.length === 0) {
      const saudiBanks = [
        { name: "Arab National Bank (ANB)", code: "ANB" },
        { name: "Saudi British Bank (SABB)", code: "SABB" },
        { name: "Al Rajhi Bank", code: "ARB" },
        { name: "Saudi National Bank (SNB)", code: "SNB" },
        { name: "Riyad Bank", code: "RB" },
        { name: "Banque Saudi Fransi (BSF)", code: "BSF" },
        { name: "Alinma Bank", code: "ALINMA" },
        { name: "Bank AlJazira", code: "JAZ" },
        { name: "Bank Albilad", code: "BILAD" },
        { name: "Saudi Investment Bank (SAIB)", code: "SAIB" },
        { name: "National Commercial Bank (NCB)", code: "NCB" },
        { name: "First Abu Dhabi Bank (FAB)", code: "FAB" },
      ];

      for (const bank of saudiBanks) {
        await storage.createBank(bank);
      }
      
      console.log("Default Saudi banks initialized");
    }
  } catch (error) {
    console.error("Error initializing default banks:", error);
  }
}
