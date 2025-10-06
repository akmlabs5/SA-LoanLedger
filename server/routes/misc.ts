import type { Express } from "express";
import type { AppDependencies } from "../types";
import { isAuthenticated } from "../replitAuth";
import { sendLoanDueNotification } from "../emailService";
import { transactionTypeZodEnum } from "@shared/schema";
import { z } from "zod";

export function registerMiscRoutes(app: Express, deps: AppDependencies) {
  const { storage } = deps;

  // SIBOR rate (simulated for MVP) - Public endpoint
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
        // Transform loans to match LoanDueNotification interface
        const dueLoanNotifications = dueLoans.map(loan => ({
          id: loan.id,
          referenceNumber: loan.referenceNumber,
          amount: loan.amount,
          dueDate: loan.dueDate,
          facility: {
            bank: {
              name: 'Bank' // Simplified for notification - could be enhanced with actual bank lookup
            }
          }
        }));
        
        await sendLoanDueNotification(user.email, dueLoanNotifications);
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
            bankName: loan.facility.bank.name,
            facilityId: loan.facilityId,
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
          allLoans.find(l => l.id === loan.loanId)?.facility.bank.id === queryResult.data.bankId
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
}
