import type { Express } from "express";
import { createServer, type Server } from "http";
import { createStorage, type IStorage, initializeStorage } from "./storage";
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
  insertLoanReminderSchema,
  updateLoanReminderSchema,
  insertGuaranteeSchema,
  updateGuaranteeSchema,
  insertAiInsightConfigSchema,
  insertExposureSnapshotSchema,
  insertTransactionSchema,
  transactionTypeZodEnum,
  paymentRequestSchema,
  settlementRequestSchema,
  revolveRequestSchema,
  insertAttachmentSchema,
  insertAttachmentAuditSchema,
  attachmentUploadIntentSchema,
  updateAttachmentMetaSchema,
  attachmentOwnerTypeZodEnum,
  attachmentCategoryZodEnum,
} from "@shared/schema";
import { z } from "zod";
import crypto from "crypto";

// Global storage instance
let storage: IStorage;

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize database connection with health check
  const databaseAvailable = await initializeDatabase();
  
  // Create storage based on database availability
  storage = createStorage(databaseAvailable);
  
  // Initialize the global storage instance for auth system
  initializeStorage(databaseAvailable);
  
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

  // Get single bank by ID
  app.get('/api/banks/:bankId', isAuthenticated, async (req, res) => {
    try {
      const { bankId } = req.params;
      const banks = await storage.getAllBanks();
      const bank = banks.find(b => b.id === bankId);
      
      if (!bank) {
        return res.status(404).json({ message: "Bank not found" });
      }
      
      res.json(bank);
    } catch (error) {
      console.error("Error fetching bank:", error);
      res.status(500).json({ message: "Failed to fetch bank" });
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

  // Get single facility by ID
  app.get('/api/facilities/:facilityId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { facilityId } = req.params;
      
      // Get facility with bank information  
      const facility = await storage.getFacilityWithBank(facilityId);
      
      if (!facility) {
        return res.status(404).json({ message: "Facility not found" });
      }

      // Verify user has access to this facility
      if (facility.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(facility);
    } catch (error) {
      console.error("Error fetching facility:", error);
      res.status(500).json({ message: "Failed to fetch facility" });
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
      
      // Extract assignment fields from request
      const { facilityId, pledgeType, ...collateralFields } = req.body;
      
      // Validate required assignment fields
      if (!facilityId) {
        return res.status(400).json({ message: "Facility selection is required for collateral creation" });
      }
      
      if (!pledgeType) {
        return res.status(400).json({ message: "Pledge type is required for collateral creation" });
      }
      
      // Validate collateral data
      const collateralData = insertCollateralSchema.parse({ ...collateralFields, userId });
      
      // Validate user owns the facility
      const userFacilities = await storage.getUserFacilities(userId);
      const facility = userFacilities.find((f: any) => f.id === facilityId);
      if (!facility) {
        return res.status(403).json({ message: "Facility not found or access denied" });
      }
      
      // Create collateral first
      const collateral = await storage.createCollateral(collateralData);
      
      // Then immediately create the assignment (atomically)
      try {
        const assignmentData = {
          collateralId: collateral.id,
          facilityId,
          pledgeType,
          effectiveDate: new Date().toISOString().split('T')[0],
          isActive: true,
          userId
        };
        
        await storage.createCollateralAssignment(assignmentData);
        
        res.json(collateral);
      } catch (assignmentError) {
        // If assignment fails, rollback the collateral creation
        try {
          await storage.deleteCollateral(collateral.id);
        } catch (rollbackError) {
          console.error("Failed to rollback collateral after assignment failure:", rollbackError);
        }
        throw assignmentError;
      }
      
    } catch (error) {
      console.error("Error creating collateral:", error);
      res.status(400).json({ message: "Failed to create collateral and assignment" });
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
      
      // Preprocess date fields - convert empty strings to null for optional dates
      const processedBody = { ...req.body };
      if (processedBody.chargesDueDate === "") {
        processedBody.chargesDueDate = null;
      }
      if (processedBody.lastAccrualDate === "") {
        processedBody.lastAccrualDate = null;
      }
      if (processedBody.settledDate === "") {
        processedBody.settledDate = null;
      }
      
      const loanData = insertLoanSchema.parse({ ...processedBody, userId });
      
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
      
      // Handle credit line assignment (either provided or auto-assign)
      let finalCreditLineId = loanData.creditLineId;
      
      if (loanData.creditLineId) {
        // Validate provided credit line
        const userCreditLines = await storage.getUserCreditLines(userId);
        const creditLine = userCreditLines.find((cl: any) => cl.id === loanData.creditLineId);
        
        if (!creditLine) {
          return res.status(403).json({ message: "Credit line not found or access denied" });
        }
        
        if (creditLine.facility.id !== loanData.facilityId) {
          return res.status(400).json({ message: "Credit line does not belong to the specified facility" });
        }
        
        finalCreditLineId = loanData.creditLineId;
      } else {
        // Auto-assign: find or create a credit line for this facility
        const userCreditLines = await storage.getUserCreditLines(userId);
        const facilityCreditLines = userCreditLines.filter((cl: any) => cl.facilityId === loanData.facilityId);
        
        if (facilityCreditLines.length > 0) {
          // Use the first available credit line for this facility
          finalCreditLineId = facilityCreditLines[0].id;
        } else {
          // Create a new credit line for this facility
          const newCreditLine = await storage.createCreditLine({
            facilityId: loanData.facilityId,
            userId,
            creditLineType: "working_capital", // Default to working capital type
            name: `Credit Line 1 - ${facility.bank?.name || 'Bank'}`,
            description: "Auto-created credit line for loan drawdown",
            creditLimit: facility.creditLimit, // Use facility's credit limit
            interestRate: facility.costOfFunding
          });
          finalCreditLineId = newCreditLine.id;
        }
      }
      
      // TODO: Additional validation - check available credit limit vs loan amount
      
      // Ensure creditLineId is set before creating the loan
      const finalLoanData = { ...loanData, creditLineId: finalCreditLineId };
      const loan = await storage.createLoan(finalLoanData);
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

  // Loan Reminder routes
  app.get('/api/loans/:loanId/reminders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { loanId } = req.params;
      
      // Verify user owns the loan
      const loan = await storage.getLoanById(loanId);
      if (!loan || loan.userId !== userId) {
        return res.status(404).json({ message: "Loan not found" });
      }
      
      const reminders = await storage.getLoanReminders(loanId);
      res.json(reminders);
    } catch (error) {
      console.error("Error fetching loan reminders:", error);
      res.status(500).json({ message: "Failed to fetch reminders" });
    }
  });

  app.post('/api/loans/:loanId/reminders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { loanId } = req.params;
      
      // Verify user owns the loan
      const loan = await storage.getLoanById(loanId);
      if (!loan || loan.userId !== userId) {
        return res.status(404).json({ message: "Loan not found" });
      }
      
      const reminderData = insertLoanReminderSchema.parse({
        ...req.body,
        loanId,
        userId,
      });
      
      const reminder = await storage.createLoanReminder(reminderData);
      res.status(201).json(reminder);
    } catch (error) {
      console.error("Error creating reminder:", error);
      res.status(500).json({ message: "Failed to create reminder" });
    }
  });

  app.put('/api/reminders/:reminderId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { reminderId } = req.params;
      
      // First verify the reminder exists and user owns it
      const existingReminders = await storage.getUserReminders(userId);
      const existingReminder = existingReminders.find(r => r.id === reminderId);
      
      if (!existingReminder) {
        return res.status(404).json({ message: "Reminder not found" });
      }
      
      const reminderData = updateLoanReminderSchema.parse({
        ...req.body,
        id: reminderId,
      });
      
      const reminder = await storage.updateLoanReminder(reminderId, reminderData);
      res.json(reminder);
    } catch (error) {
      console.error("Error updating reminder:", error);
      res.status(500).json({ message: "Failed to update reminder" });
    }
  });

  app.delete('/api/reminders/:reminderId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { reminderId } = req.params;
      
      // First verify the reminder exists and user owns it
      const existingReminders = await storage.getUserReminders(userId);
      const existingReminder = existingReminders.find(r => r.id === reminderId);
      
      if (!existingReminder) {
        return res.status(404).json({ message: "Reminder not found" });
      }
      
      await storage.deleteLoanReminder(reminderId);
      res.status(200).json({ message: "Reminder deleted successfully" });
    } catch (error) {
      console.error("Error deleting reminder:", error);
      res.status(500).json({ message: "Failed to delete reminder" });
    }
  });

  app.get('/api/user/reminders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const reminders = await storage.getUserReminders(userId);
      res.json(reminders);
    } catch (error) {
      console.error("Error fetching user reminders:", error);
      res.status(500).json({ message: "Failed to fetch user reminders" });
    }
  });

  // Calendar invite endpoints
  app.get('/api/reminders/:reminderId/calendar', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { reminderId } = req.params;
      
      // Verify the reminder exists and user owns it
      const existingReminders = await storage.getUserReminders(userId);
      const reminder = existingReminders.find(r => r.id === reminderId);
      
      if (!reminder) {
        return res.status(404).json({ message: "Reminder not found" });
      }

      // Fetch the loan data separately
      const loan = await storage.getLoanById(reminder.loanId);
      if (!loan || loan.userId !== userId) {
        return res.status(404).json({ message: "Loan not found" });
      }

      const { CalendarService } = await import('./calendarService');
      const user = await storage.getUser(userId);
      const userEmail = user?.email || 'user@example.com';
      
      const icsContent = CalendarService.generateICSFile(reminder, loan, userEmail);
      const fileName = CalendarService.generateFileName(reminder, loan);
      
      res.set({
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-cache'
      });
      
      res.send(icsContent);
    } catch (error) {
      console.error("Error generating calendar invite:", error);
      res.status(500).json({ message: "Failed to generate calendar invite" });
    }
  });

  app.get('/api/loans/:loanId/reminders/calendar', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { loanId } = req.params;
      
      // Verify loan ownership  
      const loan = await storage.getLoanById(loanId);
      if (!loan || loan.userId !== userId) {
        return res.status(404).json({ message: "Loan not found" });
      }

      // Get all reminders for this loan
      const loanReminders = await storage.getLoanReminders(loanId);
      
      if (loanReminders.length === 0) {
        return res.status(404).json({ message: "No reminders found for this loan" });
      }

      // Create reminders with loan data for bulk generation
      const remindersWithLoan = loanReminders.map(reminder => ({
        ...reminder,
        loan: loan
      }));

      const { CalendarService } = await import('./calendarService');
      const user = await storage.getUser(userId);
      const userEmail = user?.email || 'user@example.com';
      
      const icsContent = CalendarService.generateBulkICSFile(remindersWithLoan, userEmail);
      const fileName = `loan-${loan.referenceNumber}-reminders-${new Date().toISOString().split('T')[0]}.ics`;
      
      res.set({
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-cache'
      });
      
      res.send(icsContent);
    } catch (error) {
      console.error("Error generating bulk calendar invites:", error);
      res.status(500).json({ message: "Failed to generate calendar invites" });
    }
  });

  app.get('/api/user/reminders/calendar', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const remindersWithLoans = await storage.getUserReminders(userId);
      
      if (remindersWithLoans.length === 0) {
        return res.status(404).json({ message: "No reminders found" });
      }

      const { CalendarService } = await import('./calendarService');
      const user = await storage.getUser(userId);
      const userEmail = user?.email || 'user@example.com';
      
      const icsContent = CalendarService.generateBulkICSFile(remindersWithLoans, userEmail);
      const fileName = CalendarService.generateBulkFileName();
      
      res.set({
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-cache'
      });
      
      res.send(icsContent);
    } catch (error) {
      console.error("Error generating all calendar invites:", error);
      res.status(500).json({ message: "Failed to generate calendar invites" });
    }
  });

  // Guarantee routes
  app.get('/api/guarantees', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const guarantees = await storage.getUserGuarantees(userId);
      res.json(guarantees);
    } catch (error) {
      console.error("Error fetching guarantees:", error);
      res.status(500).json({ message: "Failed to fetch guarantees" });
    }
  });

  app.get('/api/guarantees/:guaranteeId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { guaranteeId } = req.params;
      
      const guarantee = await storage.getGuaranteeById(guaranteeId);
      if (!guarantee || guarantee.userId !== userId) {
        return res.status(404).json({ message: "Guarantee not found" });
      }
      
      res.json(guarantee);
    } catch (error) {
      console.error("Error fetching guarantee:", error);
      res.status(500).json({ message: "Failed to fetch guarantee" });
    }
  });

  app.post('/api/guarantees', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const guaranteeData = insertGuaranteeSchema.parse({
        ...req.body,
        userId,
      });
      
      // Verify user owns the facility
      const userFacilities = await storage.getUserFacilities(userId);
      const facility = userFacilities.find(f => f.id === guaranteeData.facilityId);
      if (!facility) {
        return res.status(404).json({ message: "Facility not found" });
      }
      
      const guarantee = await storage.createGuarantee(guaranteeData);
      res.status(201).json(guarantee);
    } catch (error) {
      console.error("Error creating guarantee:", error);
      res.status(500).json({ message: "Failed to create guarantee" });
    }
  });

  app.put('/api/guarantees/:guaranteeId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { guaranteeId } = req.params;
      
      // Verify user owns the guarantee
      const existingGuarantee = await storage.getGuaranteeById(guaranteeId);
      if (!existingGuarantee || existingGuarantee.userId !== userId) {
        return res.status(404).json({ message: "Guarantee not found" });
      }
      
      const guaranteeData = updateGuaranteeSchema.parse({
        ...req.body,
        id: guaranteeId,
      });
      
      const guarantee = await storage.updateGuarantee(guaranteeId, guaranteeData);
      res.json(guarantee);
    } catch (error) {
      console.error("Error updating guarantee:", error);
      res.status(500).json({ message: "Failed to update guarantee" });
    }
  });

  app.delete('/api/guarantees/:guaranteeId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { guaranteeId } = req.params;
      
      // Verify user owns the guarantee
      const existingGuarantee = await storage.getGuaranteeById(guaranteeId);
      if (!existingGuarantee || existingGuarantee.userId !== userId) {
        return res.status(404).json({ message: "Guarantee not found" });
      }
      
      await storage.deleteGuarantee(guaranteeId);
      res.status(200).json({ message: "Guarantee deleted successfully" });
    } catch (error) {
      console.error("Error deleting guarantee:", error);
      res.status(500).json({ message: "Failed to delete guarantee" });
    }
  });

  app.get('/api/facilities/:facilityId/guarantees', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { facilityId } = req.params;
      
      // Verify user owns the facility
      const userFacilities = await storage.getUserFacilities(userId);
      const facility = userFacilities.find(f => f.id === facilityId);
      if (!facility) {
        return res.status(404).json({ message: "Facility not found" });
      }
      
      const guarantees = await storage.getFacilityGuarantees(facilityId);
      res.json(guarantees);
    } catch (error) {
      console.error("Error fetching facility guarantees:", error);
      res.status(500).json({ message: "Failed to fetch facility guarantees" });
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
      const insights = await generateAIInsights(userId, storage);
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

  // Loan settlement data endpoint for Transaction History enhancements
  app.get('/api/history/loan-settlements', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Validate query parameters
      const querySchema = z.object({
        bankId: z.string().optional(),
        facilityId: z.string().optional(),
        from: z.string().optional(),
        to: z.string().optional(),
      });
      
      const queryResult = querySchema.safeParse(req.query);
      if (!queryResult.success) {
        return res.status(400).json({ 
          message: "Invalid query parameters",
          errors: queryResult.error.errors 
        });
      }

      // Get all user loans with related data
      const loans = await storage.getActiveLoansByUser(userId);
      const settledLoans = await storage.getSettledLoansByUser(userId);
      const allLoans = [...loans, ...settledLoans];

      // Calculate settlement data for each loan
      const settlementData = await Promise.all(
        allLoans.map(async (loan) => {
          // Get loan transactions to calculate settlement progress
          const transactions = await storage.getLoanLedger(loan.id);
          
          // Calculate totals with principal vs interest breakdown
          const totalDrawn = transactions
            .filter(t => t.type === 'draw')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
          
          // Break down repayments into principal vs interest
          const repaymentTransactions = transactions.filter(t => t.type === 'repayment');
          let principalPaid = 0;
          let interestPaidFromRepayments = 0;
          let totalRepaid = 0;
          
          repaymentTransactions.forEach(t => {
            const amount = parseFloat(t.amount);
            totalRepaid += amount;
            
            // Check if allocation data exists
            if (t.allocation && typeof t.allocation === 'object') {
              const allocation = t.allocation as any;
              principalPaid += parseFloat(allocation.principal || 0);
              interestPaidFromRepayments += parseFloat(allocation.interest || 0);
            } else {
              // If no allocation data, treat as principal payment for now
              principalPaid += amount;
            }
          });
          
          // Separate interest and fee transactions
          const interestCharges = transactions
            .filter(t => t.type === 'interest')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
          
          const feeCharges = transactions
            .filter(t => t.type === 'fee')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
          
          // Total interest paid (from repayment allocations + separate interest transactions)
          const totalInterestPaid = interestPaidFromRepayments;
          
          // Total charges (interest + fees)
          const totalCharges = interestCharges + feeCharges;
          
          const outstandingBalance = totalDrawn + totalCharges - totalRepaid;
          const settlementProgress = totalDrawn > 0 ? (totalRepaid / (totalDrawn + totalCharges)) * 100 : 0;
          
          // Calculate principal and interest progress
          const principalProgress = totalDrawn > 0 ? (principalPaid / totalDrawn) * 100 : 0;
          const interestProgress = totalCharges > 0 ? (totalInterestPaid / totalCharges) * 100 : 0;
          
          // Determine settlement status
          let settlementStatus = loan.status;
          if (outstandingBalance <= 0 && loan.status === 'active') {
            settlementStatus = 'settled';
          } else if (new Date(loan.dueDate) < new Date() && outstandingBalance > 0) {
            settlementStatus = 'overdue';
          }
          
          return {
            loanId: loan.id,
            referenceNumber: loan.referenceNumber,
            bankName: loan.creditLine.facility.bank.name,
            facilityId: loan.creditLine.facilityId,
            amount: parseFloat(loan.amount),
            totalDrawn,
            totalRepaid,
            principalPaid,
            totalInterestPaid,
            interestCharges,
            feeCharges,
            totalCharges,
            outstandingBalance: Math.max(0, outstandingBalance),
            settlementProgress: Math.min(100, Math.max(0, settlementProgress)),
            principalProgress: Math.min(100, Math.max(0, principalProgress)),
            interestProgress: Math.min(100, Math.max(0, interestProgress)),
            settlementStatus,
            dueDate: loan.dueDate,
            settledDate: loan.settledDate,
            startDate: loan.startDate,
            transactionCount: transactions.length,
            lastTransactionDate: transactions.length > 0 
              ? Math.max(...transactions.map(t => new Date(t.date).getTime()))
              : null,
            breakdown: {
              principalOwed: totalDrawn,
              principalPaid,
              principalRemaining: Math.max(0, totalDrawn - principalPaid),
              interestOwed: interestCharges,
              interestPaid: totalInterestPaid,
              interestRemaining: Math.max(0, interestCharges - totalInterestPaid),
              feesOwed: feeCharges,
              feesRemaining: Math.max(0, feeCharges)
            }
          };
        })
      );

      // Apply filters if provided
      let filteredData = settlementData;
      
      if (queryResult.data.bankId) {
        filteredData = filteredData.filter(loan => 
          allLoans.find(l => l.id === loan.loanId)?.creditLine.facility.bank.id === queryResult.data.bankId
        );
      }
      
      if (queryResult.data.facilityId) {
        filteredData = filteredData.filter(loan => loan.facilityId === queryResult.data.facilityId);
      }
      
      if (queryResult.data.from) {
        const fromDate = new Date(queryResult.data.from);
        filteredData = filteredData.filter(loan => new Date(loan.startDate) >= fromDate);
      }
      
      if (queryResult.data.to) {
        const toDate = new Date(queryResult.data.to);
        filteredData = filteredData.filter(loan => new Date(loan.startDate) <= toDate);
      }

      // Sort by most recent activity
      filteredData.sort((a, b) => {
        const aLastActivity = a.lastTransactionDate || new Date(a.startDate).getTime();
        const bLastActivity = b.lastTransactionDate || new Date(b.startDate).getTime();
        return bLastActivity - aLastActivity;
      });

      res.json({
        data: filteredData,
        summary: {
          totalLoans: filteredData.length,
          activeLoans: filteredData.filter(l => l.settlementStatus === 'active').length,
          settledLoans: filteredData.filter(l => l.settlementStatus === 'settled').length,
          overdueLoans: filteredData.filter(l => l.settlementStatus === 'overdue').length,
          totalOutstanding: filteredData.reduce((sum, l) => sum + l.outstandingBalance, 0),
          averageSettlementProgress: filteredData.length > 0 
            ? filteredData.reduce((sum, l) => sum + l.settlementProgress, 0) / filteredData.length 
            : 0
        }
      });
    } catch (error) {
      console.error("Error fetching loan settlement data:", error);
      res.status(500).json({ message: "Failed to fetch loan settlement data" });
    }
  });

  // Attachment routes
  // Upload intent - generates signed URL for direct upload to object storage
  app.post('/api/attachments/upload-intent', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const uploadData = attachmentUploadIntentSchema.parse(req.body);
      
      // Generate storage key
      const timestamp = new Date().toISOString().slice(0, 7); // YYYY-MM format
      const fileId = crypto.randomUUID();
      const sanitizedFileName = uploadData.fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storageKey = `attachments/${uploadData.ownerType}/${uploadData.ownerId}/${timestamp}/${fileId}_${sanitizedFileName}`;
      
      // For now, we'll return a mock signed URL since object storage integration will be added later
      const signedUrl = `${process.env.PUBLIC_OBJECT_SEARCH_PATHS || '/storage'}/${storageKey}`;
      
      res.json({
        storageKey,
        uploadUrl: signedUrl,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
      });
    } catch (error) {
      console.error('Error creating upload intent:', error);
      res.status(400).json({ message: 'Failed to create upload intent' });
    }
  });

  // Finalize attachment record after successful upload
  app.post('/api/attachments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const attachmentData = insertAttachmentSchema.parse({
        ...req.body,
        userId,
        uploadedBy: userId,
      });
      
      const attachment = await storage.createAttachment(attachmentData);
      
      // Log audit trail
      await storage.createAttachmentAudit({
        attachmentId: attachment.id,
        userId,
        action: 'upload',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { fileName: attachment.fileName, fileSize: attachment.fileSize },
      });
      
      res.status(201).json(attachment);
    } catch (error) {
      console.error('Error creating attachment:', error);
      res.status(400).json({ message: 'Failed to create attachment' });
    }
  });

  // List attachments for an entity
  app.get('/api/attachments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Validate query parameters with Zod
      const querySchema = z.object({
        ownerType: attachmentOwnerTypeZodEnum,
        ownerId: z.string().min(1),
      });
      
      const { ownerType, ownerId } = querySchema.parse(req.query);
      
      const attachments = await storage.getAttachmentsByOwner(
        ownerType,
        ownerId,
        userId
      );
      
      res.json(attachments);
    } catch (error) {
      console.error('Error fetching attachments:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid query parameters', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Failed to fetch attachments' });
      }
    }
  });

  // Get single attachment with download URL
  app.get('/api/attachments/:attachmentId/download', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { attachmentId } = req.params;
      
      const attachment = await storage.getAttachmentById(attachmentId, userId);
      if (!attachment) {
        return res.status(404).json({ message: 'Attachment not found' });
      }
      
      // Generate signed download URL (mock for now)
      const downloadUrl = `${process.env.PUBLIC_OBJECT_SEARCH_PATHS || '/storage'}/${attachment.storageKey}`;
      
      // Log audit trail
      await storage.createAttachmentAudit({
        attachmentId: attachment.id,
        userId,
        action: 'download',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { fileName: attachment.fileName },
      });
      
      res.json({
        downloadUrl,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
        fileName: attachment.fileName,
        contentType: attachment.contentType,
      });
    } catch (error) {
      console.error('Error getting attachment download URL:', error);
      res.status(500).json({ message: 'Failed to get download URL' });
    }
  });

  // Update attachment metadata
  app.patch('/api/attachments/:attachmentId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { attachmentId } = req.params;
      const metadata = updateAttachmentMetaSchema.parse(req.body);
      
      const attachment = await storage.updateAttachmentMetadata(attachmentId, metadata, userId);
      
      // Log audit trail
      await storage.createAttachmentAudit({
        attachmentId: attachment.id,
        userId,
        action: 'update_meta',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { changes: metadata },
      });
      
      res.json(attachment);
    } catch (error) {
      console.error('Error updating attachment metadata:', error);
      res.status(400).json({ message: 'Failed to update attachment metadata' });
    }
  });

  // Delete attachment (soft delete)
  app.delete('/api/attachments/:attachmentId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { attachmentId } = req.params;
      
      await storage.deleteAttachment(attachmentId, userId);
      
      // Log audit trail
      await storage.createAttachmentAudit({
        attachmentId,
        userId,
        action: 'delete',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: {},
      });
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting attachment:', error);
      res.status(500).json({ message: 'Failed to delete attachment' });
    }
  });

  // Get attachment audit trail
  app.get('/api/attachments/:attachmentId/audit', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { attachmentId } = req.params;
      
      // Verify user has access to the attachment
      const attachment = await storage.getAttachmentById(attachmentId, userId);
      if (!attachment) {
        return res.status(404).json({ message: 'Attachment not found' });
      }
      
      const auditTrail = await storage.getAttachmentAuditTrail(attachmentId);
      res.json(auditTrail);
    } catch (error) {
      console.error('Error fetching attachment audit trail:', error);
      res.status(500).json({ message: 'Failed to fetch audit trail' });
    }
  });

  // Admin session storage (in production, use proper session store)
  const adminSessions = new Map<string, { username: string; role: string; loginTime: string }>();

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

  // Admin system stats
  app.get('/api/admin/system/stats', isAdminAuthenticated, async (req: any, res) => {
    try {
      // Get real system stats
      const loans = await storage.getAllLoans(req.user?.claims?.sub || 'demo-user');
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

  // Regular admin routes (kept for backward compatibility during transition)
  app.get('/api/admin/stats', isAuthenticated, async (req: any, res) => {
    try {
      // Get aggregate stats for admin dashboard
      const loans = await storage.getAllLoans(req.user.claims.sub);
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

  app.get('/api/admin/users', isAuthenticated, async (req: any, res) => {
    try {
      // For demo purposes, return the current user
      const currentUser = req.user.claims;
      
      const users = [{
        id: currentUser.sub,
        email: currentUser.email || 'admin@example.com',
        firstName: currentUser.first_name || 'Admin',
        lastName: currentUser.last_name || 'User',
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
