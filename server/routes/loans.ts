import type { Express } from "express";
import type { AppDependencies } from "../types";
import { isAuthenticated } from "../replitAuth";
import { attachOrganizationContext, requireOrganization } from "../organizationMiddleware";
import { 
  insertLoanSchema, 
  paymentRequestSchema,
  settlementRequestSchema,
  revolveRequestSchema
} from "@shared/schema";
import { sendTemplateReminderEmail } from "../emailService";

export function registerLoansRoutes(app: Express, deps: AppDependencies) {
  const { storage } = deps;

  app.get('/api/loans', isAuthenticated, attachOrganizationContext, requireOrganization, async (req: any, res) => {
    try {
      const organizationId = req.organizationId;
      const status = req.query.status as string;
      
      let loans;
      if (status === 'settled') {
        loans = await storage.getSettledLoansByUser(organizationId);
      } else {
        loans = await storage.getActiveLoansByUser(organizationId);
      }
      
      res.json(loans);
    } catch (error) {
      console.error("Error fetching loans:", error);
      res.status(500).json({ message: "Failed to fetch loans" });
    }
  });

  app.post('/api/loans', isAuthenticated, attachOrganizationContext, requireOrganization, async (req: any, res) => {
    try {
      const organizationId = req.organizationId;
      const userId = req.user.claims.sub;
      
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
      
      const loanData = insertLoanSchema.parse({ ...processedBody, organizationId, userId });
      
      if (!loanData.facilityId) {
        return res.status(400).json({ message: "Facility is required for loan creation" });
      }
      
      const userFacilities = await storage.getUserFacilities(organizationId);
      const facility = userFacilities.find((f: any) => f.id === loanData.facilityId);
      
      if (!facility) {
        return res.status(403).json({ message: "Facility not found or access denied" });
      }
      
      let finalCreditLineId = loanData.creditLineId;
      
      if (loanData.creditLineId) {
        const userCreditLines = await storage.getUserCreditLines(organizationId);
        const creditLine = userCreditLines.find((cl: any) => cl.id === loanData.creditLineId);
        
        if (!creditLine) {
          return res.status(403).json({ message: "Credit line not found or access denied" });
        }
        
        if (creditLine.facility.id !== loanData.facilityId) {
          return res.status(400).json({ message: "Credit line does not belong to the specified facility" });
        }
        
        finalCreditLineId = loanData.creditLineId;
      } else {
        const userCreditLines = await storage.getUserCreditLines(organizationId);
        const facilityCreditLines = userCreditLines.filter((cl: any) => cl.facilityId === loanData.facilityId);
        
        if (facilityCreditLines.length > 0) {
          finalCreditLineId = facilityCreditLines[0].id;
        } else {
          const newCreditLine = await storage.createCreditLine({
            facilityId: loanData.facilityId,
            organizationId,
            creditLineType: "working_capital",
            name: `Credit Line 1 - ${facility.bank?.name || 'Bank'}`,
            description: "Auto-created credit line for loan drawdown",
            creditLimit: facility.creditLimit,
            interestRate: facility.costOfFunding
          });
          finalCreditLineId = newCreditLine.id;
        }
      }
      
      const finalLoanData = { ...loanData, creditLineId: finalCreditLineId };
      const loan = await storage.createLoan(finalLoanData);

      try {
        const userSettings = await storage.getUserReminderSettings(organizationId);
        
        if (userSettings && userSettings.autoApplyEnabled && Array.isArray(userSettings.defaultIntervals) && userSettings.defaultIntervals.length > 0) {
          const validIntervals = Array.from(new Set(
            userSettings.defaultIntervals.filter(interval => 
              Number.isInteger(interval) && interval > 0
            )
          ));

          if (validIntervals.length === 0) {
            console.warn("No valid intervals found for loan:", loan.id, "- skipping auto-reminder generation");
          } else {
            const loanDueDate = new Date(loan.dueDate);
            if (isNaN(loanDueDate.getTime())) {
              console.warn("Invalid due date for loan:", loan.id, "- skipping auto-reminder generation");
            } else {
              const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Riyadh' });
              
              const existingReminders = await storage.getLoanReminders(loan.id);
              const existingDates = new Set(existingReminders.map(r => new Date(r.reminderDate).toLocaleDateString('en-CA', { timeZone: 'Asia/Riyadh' })));
              
              const reminderPromises = validIntervals.map(async (interval) => {
                const reminderDate = new Date(loanDueDate);
                reminderDate.setDate(reminderDate.getDate() - interval);
                const reminderDateStr = reminderDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Riyadh' });
                
                if (reminderDateStr <= today) {
                  return { success: false, reason: 'past_date', interval };
                }
                
                if (existingDates.has(reminderDateStr)) {
                  return { success: false, reason: 'duplicate_date', interval };
                }

                const reminderData = {
                  loanId: loan.id,
                  organizationId,
                  type: 'due_date' as const,
                  title: `Payment Due in ${interval} Days`,
                  reminderDate: new Date(reminderDateStr),
                  message: `Automated reminder: Payment due in ${interval} days`,
                  emailEnabled: userSettings.defaultEmailEnabled,
                  calendarEnabled: userSettings.defaultCalendarEnabled,
                };

                try {
                  const createdReminder = await storage.createLoanReminder(reminderData);
                  
                  if (createdReminder.emailEnabled) {
                    console.log(`Auto-reminder created with email enabled: ${createdReminder.id} (email will be sent by reminder processing system)`);
                  }
                  
                  return { success: true, reminder: createdReminder, interval };
                } catch (error) {
                  console.warn(`Failed to create reminder for interval ${interval} days:`, error);
                  return { success: false, reason: 'creation_failed', interval, error };
                }
              });

              const results = await Promise.allSettled(reminderPromises);
              const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
              const skippedCount = results.filter(r => r.status === 'fulfilled' && !r.value.success).length;
              
              if (successCount > 0) {
                console.log(`Successfully created ${successCount} auto-generated reminders for loan ${loan.id}${skippedCount > 0 ? ` (${skippedCount} skipped)` : ''}`);
              }
            }
          }
        }
      } catch (reminderError) {
        console.warn("Failed to auto-generate reminders for loan:", loan.id, reminderError);
      }

      res.json(loan);
    } catch (error: any) {
      console.error("Error creating loan:", error);
      
      // Handle Zod validation errors with specific messages
      if (error.name === 'ZodError') {
        const firstError = error.issues?.[0];
        if (firstError) {
          const field = firstError.path.join('.');
          return res.status(400).json({ 
            message: `Validation error: ${firstError.message}`,
            field: field,
            error: firstError.message 
          });
        }
      }
      
      res.status(400).json({ message: "Failed to create loan" });
    }
  });

  app.get('/api/loans/:id', isAuthenticated, attachOrganizationContext, requireOrganization, async (req: any, res) => {
    try {
      const loanId = req.params.id;
      const organizationId = req.organizationId;
      const loan = await storage.getLoanById(loanId);
      
      if (!loan || loan.organizationId !== organizationId) {
        return res.status(404).json({ message: "Loan not found" });
      }
      
      res.json(loan);
    } catch (error) {
      console.error("Error fetching loan:", error);
      res.status(500).json({ message: "Failed to fetch loan" });
    }
  });

  app.patch('/api/loans/:id', isAuthenticated, attachOrganizationContext, requireOrganization, async (req: any, res) => {
    try {
      const loanId = req.params.id;
      const organizationId = req.organizationId;
      const { reason, ...updateData } = req.body;
      
      const validatedData = insertLoanSchema.partial().parse(updateData);
      
      const updatedLoan = await storage.updateLoan(loanId, validatedData, organizationId, reason);
      res.json(updatedLoan);
    } catch (error) {
      console.error("Error updating loan:", error);
      res.status(400).json({ message: "Failed to update loan" });
    }
  });

  app.post('/api/loans/:id/repayments', isAuthenticated, attachOrganizationContext, requireOrganization, async (req: any, res) => {
    try {
      const loanId = req.params.id;
      const organizationId = req.organizationId;
      const userId = req.user.claims.sub;
      const paymentData = paymentRequestSchema.parse(req.body);
      
      // Verify loan belongs to organization before processing payment
      const loan = await storage.getLoanById(loanId);
      if (!loan || loan.organizationId !== organizationId) {
        return res.status(404).json({ message: "Loan not found" });
      }
      
      const result = await storage.processPayment(loanId, paymentData, userId);
      res.json(result);
    } catch (error) {
      console.error("Error processing payment:", error);
      res.status(400).json({ message: "Failed to process payment" });
    }
  });

  app.post('/api/loans/:id/settle', isAuthenticated, attachOrganizationContext, requireOrganization, async (req: any, res) => {
    try {
      const loanId = req.params.id;
      const organizationId = req.organizationId;
      const userId = req.user.claims.sub;
      const settlementData = settlementRequestSchema.parse(req.body);
      
      // Verify loan belongs to organization before settling
      const loan = await storage.getLoanById(loanId);
      if (!loan || loan.organizationId !== organizationId) {
        return res.status(404).json({ message: "Loan not found" });
      }
      
      const result = await storage.settleLoan(loanId, settlementData, userId);
      res.json(result);
    } catch (error) {
      console.error("Error settling loan:", error);
      res.status(400).json({ message: "Failed to settle loan" });
    }
  });

  app.post('/api/loans/:id/revolve', isAuthenticated, attachOrganizationContext, requireOrganization, async (req: any, res) => {
    try {
      const loanId = req.params.id;
      const organizationId = req.organizationId;
      const userId = req.user.claims.sub;
      const revolveData = revolveRequestSchema.parse(req.body);
      
      // Verify loan belongs to organization before revolving
      const loan = await storage.getLoanById(loanId);
      if (!loan || loan.organizationId !== organizationId) {
        return res.status(404).json({ message: "Loan not found" });
      }
      
      const result = await storage.revolveLoan(loanId, revolveData, userId);
      res.json(result);
    } catch (error) {
      console.error("Error revolving loan:", error);
      res.status(400).json({ message: "Failed to revolve loan" });
    }
  });

  app.get('/api/loans/:id/ledger', isAuthenticated, attachOrganizationContext, requireOrganization, async (req: any, res) => {
    try {
      const loanId = req.params.id;
      const transactions = await storage.getLoanLedger(loanId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching loan ledger:", error);
      res.status(500).json({ message: "Failed to fetch loan ledger" });
    }
  });

  app.get('/api/loans/:id/balance', isAuthenticated, attachOrganizationContext, requireOrganization, async (req: any, res) => {
    try {
      const loanId = req.params.id;
      const balance = await storage.calculateLoanBalance(loanId);
      res.json(balance);
    } catch (error) {
      console.error("Error calculating loan balance:", error);
      res.status(500).json({ message: "Failed to calculate loan balance" });
    }
  });

  app.delete('/api/loans/:id', isAuthenticated, attachOrganizationContext, requireOrganization, async (req: any, res) => {
    try {
      const loanId = req.params.id;
      const organizationId = req.organizationId;
      const { reason } = req.body;
      
      await storage.deleteLoan(loanId, organizationId, reason);
      res.json({ message: "Loan cancelled successfully" });
    } catch (error) {
      console.error("Error cancelling loan:", error);
      res.status(500).json({ message: "Failed to cancel loan" });
    }
  });
}
