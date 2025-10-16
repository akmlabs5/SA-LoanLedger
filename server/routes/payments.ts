import type { Express } from "express";
import type { AppDependencies } from "../types";
import { isAuthenticated } from "../replitAuth";
import { attachOrganizationContext, requireOrganization } from "../organizationMiddleware";
import { insertLoanPaymentSchema } from "@shared/schema";

export function registerPaymentRoutes(app: Express, deps: AppDependencies) {
  const { storage } = deps;

  // Record a new payment
  app.post('/api/payments', isAuthenticated, attachOrganizationContext, requireOrganization, async (req: any, res) => {
    try {
      const organizationId = req.organizationId;
      const userId = req.user.claims.sub;
      
      const paymentData = insertLoanPaymentSchema.parse({ 
        ...req.body, 
        organizationId, 
        createdBy: userId 
      });
      
      // Verify loan belongs to organization
      const loan = await storage.getLoanById(paymentData.loanId);
      if (!loan || loan.organizationId !== organizationId) {
        return res.status(403).json({ message: "Loan not found or access denied" });
      }
      
      const payment = await storage.recordPayment(paymentData);
      res.json(payment);
    } catch (error) {
      console.error("Error recording payment:", error);
      res.status(500).json({ message: "Failed to record payment" });
    }
  });

  // Get payment history for a specific loan
  app.get('/api/payments/loan/:loanId', isAuthenticated, attachOrganizationContext, requireOrganization, async (req: any, res) => {
    try {
      const organizationId = req.organizationId;
      const { loanId } = req.params;
      
      // Verify loan belongs to organization
      const loan = await storage.getLoanById(loanId);
      if (!loan || loan.organizationId !== organizationId) {
        return res.status(403).json({ message: "Loan not found or access denied" });
      }
      
      const payments = await storage.getPaymentsByLoan(loanId);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching payment history:", error);
      res.status(500).json({ message: "Failed to fetch payment history" });
    }
  });

  // Get payment history with filters
  app.get('/api/payments/history', isAuthenticated, attachOrganizationContext, requireOrganization, async (req: any, res) => {
    try {
      const organizationId = req.organizationId;
      const { from, to, loanId, limit, offset } = req.query;
      
      const filters = {
        from: from as string | undefined,
        to: to as string | undefined,
        loanId: loanId as string | undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      };
      
      const result = await storage.getPaymentHistory(organizationId, filters);
      res.json(result);
    } catch (error) {
      console.error("Error fetching payment history:", error);
      res.status(500).json({ message: "Failed to fetch payment history" });
    }
  });

  // Get payment summary for a specific loan
  app.get('/api/payments/summary/:loanId', isAuthenticated, attachOrganizationContext, requireOrganization, async (req: any, res) => {
    try {
      const organizationId = req.organizationId;
      const { loanId } = req.params;
      
      // Verify loan belongs to organization
      const loan = await storage.getLoanById(loanId);
      if (!loan || loan.organizationId !== organizationId) {
        return res.status(403).json({ message: "Loan not found or access denied" });
      }
      
      const summary = await storage.calculatePaymentSummary(loanId);
      res.json(summary);
    } catch (error) {
      console.error("Error calculating payment summary:", error);
      res.status(500).json({ message: "Failed to calculate payment summary" });
    }
  });
}
