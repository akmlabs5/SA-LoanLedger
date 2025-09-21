import type { Express } from "express";
import { createServer, type Server } from "http";
import { createStorage, type IStorage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { generateAIInsights } from "./aiInsights";
import { sendLoanDueNotification } from "./emailService";
import { initializeDatabase } from "./db";
import {
  insertBankSchema,
  insertBankContactSchema,
  insertFacilitySchema,
  insertCollateralSchema,
  insertCollateralAssignmentSchema,
  insertLoanSchema,
  insertAiInsightConfigSchema,
  insertExposureSnapshotSchema,
  insertTransactionSchema,
  transactionTypeZodEnum,
  paymentRequestSchema,
  settlementRequestSchema,
  revolveRequestSchema,
} from "@shared/schema";
import { z } from "zod";

// Global storage instance
let storage: IStorage;

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize database connection with health check
  const databaseAvailable = await initializeDatabase();
  
  // Create storage based on database availability
  storage = createStorage(databaseAvailable);
  
  // Setup auth with database availability flag
  await setupAuth(app, databaseAvailable);

  // Initialize default Saudi banks
  await initializeDefaultBanks();

  // Auth routes
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

  // Bank Contact routes
  app.get('/api/banks/:bankId/contacts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { bankId } = req.params;
      const contacts = await storage.getBankContacts(bankId, userId);
      res.json(contacts);
    } catch (error) {
      console.error("Error fetching bank contacts:", error);
      res.status(500).json({ message: "Failed to fetch bank contacts" });
    }
  });

  app.post('/api/banks/:bankId/contacts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { bankId } = req.params;
      const contactData = insertBankContactSchema.parse({ 
        ...req.body, 
        userId, 
        bankId 
      });
      const contact = await storage.createBankContact(contactData);
      res.json(contact);
    } catch (error) {
      console.error("Error creating bank contact:", error);
      res.status(400).json({ message: "Failed to create bank contact" });
    }
  });

  app.put('/api/bank-contacts/:contactId', isAuthenticated, async (req: any, res) => {
    try {
      const { contactId } = req.params;
      const contactData = req.body;
      delete contactData.id; // Prevent ID updates
      delete contactData.userId; // Prevent user ID updates
      delete contactData.bankId; // Prevent bank ID updates
      
      const contact = await storage.updateBankContact(contactId, contactData);
      res.json(contact);
    } catch (error) {
      console.error("Error updating bank contact:", error);
      res.status(400).json({ message: "Failed to update bank contact" });
    }
  });

  app.delete('/api/bank-contacts/:contactId', isAuthenticated, async (req: any, res) => {
    try {
      const { contactId } = req.params;
      await storage.deleteBankContact(contactId);
      res.json({ message: "Bank contact deleted successfully" });
    } catch (error) {
      console.error("Error deleting bank contact:", error);
      res.status(500).json({ message: "Failed to delete bank contact" });
    }
  });

  app.put('/api/bank-contacts/:contactId/set-primary', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { contactId } = req.params;
      const { bankId } = req.body;
      
      const contact = await storage.setPrimaryContact(contactId, bankId, userId);
      res.json(contact);
    } catch (error) {
      console.error("Error setting primary contact:", error);
      res.status(400).json({ message: "Failed to set primary contact" });
    }
  });

  // Facility routes
  app.get('/api/facilities', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Initialize sample facilities for new users
      await initializeSampleFacilities(userId);
      
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

  app.put('/api/facilities/:facilityId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { facilityId } = req.params;
      const updateData = req.body;
      
      // Remove fields that shouldn't be updated
      delete updateData.id;
      delete updateData.userId;
      delete updateData.createdAt;
      delete updateData.updatedAt;
      
      // Validate the facility belongs to the user
      const userFacilities = await storage.getUserFacilities(userId);
      const facility = userFacilities.find((f: any) => f.id === facilityId);
      
      if (!facility) {
        return res.status(404).json({ message: "Facility not found or access denied" });
      }
      
      // Validate update data against schema (partial update)
      const facilityUpdateSchema = insertFacilitySchema.omit({ userId: true }).partial();
      const validatedData = facilityUpdateSchema.parse(updateData);
      
      const updatedFacility = await storage.updateFacility(facilityId, validatedData);
      res.json(updatedFacility);
    } catch (error) {
      console.error("Error updating facility:", error);
      res.status(400).json({ message: "Failed to update facility" });
    }
  });

  app.delete('/api/facilities/:facilityId', isAuthenticated, async (req: any, res) => {
    try {
      const { facilityId } = req.params;
      await storage.deleteFacility(facilityId);
      res.json({ message: "Facility deleted successfully" });
    } catch (error) {
      console.error("Error deleting facility:", error);
      res.status(500).json({ message: "Failed to delete facility" });
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

  app.delete('/api/collateral/:id', isAuthenticated, async (req: any, res) => {
    try {
      const collateralId = req.params.id;
      await storage.deleteCollateral(collateralId);
      res.json({ message: "Collateral deleted successfully" });
    } catch (error) {
      console.error("Error deleting collateral:", error);
      res.status(500).json({ message: "Failed to delete collateral" });
    }
  });

  // Collateral Assignment routes
  app.get('/api/collateral-assignments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const assignments = await storage.getUserCollateralAssignments(userId);
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching collateral assignments:", error);
      res.status(500).json({ message: "Failed to fetch collateral assignments" });
    }
  });

  app.post('/api/collateral-assignments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const assignmentData = insertCollateralAssignmentSchema.parse({ ...req.body, userId });
      
      // Validate that user owns the collateral and facility/credit line
      const userCollateral = await storage.getUserCollateral(userId);
      const userFacilities = await storage.getUserFacilities(userId);
      const userCreditLines = await storage.getUserCreditLines(userId);
      
      if (!userCollateral.find((c: any) => c.id === assignmentData.collateralId)) {
        return res.status(403).json({ message: "Collateral not found or access denied" });
      }
      
      // Validate at least one target is specified
      if (!assignmentData.facilityId && !assignmentData.creditLineId) {
        return res.status(400).json({ message: "Either facilityId or creditLineId must be specified" });
      }
      
      // Check if facility or credit line belongs to user
      if (assignmentData.facilityId) {
        const facility = userFacilities.find((f: any) => f.id === assignmentData.facilityId);
        if (!facility) {
          return res.status(403).json({ message: "Facility not found or access denied" });
        }
      }
      
      if (assignmentData.creditLineId) {
        const creditLine = userCreditLines.find((cl: any) => cl.id === assignmentData.creditLineId);
        if (!creditLine) {
          return res.status(403).json({ message: "Credit line not found or access denied" });
        }
        
        // If both facility and credit line provided, ensure consistency
        if (assignmentData.facilityId && creditLine.facility.id !== assignmentData.facilityId) {
          return res.status(400).json({ message: "Credit line does not belong to the specified facility" });
        }
      }
      
      const assignment = await storage.createCollateralAssignment(assignmentData);
      res.json(assignment);
    } catch (error) {
      console.error("Error creating collateral assignment:", error);
      res.status(400).json({ message: "Failed to create collateral assignment" });
    }
  });

  app.put('/api/collateral-assignments/:id', isAuthenticated, async (req: any, res) => {
    try {
      const assignmentId = req.params.id;
      const userId = req.user.claims.sub;
      const updates = req.body;
      
      // Validate ownership: check if assignment belongs to user
      const userAssignments = await storage.getUserCollateralAssignments(userId);
      const existingAssignment = userAssignments.find((a: any) => a.id === assignmentId);
      
      if (!existingAssignment) {
        return res.status(403).json({ message: "Assignment not found or access denied" });
      }
      
      // If updating facilityId or creditLineId, validate ownership
      if (updates.facilityId || updates.creditLineId) {
        const userFacilities = await storage.getUserFacilities(userId);
        const userCreditLines = await storage.getUserCreditLines(userId);
        
        if (updates.facilityId && !userFacilities.find((f: any) => f.id === updates.facilityId)) {
          return res.status(403).json({ message: "Facility not found or access denied" });
        }
        
        if (updates.creditLineId && !userCreditLines.find((cl: any) => cl.id === updates.creditLineId)) {
          return res.status(403).json({ message: "Credit line not found or access denied" });
        }
        
        // Validate consistency: if both provided, ensure creditLine belongs to facility
        if (updates.facilityId && updates.creditLineId) {
          const creditLine = userCreditLines.find((cl: any) => cl.id === updates.creditLineId);
          if (creditLine && creditLine.facility.id !== updates.facilityId) {
            return res.status(400).json({ message: "Credit line does not belong to the specified facility" });
          }
        }
      }
      
      const assignment = await storage.updateCollateralAssignment(assignmentId, updates);
      res.json(assignment);
    } catch (error) {
      console.error("Error updating collateral assignment:", error);
      res.status(400).json({ message: "Failed to update collateral assignment" });
    }
  });

  app.delete('/api/collateral-assignments/:id', isAuthenticated, async (req: any, res) => {
    try {
      const assignmentId = req.params.id;
      const userId = req.user.claims.sub;
      
      // Validate ownership: check if assignment belongs to user
      const userAssignments = await storage.getUserCollateralAssignments(userId);
      const existingAssignment = userAssignments.find((a: any) => a.id === assignmentId);
      
      if (!existingAssignment) {
        return res.status(403).json({ message: "Assignment not found or access denied" });
      }
      
      await storage.deleteCollateralAssignment(assignmentId);
      res.json({ message: "Collateral assignment deleted successfully" });
    } catch (error) {
      console.error("Error deleting collateral assignment:", error);
      res.status(500).json({ message: "Failed to delete collateral assignment" });
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
      
      // Validate that facilityId is required
      if (!loanData.facilityId) {
        return res.status(400).json({ message: "Facility is required for loan creation" });
      }
      
      // Validate that user owns the facility
      const userFacilities = await storage.getUserFacilities(userId);
      const facility = userFacilities.find((f: any) => f.id === loanData.facilityId);
      
      if (!facility) {
        return res.status(403).json({ message: "Facility not found or access denied" });
      }
      
      // If creditLineId is provided, validate it belongs to the same facility and user
      if (loanData.creditLineId) {
        const userCreditLines = await storage.getUserCreditLines(userId);
        const creditLine = userCreditLines.find((cl: any) => cl.id === loanData.creditLineId);
        
        if (!creditLine) {
          return res.status(403).json({ message: "Credit line not found or access denied" });
        }
        
        if (creditLine.facility.id !== loanData.facilityId) {
          return res.status(400).json({ message: "Credit line does not belong to the specified facility" });
        }
      }
      
      // TODO: Additional validation - check available credit limit vs loan amount
      
      const loan = await storage.createLoan(loanData);
      res.json(loan);
    } catch (error) {
      console.error("Error creating loan:", error);
      res.status(400).json({ message: "Failed to create loan" });
    }
  });

  // Enhanced Loan Lifecycle Management Routes
  
  // Get individual loan details
  app.get('/api/loans/:id', isAuthenticated, async (req: any, res) => {
    try {
      const loanId = req.params.id;
      const loan = await storage.getLoanById(loanId);
      
      if (!loan) {
        return res.status(404).json({ message: "Loan not found" });
      }
      
      res.json(loan);
    } catch (error) {
      console.error("Error fetching loan:", error);
      res.status(500).json({ message: "Failed to fetch loan" });
    }
  });

  // Update loan details
  app.patch('/api/loans/:id', isAuthenticated, async (req: any, res) => {
    try {
      const loanId = req.params.id;
      const userId = req.user.claims.sub;
      const { reason, ...updateData } = req.body;
      
      // Validate update data
      const validatedData = insertLoanSchema.partial().parse(updateData);
      
      const updatedLoan = await storage.updateLoan(loanId, validatedData, userId, reason);
      res.json(updatedLoan);
    } catch (error) {
      console.error("Error updating loan:", error);
      res.status(400).json({ message: "Failed to update loan" });
    }
  });

  // Process payment against loan
  app.post('/api/loans/:id/repayments', isAuthenticated, async (req: any, res) => {
    try {
      const loanId = req.params.id;
      const userId = req.user.claims.sub;
      const paymentData = paymentRequestSchema.parse(req.body);
      
      const result = await storage.processPayment(loanId, paymentData, userId);
      res.json(result);
    } catch (error) {
      console.error("Error processing payment:", error);
      res.status(400).json({ message: "Failed to process payment" });
    }
  });

  // Settle loan (full payment)
  app.post('/api/loans/:id/settle', isAuthenticated, async (req: any, res) => {
    try {
      const loanId = req.params.id;
      const userId = req.user.claims.sub;
      const settlementData = settlementRequestSchema.parse(req.body);
      
      const result = await storage.settleLoan(loanId, settlementData, userId);
      res.json(result);
    } catch (error) {
      console.error("Error settling loan:", error);
      res.status(400).json({ message: "Failed to settle loan" });
    }
  });

  // Revolve loan (renew for continuous credit)
  app.post('/api/loans/:id/revolve', isAuthenticated, async (req: any, res) => {
    try {
      const loanId = req.params.id;
      const userId = req.user.claims.sub;
      const revolveData = revolveRequestSchema.parse(req.body);
      
      const result = await storage.revolveLoan(loanId, revolveData, userId);
      res.json(result);
    } catch (error) {
      console.error("Error revolving loan:", error);
      res.status(400).json({ message: "Failed to revolve loan" });
    }
  });

  // Get loan ledger (transaction history)
  app.get('/api/loans/:id/ledger', isAuthenticated, async (req: any, res) => {
    try {
      const loanId = req.params.id;
      const transactions = await storage.getLoanLedger(loanId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching loan ledger:", error);
      res.status(500).json({ message: "Failed to fetch loan ledger" });
    }
  });

  // Get loan balance breakdown
  app.get('/api/loans/:id/balance', isAuthenticated, async (req: any, res) => {
    try {
      const loanId = req.params.id;
      const balance = await storage.calculateLoanBalance(loanId);
      res.json(balance);
    } catch (error) {
      console.error("Error calculating loan balance:", error);
      res.status(500).json({ message: "Failed to calculate loan balance" });
    }
  });

  // Delete/Cancel loan (with audit trail)
  app.delete('/api/loans/:id', isAuthenticated, async (req: any, res) => {
    try {
      const loanId = req.params.id;
      const userId = req.user.claims.sub;
      const { reason } = req.body;
      
      await storage.deleteLoan(loanId, userId, reason);
      res.json({ message: "Loan cancelled successfully" });
    } catch (error) {
      console.error("Error cancelling loan:", error);
      res.status(500).json({ message: "Failed to cancel loan" });
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

  // Create validation schemas for query parameters
  const dateStringSchema = z.string()
    .refine((val) => /^\d{4}-\d{2}-\d{2}$/.test(val), "Date must be in YYYY-MM-DD format")
    .refine((val) => !isNaN(Date.parse(val)), "Must be a valid date")
    .optional();

  const uuidSchema = z.string()
    .refine((val) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val), "Must be a valid UUID")
    .optional();

  const exposureHistoryQuerySchema = z.object({
    from: dateStringSchema,
    to: dateStringSchema,
    bankId: uuidSchema,
    facilityId: uuidSchema,
  }).refine((data) => {
    if (data.from && data.to) {
      const fromDate = new Date(data.from);
      const toDate = new Date(data.to);
      return fromDate <= toDate;
    }
    return true;
  }, "From date must be before or equal to To date");

  const transactionHistoryQuerySchema = z.object({
    from: dateStringSchema,
    to: dateStringSchema,
    bankId: uuidSchema,
    facilityId: uuidSchema,
    loanId: uuidSchema,
    type: transactionTypeZodEnum.optional(),
    limit: z.coerce.number().int().nonnegative().max(1000).default(50).optional(),
    offset: z.coerce.number().int().nonnegative().default(0).optional(),
  }).refine((data) => {
    if (data.from && data.to) {
      const fromDate = new Date(data.from);
      const toDate = new Date(data.to);
      return fromDate <= toDate;
    }
    return true;
  }, "From date must be before or equal to To date");

  // History routes
  app.get('/api/history/exposures', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Initialize sample exposure snapshots for new users (idempotent)
      await ensureSampleExposureSnapshots(userId);

      // Validate query parameters
      const queryResult = exposureHistoryQuerySchema.safeParse(req.query);
      if (!queryResult.success) {
        return res.status(400).json({ 
          message: "Invalid query parameters",
          errors: queryResult.error.errors 
        });
      }

      const filters = { userId, ...queryResult.data };
      const exposures = await storage.listExposureSnapshots(filters);
      res.json(exposures);
    } catch (error) {
      console.error("Error fetching exposure history:", error);
      res.status(500).json({ message: "Failed to fetch exposure history" });
    }
  });

  app.get('/api/history/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Initialize sample transaction history for new users (idempotent)
      await ensureSampleTransactionHistory(userId);

      // Validate query parameters
      const queryResult = transactionHistoryQuerySchema.safeParse(req.query);
      if (!queryResult.success) {
        return res.status(400).json({ 
          message: "Invalid query parameters",
          errors: queryResult.error.errors 
        });
      }

      const filters = { userId, ...queryResult.data };
      
      // Get total count for pagination
      const totalCount = await storage.getTransactionCount(filters);
      const transactions = await storage.listTransactions(filters);
      
      res.json({
        data: transactions,
        total: totalCount,
        limit: queryResult.data.limit || 50,
        offset: queryResult.data.offset || 0
      });
    } catch (error) {
      console.error("Error fetching transaction history:", error);
      res.status(500).json({ message: "Failed to fetch transaction history" });
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

async function initializeSampleFacilities(userId: string) {
  try {
    const userFacilities = await storage.getUserFacilities(userId);
    
    if (userFacilities.length === 0) {
      const banks = await storage.getAllBanks();
      
      if (banks.length > 0) {
        // Create sample facilities for the first few banks
        const sampleFacilities = [
          {
            bankId: banks[0].id, // ANB
            userId,
            facilityType: "revolving" as const,
            creditLimit: "5000000.00",
            costOfFunding: "2.50",
            startDate: new Date().toISOString().split('T')[0],
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            terms: "Standard revolving credit line with monthly interest payments",
            isActive: true
          },
          {
            bankId: banks[1].id, // SABB
            userId,
            facilityType: "term" as const,
            creditLimit: "10000000.00", 
            costOfFunding: "2.75",
            startDate: new Date().toISOString().split('T')[0],
            expiryDate: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            terms: "Two-year term loan facility with quarterly payments",
            isActive: true
          },
          {
            bankId: banks[2].id, // Al Rajhi Bank
            userId,
            facilityType: "working_capital" as const,
            creditLimit: "3000000.00",
            costOfFunding: "2.25", 
            startDate: new Date().toISOString().split('T')[0],
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            terms: "Working capital facility for operational needs",
            isActive: true
          }
        ];

        for (const facility of sampleFacilities) {
          await storage.createFacility(facility);
        }
        
        console.log(`Sample facilities created for user: ${userId}`);
      }
    }
  } catch (error) {
    console.error("Error initializing sample facilities:", error);
  }
}

// Per-user seeding status cache to prevent unnecessary re-seeding
const userSeedingStatus = new Map<string, { exposuresDone: boolean; transactionsDone: boolean }>();

async function ensureSampleExposureSnapshots(userId: string) {
  try {
    // Check cache first to avoid unnecessary database queries
    let status = userSeedingStatus.get(userId);
    if (status?.exposuresDone) {
      return;
    }

    // Double-check in database with a more specific query to handle race conditions
    const existingSnapshots = await storage.listExposureSnapshots({ 
      userId, 
      from: '2024-01-01', 
      to: '2025-09-15' 
    });
    
    if (existingSnapshots.length === 0) {
      const banks = await storage.getAllBanks();
      const userFacilities = await storage.getUserFacilities(userId);
      
      if (banks.length > 0 && userFacilities.length > 0) {
        const snapshots = [];
        const dates = ['2024-01-01', '2025-01-01', '2025-09-15'];
        
        // Find the main banks used in facilities
        const facilityBanks = new Map();
        userFacilities.forEach(facility => {
          facilityBanks.set(facility.bank.id, facility.bank);
        });
        
        for (const date of dates) {
          let totalOutstanding = 0;
          let totalCreditLimit = 0;
          
          // Create bank-level snapshots
          for (const [bankId, bank] of Array.from(facilityBanks)) {
            const bankFacilities = userFacilities.filter(f => f.bank.id === bankId);
            const bankCreditLimit = bankFacilities.reduce((sum, f) => sum + parseFloat(f.creditLimit), 0);
            
            // Progressive increase in exposure over time
            const progressFactor = date === '2024-01-01' ? 0.3 : date === '2025-01-01' ? 0.6 : 0.8;
            const bankOutstanding = bankCreditLimit * progressFactor;
            
            snapshots.push({
              userId,
              date,
              bankId,
              outstanding: bankOutstanding.toFixed(2),
              creditLimit: bankCreditLimit.toFixed(2),
            });
            
            totalOutstanding += bankOutstanding;
            totalCreditLimit += bankCreditLimit;
            
            // Create facility-level snapshots for each bank
            for (const facility of bankFacilities) {
              const facilityOutstanding = parseFloat(facility.creditLimit) * progressFactor;
              snapshots.push({
                userId,
                date,
                bankId: facility.bank.id,
                facilityId: facility.id,
                outstanding: facilityOutstanding.toFixed(2),
                creditLimit: facility.creditLimit,
              });
            }
          }
          
          // Create global total snapshot (bankId and facilityId both null)
          snapshots.push({
            userId,
            date,
            outstanding: totalOutstanding.toFixed(2),
            creditLimit: totalCreditLimit.toFixed(2),
          });
        }
        
        try {
          await storage.addExposureSnapshots(snapshots);
          console.log(`Sample exposure snapshots created for user: ${userId}`);
          
          // Mark as done in cache
          if (!status) {
            status = { exposuresDone: false, transactionsDone: false };
            userSeedingStatus.set(userId, status);
          }
          status.exposuresDone = true;
        } catch (error: any) {
          // If error is due to unique constraint violation, consider it already seeded
          if (error.code === '23505' || error.message?.includes('duplicate key')) {
            console.log(`Sample exposure snapshots already exist for user: ${userId}`);
            if (!status) {
              status = { exposuresDone: false, transactionsDone: false };
              userSeedingStatus.set(userId, status);
            }
            status.exposuresDone = true;
          } else {
            throw error;
          }
        }
      }
    } else {
      // Mark as done in cache since data already exists
      if (!status) {
        status = { exposuresDone: false, transactionsDone: false };
        userSeedingStatus.set(userId, status);
      }
      status.exposuresDone = true;
    }
  } catch (error) {
    console.error("Error ensuring sample exposure snapshots:", error);
  }
}

async function ensureSampleTransactionHistory(userId: string) {
  try {
    // Check cache first to avoid unnecessary database queries
    let status = userSeedingStatus.get(userId);
    if (status?.transactionsDone) {
      return;
    }

    // Check with a specific date range to detect our sample transactions
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const existingTransactions = await storage.listTransactions({ 
      userId, 
      from: threeMonthsAgo.toISOString().split('T')[0],
      limit: 5 
    });
    
    if (existingTransactions.length === 0) {
      const banks = await storage.getAllBanks();
      const userFacilities = await storage.getUserFacilities(userId);
      const activeLoans = await storage.getActiveLoansByUser(userId);
      
      if (banks.length > 0 && userFacilities.length > 0) {
        const transactions = [];
        const dates = [];
        
        // Generate dates for the last 3 months
        for (let i = 0; i < 90; i += 7) { // Weekly transactions
          const date = new Date();
          date.setDate(date.getDate() - i);
          dates.push(date.toISOString().split('T')[0]);
        }
        
        let transactionCounter = 1;
        
        for (const date of dates) {
          // Mix of different transaction types
          const transactionTypes = ['draw', 'repayment', 'fee', 'interest'];
          const numTransactions = Math.floor(Math.random() * 3) + 1; // 1-3 transactions per date
          
          for (let i = 0; i < numTransactions; i++) {
            const facility = userFacilities[Math.floor(Math.random() * userFacilities.length)];
            const type = transactionTypes[Math.floor(Math.random() * transactionTypes.length)] as 'draw' | 'repayment' | 'fee' | 'interest';
            
            let amount;
            switch (type) {
              case 'draw':
                amount = (Math.random() * 500000 + 100000).toFixed(2); // 100K-600K draws
                break;
              case 'repayment':
                amount = (Math.random() * 300000 + 50000).toFixed(2); // 50K-350K repayments
                break;
              case 'fee':
                amount = (Math.random() * 5000 + 500).toFixed(2); // 500-5500 fees
                break;
              case 'interest':
                amount = (Math.random() * 15000 + 2000).toFixed(2); // 2K-17K interest
                break;
              default:
                amount = (Math.random() * 10000 + 1000).toFixed(2);
            }
            
            transactions.push({
              userId,
              date,
              bankId: facility.bank.id,
              facilityId: facility.id,
              loanId: activeLoans.length > 0 ? activeLoans[Math.floor(Math.random() * activeLoans.length)].id : undefined,
              type,
              amount,
              reference: `TXN-${String(transactionCounter).padStart(6, '0')}`,
              notes: `Sample ${type} transaction for ${facility.bank.name}`,
            });
            
            transactionCounter++;
          }
        }
        
        try {
          // Insert transactions one by one to handle potential conflicts gracefully
          let successCount = 0;
          for (const transaction of transactions) {
            try {
              await storage.addTransaction(transaction);
              successCount++;
            } catch (error: any) {
              // Skip transaction on conflict but continue with others
              console.log(`Transaction with reference ${transaction.reference} already exists, skipping`);
            }
          }
          
          console.log(`Sample transaction history created for user: ${userId} (${successCount} transactions)`);
          
          // Mark as done in cache
          if (!status) {
            status = { exposuresDone: false, transactionsDone: false };
            userSeedingStatus.set(userId, status);
          }
          status.transactionsDone = true;
        } catch (error: any) {
          console.error("Error creating sample transactions:", error);
          // Still mark as done to prevent repeated attempts if it's a systemic issue
          if (!status) {
            status = { exposuresDone: false, transactionsDone: false };
            userSeedingStatus.set(userId, status);
          }
          status.transactionsDone = true;
        }
      }
    } else {
      // Mark as done in cache since data already exists
      if (!status) {
        status = { exposuresDone: false, transactionsDone: false };
        userSeedingStatus.set(userId, status);
      }
      status.transactionsDone = true;
    }
  } catch (error) {
    console.error("Error ensuring sample transaction history:", error);
  }
}
