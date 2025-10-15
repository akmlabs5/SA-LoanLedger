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
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import xlsx from "xlsx";

export function registerLoansRoutes(app: Express, deps: AppDependencies) {
  const { storage } = deps;

  app.get('/api/loans', isAuthenticated, attachOrganizationContext, requireOrganization, async (req: any, res) => {
    try {
      const organizationId = req.organizationId;
      const status = req.query.status as string;
      
      let loans;
      if (status === 'settled') {
        loans = await storage.getSettledLoansByUser(organizationId);
      } else if (status === 'cancelled') {
        loans = await storage.getCancelledLoansByUser(organizationId);
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

      // Send immediate loan confirmation email with calendar invite if requested (fire-and-forget)
      if (req.body.sendEmailReminder === true) {
        // Fire-and-forget: don't await to avoid blocking loan creation
        (async () => {
          try {
            const { sendLoanConfirmationEmail } = await import('../emailService');
            const user = await storage.getUser(userId);
            
            if (user) {
              const facilityWithBank = await storage.getFacilityWithBank(facility.id);
              
              const emailSent = await sendLoanConfirmationEmail(
                user,
                loan,
                facilityWithBank?.bank,
                facilityWithBank
              );
              
              if (emailSent) {
                console.log(`✅ Loan confirmation email sent to ${user.email} for loan ${loan.referenceNumber}`);
              } else {
                console.warn(`⚠️ Failed to send loan confirmation email for loan ${loan.referenceNumber}`);
              }
            }
          } catch (emailError) {
            console.error('Error sending loan confirmation email:', emailError);
          }
        })().catch(err => console.error('Unhandled error in loan confirmation email:', err));
      }

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
      
      // Calculate accrued interest (to date) and projected total interest
      const calculateInterest = (amount: number, rate: number, startDate: Date, endDate: Date, basis: string = 'actual_365') => {
        const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const daysInYear = basis === 'actual_360' ? 360 : 365;
        
        if (daysDiff > 0 && rate > 0) {
          return (amount * rate / 100) * (daysDiff / daysInYear);
        }
        return 0;
      };
      
      const loanAmount = parseFloat(loan.amount);
      const totalRate = parseFloat(loan.siborRate) + parseFloat(loan.margin);
      const startDate = new Date(loan.startDate);
      const dueDate = new Date(loan.dueDate);
      const today = new Date();
      
      // Accrued interest: from start date to today (for active loans only)
      const accruedInterest = loan.status === 'active' 
        ? calculateInterest(loanAmount, totalRate, startDate, today, loan.interestBasis || 'actual_365')
        : 0;
      
      // Projected total interest: from start date to due date (full tenor)
      const projectedTotalInterest = calculateInterest(loanAmount, totalRate, startDate, dueDate, loan.interestBasis || 'actual_365');
      
      res.json({
        ...loan,
        accruedInterest: accruedInterest.toFixed(2),
        projectedTotalInterest: projectedTotalInterest.toFixed(2)
      });
    } catch (error) {
      console.error("Error fetching loan:", error);
      res.status(500).json({ message: "Failed to fetch loan" });
    }
  });

  app.get('/api/loans/:id/revolving-usage', isAuthenticated, attachOrganizationContext, requireOrganization, async (req: any, res) => {
    try {
      const loanId = req.params.id;
      const organizationId = req.organizationId;
      
      const loan = await storage.getLoanById(loanId);
      
      if (!loan || loan.organizationId !== organizationId) {
        return res.status(404).json({ message: "Loan not found" });
      }

      const facility = loan.facility;
      if (!facility || !facility.enableRevolvingTracking || !facility.maxRevolvingPeriod) {
        return res.status(400).json({ message: "Revolving period tracking is not enabled for this loan's facility" });
      }

      const startDate = new Date(loan.startDate);
      const today = new Date();
      
      let endDate: Date;
      if (loan.status === 'settled' && loan.settledDate) {
        endDate = new Date(loan.settledDate);
      } else {
        endDate = today;
      }
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({ message: "Invalid dates for loan" });
      }
      
      const daysUsed = Math.max(0, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
      
      const maxPeriod = facility.maxRevolvingPeriod;
      const daysRemaining = Math.max(0, Math.round(maxPeriod - daysUsed));
      
      let percentageUsed = (daysUsed / maxPeriod) * 100;
      if (!isFinite(percentageUsed)) {
        percentageUsed = 0;
      }
      percentageUsed = Math.min(100, Math.max(0, Math.round(percentageUsed * 10) / 10));
      
      let status: 'available' | 'warning' | 'critical' | 'expired';
      if (percentageUsed >= 100) {
        status = 'expired';
      } else if (percentageUsed >= 90) {
        status = 'critical';
      } else if (percentageUsed >= 70) {
        status = 'warning';
      } else {
        status = 'available';
      }
      
      const canRevolve = daysRemaining > 0;
      
      const usageData = {
        daysUsed: Math.round(daysUsed),
        daysRemaining,
        percentageUsed,
        status,
        canRevolve,
        maxRevolvingPeriod: maxPeriod,
        loanStatus: loan.status,
      };
      
      res.json(usageData);
    } catch (error) {
      console.error("Error calculating loan revolving usage:", error);
      res.status(500).json({ message: "Failed to calculate loan revolving usage" });
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

  app.post('/api/loans/:id/reverse-settlement', isAuthenticated, attachOrganizationContext, requireOrganization, async (req: any, res) => {
    try {
      const loanId = req.params.id;
      const organizationId = req.organizationId;
      const userId = req.user.claims.sub;
      const { reason } = req.body;
      
      // Verify loan belongs to organization before reversing
      const loan = await storage.getLoanById(loanId);
      if (!loan || loan.organizationId !== organizationId) {
        return res.status(404).json({ message: "Loan not found" });
      }
      
      const reversedLoan = await storage.reverseLoanSettlement(loanId, reason, userId);
      res.json(reversedLoan);
    } catch (error: any) {
      console.error("Error reversing settlement:", error);
      res.status(400).json({ message: error.message || "Failed to reverse settlement" });
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

  app.post('/api/loans/:id/permanent-delete', isAuthenticated, attachOrganizationContext, requireOrganization, async (req: any, res) => {
    try {
      const loanId = req.params.id;
      const organizationId = req.organizationId;
      
      await storage.permanentlyDeleteLoan(loanId, organizationId);
      res.json({ message: "Loan permanently deleted successfully" });
    } catch (error: any) {
      console.error("Error permanently deleting loan:", error);
      if (error.message === 'Only cancelled loans can be permanently deleted') {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to permanently delete loan" });
    }
  });

  // Helper function to calculate loan urgency
  const getLoanUrgency = (dueDate: string | null): 'critical' | 'warning' | 'normal' => {
    if (!dueDate) return 'normal';
    const today = new Date();
    const due = new Date(dueDate);
    const daysDiff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff < 0 || daysDiff <= 7) return 'critical';
    if (daysDiff <= 15) return 'warning';
    return 'normal';
  };

  // Export loans to PDF
  app.get('/api/loans/export/pdf', isAuthenticated, attachOrganizationContext, requireOrganization, async (req: any, res) => {
    try {
      const organizationId = req.organizationId;
      const status = req.query.status as string;
      const bankId = req.query.bankId as string;
      const search = req.query.search as string;
      const urgencyFilter = req.query.urgencyFilter as string;

      // Fetch loans based on status
      let loans;
      if (status === 'settled') {
        loans = await storage.getSettledLoansByUser(organizationId);
      } else if (status === 'cancelled') {
        loans = await storage.getCancelledLoansByUser(organizationId);
      } else {
        loans = await storage.getActiveLoansByUser(organizationId);
      }

      // Get all facilities and banks for this organization
      const facilities = await storage.getUserFacilities(organizationId);
      const allBanks = await storage.getAllBanks();

      // Apply filters
      let filteredLoans = loans;
      
      if (bankId) {
        const bankFacilities = facilities.filter((f: any) => f.bankId === bankId);
        const facilityIds = bankFacilities.map((f: any) => f.id);
        filteredLoans = filteredLoans.filter((l: any) => facilityIds.includes(l.facilityId));
      }

      if (search) {
        const searchLower = search.toLowerCase();
        filteredLoans = filteredLoans.filter((l: any) => {
          const facility = facilities.find((f: any) => f.id === l.facilityId);
          const bank = allBanks.find((b: any) => b.id === facility?.bankId);
          return (
            bank?.name?.toLowerCase().includes(searchLower) ||
            l.referenceNumber?.toLowerCase().includes(searchLower) ||
            l.amount?.toString().includes(searchLower)
          );
        });
      }

      // Apply urgency filter for active loans
      if (urgencyFilter && status === 'active') {
        filteredLoans = filteredLoans.filter((l: any) => {
          const urgency = getLoanUrgency(l.dueDate);
          return urgency === urgencyFilter;
        });
      }

      // Prepare report data with calculations
      const reportData = await Promise.all(filteredLoans.map(async (loan: any) => {
        const facility = facilities.find((f: any) => f.id === loan.facilityId);
        const bank = allBanks.find((b: any) => b.id === facility?.bankId);
        
        let balance = { total: parseFloat(loan.amount) };
        if (status !== 'cancelled') {
          try {
            balance = await storage.calculateLoanBalance(loan.id);
          } catch (e) {
            // If balance calculation fails, use loan amount
          }
        }

        const allInRate = parseFloat(loan.siborRate || 0) + parseFloat(loan.margin || 0);
        
        return {
          reference: loan.referenceNumber || '-',
          bankName: bank?.name || 'Unknown',
          amount: parseFloat(loan.amount),
          outstanding: balance.total,
          allInRate: allInRate.toFixed(2),
          startDate: loan.startDate || '-',
          dueDate: loan.dueDate || '-',
          status: loan.status,
          settledDate: loan.settledDate || '-'
        };
      }));

      // Generate PDF
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      const statusLabel = status === 'settled' ? 'Settled' : status === 'cancelled' ? 'Cancelled' : 'Active';
      doc.text(`${statusLabel} Loans Report`, 14, 20);
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);
      doc.text(`Total Loans: ${reportData.length}`, 14, 34);

      // Table headers based on status
      let headers;
      let body;
      
      if (status === 'settled') {
        headers = [['Reference', 'Bank', 'Amount (SAR)', 'All-in Rate %', 'Start Date', 'Due Date', 'Settled Date']];
        body = reportData.map((row: any) => [
          row.reference,
          row.bankName,
          row.amount.toLocaleString(),
          row.allInRate,
          row.startDate,
          row.dueDate,
          row.settledDate
        ]);
      } else if (status === 'cancelled') {
        headers = [['Reference', 'Bank', 'Amount (SAR)', 'All-in Rate %', 'Start Date', 'Due Date']];
        body = reportData.map((row: any) => [
          row.reference,
          row.bankName,
          row.amount.toLocaleString(),
          row.allInRate,
          row.startDate,
          row.dueDate
        ]);
      } else {
        headers = [['Reference', 'Bank', 'Amount (SAR)', 'Outstanding (SAR)', 'All-in Rate %', 'Start Date', 'Due Date']];
        body = reportData.map((row: any) => [
          row.reference,
          row.bankName,
          row.amount.toLocaleString(),
          row.outstanding.toLocaleString(),
          row.allInRate,
          row.startDate,
          row.dueDate
        ]);
      }

      autoTable(doc, {
        startY: 40,
        head: headers,
        body: body,
        theme: 'grid',
        headStyles: { fillColor: [22, 101, 52] }, // Saudi green
        styles: { fontSize: 8 }
      });

      // Generate PDF as buffer
      const pdfOutput = doc.output('arraybuffer');
      const pdfBuffer = Buffer.from(pdfOutput);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${statusLabel.toLowerCase()}-loans-${new Date().toISOString().split('T')[0]}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length.toString());
      res.end(pdfBuffer, 'binary');

    } catch (error: any) {
      console.error('Error generating PDF export:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Export loans to Excel
  app.get('/api/loans/export/excel', isAuthenticated, attachOrganizationContext, requireOrganization, async (req: any, res) => {
    try {
      const organizationId = req.organizationId;
      const status = req.query.status as string;
      const bankId = req.query.bankId as string;
      const search = req.query.search as string;
      const urgencyFilter = req.query.urgencyFilter as string;

      // Fetch loans based on status
      let loans;
      if (status === 'settled') {
        loans = await storage.getSettledLoansByUser(organizationId);
      } else if (status === 'cancelled') {
        loans = await storage.getCancelledLoansByUser(organizationId);
      } else {
        loans = await storage.getActiveLoansByUser(organizationId);
      }

      // Get all facilities and banks for this organization
      const facilities = await storage.getUserFacilities(organizationId);
      const allBanks = await storage.getAllBanks();

      // Apply filters
      let filteredLoans = loans;
      
      if (bankId) {
        const bankFacilities = facilities.filter((f: any) => f.bankId === bankId);
        const facilityIds = bankFacilities.map((f: any) => f.id);
        filteredLoans = filteredLoans.filter((l: any) => facilityIds.includes(l.facilityId));
      }

      if (search) {
        const searchLower = search.toLowerCase();
        filteredLoans = filteredLoans.filter((l: any) => {
          const facility = facilities.find((f: any) => f.id === l.facilityId);
          const bank = allBanks.find((b: any) => b.id === facility?.bankId);
          return (
            bank?.name?.toLowerCase().includes(searchLower) ||
            l.referenceNumber?.toLowerCase().includes(searchLower) ||
            l.amount?.toString().includes(searchLower)
          );
        });
      }

      // Apply urgency filter for active loans
      if (urgencyFilter && status === 'active') {
        filteredLoans = filteredLoans.filter((l: any) => {
          const urgency = getLoanUrgency(l.dueDate);
          return urgency === urgencyFilter;
        });
      }

      // Prepare report data with calculations
      const reportData = await Promise.all(filteredLoans.map(async (loan: any) => {
        const facility = facilities.find((f: any) => f.id === loan.facilityId);
        const bank = allBanks.find((b: any) => b.id === facility?.bankId);
        
        let balance = { total: parseFloat(loan.amount) };
        if (status !== 'cancelled') {
          try {
            balance = await storage.calculateLoanBalance(loan.id);
          } catch (e) {
            // If balance calculation fails, use loan amount
          }
        }

        const allInRate = parseFloat(loan.siborRate || 0) + parseFloat(loan.margin || 0);
        
        const baseData: any = {
          'Reference': loan.referenceNumber || '-',
          'Bank': bank?.name || 'Unknown',
          'Amount (SAR)': parseFloat(loan.amount),
          'All-in Rate (%)': allInRate.toFixed(2),
          'Start Date': loan.startDate || '-',
          'Due Date': loan.dueDate || '-'
        };

        // Add conditional fields based on status
        if (status === 'settled') {
          baseData['Settled Date'] = loan.settledDate || '-';
        } else if (status === 'active') {
          baseData['Outstanding (SAR)'] = balance.total;
        }

        return baseData;
      }));

      const worksheet = xlsx.utils.json_to_sheet(reportData);
      const workbook = xlsx.utils.book_new();
      
      const statusLabel = status === 'settled' ? 'Settled' : status === 'cancelled' ? 'Cancelled' : 'Active';
      xlsx.utils.book_append_sheet(workbook, worksheet, `${statusLabel} Loans`);

      const excelBuffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${statusLabel.toLowerCase()}-loans-${new Date().toISOString().split('T')[0]}.xlsx`);
      res.send(excelBuffer);

    } catch (error: any) {
      console.error('Error generating Excel export:', error);
      res.status(500).json({ error: error.message });
    }
  });
}
