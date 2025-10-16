import type { Express } from "express";
import type { AppDependencies } from "../types";
import { isAuthenticated } from "../replitAuth";
import { attachOrganizationContext, requireOrganization } from "../organizationMiddleware";

export function registerAnalyticsRoutes(app: Express, deps: AppDependencies) {
  const { storage } = deps;

  // Year-over-year analytics endpoint
  app.get('/api/analytics/year-over-year', isAuthenticated, attachOrganizationContext, requireOrganization, async (req: any, res) => {
    try {
      const organizationId = req.organizationId;
      const { from, to, groupBy = 'month' } = req.query;
      
      if (!from || !to) {
        return res.status(400).json({ message: "Both 'from' and 'to' dates are required" });
      }
      
      // Get all loans (active, settled, cancelled)
      const activeLoans = await storage.getActiveLoansByUser(organizationId);
      const settledLoans = await storage.getSettledLoansByUser(organizationId);
      const cancelledLoans = await storage.getCancelledLoansByUser(organizationId);
      const allLoans = [...activeLoans, ...settledLoans, ...cancelledLoans];
      
      // Get all payments in date range
      const paymentHistory = await storage.getPaymentHistory(organizationId, {
        from: from as string,
        to: to as string,
        limit: 10000
      });
      
      // Get snapshots in date range
      const snapshots = await storage.getSnapshotsInRange(organizationId, from as string, to as string);
      
      // Helper function to get period key
      const getPeriodKey = (date: Date, groupBy: string) => {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const quarter = Math.floor((month - 1) / 3) + 1;
        
        if (groupBy === 'year') return `${year}`;
        if (groupBy === 'quarter') return `${year}-Q${quarter}`;
        return `${year}-${String(month).padStart(2, '0')}`;
      };
      
      // Aggregate loans by period
      const loansByPeriod: Record<string, any> = {};
      
      for (const loan of allLoans) {
        const loanDate = new Date(loan.startDate);
        if (loanDate >= new Date(from as string) && loanDate <= new Date(to as string)) {
          const periodKey = getPeriodKey(loanDate, groupBy as string);
          
          if (!loansByPeriod[periodKey]) {
            loansByPeriod[periodKey] = {
              period: periodKey,
              loansCreated: 0,
              totalDisbursed: 0,
              avgLoanSize: 0,
              loans: []
            };
          }
          
          loansByPeriod[periodKey].loansCreated += 1;
          loansByPeriod[periodKey].totalDisbursed += Number(loan.amount?.toString() || 0);
          loansByPeriod[periodKey].loans.push(loan);
        }
      }
      
      // Calculate averages
      for (const period in loansByPeriod) {
        const data = loansByPeriod[period];
        data.avgLoanSize = data.loansCreated > 0 ? data.totalDisbursed / data.loansCreated : 0;
      }
      
      // Aggregate payments by period
      const paymentsByPeriod: Record<string, any> = {};
      
      for (const payment of paymentHistory.data) {
        const paymentDate = new Date(payment.paymentDate);
        const periodKey = getPeriodKey(paymentDate, groupBy as string);
        
        if (!paymentsByPeriod[periodKey]) {
          paymentsByPeriod[periodKey] = {
            period: periodKey,
            paymentCount: 0,
            totalPaid: 0,
            principalPaid: 0,
            interestPaid: 0
          };
        }
        
        paymentsByPeriod[periodKey].paymentCount += 1;
        paymentsByPeriod[periodKey].totalPaid += Number(payment.amount?.toString() || 0);
        paymentsByPeriod[periodKey].principalPaid += Number(payment.principalAmount?.toString() || 0);
        paymentsByPeriod[periodKey].interestPaid += Number(payment.interestAmount?.toString() || 0);
      }
      
      // Aggregate snapshots by period (use last snapshot of each period)
      const snapshotsByPeriod: Record<string, any> = {};
      
      for (const snapshot of snapshots) {
        const snapshotDate = new Date(snapshot.snapshotDate);
        const periodKey = getPeriodKey(snapshotDate, groupBy as string);
        
        if (!snapshotsByPeriod[periodKey] || 
            new Date(snapshot.snapshotDate) > new Date(snapshotsByPeriod[periodKey].snapshotDate)) {
          snapshotsByPeriod[periodKey] = {
            period: periodKey,
            snapshotDate: snapshot.snapshotDate,
            totalOutstanding: Number(snapshot.totalOutstanding?.toString() || 0),
            totalCreditLimit: Number(snapshot.totalCreditLimit?.toString() || 0),
            portfolioLtv: Number(snapshot.portfolioLtv?.toString() || 0),
            activeLoansCount: snapshot.activeLoansCount,
            bankExposures: snapshot.bankExposuresJson,
            metrics: snapshot.metricsJson
          };
        }
      }
      
      // Combine all data by period
      const allPeriods = new Set([
        ...Object.keys(loansByPeriod),
        ...Object.keys(paymentsByPeriod),
        ...Object.keys(snapshotsByPeriod)
      ]);
      
      const combinedData = Array.from(allPeriods).map(period => ({
        period,
        loans: loansByPeriod[period] || {
          period,
          loansCreated: 0,
          totalDisbursed: 0,
          avgLoanSize: 0
        },
        payments: paymentsByPeriod[period] || {
          period,
          paymentCount: 0,
          totalPaid: 0,
          principalPaid: 0,
          interestPaid: 0
        },
        snapshot: snapshotsByPeriod[period] || null
      })).sort((a, b) => a.period.localeCompare(b.period));
      
      // Calculate period-over-period changes
      const dataWithChanges = combinedData.map((current, index) => {
        if (index === 0) {
          return { ...current, changes: null };
        }
        
        const previous = combinedData[index - 1];
        
        const calculateChange = (curr: number, prev: number) => {
          if (prev === 0) return curr > 0 ? 100 : 0;
          return ((curr - prev) / prev) * 100;
        };
        
        return {
          ...current,
          changes: {
            loansCreated: calculateChange(current.loans.loansCreated, previous.loans.loansCreated),
            totalDisbursed: calculateChange(current.loans.totalDisbursed, previous.loans.totalDisbursed),
            totalPaid: calculateChange(current.payments.totalPaid, previous.payments.totalPaid),
            outstandingBalance: current.snapshot && previous.snapshot
              ? calculateChange(current.snapshot.totalOutstanding, previous.snapshot.totalOutstanding)
              : null
          }
        };
      });
      
      res.json({
        groupBy,
        from,
        to,
        data: dataWithChanges,
        summary: {
          totalLoansCreated: Object.values(loansByPeriod).reduce((sum: number, p: any) => sum + p.loansCreated, 0),
          totalDisbursed: Object.values(loansByPeriod).reduce((sum: number, p: any) => sum + p.totalDisbursed, 0),
          totalPaymentsReceived: Object.values(paymentsByPeriod).reduce((sum: number, p: any) => sum + p.totalPaid, 0),
          totalPrincipalPaid: Object.values(paymentsByPeriod).reduce((sum: number, p: any) => sum + p.principalPaid, 0),
          totalInterestPaid: Object.values(paymentsByPeriod).reduce((sum: number, p: any) => sum + p.interestPaid, 0)
        }
      });
    } catch (error) {
      console.error("Error generating year-over-year analytics:", error);
      res.status(500).json({ message: "Failed to generate analytics" });
    }
  });
}
