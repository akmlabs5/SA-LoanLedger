import type { Express } from "express";
import { isAuthenticated } from "../replitAuth";
import type { AppDependencies } from "../types";

export function registerDashboardRoutes(app: Express, deps: AppDependencies) {
  const { storage } = deps;

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

  app.get('/api/dashboard/upcoming-loans-by-month', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const bankId = req.query.bankId as string | undefined;
      const facilityType = req.query.facilityType as string | undefined;
      
      const allLoans = await storage.getActiveLoansByUser(userId);
      const facilities = await storage.getUserFacilities(userId);
      
      let filteredLoans = allLoans.filter((loan: any) => loan.status === 'active');
      
      if (bankId) {
        const bankFacilityIds = facilities.filter((f: any) => f.bankId === bankId).map((f: any) => f.id);
        filteredLoans = filteredLoans.filter((loan: any) => bankFacilityIds.includes(loan.facilityId));
      }
      
      if (facilityType) {
        const typeFacilityIds = facilities.filter((f: any) => f.facilityType === facilityType).map((f: any) => f.id);
        filteredLoans = filteredLoans.filter((loan: any) => typeFacilityIds.includes(loan.facilityId));
      }
      
      const now = new Date();
      const months: any[] = [];
      for (let i = 0; i < 12; i++) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
        months.push({
          month: monthDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
          monthKey: `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`,
          count: 0,
          amount: 0
        });
      }
      
      filteredLoans.forEach((loan: any) => {
        if (!loan.dueDate) return;
        
        const dueDate = new Date(loan.dueDate);
        const monthKey = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}`;
        
        const monthData = months.find(m => m.monthKey === monthKey);
        if (monthData) {
          monthData.count += 1;
          monthData.amount += parseFloat(loan.amount.toString());
        }
      });
      
      res.json(months);
    } catch (error) {
      console.error("Error fetching upcoming loans by month:", error);
      res.status(500).json({ message: "Failed to fetch upcoming loans by month" });
    }
  });
}
